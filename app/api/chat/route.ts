import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 强制使用目前唯一能通的 2.0 模型
const MODEL_NAME = "gemini-2.0-flash-exp";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages } = json;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 确定 API 地址 (Vercel 直连 Google)
    const baseUrl = 'https://generativelanguage.googleapis.com';
    const url = `${baseUrl}/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${apiKey}`;

    console.log(`[Connecting] ${url.replace(apiKey, 'HIDDEN')}`);

    // 整理历史记录
    const contents = messages.map((m: any) => {
      const parts = [];
      if (typeof m.content === 'string') {
        parts.push({ text: m.content });
      } else if (m.content?.text) {
        parts.push({ text: m.content.text });
      }
      if (m.content?.images && Array.isArray(m.content.images)) {
        m.content.images.forEach((img: string) => {
          const base64Data = img.includes(',') ? img.split(',')[1] : img; 
          if (base64Data) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
          }
        });
      }
      return { role: m.role === 'user' ? 'user' : 'model', parts: parts };
    });

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Google Error]", errText);
        return NextResponse.json({ error: `Gemini Error: ${response.status}`, details: errText }, { status: response.status });
    }

    // 4. 处理流式响应 (透视模式)
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';

        console.log("--- STREAM STARTED ---");

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          // 🚨【关键】把原始数据打印出来，看看 2.0 到底长啥样！
          console.log("[Raw Chunk]", chunk); 
          
          buffer += chunk;
          
          // 尝试更加暴力的解析方法 (正则提取)，防止 JSON 格式不兼容
          // 2.0 有时候返回的数据很乱，我们直接抓取 "text": "..."
          const matches = buffer.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
          for (const match of matches) {
              const text = match[1];
              if (text) {
                  // 解码 unicode 字符 (比如 \n, \uXXXX)
                  try {
                      const decodedText = JSON.parse(`"${text}"`);
                      controller.enqueue(new TextEncoder().encode(decodedText));
                  } catch (e) {
                      // 如果解码失败，直接发原文
                      controller.enqueue(new TextEncoder().encode(text));
                  }
              }
          }
          // 清空 buffer 防止重复处理 (这里简化处理，实际生产可能需要更复杂的 buffer 管理)
          // 但为了测试 2.0，这招通常最有效
          buffer = ""; 
        }
        console.log("--- STREAM ENDED ---");
        controller.close();
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (e: any) {
    console.error("[Server Internal Error]", e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}