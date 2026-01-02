import { google } from '@ai-sdk/google';
import { generateText } from 'ai'; // 👈 注意这里换成了 generateText

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    // 1. 打印日志，确认请求到了后端
    console.log("收到请求，模型:", model);
    console.log("Key是否存在:", !!process.env.GOOGLE_GENERATIVE_AI_API_KEY);

    let googleModelName = 'gemini-1.5-flash';
    if (model === 'gpt4') {
      googleModelName = 'gemini-1.5-pro';
    }

    // 2. 强制使用非流式生成 (这样如果有错，会直接抛出异常，而不是断流)
    const result = await generateText({
      model: google(googleModelName as any),
      messages: messages,
    });

    // 3. 拿到结果直接返回
    return new Response(result.text);

  } catch (error: any) {
    console.error("后端报错:", error);
    
    // 4. 把具体的错误信息返回给前端！
    // 这样你的网页就会弹窗告诉你到底是哪里错了 (比如 API Key 无效)
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}