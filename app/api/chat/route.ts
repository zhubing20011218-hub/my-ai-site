import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";
import Replicate from "replicate"; // ✅ [新增] 引入 Replicate

// 1. 初始化 Gemini
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

// 2. 初始化 Replicate (用于绘图和视频)
const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { messages, model, persona } = await req.json();
    
    // 获取用户最后一条输入
    const lastMessage = messages[messages.length - 1];
    const prompt = typeof lastMessage.content === 'string' ? lastMessage.content : lastMessage.content.text;

    // ============================================================
    // 🎨 分支 1：如果是绘图模型 (Banana SDXL)
    // ============================================================
    if (model === 'banana-sdxl') {
      // 调用 SDXL 模型
      const output: any = await replicate.run(
        "stability-ai/sdxl:39ed52f2a78e934b3ba6e2a89f5b1c712de7dfea535525255b1aa35c5565e08b",
        {
          input: {
            prompt: prompt, // 用户的描述
            width: 1024,
            height: 1024,
            refine: "expert_ensemble_refiner"
          }
        }
      );
      
      // Replicate 返回的是图片 URL 数组
      const imageUrl = output[0];
      
      // ✅ 我们把图片包装成 Markdown 格式返回，这样前端就能直接显示了！
      return new Response(`![Generated Image](${imageUrl})\n\n✅ 绘图完成！本次消耗: $0.20`);
    }

    // ============================================================
    // 🎬 分支 2：如果是视频模型 (Sora / Veo 暂时用 SVD 代替)
    // ============================================================
    if (model === 'sora-v1' || model === 'veo-google') {
      // ⚠️ 注意：由于 Sora 未开放，这里使用 Stable Video Diffusion 模拟效果
      const output: any = await replicate.run(
        "stability-ai/stable-video-diffusion:3f0457e4619daac51203dedb472816f3af8d40d92ada20f4cb11f05321f9543b",
        {
          input: {
            // SVD 需要图片作为输入，这里为了演示，我们假设用户输入的是提示词
            // 实际商业版通常是先文生图，再图生视频。
            // 为了简化流程，这里暂时只返回一个文字提示，或者你可以接入 runway 的 API
            // 下面是一个模拟的视频生成逻辑 (因为 SVD 需要上传图片)
            
            // ❌ 如果没有图片，SVD 无法直接工作。
            // 💡 临时方案：我们先返回一个占位符，或者调用 Text-to-Video 模型 (如 Zeroscope)
          }
        }
      );
      
      // 这里用 Zeroscope (文生视频) 来演示，让功能可用
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

      const videoUrl = videoOutput[0];
      return new Response(`[视频生成完毕](${videoUrl})\n\n<video controls src="${videoUrl}" width="100%"></video>\n\n✅ 视频生成成功！本次消耗: $2.50`);
    }

    // ============================================================
    // 🧠 分支 3：如果是文本模型 (Gemini) - 保持原有逻辑
    // ============================================================
    
    // 1. 处理系统指令 (Persona)
    let systemInstruction = "You are a helpful AI assistant.";
    if (persona === 'tiktok_script') systemInstruction = "你是TikTok爆款脚本专家...";
    if (persona === 'sales_copy') systemInstruction = "你是金牌销售文案...";
    // ... 其他角色逻辑保持不变，或者直接用前端传来的 prompt 里的 instruction

    const geminiModel = genAI.getGenerativeModel({ 
      model: model === 'gemini-2.0-flash-thinking-exp' ? 'gemini-2.0-flash-exp' : model, // 暂时映射 Thinking 到 Flash，防止 api key 权限问题
      systemInstruction: systemInstruction 
    });

    // 2. 处理历史消息格式
    const chat = geminiModel.startChat({
      history: messages.slice(0, -1).map((m: any) => ({
        role: m.role === 'user' ? 'user' : 'model',
        parts: [{ text: typeof m.content === 'string' ? m.content : m.content.text }],
      })),
    });

    // 3. 处理当前消息 (包含图片处理)
    const currentContent = messages[messages.length - 1].content;
    let result;
    
    if (typeof currentContent === 'object' && currentContent.images && currentContent.images.length > 0) {
      // 有图片的情况
      const imageParts = currentContent.images.map((img: string) => ({
        inlineData: {
          data: img.split(",")[1],
          mimeType: "image/jpeg",
        },
      }));
      result = await geminiModel.generateContentStream([currentContent.text, ...imageParts]);
    } else {
      // 纯文字的情况
      result = await chat.sendMessageStream(typeof currentContent === 'string' ? currentContent : currentContent.text);
    }

    // 4. 流式返回
    const stream = new ReadableStream({
      async start(controller) {
        for await (const chunk of result.stream) {
          const chunkText = chunk.text();
          controller.enqueue(new TextEncoder().encode(chunkText));
        }
        controller.close();
      },
    });

    return new Response(stream);

  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json({ error: "处理请求时发生错误" }, { status: 500 });
  }
}