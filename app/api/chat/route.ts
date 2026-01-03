import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 组装用户内容 ---
    let parts: any[] = [];

    if (typeof lastMsg.content === 'string') {
      parts.push({ text: lastMsg.content });
    } else if (typeof lastMsg.content === 'object') {
      const text = lastMsg.content.text || "";
      if (text) parts.push({ text: text });

      // 图片处理
      if (lastMsg.content.images?.length > 0) {
        lastMsg.content.images.forEach((img: string) => {
          parts.push({
            inline_data: {
              mime_type: "image/jpeg",
              data: img.split(',')[1]
            }
          });
        });
      }

      // Excel/文件处理
      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
        console.log("处理文件:", file.name);
        try {
          if (file.name.match(/\.(xlsx|xls|csv)$/i)) {
            const workbook = XLSX.read(file.content.split(',')[1], { type: 'base64' });
            const sheet = workbook.Sheets[workbook.SheetNames[0]];
            const csvData = XLSX.utils.sheet_to_csv(sheet);
            parts.push({ text: `\n\n【表格数据】\n${csvData.slice(0, 15000)}` });
          } else if (file.name.match(/\.(txt|md|js|py|json)$/i)) {
             const textData = Buffer.from(file.content.split(',')[1], 'base64').toString('utf-8');
             parts.push({ text: `\n\n【文件内容】\n${textData.slice(0, 15000)}` });
          }
        } catch (e) { console.error(e); }
      }
    }

    // --- 2. ✨ 核心修复：加回“系统指令” (System Instruction) ---
    // 这段话告诉 AI：回答完之后，必须生成 ___RELATED___ 分隔的建议
    const systemInstructionText = `
    你是一个智能助手。
    请正常回答用户的问题。
    
    【重要规则】
    在回答的最后，你必须生成 3 个与当前话题相关的简短追问建议。
    格式必须严格如下（不要加序号，用 | 分隔）：
    
    ___RELATED___建议问题1?|建议问题2?|建议问题3?
    
    例如：
    上海今天天气不错。
    ___RELATED___明天天气怎么样？|推荐去哪里玩？|要注意防晒吗？
    `;

    // --- 3. 发起请求 ---
    // 继续使用 gemini-2.0-flash-exp，因为它又快又聪明
    const modelName = "gemini-2.0-flash-exp"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    console.log(`请求 Google API (${modelName}) + 胶囊建议...`);

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // 这里把系统指令传给 API
        system_instruction: {
          parts: [{ text: systemInstructionText }]
        },
        safetySettings: [
            { category: "HARM_CATEGORY_HARASSMENT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_HATE_SPEECH", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_SEXUALLY_EXPLICIT", threshold: "BLOCK_NONE" },
            { category: "HARM_CATEGORY_DANGEROUS_CONTENT", threshold: "BLOCK_NONE" }
        ]
      })
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("API Error:", data);
      throw new Error(data.error?.message || "Google API Error");
    }

    // --- 4. 返回结果 ---
    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 伪装流式返回
    const encoder = new TextEncoder();
    const stream = new ReadableStream({
      start(controller) {
        controller.enqueue(encoder.encode(replyText));
        controller.close();
      }
    });

    return new NextResponse(stream);

  } catch (error: any) {
    console.error("System Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}