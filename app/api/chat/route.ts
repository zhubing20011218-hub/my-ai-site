import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 使用最新的 2.0 模型 (支持联网搜索)
const MODEL_NAME = "gemini-2.0-flash-exp";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages } = json;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 1. ⌚️ 装回“手表”和“定位器”
    // 获取 Vercel 提供的地理位置信息 (如果本地运行则是 Unknown)
    const city = req.headers.get('x-vercel-ip-city') || 'Unknown City';
    const country = req.headers.get('x-vercel-ip-country') || 'Unknown Country';
    // 获取精准的上海时间
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

    // ✨ 系统指令：注入灵魂 + 时间 + 地点
    const SYSTEM_INSTRUCTION = `
    你叫 Eureka，是一个温暖、幽默、知识渊博的 AI 伙伴。
    
    【你的当前状态】
    - 🕒 **当前时间**: ${now}
    - 📍 **用户大致位置**: ${city}, ${country} (如果用户问天气，优先查询此地)
    
    【回答原则】
    1. **语气**: 自然、像老朋友，多用 Emoji (✨🌈)。
    2. **实时信息**: 你拥有 Google 搜索能力！当用户问天气、新闻、股票等实时信息时，**请务必使用工具查询最新数据**，不要瞎编。
    3. **排版**: 
       - 重点内容加粗。
       - 复杂信息用列表展示。
       - **禁止**使用复杂的 Markdown 表格，除非用户要求。
    
    【结尾要求】
    在回答最后，必须生成 3 个相关建议问题，格式如下：
    ---
    💡 **猜你想问**：
    1. [建议1]
    2. [建议2]
    3. [建议3]
    `;

    // 2. 构造请求 URL
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

    // 3. ✨✨✨ 关键：开启 Google 搜索工具 (Real-time Grounding) ✨✨✨
    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: contents,
      tools: [
        {
          google_search: {} // <--- 这就是让它能查天气的“天眼”
        }
      ]
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("[Google Error]", errText);
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
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;
          
          // 解析逻辑 (兼容 2.0 的搜索结果)
          const matches = buffer.matchAll(/"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g);
          for (const match of matches) {
              const text = match[1];
              if (text) {
                  try {
                      const decodedText = JSON.parse(`"${text}"`);
                      controller.enqueue(new TextEncoder().encode(decodedText));
                  } catch (e) {
                      controller.enqueue(new TextEncoder().encode(text));
                  }
              }
          }
          buffer = ""; 
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