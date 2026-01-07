import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

// ✅ 保持 Node.js 环境 + 300秒超时
export const runtime = "nodejs"; 
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

// 🧮 辅助函数：根据比例和清晰度计算宽高
function calculateDimensions(ratio: string, resolution: string) {
    let width = 1024;
    let height = 576;
    let baseSize = 1024; // 默认基准

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

    width = Math.floor(width / 64) * 64;
    height = Math.floor(height / 64) * 64;

    return { width, height };
}

export async function POST(req: Request) {
  const startTime = Date.now(); 
  console.log(`[API Start] Request received`);

  try {
    const { messages, model, aspectRatio, resolution, duration, image } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // ============================================================
    // 🎨 分支 1：绘图模型 (Banana SDXL)
    // ============================================================
    if (model === 'banana-sdxl') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return NextResponse.json({ 
            type: 'image', 
            url: output[0], 
            markdown: `![Generated Image](${output[0]})\n\n✅ **绘图完成！**` 
        });
    }

    // ============================================================
    // 🎬 分支 2：视频模型 (智能路由：图生视频 OR 文生视频)
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        let videoOutput: any;
        
        if (image) {
            console.log(`[API Video] Mode: Image-to-Video (SVD)`);
            videoOutput = await replicate.run(
              "stability-ai/stable-video-diffusion:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
              {
                input: {
                  input_image: image, // 前端已压缩，这里直接发
                  video_length: "25_frames_with_svd_xt",
                  sizing_strategy: "maintain_aspect_ratio",
                  frames_per_second: 6,
                  motion_bucket_id: 127
                }
              }
            );
        } else {
            console.log(`[API Video] Mode: Text-to-Video (Zeroscope)`);
            const { width, height } = calculateDimensions(aspectRatio || "16:9", resolution || "1080p");
            const fps = 24;
            const num_frames = (duration || 5) * fps; 

            videoOutput = await replicate.run(
              "anotherjesse/zeroscope-v2-xl:9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
              { 
                input: { 
                  prompt: prompt, 
                  fps: fps, 
                  width: width,   
                  height: height,   
                  num_frames: num_frames 
                } 
              }
            );
        }
        
        const remoteUrl = Array.isArray(videoOutput) ? videoOutput[0] : videoOutput;
        console.log(`[API Video] Generated Remote URL: ${remoteUrl}`);

        const videoRes = await fetch(remoteUrl);
        if (!videoRes.ok) throw new Error("Failed to fetch video stream from source");

        return new Response(videoRes.body, {
            headers: {
                'Content-Type': 'video/mp4',
                'Content-Disposition': 'attachment; filename="video.mp4"',
            }
        });
    }

    // ============================================================
    // 🧠 分支 3：Gemini 文字模型
    // ============================================================
    
    let targetModel = 'gemini-2.5-flash'; 
    if (model === 'gemini-2.0-flash-exp') targetModel = 'gemini-2.5-flash'; 
    else if (model === 'gemini-1.5-pro') targetModel = 'gemini-2.5-pro';   
    else if (model === 'gemini-exp-1206' || model === 'gemini-2.0-flash-thinking-exp') targetModel = 'gemini-exp-1206'; 

    let systemInstruction = `You are Eureka, a helpful AI assistant. 
    IMPORTANT: After your main response, you MUST generate 3 related follow-up questions.
    Format: ___RELATED___ Question 1? | Question 2? | Question 3?`;
    
    if (model === 'gemini-exp-1206') systemInstruction += " You are in Deep Thinking Mode.";

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
            controller.close();
        }
      },
    });

    return new Response(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    let userMsg = "服务暂时繁忙，请稍后再试。";
    if (error.toString().includes("402")) userMsg = "额度不足，请充值。";
    if (error.toString().includes("429")) userMsg = "调用太频繁，请稍后再试。"; 
    
    return NextResponse.json({ error: userMsg, details: error.message }, { status: 500 });
  }
}