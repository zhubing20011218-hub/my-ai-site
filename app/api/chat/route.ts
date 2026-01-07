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

// ---------------------------------------------------------
// 1. GET: 查询任务状态 (解决 504 超时)
// ---------------------------------------------------------
export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get('id');
    if (!id) return NextResponse.json({ error: 'Missing ID' }, { status: 400 });

    try {
        const prediction = await replicate.predictions.get(id);
        return NextResponse.json(prediction);
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
        // 修复：改用 I2VGen-XL，参数更少更稳定，解决 422 错误
        if (image) {
            console.log("🚀 Creating I2VGen-XL Task...");
            prediction = await replicate.predictions.create({
                version: "5821a338d0003352160bab388d4074bfc86387928505630247492c093a8d94c1", // I2VGen-XL
                input: {
                    image: image, // 这里参数名是 image，不是 input_image
                    prompt: prompt || "High quality video", // 必须有提示词
                    max_frames: 16,
                    num_inference_steps: 50
                }
            });
        } 
        // 👉 情况 B：文生视频 (Zeroscope)
        else {
            console.log("🚀 Creating Zeroscope Task...");
            // 使用 Zeroscope V2 XL
            prediction = await replicate.predictions.create({
                version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                input: {
                    prompt: prompt,
                    num_frames: 24,
                    width: 1024,
                    height: 576,
                    fps: 24
                }
            });
        }

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
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}