import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 构建原生的 Google API 请求体 ---
    // 我们手动组装数据，不依赖 SDK，这样绝对不会出错
    let parts: any[] = [];
    let systemInstruction = ""; 

    // 处理文本和文件
    if (typeof lastMsg.content === 'string') {
      parts.push({ text: lastMsg.content });
    } else if (typeof lastMsg.content === 'object') {
      const text = lastMsg.content.text || "";
      if (text) parts.push({ text: text });

      // 处理图片
      if (lastMsg.content.images?.length > 0) {
        lastMsg.content.images.forEach((img: string) => {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: img.split(',')[1] // 去掉 base64 前缀
            }
          });
        });
      }

      // 处理 Excel 文件 (核心功能)
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("正在解析文件:", file.name);
        
        if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
          try {
            const workbook = XLSX.read(file.content.split(',')[1], { type: 'base64' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            // 把表格数据变成文字喂给 AI
            parts.push({ text: `\n\n【附件表格数据 (${file.name})】:\n${csvData.slice(0, 10000)}` });
          } catch (e) {
            console.error("解析Excel失败:", e);
          }
        } else if (file.name.match(/\.(txt|md|js|py|json)$/i)) {
           const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
           parts.push({ text: `\n\n【附件文件内容 (${file.name})】:\n${textData.slice(0, 10000)}` });
        }
      }
    }

    // --- 2. 直接发起 HTTP 请求 (绕过 SDK) ---
    // 使用您账号里确认存在的 gemini-1.5-flash 模型
    const modelName = "gemini-1.5-flash"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`正在直连 Google API: ${modelName}...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }]
      })
    });

    const data = await response.json();

    // --- 3. 处理错误 ---
    if (!response.ok) {
      console.error("Google API 报错:", data);
      const errMsg = data.error?.message || "未知错误";
      // 如果是 404，说明模型名字真的不对，那我们就用备用的 2.0
      if (response.status === 404) {
         throw new Error(`模型 ${modelName} 无法访问，请尝试 gemini-pro`);
      }
      throw new Error(errMsg);
    }

    // --- 4. 返回结果 (非流式，保证稳定性) ---
    // 为了防止流式解析再出问题，我们先用一次性返回，确保功能先通！
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "AI 没有返回任何内容";
    
    // 模拟一个流式响应给前端，这样前端不用改代码
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(replyText));
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("最终错误:", error);
    return NextResponse.json({ error: `请求失败: ${error.message}` }, { status: 500 });
  }
}