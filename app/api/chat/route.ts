import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx'; // 引入表格处理库

export const dynamic = 'force-dynamic';

// 建立 Gemini 客户端
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || "");

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();
    
    // 获取最新一条消息 (用户发送的)
    const lastMsg = messages[messages.length - 1];
    let prompt = lastMsg.content;
    let imageParts: any[] = [];

    // --- 🕵️‍♀️ 文件解析核心逻辑 ---
    
    // 检查是否有文件附带 (前端传来的结构: { text: "...", file: {name: "xx.xlsx", content: "base64..."} })
    // 注意：我们在前端把 file 放在了 content 对象里，或者您可能需要调整前端传参结构。
    // 为了兼容您现有的前端逻辑 (content: { text, images, file })，我们需要解析它。
    
    if (typeof lastMsg.content === 'object' && lastMsg.content !== null) {
      prompt = lastMsg.content.text || ""; // 提取文字问题
      
      // 1. 处理图片 (Gemini Vision)
      if (lastMsg.content.images && lastMsg.content.images.length > 0) {
        imageParts = lastMsg.content.images.map((img: string) => {
          return {
            inlineData: {
              data: img.split(',')[1], // 去掉 data:image/png;base64, 前缀
              mimeType: "image/jpeg"
            }
          };
        });
      }

      // 2. ✨ 处理 Excel/CSV 表格
      if (lastMsg.content.file) {
        const file = lastMsg.content.file; // { name, content }
        const fileName = file.name.toLowerCase();
        
        if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls') || fileName.endsWith('.csv')) {
          console.log(`正在解析表格文件: ${fileName}`);
          
          try {
            // 去掉 Base64 前缀 (data:application/vnd...;base64,)
            const base64Data = file.content.split(',')[1];
            
            // 读取 Excel
            const workbook = XLSX.read(base64Data, { type: 'base64' });
            
            // 获取第一个 Sheet
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            
            // 转换为 CSV 文本
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            
            // 将数据注入到 Prompt 中
            prompt += `\n\n【附件数据分析】\n文件名: ${file.name}\n以下是文件内容数据:\n\`\`\`csv\n${csvData}\n\`\`\`\n\n请根据以上数据回答我的问题。`;
            
          } catch (err) {
            console.error("解析表格失败:", err);
            prompt += `\n\n(系统提示: 用户上传了表格文件 ${file.name}，但解析失败，请告知用户)`;
          }
        }
        
        // 3. 处理纯文本文件 (.txt, .md, .py, .js)
        else if (fileName.endsWith('.txt') || fileName.endsWith('.md') || fileName.endsWith('.js') || fileName.endsWith('.py')) {
           // Base64 解码为 UTF-8 文本
           const base64Data = file.content.split(',')[1];
           const textData = Buffer.from(base64Data, 'base64').toString('utf-8');
           prompt += `\n\n【附件文件内容】\n文件名: ${file.name}\n\`\`\`\n${textData}\n\`\`\`\n`;
        }
      }
    }

    // --- 发送给 Gemini ---
    
    // 构造请求部分
    const modelName = model === 'Gemini 3 Pro' ? 'gemini-1.5-pro-latest' : 'gemini-pro'; 
    const geminiModel = genAI.getGenerativeModel({ model: modelName });

    // 如果有图片，使用 vision 能力；否则纯文本
    let result;
    if (imageParts.length > 0) {
      result = await geminiModel.generateContentStream([prompt, ...imageParts]);
    } else {
      result = await geminiModel.generateContentStream(prompt);
    }

    // --- 流式返回响应 ---
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) {
            controller.enqueue(new TextEncoder().encode(chunkText));
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("Chat Error:", error);
    return NextResponse.json({ error: error.message || "AI 处理请求失败" }, { status: 500 });
  }
}