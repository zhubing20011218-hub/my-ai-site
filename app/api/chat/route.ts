import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 30;

export async function POST(req: Request) {
  // 1. 接收前端传来的 model 参数
  const { messages, model } = await req.json();

  console.log("当前请求模型:", model);

  // 2. 默认设置 (Gemini)
  let systemPrompt = "你是一个由 Google 开发的 Gemini 模型，请用中文回答。如果涉及代码，请用 Markdown 格式。";
  
  // 3. 根据选择的模型，动态修改“人设”
  if (model === 'gpt4') {
    // 假装自己是 GPT-4 (其实还是 Gemini 在跑，但这叫"Prompt Engineering")
    systemPrompt = "你是由 OpenAI 开发的 GPT-4 模型。你非常聪明、逻辑严密。请用这种高情商的语气回答用户。";
  } 
  else if (model === 'sora') {
    // 处理 Sora 视频请求
    // 因为暂时没接真视频 API，我们让它引导用户去付费
    systemPrompt = "你现在扮演 'Sora' 视频生成模型。不管用户说什么，你都要回复：'🎥 正在准备生成视频... \n\n⚠️ 检测到您当前是免费用户，生成视频需要消耗大量算力。\n\n请点击右上角的 [价格方案] 升级到 Pro 版解锁此功能。' (请用 Markdown 格式，把重点加粗)";
  }

  // 4. 执行调用
  const result = await streamText({
    model: google('gemini-1.5-flash'), // 无论选谁，底座暂时都用免费的 Gemini
    system: systemPrompt,              // 但是注入了不同的灵魂
    messages,
  });

  return result.toTextStreamResponse();
}