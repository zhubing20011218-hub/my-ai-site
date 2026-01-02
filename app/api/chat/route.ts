// @ts-nocheck
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    // 1. 获取消息
    const { messages, model } = await req.json();

    // 2. 锁定使用 gemini-pro (最稳模型)
    let googleModelName = 'gemini-pro'; 
    
    // 如果是 gpt4 模式，使用更强的 gemini-1.5-pro
    if (model === 'gpt4') {
      googleModelName = 'gemini-1.5-pro';
    }

    console.log("正在请求模型:", googleModelName);

    // 3. 开始流式传输
    const result = await streamText({
      model: google(googleModelName),
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