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

    // 2. 系统指令
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
    const url = `${baseUrl}/v1beta/models/${MODEL_NAME}:streamGenerateContent?key=${apiKey}`;

    const contents = messages.map((m: any) => {
      const parts = [];
      if (typeof m.content === 'string') parts.push({ text: m.content });
      else if (m.content?.text) parts.push({ text: m.content.text });
      // 这里的 image 处理保持原样
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

    // ✨✨✨ 修复核心：稳健的流式解析 ✨✨✨
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) { controller.close(); return; }
        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // 1. 累积数据到缓冲区
          buffer += decoder.decode(value, { stream: true });
          
          // 2. 只有遇到换行符才说明这一句发完了，才开始切分
          // (Google 的流是按行发送 JSON 的，这是一个铁律)
          let boundary = buffer.indexOf('\n');
          
          while (boundary !== -1) {
            const line = buffer.slice(0, boundary).trim(); // 提取完整的一行
            buffer = buffer.slice(boundary + 1); // 剩下的放回缓冲区等待下一次拼接
            
            if (line) {
               try {
                  // 处理 JSON 里的逗号/方括号，使其变成合法的 JSON 对象
                  let cleanJson = line;
                  if (cleanJson.startsWith(',')) cleanJson = cleanJson.slice(1);
                  if (cleanJson.startsWith('[')) cleanJson = cleanJson.slice(1);
                  if (cleanJson.endsWith(']')) cleanJson = cleanJson.slice(0, -1);
                  if (cleanJson.endsWith(',')) cleanJson = cleanJson.slice(0, -1); // 结尾也可能有逗号

                  const json = JSON.parse(cleanJson);
                  const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                  
                  if (text) {
                      controller.enqueue(new TextEncoder().encode(text));
                  }
               } catch (e) {
                  // 解析失败的行通常是元数据，忽略即可，不会导致崩坏
               }
            }
            // 继续找下一个换行符
            boundary = buffer.indexOf('\n');
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