import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';

// API Key 配置
const KEYS = {
  GEMINI: process.env.GEMINI_API_KEY,
  SORA: process.env.SORA_API_KEY,
  VEO: process.env.VEO_API_KEY,
  BANANA: process.env.BANANA_API_KEY,
};

// 辅助函数：构造文本流
const createTextStream = (text: string) => {
  const encoder = new TextEncoder();
  return new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });
};

// ✨✨✨ 角色指令中心 (Persona Command Center) ✨✨✨
// 这里是 AI 变身的灵魂，确保每个角色都有极强的风格
const getSystemInstruction = (persona: string, time: string, city: string) => {
  const baseInfo = `【实时环境】当前时间: ${time}，用户位置: ${city}。`;
  const formatRequirement = `\n\n【排版规范】多用加粗和列表，拒绝Markdown表格。最后必须生成3个建议(格式: <<<SUGGESTIONS_START>>>["问题1","问题2","问题3"]<<<SUGGESTIONS_END>>>)`;

  switch (persona) {
    case 'tiktok_script':
      return `${baseInfo} 你现在是 TikTok 顶级短视频编导。
      你的目标：创作极具钩子（Hook）和病毒式传播潜力的脚本。
      输出结构必须包含：
      - **黄金3秒 (Hook)**：制造悬念或视觉冲击。
      - **剧情/反转 (Body)**：紧凑无废话。
      - **评论区埋梗 (Comment Hook)**：引导用户评论。
      - **行动号召 (CTA)**：引导点赞收藏。
      风格：夸张、高能、口语化。` + formatRequirement;
      
    case 'sales_copy':
      return `${baseInfo} 你是拥有10年经验的金牌带货文案专家。
      你的目标：让读者看完立刻下单。
      输出逻辑：痛点代入 -> 核心卖点 -> 信任背书 -> 限时催单。
      多使用感叹号和 Emoji。针对 TikTok 电商场景，文案要短小悍利，冲击力强。` + formatRequirement;
      
    case 'customer_service':
      return `${baseInfo} 你是一位高情商的电商客服专家。
      你的原则：情绪安抚 > 解决问题 > 补偿方案。
      语气：极致温柔、专业、带有品牌温度。
      如果是投诉，先深刻道歉，再给出处理结果。` + formatRequirement;
      
    case 'data_analyst':
      return `${baseInfo} 你是严谨的跨境电商数据分析师。
      请基于用户提供的信息进行深度拆解：
      - **竞品差异化分析**
      - **受众画像定位**
      - **SWOT 态势分析**
      风格：冷静、理性、用数据说话。` + formatRequirement;

    default:
      return `${baseInfo} 你叫 Eureka，一个温暖且拥有 Google 搜索能力的 AI 助手。
      如果用户问实时信息，务必调用搜索工具回答。` + formatRequirement;
  }
};

// --- 处理器 1: Gemini (全功能保留版) ---
async function handleGemini(req: NextRequest, json: any, model: string) {
  if (!KEYS.GEMINI) throw new Error("Gemini API Key missing");

  // 模型路由
  let targetModel = model;
  if (model === 'gemini-1.5-pro') targetModel = 'gemini-1.5-pro'; 
  else targetModel = 'gemini-2.0-flash-exp'; 

  const city = req.headers.get('x-vercel-ip-city') || 'Unknown City';
  const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai', hour12: false });

  // ✨ 获取精准指令
  const persona = json.persona || 'general';
  const systemInstructionText = getSystemInstruction(persona, now, city);

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
    systemInstruction: { parts: [{ text: systemInstructionText }] },
    contents: contents,
    tools: [{ google_search: {} }] // 🛰️ 保留联网能力
  };

  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
      const errText = await response.text();
      throw new Error(`Gemini Error: ${response.status}`);
  }

  // 🐍 保留修复版贪吃蛇流式解析逻辑
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
        
        // 关键：正则必须在此定义，防止 lastIndex 状态残留
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

// --- 视频与特殊模型处理器 (框架保留) ---
async function handleSora(req: NextRequest, json: any) {
  return new NextResponse(createTextStream("🎬 [Sora Framework Ready] 待接入 API Key。"), { headers: { 'Content-Type': 'text/plain' } });
}
async function handleVeo(req: NextRequest, json: any) {
  return new NextResponse(createTextStream("🎥 [Veo Framework Ready] 待接入 API Key。"), { headers: { 'Content-Type': 'text/plain' } });
}
async function handleBanana(req: NextRequest, json: any) {
  return new NextResponse(createTextStream("🍌 [Banana Framework Ready] 任务已接收。"), { headers: { 'Content-Type': 'text/plain' } });
}

// 🌐 中央调度器 (保留所有模型识别)
export async function POST(req: NextRequest) {
  try {
    const json = await req.json(); 
    const { model } = json;

    if (model.startsWith("gemini")) {
      return await handleGemini(req, json, model);
    } 
    else if (model === "sora-v1") return await handleSora(req, json);
    else if (model === "veo-google") return await handleVeo(req, json);
    else if (model === "banana-sdxl") return await handleBanana(req, json);
    else return await handleGemini(req, json, "gemini-2.0-flash-exp");

  } catch (e: any) {
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}