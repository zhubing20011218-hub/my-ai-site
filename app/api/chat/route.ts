import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    // 1. 检查 API Key 是否存在
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "服务器未配置 API Key" }, { status: 500 });
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    
    // 🚀 强制指定模型：gemini-1.5-flash
    // 这是目前 Google 官方主推、速度最快、且 100% 支持文件的版本
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    let prompt = "";
    let imageParts: any[] = [];

    // --- 2. 解析内容 ---
    if (typeof lastMsg.content === 'string') {
      prompt = lastMsg.content;
    } else if (typeof lastMsg.content === 'object') {
      prompt = lastMsg.content.text || "";
      
      // 处理图片
      if (lastMsg.content.images?.length > 0) {
        imageParts = lastMsg.content.images.map((img: string) => ({
          inlineData: { data: img.split(',')[1], mimeType: "image/jpeg" }
        }));
      }

      // 处理 Excel 文件
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("正在解析文件:", file.name); // 调试日志

        if (file.name.endsWith('.xlsx') || file.name.endsWith('.csv')) {
          try {
            const base64Data = file.content.split(',')[1];
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const csvData = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
            prompt += `\n\n【附件表格数据】\n文件名: ${file.name}\n\`\`\`csv\n${csvData}\n\`\`\`\n`;
          } catch (e) {
            console.error("解析失败:", e);
          }
        }
      }
    }

    // --- 3. 发送请求 ---
    console.log("正在请求 Google API (gemini-1.5-flash)...");
    
    const result = await model.generateContentStream([prompt, ...imageParts]);

    // --- 4. 返回流 ---
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("Chat Error Details:", error);
    // 把最真实的错误返回给前端，不要包装
    return NextResponse.json({ 
      error: `AI请求失败: ${error.message}` 
    }, { status: 500 });
  }
}