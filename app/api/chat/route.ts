// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 60; // 付费版可以处理更长任务，延长时间限制

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🏆 这里的名字来自你的 Google 后台
    // 既然你付费了，这个最强模型现在应该为你敞开大门了！
    const modelName = 'gemini-3-pro-preview'; 

    console.log(`🚀 正在呼叫尊贵的 Gemini 3 模型: ${modelName}...`);

    const result = await generateText({
      model: google(modelName),
      messages: messages,
    });

    console.log("✅ Gemini 3 回复成功！");

    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    
    // 如果刚付完款 Google 系统还在生效中（可能有几分钟延迟），会显示在这里
    return new Response(JSON.stringify({ 
      error: "调用失败", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// 强制更新标记: 启用 Gemini 3 Pro