// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🔍 关键修改：换成 Google 目前的主力模型名字
    // gemini-pro 已经旧了，gemini-1.5-flash 是现在的标准
    const modelName = 'gemini-1.5-flash'; 

    console.log(`1. 正在呼叫 Google 模型: ${modelName}...`);

    // 使用 generateText (非流式，最稳，绝对不会报 is not a function)
    const result = await generateText({
      model: google(modelName),
      messages: messages,
    });

    console.log("2. Google 回复成功！");

    // 直接返回文本
    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    
    // 如果这个模型也挂了，直接把 Google 的回话显示出来
    return new Response(JSON.stringify({ 
      error: "Google报错", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}

// Final fix for model name