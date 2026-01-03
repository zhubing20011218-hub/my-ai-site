import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 简单粗暴的数据组装 ---
    let parts: any[] = [];

    if (typeof lastMsg.content === 'string') {
      parts.push({ text: lastMsg.content });
    } else if (typeof lastMsg.content === 'object') {
      const text = lastMsg.content.text || "";
      if (text) parts.push({ text: text });

      // 图片
      if (lastMsg.content.images?.length > 0) {
        lastMsg.content.images.forEach((img: string) => {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: img.split(',')[1]
            }
          });
        });
      }

      // Excel 文件
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("正在处理文件:", file.name);
        try {
          if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
            const workbook = XLSX.read(file.content.split(',')[1], { type: 'base64' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            parts.push({ text: `\n\n【表格数据】\n${csvData.slice(0, 15000)}` });
          } else if (file.name.match(/\.(txt|md|js|py|json)$/i)) {
             const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
             parts.push({ text: `\n\n【文件内容】\n${textData.slice(0, 15000)}` });
          }
        } catch (e) {
           console.error("文件解析失败", e);
        }
      }
    }

    // --- 2. 这里的改动是关键 ---
    // 我们直接用您的诊断列表里出现的 "gemini-2.0-flash-exp"
    // 这个模型是 Google 目前最新的实验版，通常没有区域限制，且支持所有功能
    const modelName = "gemini-2.0-flash-exp"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`正在直连 Google (${modelName})...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // 安全设置全开，防止误杀
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
      console.error("Google API Error:", data);
      // 如果 2.0 也不行，我们绝望地试一下 1.5-flash
      if (response.status === 404) {
         return NextResponse.json({ error: `模型 ${modelName} 连接失败 (404)，请检查 API Key 权限` }, { status: 404 });
      }
      return NextResponse.json({ error: data.error?.message || "Google API 报错" }, { status: 500 });
    }

    // --- 4. 成功返回 ---
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 无言以对";
    
    // 伪装成流式返回，让前端开心
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(replyText));
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("System Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}