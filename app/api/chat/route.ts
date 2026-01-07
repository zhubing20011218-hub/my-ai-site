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

// 1. GET: 轮询任务
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

// 2. POST: 提交任务
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { messages, model, prompt: videoPrompt, prompt_optimizer, first_frame_image } = body;

    // --- 🎬 视频任务：接入 Minimax Video-01 ---
    if (model === 'sora-v1' || model === 'veo-google') {
        const prediction = await replicate.predictions.create({
            // 使用 Replicate 官方 Minimax 最新 Hash
            version: "7660676e1e3985a63974a9d2712812061405788bd98684d03612d7c71aa8d913",
            input: {
                prompt: videoPrompt || "A cinematic scene, high detail",
                prompt_optimizer: prompt_optimizer ?? true,
                first_frame_image: first_frame_image || undefined
            }
        });
        return NextResponse.json({ type: 'async_job', id: prediction.id, status: prediction.status });
    }

    // --- 🎨 图片任务：Banana SDXL ---
    if (model === 'banana-sdxl') {
        const lastPrompt = messages[messages.length-1].content.text;
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: lastPrompt, width: 1024, height: 1024 } }
        );
        return NextResponse.json({ url: output[0] });
    }

    // --- 🧠 聊天：修复 503 Overload 映射 ---
    // 🚨 强制模型映射：将 UI 的 2.5 映射到可用的 1.5 Pro
    let validModel = "gemini-1.5-flash";
    if (model.includes("pro") || model.includes("2.5") || model.includes("exp")) {
        validModel = "gemini-1.5-pro"; 
    }

    const geminiModel = genAI.getGenerativeModel({ model: validModel });
    const chat = geminiModel.startChat({
        history: messages.slice(0, -1).map((m: any) => ({
            role: m.role === 'user' ? 'user' : 'model',
            parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }],
        }))
    });

    const chatContent = typeof messages[messages.length - 1].content === 'string' 
        ? messages[messages.length - 1].content 
        : messages[messages.length - 1].content.text;

    const result = await chat.sendMessageStream(chatContent);

    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const text = chunk.text();
          if (text) controller.enqueue(new TextEncoder().encode(text));
        }
        controller.close();
      },
    });
    return new Response(stream);

  } catch (error: any) {
    console.error("API Error:", error);
    return NextResponse.json({ error: "服务器负载中，请刷新重试" }, { status: 503 });
  }
}