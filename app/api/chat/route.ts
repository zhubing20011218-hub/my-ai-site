import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

export const runtime = "nodejs"; 
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

function calculateDimensions(ratio: string, resolution: string) {
    // 强制限制最大宽/高为 1024，防止模型崩坏返回垃圾数据
    // 即使选了 4K，也先按模型能跑的最大值跑，保证成功率
    const MAX_SIDE = 1024; 
    let width = 1024;
    let height = 576;

    const [wRatio, hRatio] = ratio.split(':').map(Number);
    if (wRatio > hRatio) {
        width = MAX_SIDE;
        height = Math.round(width * (hRatio / wRatio));
    } else {
        height = MAX_SIDE;
        width = Math.round(height * (wRatio / hRatio));
    }
    // 必须是 64 的倍数
    width = Math.floor(width / 64) * 64;
    height = Math.floor(height / 64) * 64;
    return { width, height };
}

export async function POST(req: Request) {
  try {
    const { messages, model, aspectRatio, resolution, duration, image } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // --- 1. 绘图模型 (Banana) ---
    if (model === 'banana-sdxl') {
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return new Response(`![Generated Image](${output[0]})\n\n✅ **绘图完成！**`);
    }

    // --- 2. 视频模型 (Sora/Veo) ---
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        console.log(`[API Video] Starting... Mode: ${image ? 'Img2Video' : 'Text2Video'}`);
        
        let videoOutput: any;
        
        if (image) {
            // 图生视频
            videoOutput = await replicate.run(
              "stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
              {
                input: {
                  input_image: image,
                  video_length: "25_frames_with_svd_xt",
                  sizing_strategy: "maintain_aspect_ratio",
                  frames_per_second: 6,
                  motion_bucket_id: 127
                }
              }
            );
        } else {
            // 文生视频：确保参数安全
            const { width, height } = calculateDimensions(aspectRatio || "16:9", resolution || "1080p");
            const fps = 24;
            const num_frames = (duration || 5) * fps; 

            videoOutput = await replicate.run(
              "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
              { 
                input: { prompt: prompt, fps, width, height, num_frames } 
              }
            );
        }
        
        // 获取 URL 字符串
        const remoteUrl = Array.isArray(videoOutput) ? videoOutput[0] : videoOutput;
        console.log(`[API Video] Done. URL: ${remoteUrl}`);

        // 直接返回纯文本 URL 字符串
        return new Response(String(remoteUrl));
    }

    // --- 3. Gemini 文字聊天 ---
    let targetModel = 'gemini-2.5-flash'; 
    if (model === 'gemini-2.0-flash-exp') targetModel = 'gemini-2.5-flash'; 
    
    let systemInstruction = `You are Eureka. IMPORTANT: Generate 3 related questions at the end: ___RELATED___ Q1 | Q2 | Q3`;
    if (model === 'gemini-exp-1206') systemInstruction += " Deep Thinking Mode.";

    const geminiModel = genAI.getGenerativeModel({ model: targetModel, systemInstruction });
    const chat = geminiModel.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }],
      })),
    });

    const currentContent = messages[messages.length - 1].content;
    let result;
    
    if (typeof currentContent === 'object' && currentContent.images?.length > 0) {
      const imageParts = currentContent.images.map((img: string) => ({
        inlineData: { data: img.split(",")[1], mimeType: "image/jpeg" },
      }));
      result = await geminiModel.generateContentStream([currentContent.text, ...imageParts]);
    } else {
      result = await chat.sendMessageStream(typeof currentContent === 'string' ? currentContent : currentContent.text);
    }

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          if (chunkText) controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}