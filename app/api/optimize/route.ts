import { GoogleGenerativeAI } from "@google/generative-ai";
import { NextResponse } from "next/server";

// 初始化 Google AI
const apiKey = process.env.GOOGLE_GENERATIVE_AI_API_KEY || "";
const genAI = new GoogleGenerativeAI(apiKey);

export const runtime = "edge";

export async function POST(req: Request) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json({ error: "请输入内容" }, { status: 400 });
    }

    // 使用 Flash 模型来快速生成提示词，成本低且速度快
    const model = genAI.getGenerativeModel({ 
      model: "gemini-2.5-flash",
      systemInstruction: "你是一位精通 Prompt Engineering（提示词工程）的专家。用户的输入可能是一个模糊的问题或简短的想法。你的任务是将其重写为一个结构清晰、逻辑严密、细节丰富的 AI 提示词（Prompt）。\n\n要求：\n1. 直接输出优化后的提示词内容，不要包含'好的'、'这是优化后的内容'等废话。\n2. 保持语言与用户输入一致（用户输中文就回中文）。\n3. 适当补充背景信息、角色设定和输出要求，以便让后续的大模型输出更好的结果。"
    });

    const result = await model.generateContent(prompt);
    const optimizedText = result.response.text();

    return NextResponse.json({ optimized: optimizedText });

  } catch (error: any) {
    console.error("Optimization Error:", error);
    return NextResponse.json({ error: "优化服务暂时不可用，请检查 Key 或网络。" }, { status: 500 });
  }
}