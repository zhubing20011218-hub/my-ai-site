import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages, model } = json; // ✨ 接收前端传来的 model 参数
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 1. 获取环境信息
    const city = req.headers.get('x-vercel-ip-city') || 'Unknown City';
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

    // 2. 确定模型 (双重保险：如果没有传，默认用 2.0)
    // 即使前端传了 pro，我们在 page.tsx 里也暂时映射成了 2.0，所以这里收到的肯定是 2.0
    const targetModel = model || "gemini-2.0-flash-exp";

    // 3. 系统指令
    const SYSTEM_INSTRUCTION = `
    你叫 Eureka。
    当前时间: ${now}
    用户位置: ${city} (如问天气请查此地)

    【回答规范】
    1. **拒绝重复**：回答要干脆利落。
    2. **排版整洁**：使用列表和加粗，禁止使用复杂的 Markdown 表格。
    3. **猜你想问**：
       - 请在回答的最后，生成 3 个后续问题。
       - **格式必须严格如下** (方便前端识别):
       
       <<<SUGGESTIONS_START>>>
       ["问题1", "问题2", "问题3"]
       <<<SUGGESTIONS_END>>>
    `;

    const baseUrl = 'https://generativelanguage.googleapis.com';
    const url = `${baseUrl}/v1beta/models/${targetModel}:streamGenerateContent?key=${apiKey}`;

    const contents = messages.map((m: any) => {
      const parts = [];
      if (typeof m.content === 'string') parts.push({ text: m.content });
      else if (m.content?.text) parts.push({ text: m.content.text });
      if (m.content?.images && Array.isArray(m.content.images)) {
        m.content.images.forEach((img: string) => {
           const base64Data = img.includes(',') ? img.split(',')[1] : img; 
           if(base64Data) parts.push({ inlineData: { mimeType: 'image/jpeg', data: base64Data } });
        });
      }
      return { role: m.role === 'user' ? 'user' : 'model', parts: parts };
    });

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: contents,
      tools: [{ google_search: {} }] 
    };

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(body),
    });

    if (!response.ok) {
        const errText = await response.text();
        return NextResponse.json({ error: `Gemini Error: ${response.status}`, details: errText }, { status: response.status });
    }

    // ✨✨✨ 终极流式解析：修复版贪吃蛇算法 ✨✨✨
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 1. 进食
          buffer += decoder.decode(value, { stream: true });
          
          // 2. 消化
          // 🚨【关键修复】正则表达式必须每次循环都重新定义，或者重置 lastIndex！
          // 否则当 buffer 被切断后，正则的指针会指向错误的位置，导致跳过内容！
          const regex = /"text"\s*:\s*"((?:[^"\\]|\\.)*)"/g;
          
          let match;
          let lastIndex = 0;

          while ((match = regex.exec(buffer)) !== null) {
             const rawText = match[1];
             lastIndex = regex.lastIndex;

             try {
                const text = JSON.parse(`"${rawText}"`);
                controller.enqueue(new TextEncoder().encode(text));
             } catch (e) {
                controller.enqueue(new TextEncoder().encode(rawText));
             }
          }

          // 3. 排泄：切掉处理过的部分
          if (lastIndex > 0) {
             buffer = buffer.slice(lastIndex);
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}