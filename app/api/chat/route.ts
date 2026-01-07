import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; 

const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN || "MISSING_KEY",
});

// ✅ 保持 Node.js 环境 + 300秒超时 (Pro 专属)
export const runtime = "nodejs"; 
export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  const startTime = Date.now(); 
  console.log(`[API Start] Request received`);

  try {
    const { messages, model, persona } = await req.json();
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // ============================================================
    // 🎨 分支 1：绘图模型
    // ============================================================
    if (model === 'banana-sdxl') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        const output: any = await replicate.run(
          "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
          { input: { prompt: prompt, width: 1024, height: 1024, refine: "expert_ensemble_refiner" } }
        );
        // ✅ 改为 JSON 返回
        return NextResponse.json({ 
            type: 'image', 
            url: output[0], 
            markdown: `![Generated Image](${output[0]})\n\n✅ **绘图完成！**` 
        });
    }

    // ============================================================
    // 🎬 分支 2：视频模型 (高清 Pro 版)
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
        if (!process.env.REPLICATE_API_TOKEN) throw new Error("Replicate API Key 未配置");
        
        console.log(`[API Video] Starting generation...`);
        
        // 高清参数
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
        
        console.log(`[API Video] Success: ${videoOutput[0]}`);
        
        // ✅ 核心修复：强制使用 JSON 包裹 URL，不再直接返回流/字符串
        // 这样前端就不会把视频当成乱码文字处理了
        return NextResponse.json({ 
            type: 'video', 
            url: videoOutput[0] 
        });
    }

    // ============================================================
    // 🧠 分支 3：Gemini 文字模型
    // ============================================================
    
    let targetModel = 'gemini-2.5-flash'; 
    if (model === 'gemini-2.0-flash-exp') targetModel = 'gemini-2.5-flash'; 
    else if (model === 'gemini-1.5-pro') targetModel = 'gemini-2.5-pro';   
    else if (model === 'gemini-exp-1206') targetModel = 'gemini-exp-1206'; 

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
    
    // 如果是普通文字请求，返回文本；如果是多媒体请求，最好也返回 JSON 错误以便前端处理
    // 为了兼容，我们这里还是返回 500 状态码
    return new Response(userMsg, { status: 500 });
  }
}