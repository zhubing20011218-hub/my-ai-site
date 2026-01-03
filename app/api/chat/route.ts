import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 数据组装 ---
    let parts: any[] = [];

    if (typeof lastMsg.content === 'string') {
      parts.push({ text: lastMsg.content });
    } else if (typeof lastMsg.content === 'object') {
      const text = lastMsg.content.text || "";
      if (text) parts.push({ text: text });

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

      if (lastMsg.content.file) {
        const file = lastMsg.content.file;
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

    // --- 2. ✨✨✨ 注入“有趣灵魂” (System Instruction) ✨✨✨
    const systemInstructionText = `
    你叫 Eureka，不是冷冰冰的 AI，而是一个说话风趣、高情商、办事利索的数字伙伴。
    
    【你的性格设定】
    1. **拒绝废话**：不要说“作为各种语言模型...”、“我无法访问实时互联网...”。如果用户问天气，虽然你不能联网，但你要根据历史气候数据，给出一个**“基于往年同期大数据的模拟预测”**，并明确标注这不仅是预测。
    2. **人情味**：使用更口语化的表达，适当使用 Emoji (😄, 🤔, 🌤️)。像朋友一样聊天，而不是像客服一样回答。
    3. **办事给力**：用户传表格时，直接给出核心洞察，不要罗列数据。用户问代码时，直接给优化后的代码。
    
    【关于天气问题的特殊处理】
    如果用户问未来天气，**绝对不要**只说“我不知道”。
    你要这样回答：“虽然我还没连上气象局的卫星📡，但根据上海往年的气候大数据，下周大概率是这样的...”
    然后列出一份**模拟**的天气表（标注：历史数据推演），例如：
    * 周一：🌤️ 多云转晴，22°C (适合晨跑)
    * 周二：🌧️ 小雨，19°C (记得带伞)
    ...
    (最后加一句贴心的穿衣建议)

    【强制格式要求】
    在回答的最后（无论什么话题），必须生成 3 个相关的追问建议，用 ___RELATED___ 开头，竖线 | 分隔。
    例如：
    ...这里是你的回答...
    ___RELATED___建议1?|建议2?|建议3?
    `;

    // --- 3. 发起请求 ---
    const modelName = "gemini-2.0-flash-exp"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // 注入灵魂
        system_instruction: {
          parts: [{ text: systemInstructionText }]
        },
        // 安全全开，防止因为过于活泼被拦截
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
      throw new Error(data.error?.message || "Google API Error");
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
    // 伪装流式
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