import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    const lastMsg = messages[messages.length - 1];
    let prompt = "";
    let imageParts: any[] = [];

    // --- 1. 解析内容 (保持不变) ---
    if (typeof lastMsg.content === 'string') {
      prompt = lastMsg.content;
    } else if (typeof lastMsg.content === 'object') {
      prompt = lastMsg.content.text || "";
      if (lastMsg.content.images?.length > 0) {
        imageParts = lastMsg.content.images.map((img: string) => ({
          inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
        }));
      }
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        const fileName = file.name.toLowerCase();
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
          try {
            const base64Data = file.content.split(',')[1];
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[workbook.SheetNames[0]]);
            prompt += `\n\n【附件数据】\n文件名: ${file.name}\n\`\`\`csv\n${csvData}\n\`\`\`\n`;
          } catch (err) { console.error("表格解析失败", err); }
        } else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.js') || fileName.endsWith('.py')) {
           const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
           prompt += `\n\n【附件内容】\n${textData}\n`;
        }
      }
    }

    // --- 2. 🚀 核心修复：自动重试机制 (Auto-Fallback) ---
    // Google 的模型名字经常变，我们准备一个列表，挨个试，哪个能用就用哪个。
    // 优先用 flash-001 (全名), 失败了试 pro-001, 再失败试 gemini-pro (旧版保底)
    const candidateModels = model === 'Gemini 3 Pro' 
      ? ["gemini-1.5-flash-001", "gemini-1.5-pro-001", "gemini-pro"] 
      : ["gemini-pro"];

    let finalResult = null;
    let usedModel = "";

    // 循环尝试模型
    for (const modelName of candidateModels) {
      try {
        console.log(`正在尝试模型: ${modelName}...`);
        const geminiModel = genAI.getGenerativeModel({ model: modelName });
        
        if (imageParts.length > 0) {
          finalResult = await geminiModel.generateContentStream([prompt, ...imageParts]);
        } else {
          finalResult = await geminiModel.generateContentStream(prompt);
        }
        
        usedModel = modelName;
        console.log(`✅ 模型 ${modelName} 调用成功！`);
        break; // 成功了就跳出循环
      } catch (e: any) {
        console.warn(`❌ 模型 ${modelName} 失败: ${e.message}`);
        // 如果是最后一个模型也失败了，那就真的报错了
        if (modelName === candidateModels[candidateModels.length - 1]) {
          throw e;
        }
        // 否则继续下一次循环，尝试下一个备胎
      }
    }

    // --- 3. 返回流 ---
    const stream = new ReadableStream({
      async start(controller) {
        // @ts-ignore
        for await (const chunk of finalResult.stream) {
          const chunkText = chunk.text();
          if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("Chat Error:", error);
    // 把详细错误吐给前端，方便截图
    return NextResponse.json({ error: `AI服务暂不可用 (${error.message})` }, { status: 500 });
  }
}