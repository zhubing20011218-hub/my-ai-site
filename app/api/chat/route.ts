import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 配置丢失" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 组装 Prompt (包含文字、图片、表格) ---
    let parts: any[] = [];

    // (A) 处理文字
    if (typeof lastMsg.content === 'string') {
      parts.push({ text: lastMsg.content });
    } else if (typeof lastMsg.content === 'object') {
      const text = lastMsg.content.text || "";
      if (text) parts.push({ text: text });

      // (B) 处理图片
      if (lastMsg.content.images?.length > 0) {
        lastMsg.content.images.forEach((img: string) => {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: img.split(',')[1] // 去掉 base64 头部
            }
          });
        });
      }

      // (C) 处理 Excel/CSV 文件 (核心修复)
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("正在解析文件:", file.name); // Vercel 后台日志
        
        try {
          if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
            // 读取 Excel
            const workbook = XLSX.read(file.content.split(',')[1], { type: 'base64' });
            const sheetName = workbook.SheetNames[0];
            const sheet = workbook.Sheets[sheetName];
            // 转换为 CSV 文本
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            
            // 注入 Prompt
            parts.push({ text: `\n\n=== 附件表格数据 (${file.name}) ===\n${csvData}\n=== 数据结束 ===\n\n请根据以上表格数据回答我的问题。` });
          } else if (file.name.match(/\.(txt|md|js|py|json)$/i)) {
             // 读取纯文本
             const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
             parts.push({ text: `\n\n=== 附件文件内容 (${file.name}) ===\n${textData}\n=== 内容结束 ===` });
          }
        } catch (e) {
          console.error("文件解析异常:", e);
          parts.push({ text: `\n\n[系统提示: 文件 ${file.name} 解析失败，请忽略文件内容]` });
        }
      }
    }

    // --- 2. 使用“最强模型”直连 Google (gemini-1.5-pro) ---
    // 根据您的诊断截图，gemini-1.5-pro 是可用的。它是目前处理表格能力最强的。
    const modelName = "gemini-1.5-pro"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`正在请求 Google API (${modelName})...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // 增加安全设置，防止因为因为表格内容触发安全拦截
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    // --- 3. 错误处理 ---
    if (!response.ok) {
      console.error("API Error Response:", data);
      const errorMessage = data.error?.message || "未知 API 错误";
      return NextResponse.json({ error: `Google API 报错: ${errorMessage}` }, { status: response.status });
    }

    // --- 4. 返回结果 ---
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!replyText) {
      return NextResponse.json({ error: "模型没有返回任何内容 (可能是被安全策略拦截)" }, { status: 500 });
    }

    // 为了兼容前端的流式读取，我们伪造一个流
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(replyText));
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("Server Error:", error);
    return NextResponse.json({ error: `服务内部错误: ${error.message}` }, { status: 500 });
  }
}