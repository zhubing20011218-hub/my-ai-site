// @ts-nocheck
import { google } from '@ai-sdk/google';
import { streamText } from 'ai';

export const maxDuration = 60;

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const modelName = 'gemini-3-pro-preview'; 
    const now = new Date().toLocaleString('zh-CN', { timeZone: 'Asia/Shanghai' });
    
    // 🧠 核心修改：系统提示词 (System Prompt)
    // 我们强制要求 AI 在最后输出 "___RELATED___" 加上三个相关问题
    const systemPrompt = `
      你是由 Google 开发的最强 AI 模型 Gemini 3 Pro。
      当前北京时间是：${now}。
      
      请遵守以下规则：
      1. 回答必须准确、专业且即使。
      2. 请用中文回答。
      3. 在每次回答的最后，必须生成 3 个用户可能感兴趣的简短后续问题。
      4. 格式必须严格如下：
         
         (你的正常回答内容...)

         ___RELATED___问题1|问题2|问题3
      
      注意： "___RELATED___" 是分隔符，不要改动，后面紧跟三个问题，用竖线 "|" 隔开。
    `;

    console.log(`🚀 [真实调用] 正在请求模型: ${modelName}`);

    const result = await streamText({
      model: google(modelName),
      system: systemPrompt,
      messages: messages,
    });

    return new Response(result.textStream, {
      headers: {
        'Content-Type': 'text/plain; charset=utf-8',
        'Transfer-Encoding': 'chunked',
      },
    });

  } catch (error: any) {
    console.error("❌ 报错详情:", error);
    return new Response(JSON.stringify({ 
      error: "调用失败", 
      details: error.message 
    }), { 
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    });
  }
}