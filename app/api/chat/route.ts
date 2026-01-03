import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    let prompt = "";
    let imageParts: any[] = [];

    // --- 1. 数据解析 (保持不变) ---
    if (typeof lastMsg.content === 'string') {
      prompt = lastMsg.content;
    } else if (typeof lastMsg.content === 'object') {
      prompt = lastMsg.content.text || "";
      
      // 解析图片
      if (lastMsg.content.images?.length > 0) {
        imageParts = lastMsg.content.images.map((img: string) => ({
          inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
        }));
      }

      // 解析文件 (Excel/CSV/TXT)
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("收到文件:", file.name); 
        
        try {
          // 简单判断文件类型
          const isExcel = file.name.endsWith('.xlsx') || file.name.endsWith('.xls') || file.name.endsWith('.csv');
          
          if (isExcel) {
            const base64Data = file.content.split(',')[1];
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            // 截取前 5000 字符防止 Token 爆炸 (针对旧模型优化)
            prompt += `\n\n【表格数据预览】\n${csvData.slice(0, 8000)}\n(数据过长已截断)...`;
          } else {
            // 纯文本
            const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
            prompt += `\n\n【文件内容】\n${textData.slice(0, 8000)}`;
          }
        } catch (e) {
          console.error("文件解析出错:", e);
        }
      }
    }

    // --- 2. 🚀 自动降级重试系统 (核心修复) ---
    // 这是一个“模型候选名单”，我们会按顺序尝试
    // 如果有图片，我们只试支持视觉的模型
    // 如果只有文字，我们最后可以用 gemini-pro 保底
    
    let candidateModels = [
      "gemini-1.5-flash",        // 首选：最新快闪模型
      "gemini-1.5-flash-001",    // 备选：指定版本号
      "gemini-1.5-pro",          // 备选：Pro版本
    ];

    // 如果没有图片，我们可以用老版 gemini-pro 兜底 (它不支持图片，但对话很稳)
    if (imageParts.length === 0) {
      candidateModels.push("gemini-pro");
    }

    let finalResponse = null;
    let successModel = "";

    // 循环尝试
    for (const modelName of candidateModels) {
      try {
        console.log(`正在尝试连接模型: ${modelName}...`);
        const model = genAI.getGenerativeModel({ model: modelName });
        
        if (imageParts.length > 0) {
          finalResponse = await model.generateContentStream([prompt, ...imageParts]);
        } else {
          finalResponse = await model.generateContentStream(prompt);
        }
        
        successModel = modelName;
        console.log(`✅ 成功连接模型: ${modelName}`);
        break; // 成功了就跳出循环，不再试了
      } catch (err: any) {
        console.warn(`❌ 模型 ${modelName} 失败: ${err.message}`);
        // 继续下一次循环，尝试下一个
      }
    }

    if (!finalResponse) {
      throw new Error("所有 AI 模型均无法访问，请检查 API Key 或网络状态。");
    }

    // --- 3. 返回流 ---
    const stream = new ReadableStream({
      async start(controller) {
        // @ts-ignore
        for await (const chunk of finalResponse.stream) {
          const chunkText = chunk.text();
          if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
        }
        // 可选：在回答最后悄悄告诉我是哪个模型生成的（调试用）
        // controller.enqueue(new TextEncoder().encode(`\n\n(由 ${successModel} 生成)`));
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("Final Error:", error);
    return NextResponse.json({ error: `服务暂时繁忙: ${error.message}` }, { status: 500 });
  }
}