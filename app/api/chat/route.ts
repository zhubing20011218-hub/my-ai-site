import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 👇 这一行非常关键！如果红线报错，往往是因为缺了这一行
    const { messages, model } = await req.json();

    // 2. 这里的模型名字不要改，先用 gemini-pro 跑通
    let googleModelName = 'gemini-pro'; 
    
    if (model === 'gpt4') {
      googleModelName = 'gemini-1.5-pro';
    }

    console.log("正在请求模型:", googleModelName);

    // 3. 开始流式传输
    const result = await streamText({
      model: google(googleModelName as any),
      messages: messages,
    });

    // 4. 返回流数据
    return result.toDataStreamResponse();

  } catch (error: any) {
    console.error("后端报错:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}