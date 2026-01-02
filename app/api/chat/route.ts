// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🏆 这里的名字来自你的截图 image_c33772.png
    // 既然你的后台显示这个模型，那用它绝对错不了！
    const modelName = 'gemini-3-pro-preview'; 

    console.log(`1. 正在呼叫 Google 最新模型: ${modelName}...`);

    const result = await generateText({
      model: google(modelName),
      messages: messages,
    });

    console.log("2. Google 回复成功！");

    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    return new Response(JSON.stringify({ 
      error: "Google API 报错", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// 强制更新标记: 使用截图中的 gemini-3 模型