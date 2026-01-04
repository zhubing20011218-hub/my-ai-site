import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 1. 定义模型翻译字典
// 🔴 修正：去掉所有后缀，只用最基础的官方名称，这是容错率最高的写法
const MODEL_MAP: Record<string, string> = {
  "fast": "gemini-1.5-flash",
  "pro": "gemini-1.5-pro",
  "thinking": "gemini-1.5-pro",
};

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages, model } = json;
    
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 映射模型名称
    // 🔴 修正：默认值也改为通用名
    const targetModel = MODEL_MAP[model] || "gemini-1.5-flash";

    // 🖨️ 调试日志：这会打印在 Vercel 的 Logs 里面，帮我们要命的时候找原因
    console.log(`[Debug] Requesting Model: ${targetModel}`);

    // 确定 API 地址
    let baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
    if (baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0, -1);

    // 2. 整理历史记录
    const contents = messages.map((m: any) => {
      const parts = [];
      if (typeof m.content === 'string') {
        parts.push({ text: m.content });
      } else if (m.content?.text) {
        parts.push({ text: m.content.text });
      }
      if (m.content?.images && Array.isArray(m.content.images)) {
        m.content.images.forEach((img: string) => {
          // 处理 Base64 图片
          const base64Data = img.includes(',') ? img.split(',')[1] : img; 
          if (base64Data) {
            parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
          }
        });
      }
      return { role: m.role === 'user' ? 'user' : 'model', parts: parts };
    });

    // 3. 构造请求 URL
    const url = `${baseUrl}/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey}`;

    console.log(`[Debug] Full URL (hidden key): ${url.replace(apiKey, 'HIDDEN')}`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Error From Google]", errText);
        
        // 尝试解析错误信息，看是不是模型不存在
        try {
            const errJson = JSON.parse(errText);
            return NextResponse.json({ 
                error: `Gemini Error: ${response.status}`, 
                message: errJson.error?.message || errText 
            }, { status: response.status });
        } catch (e) {
            return NextResponse.json({ error: `Gemini Error: ${response.status}`, details: errText }, { status: response.status });
        }
    }

    // 4. 处理流式响应
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          buffer += decoder.decode(value, { stream: true });
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; 
          for (const line of lines) {
             const trimmed = line.trim();
             if (!trimmed) continue;
             try {
                let cleanJson = trimmed;
                if (cleanJson.startsWith(',')) cleanJson = cleanJson.slice(1);
                if (cleanJson.startsWith('[')) cleanJson = cleanJson.slice(1);
                if (cleanJson.endsWith(']')) cleanJson = cleanJson.slice(0, -1);
                const json = JSON.parse(cleanJson);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) controller.enqueue(new TextEncoder().encode(text));
             } catch (e) {}
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (e: any) {
    console.error("[Server Internal Error]", e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}