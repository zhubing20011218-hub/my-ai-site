import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// ✨ 配置中心：所有 API Key 都在这里统一管理
// 即使没有 SORA_API_KEY，代码也不会崩，因为我们会做检查
const KEYS = {
  GEMINI: process.env.GEMINI_API_KEY,
  SORA: process.env.SORA_API_KEY,     // 未来您在 Vercel 填入 SORA_API_KEY 即可生效
  VEO: process.env.VEO_API_KEY,       // 同上
  BANANA: process.env.BANANA_API_KEY, // 同上
};

// 辅助函数：构造统一的文本流 (Stream helper)
// 无论是真 Gemini 还是假 Sora，我们都用这个标准格式发给前端
const createTextStream = (text: string) => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });
};

// --- 处理器 1: Gemini (现有的稳定逻辑) ---
async function handleGemini(req: NextRequest, json: any, model: string) {
  if (!KEYS.GEMINI) throw new Error("Gemini API Key missing");

  // 映射不稳定的别名到 2.0 稳定版 (为了防止 404)
  let targetModel = model;
  if (model === 'gemini-1.5-pro') targetModel = 'gemini-1.5-pro'; // 保持原样
  else targetModel = 'gemini-2.0-flash-exp'; // 其他所有都指向 2.0 Flash

  const city = req.headers.get('x-vercel-ip-city') || 'Unknown City';
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

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
  const url = `${baseUrl}/v1beta/models/${targetModel}:streamGenerateContent?key=${KEYS.GEMINI}`;

  const contents = json.messages.map((m: any) => {
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
      throw new Error(`Gemini Error: ${response.status} - ${errText}`);
  }

  // Gemini 专用流式解析器 (正则状态修复版)
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
        
        // 🚨 每次循环重新定义正则，防止状态残留
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
        if (lastIndex > 0) buffer = buffer.slice(lastIndex);
      }
      controller.close();
    }
  });

  return new NextResponse(stream, { headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}

// --- 处理器 2: Sora (框架占位符) ---
async function handleSora(req: NextRequest, json: any) {
  // 1. 检查 Key
  if (!KEYS.SORA) {
    // 优雅降级：如果没有 Key，返回一个模拟的等待文本，不报错
    return new NextResponse(createTextStream("🎬 [Sora Framework Ready]\n\n系统提示：当前环境尚未配置 `SORA_API_KEY`。\n这是一个占位符响应，表明前端请求已成功到达后端路由。\n\n待您配置真实 Key 后，此处将显示生成的视频链接。"), { headers: { 'Content-Type': 'text/plain' } });
  }

  // 2. 这里写真实的 Sora API 调用逻辑 (未来填空)
  // const response = await fetch('https://api.openai.com/v1/videos' ...);
  // ...
}

// --- 处理器 3: Veo (框架占位符) ---
async function handleVeo(req: NextRequest, json: any) {
  if (!KEYS.VEO) {
    return new NextResponse(createTextStream("🎥 [Veo Framework Ready]\n\n系统提示：当前环境尚未配置 `VEO_API_KEY`。\nGoogle Veo 视频生成请求已接收。"), { headers: { 'Content-Type': 'text/plain' } });
  }
}

// --- 处理器 4: Banana (框架占位符) ---
async function handleBanana(req: NextRequest, json: any) {
  if (!KEYS.BANANA) {
    return new NextResponse(createTextStream("🍌 [Banana GPU Framework Ready]\n\n系统提示：当前环境尚未配置 `BANANA_API_KEY`。\nSDXL 绘图任务已接收。"), { headers: { 'Content-Type': 'text/plain' } });
  }
}


// ✨✨✨ 中央调度器 ✨✨✨
export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { model } = json;

    // 根据 model 名称进行分流
    if (model.startsWith("gemini")) {
      return await handleGemini(req, json, model);
    } 
    else if (model === "sora-v1") {
      return await handleSora(req, json);
    }
    else if (model === "veo-google") {
      return await handleVeo(req, json);
    }
    else if (model === "banana-sdxl") {
      return await handleBanana(req, json);
    }
    else {
      // 默认兜底：Gemini
      return await handleGemini(req, json, "gemini-2.0-flash-exp");
    }

  } catch (e: any) {
    console.error("Route Error:", e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}