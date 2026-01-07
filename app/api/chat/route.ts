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

// ---------------------------------------------------------
// 1. GET: 查询任务状态 (轮询接口)
// ---------------------------------------------------------
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        const prediction = await replicate.predictions.get(id);
        
        // 只有当任务成功或失败时，才算结束
        return NextResponse.json({
            id: prediction.id,
            status: prediction.status, // starting, processing, succeeded, failed
            output: prediction.output,
            error: prediction.error
        });
    } catch (e: any) {
        return NextResponse.json({ error: e.message }, { status: 500 });
    }
}

// ---------------------------------------------------------
// 2. POST: 提交任务
// ---------------------------------------------------------
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, aspectRatio, resolution, duration, image } = body;
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // ============================================================
    // 🎬 视频生成 (异步模式)
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        let prediction;

        // 👉 情况 A：图生视频 (Image-to-Video)
        if (image) {
            console.log("🚀 Creating SVD Task (Img2Video)...");
            // ✅ 修复：使用官方验证过的 SVD XT 1.1 版本 Hash
            prediction = await replicate.predictions.create({
                version: "3f0457e4619daac51203dedb472816f3af343739541c338029d5006d99723225", 
                input: {
                    input_image: image,
                    video_length: "14_frames_with_svd_xt", // 14帧最稳，生成约2-3秒
                    frames_per_second: 6,
                    motion_bucket_id: 127,
                    cond_aug: 0.02
                }
            });
        } 
        // 👉 情况 B：文生视频 (Text-to-Video)
        else {
            console.log("🚀 Creating Zeroscope Task (Text2Video)...");
            
            // 计算宽高 (Zeroscope 限制)
            let width = 1024, height = 576;
            if (resolution === '1080p') { width = 1024; height = 576; } // 强制降级到模型支持的最大值，防止崩坏
            
            // ✅ 修复：使用 Zeroscope V2 XL 官方 Hash
            prediction = await replicate.predictions.create({
                version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                input: {
                    prompt: prompt,
                    num_frames: 24, // 24帧，约3-4秒
                    width: width,
                    height: height,
                    fps: 12 // 降低 fps 以延长播放时间
                }
            });
        }

        // ⚡️ 立即返回任务 ID
        return NextResponse.json({ 
            type: 'async_job', 
            id: prediction.id, 
            status: prediction.status 
        });
    }

    // ============================================================
    // 🎨 图片生成 (同步模式)
    // ============================================================
    if (model === 'banana-sdxl') {
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return new Response(`![Generated Image](${output[0]})\n\n✅ **绘图完成！**`);
    }

    // ============================================================
    // 🧠 聊天模型 (Gemini)
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
    // 返回 JSON 格式错误以便前端展示
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}