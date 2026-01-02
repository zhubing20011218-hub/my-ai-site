// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🔍 关键修改：使用 Google 官方的精准版本号
    // 简称 'gemini-1.5-flash' 有时候会找不到，加个 -001 就稳了
    const modelName = 'gemini-1.5-flash-001'; 

    console.log(`1. 正在呼叫 Google 模型: ${modelName}...`);

    // 使用 generateText (非流式，最稳)
    const result = await generateText({
      model: google(modelName),
      messages: messages,
    });

    console.log("2. Google 回复成功！");

    // 直接返回文本
    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    
    // 把详细错误吐给前端，方便我们确认
    return new Response(JSON.stringify({ 
      error: "Google API 报错", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// 强制触发更新标记 v3.0