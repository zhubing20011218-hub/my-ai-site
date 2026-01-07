import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

// 初始化 API Keys
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

// 🚀 核心修改：移除 'edge'，使用默认 Node.js 环境，配合 Pro 账号实现 5分钟超时
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now(); 
  console.log(`[API Start] Request received at ${new Date().toISOString()}`);

  try {
    const { messages, model, persona } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    console.log(`[API Processing] Model: ${model}`);

    // ============================================================
    // 🎨 分支 1：绘图模型
    // ============================================================
    if (model === 'banana-sdxl') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[API Image Done] Finished in ${duration.toFixed(2)}s`);
        
        return new Response(`![Generated Image](${output[0]})\n\n✅ **绘图完成！**`);
    }

    // ============================================================
    // 🎬 分支 2：视频模型 (高清 Pro 版)
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        console.log(`[API Video Start] Sending request to Replicate... (Expect long wait)`);
        
        // 使用高清分辨率，Pro 账号 Node.js 环境下等待 5 分钟毫无压力
        const videoOutput: any = await replicate.run(
          "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
          { 
            input: { 
              prompt: prompt, 
              fps: 24, 
              width: 1024,   
              height: 576,   
              num_frames: 24 
            } 
          }
        );
        
        const duration = (Date.now() - startTime) / 1000;
        console.log(`[API Video Done] Finished in ${duration.toFixed(2)}s. URL: ${videoOutput[0]}`);
        
        const videoUrl = videoOutput[0];
        return new Response(videoUrl);
    }

    // ============================================================
    // 🧠 分支 3：Gemini 文字模型
    // ============================================================
    
    let targetModel = 'gemini-2.5-flash'; 

    if (model === 'gemini-2.0-flash-exp') {
        targetModel = 'gemini-2.5-flash'; 
    } else if (model === 'gemini-1.5-pro') {
        targetModel = 'gemini-2.5-pro';   
    } else if (model === 'gemini-exp-1206' || model === 'gemini-2.0-flash-thinking-exp') {
        targetModel = 'gemini-exp-1206'; 
    }

    let systemInstruction = `You are Eureka, a helpful AI assistant. 
    IMPORTANT: After your main response, you MUST generate 3 related follow-up questions that the user might want to ask next.
    Format them strictly like this at the very end:
    
    ___RELATED___
    Question 1? | Question 2? | Question 3?
    
    (Do not add any other text after the related questions).`;
    
    if (model === 'gemini-exp-1206') {
        systemInstruction += " You are in Deep Thinking Mode. Analyze the problem step-by-step.";
    }

    const geminiModel = genAI.getGenerativeModel({ 
      model: targetModel, 
      systemInstruction: systemInstruction,
      tools: [{ googleSearch: {} } as any] 
    });

    const chat = geminiModel.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }],
      })),
    });

    const currentContent = messages[messages.length - 1].content;
    let result;
    
    if (typeof currentContent === 'object' && currentContent.images && currentContent.images.length > 0) {
      const imageParts = currentContent.images.map((img: string) => ({
        inlineData: { data: img.split(",")[1], mimeType: "image/jpeg" },
      }));
      result = await geminiModel.generateContentStream([currentContent.text, ...imageParts]);
    } else {
      result = await chat.sendMessageStream(typeof currentContent === 'string' ? currentContent : currentContent.text);
    }

    const stream = new ReadableStream({
      async start(controller) {
        try {
            for await (const chunk of result.stream) {
              const chunkText = chunk.text();
              if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
            }
            controller.close();
        } catch (e) {
            console.error("Stream error:", e);
            controller.close();
        }
      },
    });

    return new Response(stream);

  } catch (error: any) {
    const duration = (Date.now() - startTime) / 1000;
    console.error(`[API ERROR] Occurred after ${duration.toFixed(2)}s. Details:`, error);
    
    let userMsg = "服务暂时繁忙，请稍后再试。";
    if (error.toString().includes("402")) userMsg = "API 余额不足，请联系管理员。";
    if (error.toString().includes("429")) userMsg = "该模型调用过于频繁，请稍后再试。"; 
    
    // 超时检测
    if (duration > 55 && duration < 65) {
         userMsg = "生成时间较长，请检查网络或稍后重试。";
    }
    
    return new Response(`❌ **请求失败**\n\n${userMsg}`);
  }
}