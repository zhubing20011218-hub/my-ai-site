import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

export const runtime = "nodejs"; 
export const dynamic = 'force-dynamic';

// 辅助函数：计算视频宽高
function calculateDimensions(ratio: string, resolution: string) {
    let width = 1024;
    let height = 576;
    let baseSize = 1024; 

    // 限制最大分辨率以保证成功率
    if (resolution === '720p') baseSize = 1024; 
    if (resolution === '1080p') baseSize = 1024; 
    if (resolution === '2k') baseSize = 1024; 

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

// ✅ 新增：GET 方法，用于前端轮询查询任务状态
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        // 去 Replicate 查询任务状态
        const prediction = await replicate.predictions.get(id);
        return NextResponse.json(prediction);
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

export async function POST(req: Request) {
  try {
    const { messages, model, aspectRatio, resolution, duration, image } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // ============================================================
    // 🎬 视频模型 (Sora/Veo) -> 改为【异步任务】
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        let prediction;

        //  nhánh A: 图生视频 (SVD)
        if (image) {
            console.log("🚀 Starting Async SVD (Image-to-Video)...");
            prediction = await replicate.predictions.create({
                version: "3f0457e4619daac51203dedb472816f3af343739541c338029d5006d99723225", // SVD 1.1 video model
                input: {
                    input_image: image,
                    video_length: "25_frames_with_svd_xt",
                    sizing_strategy: "maintain_aspect_ratio",
                    frames_per_second: 6,
                    motion_bucket_id: 127
                }
            });
        } 
        // 分支 B: 文生视频 (Zeroscope)
        else {
            console.log("🚀 Starting Async Zeroscope (Text-to-Video)...");
            const { width, height } = calculateDimensions(aspectRatio || "16:9", resolution || "1080p");
            const fps = 24;
            const num_frames = (duration || 5) * 24; 
            
            prediction = await replicate.predictions.create({
                version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                input: { prompt, fps, width, height, num_frames }
            });
        }

        // 🚨 关键：立即返回任务 ID，让前端去轮询，不要在这里等！
        return NextResponse.json({ 
            type: 'async_job', 
            id: prediction.id, 
            status: prediction.status 
        });
    }

    // ============================================================
    // 🎨 绘图模型 (Banana) -> 保持同步 (因为它很快)
    // ============================================================
    if (model === 'banana-sdxl') {
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return new Response(`![Generated Image](${output[0]})\n\n✅ **绘图完成！**`);
    }

    // ============================================================
    // 🧠 聊天模型 (Gemini) -> 保持流式
    // ============================================================
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