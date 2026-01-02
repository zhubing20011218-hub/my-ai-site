// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    // 🔍 关键修改：换回最稳、免费额度最高的 Flash 模型
    // Gemini 3 Pro (你的上一个模型) 额度是 0，所以会报错
    // gemini-1.5-flash 是目前 Google 的免费主力，绝对能通！
    const modelName = 'gemini-1.5-flash'; 

    console.log(`1. 正在呼叫免费模型: ${modelName}...`);

    const result = await generateText({
      model: google(modelName),
      messages: messages,
    });

    console.log("2. Google 回复成功！");

    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    
    // 如果万一 1.5-flash 也不行，我们打印出来看
    return new Response(JSON.stringify({ 
      error: "API配额或模型错误", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}
// 强制更新标记: 切换回免费 Flash 模型