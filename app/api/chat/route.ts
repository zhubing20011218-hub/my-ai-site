// @ts-nocheck
import { google } from '@ai-sdk/google';
import { streamText } from 'ai'; // 👈 换回流式，速度起飞！

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🏆 1. 确认身份：使用最强模型 Gemini 3 Pro
    const modelName = 'gemini-3-pro-preview'; 
    
    // ⏰ 2. 注入灵魂：获取当前北京时间
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    // 📝 3. 设置系统人设 (System Prompt)
    // 这里就是告诉它：你是谁，现在几点，你要怎么表现
    const systemPrompt = `
      你是由 Google 开发的最强 AI 模型 Gemini 3 Pro。
      当前北京时间是：${now}。
      你的回答必须准确、专业且即使。
      请用中文回答。
    `;

    console.log(`🚀 [真实调用] 正在请求模型: ${modelName}`);
    console.log(`⏰ [系统时间] 已注入时间: ${now}`);

    // 🔥 4. 开启流式传输 (打字机效果)
    const result = await streamText({
      model: google(modelName),
      system: systemPrompt, // 把时间告诉它
      messages: messages,
    });

    // ✅ 5. 返回流数据 (适配你的前端)
    // 使用 textStream 直接返回纯文本流，兼容性最好
    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    return new Response(JSON.stringify({ 
      error: "调用失败", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}