import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

const MODEL_NAME = "gemini-2.0-flash-exp";

export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { messages } = json;
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // 1. 获取环境信息
    const city = req.headers.get('x-vercel-ip-city') || 'Unknown City';
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

    // 2. 系统指令：精准控制排版和建议
    const SYSTEM_INSTRUCTION = `
    你叫 Eureka。
    当前时间: ${now}
    用户位置: ${city} (如问天气请查此地)

    【回答规范】
    1. **拒绝重复**：回答要干脆利落，不要把查到的数据堆砌在最后。
    2. **排版整洁**：使用列表和加粗，禁止使用复杂的 Markdown 表格。
    3. **猜你想问**：
       - 请在回答的最后，生成 3 个后续问题。
       - **格式必须严格如下** (方便前端识别):
       
       <<<SUGGESTIONS_START>>>
       ["问题1", "问题2", "问题3"]
       <<<SUGGESTIONS_END>>>
    `;
    // 注意：上面我用了一个特殊标记，为下一步做“点击按钮”做准备！

    const baseUrl = 'https://generativelanguage.googleapis.com';
    const url = `${baseUrl}/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${apiKey}`;

    const contents = messages.map((m: any) => {
      const parts = [];
      if (typeof m.content === 'string') parts.push({ text: m.content });
      else if (m.content?.text) parts.push({ text: m.content.text });
      return { role: m.role === 'user' ? 'user' : 'model', parts: parts };
    });

    const body = {
      systemInstruction: { parts: [{ text: SYSTEM_INSTRUCTION }] },
      contents: contents,
      tools: [{ google_search: {} }] // 保持联网能力
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
          
          // ✨✨✨ 修复核心：精准解析 JSON，拒绝乱码 ✨✨✨
          // Gemini 的流是按行发送 JSON 对象的，我们按行解析
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 保留未完成的行

          for (const line of lines) {
             const trimmed = line.trim();
             if (!trimmed) continue;
             
             // 清理 JSON 格式标记 ([, ])
             let cleanJson = trimmed;
             if (cleanJson.startsWith(',')) cleanJson = cleanJson.slice(1);
             if (cleanJson.startsWith('[')) cleanJson = cleanJson.slice(1);
             if (cleanJson.endsWith(']')) cleanJson = cleanJson.slice(0, -1);
             if (cleanJson.endsWith(',')) cleanJson = cleanJson.slice(0, -1);

             try {
                const json = JSON.parse(cleanJson);
                // 🎯 只提取 candidates 里的 text (这是 AI 对用户说的话)
                // 🚫 坚决不提取 groundingMetadata 或 tool 里的 text (那是原始数据)
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                }
             } catch (e) {
                // 忽略解析错误的行
             }
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