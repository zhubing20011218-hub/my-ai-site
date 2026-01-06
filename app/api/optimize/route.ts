import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 这里的 API Key 复用你环境变量里的那个，不用改
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { text } = await req.json();

    if (!text) {
      return NextResponse.json({ error: "请输入内容" }, { status: 400 });
    }

    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    // ⚡️ 这里是“提示词工程师”的系统指令
    const systemPrompt = `
      你是一个专业的 Prompt Engineer (提示词工程师)。
      你的任务是将用户输入的简短、模糊的需求，改写成结构清晰、细节丰富、能引导 AI 输出高质量结果的优质指令（Prompt）。
      
      要求：
      1. 保持用户的原意不变，但进行扩充和润色。
      2. 增加必要的上下文、语气要求、输出格式要求。
      3. **直接输出优化后的指令内容**，不要包含任何"好的"、"这是优化后的..."等废话。
      4. 语言保持与用户输入一致（如果是中文就用中文）。
      
      用户输入: "${text}"
    `;

    const result = await model.generateContent(systemPrompt);
    const response = await result.response;
    const optimizedText = response.text();

    return NextResponse.json({ optimizedText });
  } catch (error) {
    console.error("Optimization error:", error);
    return NextResponse.json({ error: "优化失败" }, { status: 500 });
  }
}