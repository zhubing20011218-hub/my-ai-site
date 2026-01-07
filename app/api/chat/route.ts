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

function calculateDimensions(ratio: string) {
    // 强制限制以保证 Zeroscope 稳定性
    let width = 1024;
    let height = 576;
    const [wRatio, hRatio] = ratio.split(':').map(Number);
    if (wRatio > hRatio) {
        width = 1024;
        height = Math.round(1024 * (hRatio / wRatio));
    } else {
        height = 1024;
        width = Math.round(1024 * (wRatio / hRatio));
    }
    // 64倍数修正
    width = Math.floor(width / 64) * 64;
    height = Math.floor(height / 64) * 64;
    return { width, height };
}

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

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, videoMode, image, numFrames, aspectRatio, negative_prompt } = body;
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // --- 1. 视频任务 (异步) ---
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        let prediction;

        // 🖼️ 图生视频 (使用 I2VGen-XL)
        if (videoMode === 'img2video' && image) {
            console.log("Creating I2VGen-XL task...");
            prediction = await replicate.predictions.create({
                version: "5821a338d0003352160bab388d4074bfc86387928505630247492c093a8d94c1", // 官方 Hash
                input: {
                    image: image,
                    prompt: prompt || "High quality video", // I2VGen 支持提示词
                    max_frames: 16,
                    num_inference_steps: 50,
                    guidance_scale: 9.0
                }
            });
        } 
        // 📝 文生视频 (使用 Zeroscope)
        else {
            console.log("Creating Zeroscope task...");
            const { width, height } = calculateDimensions(aspectRatio || "16:9");
            prediction = await replicate.predictions.create({
                version: "9f747673945c62801b13b84701c783929c0ee784e4748ec062204894dda1a351",
                input: {
                    prompt: prompt,
                    negative_prompt: negative_prompt || "low quality, distorted",
                    num_frames: numFrames || 24,
                    width,
                    height,
                    fps: 24,
                    num_inference_steps: 50
                }
            });
        }
        return NextResponse.json({ type: 'async_job', id: prediction.id, status: prediction.status });
    }

    // --- 2. 绘图任务 (同步) ---
    if (model === 'banana-sdxl') {
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        return NextResponse.json({ url: output[0] });
    }

    // --- 3. 文本聊天 (流式) ---
    const geminiModel = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
    const chat = geminiModel.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }],
      })),
    });
    const result = await chat.sendMessageStream(prompt);
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