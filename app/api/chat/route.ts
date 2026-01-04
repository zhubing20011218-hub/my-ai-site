import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// 强制使用目前唯一能通的 2.0 模型
const MODEL_NAME = "gemini-2.0-flash-exp";

// ✨✨✨ 核心升级：注入灵魂与人设 ✨✨✨
const SYSTEM_INSTRUCTION = `
你叫 Eureka，是一个温暖、幽默、非常有亲和力的 AI 伙伴，而不是冷冰冰的机器。
请遵循以下原则：
1. **语气风格**：
   - 说话要像老朋友一样自然、活泼。
   - 适当使用 Emoji (✨🚀😄) 来增加情感色彩。
   - 拒绝官腔，拒绝教科书式的说教。
   - 如果用户心情不好，要给予共情和安慰。

2. **建议胶囊 (Suggestions)**：
   - 在每次回答的最后，**必须**根据上下文生成 3 个用户可能感兴趣的后续问题或行动。
   - **格式要求**：请严格按照下方格式输出，方便用户阅读：
     
     ---
     💡 **猜你想问**：
     1. [建议问题1]
     2. [建议问题2]
     3. [建议问题3]
`;

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages } = json;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

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

    // ✨ 在请求中带上系统指令 (System Instruction)
    const body = {
      systemInstruction: {
        parts: [{ text: SYSTEM_INSTRUCTION }]
      },
      contents: contents
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

    // 处理流式响应 (保持之前的正则解析逻辑，因为它很稳)
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