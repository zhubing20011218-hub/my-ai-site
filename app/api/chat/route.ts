import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, model, persona } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    console.log(`[API Request] Model: ${model}`);

    // ... (Replicate 画图/视频逻辑保持不变，省略以节省篇幅，请保留之前的代码) ...
    // ... 如果需要我完整写出 Replicate 部分请告诉我，否则只替换下面的 Gemini 部分 ...

    // ============================================================
    // 🎨 分支 1：绘图模型 (Banana SDXL)
    // ============================================================
    if (model === 'banana-sdxl') {
        // ... (保持之前的 Replicate 绘图代码) ...
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return new Response(`![Generated Image](${output[0]})\n\n✅ **绘图完成！**\n*消耗: $0.20*`);
    }

    // ============================================================
    // 🎬 分支 2：视频模型
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        // ... (保持之前的 Replicate 视频代码) ...
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        const videoOutput: any = await replicate.run(
          "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
          { input: { prompt: prompt, fps: 24, width: 1024, height: 576, num_frames: 24 } }
        );
        const videoUrl = videoOutput[0];
        return new Response(`[视频生成完毕](${videoUrl})\n\n<video controls src="${videoUrl}" width="100%" style="border-radius: 12px; margin-top: 10px;"></video>\n\n✅ **视频生成成功！**\n*消耗: $2.50*`);
    }

    // ============================================================
    // 🧠 分支 3：Gemini 文字模型 (精准映射你的 2.5 权限)
    // ============================================================
    
    let targetModel = 'gemini-2.5-flash'; // 默认保底

    // 1. 低档 ($0.03) -> 利润王
    if (model === 'gemini-2.0-flash-exp') {
        targetModel = 'gemini-2.5-flash'; 
    } 
    // 2. 中档 ($0.05) -> 稳定输出
    else if (model === 'gemini-1.5-pro') {
        targetModel = 'gemini-2.5-pro';   
    } 
    // 3. 高档 ($0.07) -> 思考者 (Exp 1206)
    else if (model === 'gemini-2.0-flash-thinking-exp') {
        targetModel = 'gemini-exp-1206'; 
    }

    let systemInstruction = "You are Eureka, a helpful AI assistant.";
    
    // 如果是 Exp-1206 (Thinking)，它自带 thinking 能力，但我们可以引导它更深入
    if (targetModel === 'gemini-exp-1206') {
        systemInstruction += " You are in Deep Thinking Mode. Analyze the user's request thoroughly using Chain of Thought before answering.";
    }
    
    if (persona === 'tiktok_script') systemInstruction += " You are a TikTok viral script expert.";

    const geminiModel = genAI.getGenerativeModel({ 
      model: targetModel, 
      systemInstruction: systemInstruction 
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
    console.error("Chat Route Error:", error);
    let userMsg = "服务暂时繁忙，请稍后再试。";
    if (error.toString().includes("402")) userMsg = "Replicate 余额不足，请充值。";
    return new Response(`❌ **请求失败**\n\n${userMsg}\n\n*Debug info: ${error.message}*`);
  }
}