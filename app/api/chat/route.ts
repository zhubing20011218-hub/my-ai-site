import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  // 默认使用 flash 模型
  let googleModelName = 'gemini-1.5-flash'; 
  
  // 如果前端以后加了 gpt4，这里可以做判断
  if (model === 'gpt4') {
     googleModelName = 'gemini-1.5-pro'; 
  }

  try {
    const result = await streamText({
      // @ts-ignore: 忽略类型检查，强制使用字符串
      model: google(googleModelName as any),
      messages,
    });

    return result.toDataStreamResponse();
  } catch (error) {
    console.error("Google API Error:", error);
    return new Response("API Error: 请检查后台日志", { status: 500 });
  }
}