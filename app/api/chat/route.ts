import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

// 建立 Gemini 客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    
    // 获取最新一条消息
    const lastMsg = messages[messages.length - 1];
    let prompt = "";
    let imageParts: any[] = [];

    // --- 🕵️‍♀️ 解析前端传来的混合数据 ---
    if (typeof lastMsg.content === 'string') {
      prompt = lastMsg.content;
    } else if (typeof lastMsg.content === 'object') {
      prompt = lastMsg.content.text || ""; 
      
      // 1. 处理图片
      if (lastMsg.content.images && lastMsg.content.images.length > 0) {
        imageParts = lastMsg.content.images.map((img: string) => ({
          inlineData: {
            data: img.split(',')[1], 
            mimeType: "image/jpeg"
          }
        }));
      }

      // 2. ✨ 处理 Excel/CSV 表格
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        const fileName = file.name.toLowerCase();
        
        // 如果是表格文件
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
          try {
            const base64Data = file.content.split(',')[1];
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            
            prompt += `\n\n【附件数据分析】\n文件名: ${file.name}\n数据内容:\n\`\`\`csv\n${csvData}\n\`\`\`\n\n请基于以上数据回答问题。`;
          } catch (err) {
            console.error("解析表格失败:", err);
            prompt += `\n(系统提示: 表格解析失败)`;
          }
        }
        // 如果是纯文本代码文件
        else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.js') || fileName.endsWith('.py')) {
           const base64Data = file.content.split(',')[1];
           const textData = Buffer.from(base64Data, 'base64').toString('utf-8');
           prompt += `\n\n【附件文件内容】\n文件名: ${file.name}\n\`\`\`\n${textData}\n\`\`\`\n`;
        }
      }
    }

    // --- 🚀 关键修改点：换成 Flash 模型 (防404) ---
    // gemini-1.5-flash 是目前最稳定且开放的版本，同样支持 Excel 长文本
    const targetModel = model === 'Gemini 3 Pro' ? 'gemini-1.5-flash' : 'gemini-pro';
    
    console.log(`正在请求模型: ${targetModel}`); // 加个日志方便排查
    const geminiModel = genAI.getGenerativeModel({ model: targetModel });

    let result;
    if (imageParts.length > 0) {
      result = await geminiModel.generateContentStream([prompt, ...imageParts]);
    } else {
      result = await geminiModel.generateContentStream(prompt);
    }

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
    console.error("Chat Error:", error);
    // 返回更详细的错误给前端
    return NextResponse.json({ error: error.message || "AI 服务异常" }, { status: 500 });
  }
}