import { NextResponse } from 'next/server';
import * as XLSX from 'xlsx';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) return NextResponse.json({ error: "API Key 未配置" }, { status: 500 });

    const { messages } = await req.json();
    const lastMsg = messages[messages.length - 1];
    
    // --- 1. 获取当前北京时间 (给 AI 戴手表) ---
    const now = new Date();
    const timeOptions: Intl.DateTimeFormatOptions = { 
      timeZone: 'Asia/Shanghai', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric', 
      weekday: 'long',
      hour: '2-digit',
      minute: '2-digit'
    };
    const currentTimeStr = now.toLocaleString('zh-CN', timeOptions);
    // 结果示例：2026年1月3日 星期六 14:30

    // --- 2. 数据组装 ---
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

    // --- 3. ✨✨✨ 注入“时间感知”与“有趣灵魂” ✨✨✨
    // 注意：我在 System Instruction 里动态插入了 ${currentTimeStr}
    const systemInstructionText = `
    你叫 Eureka，是一个说话风趣、高情商、办事利索的数字伙伴。
    
    【🔴 关键：你的时间感知】
    现在是北京时间：${currentTimeStr}。
    当用户问“明天”、“下周”、“未来几天”时，你必须基于“今天”的日期进行推算，并在回答中标注具体日期（例如：1月4日 周日）。
    
    【你的性格设定】
    1. **拒绝机械感**：像朋友一样聊天。不要说“我无法访问实时互联网”，你可以说“虽然我还没连上气象卫星，但根据往年同期的大数据推算...”。
    2. **天气预测规则**：如果用户问天气，必须给出一份**带有具体日期**的模拟预测表。
       格式示例：
       * 1月4日 (明天/周日)：🌤️ 多云，15°C - 20°C (适合去公园)
       * 1月5日 (周一)：🌧️ 小雨，12°C - 16°C (上班记得带伞)
    3. **办事给力**：分析表格时直接给结论，不要啰嗦。
    
    【强制格式要求】
    在回答的最后，必须生成 3 个相关的追问建议，用 ___RELATED___ 开头，竖线 | 分隔。
    `;

    // --- 4. 发起请求 ---
    const modelName = "gemini-2.0-flash-exp"; 
    const url = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`;

    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: parts }],
        // 注入包含时间的指令
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
      throw new Error(data.error?.message || "Google API Error");
    }

    const replyText = data.candidates?.[0]?.content?.parts?.[0]?.text || "";
    
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