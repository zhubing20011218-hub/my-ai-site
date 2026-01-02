import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  const { messages, model } = await req.json();

  let googleModelName = 'gemini-1.5-flash'; 
  
  if (model === 'gpt4') {
     googleModelName = 'gemini-1.5-pro'; 
  }

  try {
    const result = await streamText({
      // @ts-ignore: 忽略模型名称检查
      model: google(googleModelName as any),
      messages,
    });

    // ✅ 修复：改成 Vercel 认识的名字
    // @ts-ignore: 再次强制忽略类型检查
    return result.toTextStreamResponse();
  } catch (error) {
    console.error("Google API Error:", error);
    return new Response("API Error: 请检查后台日志", { status: 500 });
  }
}