// @ts-nocheck
import { google } from '@ai-sdk/google';
import { generateText } from 'ai'; // 👈 这次我们不用 stream，用 generateText

export const maxDuration = 30;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    console.log("1. 后端收到请求，开始呼叫 Google...");

    // 强制使用非流式 (一次性生成)
    // 这种方式兼容性最强，最不容易报错
    const result = await generateText({
      model: google('gemini-pro'),
      messages: messages,
    });

    console.log("2. Google 回复成功！内容长度:", result.text.length);

    // 直接返回纯文本
    return new Response(result.text);

  } catch (error: any) {
    console.error("❌ 严重错误:", error);
    // 把错误详情直接返回给前端，让我们看到！
    return new Response("错误: " + error.message, { status: 500 });
  }
}