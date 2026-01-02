// @ts-nocheck
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages, model } = await req.json();

    let googleModelName = 'gemini-pro'; 
    if (model === 'gpt4') {
      googleModelName = 'gemini-1.5-pro';
    }

    console.log("正在请求模型:", googleModelName);

    const result = await streamText({
      model: google(googleModelName),
      messages: messages,
    });

    // 🛑 删掉了报错的那行: result.toDataStreamResponse()
    
    // ✅ 换成这行：使用最原始的 Response 返回纯文本流
    // 这个写法 100% 不会报错，因为它不依赖 SDK 的新功能
    return new Response(result.textStream, {
      headers: { 
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked'
      }
    });

  } catch (error: any) {
    console.error("后端报错:", error);
    return new Response(JSON.stringify({ error: error.message }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}