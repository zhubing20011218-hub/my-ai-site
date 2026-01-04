import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 1. 定义模型映射 (全面升级到 2.0)
const MODEL_MAP: Record<string, string> = {
  // 2026年了，让我们尝试更新的模型
  "fast": "gemini-2.0-flash-exp", 
  "pro": "gemini-2.0-flash-exp",   
  "thinking": "gemini-2.0-flash-exp", 
};

export async function POST(req: NextRequest) {
  let apiKey = "";
  try {
    const json = await req.json(); 
    const { messages, model } = json;
    
    apiKey = process.env.GEMINI_API_KEY || "";

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 默认使用 2.0
    const targetModel = MODEL_MAP[model] || "gemini-2.0-flash-exp";

    console.log(`[Debug] Trying to use model: ${targetModel}`);

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

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Error From Google]", errText);

        // 🚨【关键功能】如果报错 404，自动查询当前可用模型列表并打印！
        if (response.status === 404) {
            console.log("🚨 Model not found. Fetching available models list...");
            try {
                const listUrl = `${baseUrl}/v1beta/models?key=${apiKey}`;
                const listResp = await fetch(listUrl);
                const listData = await listResp.json();
                console.log("📋 === AVAILABLE MODELS LIST (2026) === 📋");
                // 只打印 name 字段，方便查看
                console.log(listData.models?.map((m:any) => m.name) || listData);
                console.log("==========================================");
            } catch (listErr) {
                console.error("Failed to list models", listErr);
            }
        }
        
        return NextResponse.json({ error: `Gemini Error: ${response.status}`, details: errText }, { status: response.status });
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