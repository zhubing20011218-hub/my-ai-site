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

// 辅助函数：计算宽高
function calculateDimensions(ratio: string, resolution: string) {
    let width = 1024;
    let height = 576;
    let baseSize = 1024; 

    if (resolution === '720p') baseSize = 1280;
    if (resolution === '1080p') baseSize = 1920;
    if (resolution === '2k') baseSize = 2560;
    if (resolution === '4k') baseSize = 3840; 

    const [wRatio, hRatio] = ratio.split(':').map(Number);
    if (wRatio > hRatio) {
        width = baseSize;
        height = Math.round(width * (hRatio / wRatio));
    } else {
        height = baseSize;
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
        // 图片继续用 Markdown 格式返回，保持兼容
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
            // 文生视频
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

        // 🚨【关键修改】直接返回纯文本 URL 字符串，不要 JSON 包装
        // 这样前端收到的一定是 "https://..."，不可能是 [object Object]
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
    // 错误时返回纯文本错误信息
    return new Response(`Error: ${error.message}`, { status: 500 });
  }
}