import { NextRequest, NextResponse } from 'next/server';

// 定义 runtime，边缘计算首选
export const runtime = 'edge';

export async function POST(req: NextRequest) {
  try {
    const { messages, model } = await req.json();
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return NextResponse.json({ error: 'API Key 未配置' }, { status: 500 });
    }

    // ✨✨✨ 核心修改：支持自定义代理地址 ✨✨✨
    // 如果环境变量里配了 GEMINI_BASE_URL，就用配的；否则用 Google 官方的。
    // 注意：官方地址是 https://generativelanguage.googleapis.com
    let baseUrl = process.env.GEMINI_BASE_URL || 'https://generativelanguage.googleapis.com';
    
    // 去掉末尾的斜杠（防止用户多填）
    if (baseUrl.endsWith('/')) {
        baseUrl = baseUrl.slice(0, -1);
    }

    // 1. 整理历史记录 (将前端的消息格式转为 Gemini 格式)
    // 这里的逻辑是：把最后一条（包含图片/文件）和前面的历史记录拼接
    const contents = messages.map((m: any) => {
      const parts = [];
      
      // (A) 处理文本
      if (typeof m.content === 'string') {
        parts.push({ text: m.content });
      } else if (m.content?.text) {
        parts.push({ text: m.content.text });
      }

      // (B) 处理图片 (Base64)
      if (m.content?.images && Array.isArray(m.content.images)) {
        m.content.images.forEach((img: string) => {
          // 提取 base64 逗号后面的部分
          const base64Data = img.split(',')[1]; 
          if (base64Data) {
            parts.push({
              inlineData: {
                mimeType: 'image/jpeg', // 简单起见，默认 jpeg，Gemini 兼容性很好
                data: base64Data
              }
            });
          }
        });
      }

      // (C) 处理文件 (这里简单处理，Gemini 目前主要支持图片/PDF，纯文本文件通常作为 prompt 插入)
      if (m.content?.file && m.content.file.content) {
         const fileContent = m.content.file.content.split(',')[1];
         // 如果是 PDF
         if(m.content.file.name.endsWith('.pdf')) {
            parts.push({
              inlineData: {
                mimeType: 'application/pdf',
                data: fileContent
              }
            });
         } else {
            // 其他文件尝试作为文本提示词塞进去
            // 注意：真实场景最好在前端解析 excel/csv 为 markdown 表格再发过来
            // 这里暂且忽略二进制流，防止报错
         }
      }

      return {
        role: m.role === 'user' ? 'user' : 'model',
        parts: parts
      };
    });

    // 2. 构造请求 URL
    const url = `${baseUrl}/v1beta/models/${model || 'gemini-2.0-flash-exp'}:streamGenerateContent?key=${apiKey}`;

    // 3. 发起请求
    const response = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ contents: contents }),
    });

    if (!response.ok) {
        const errText = await response.text();
        console.error("Gemini API Error:", errText);
        return NextResponse.json({ error: `Gemini API Error: ${response.statusText}`, details: errText }, { status: response.status });
    }

    // 4. 处理流式响应 (Stream)
    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body?.getReader();
        if (!reader) {
          controller.close();
          return;
        }

        const decoder = new TextDecoder();
        let buffer = '';

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          buffer += chunk;

          // Gemini 的流式返回是一个个 JSON 对象，通常以 '[' 开头，']' 结尾，中间逗号分隔
          // 我们需要解析出 candidates[0].content.parts[0].text
          // 为了简单，我们这里直接把原始数据处理一下发给前端，或者简单正则提取
          // ⚡️ 简单处理方案：
          // Google 返回的数据格式比较复杂，这里我们尝试提取 "text": "..."
          
          const lines = buffer.split('\n');
          buffer = lines.pop() || ''; // 剩下的放回 buffer

          for (const line of lines) {
             const trimmed = line.trim();
             if (!trimmed) continue;
             // 这里的解析比较粗暴，但有效：直接找 text 字段
             try {
                // 去掉开头的逗号（如果是流的中间部分）
                let cleanJson = trimmed;
                if (cleanJson.startsWith(',')) cleanJson = cleanJson.slice(1);
                if (cleanJson.startsWith('[')) cleanJson = cleanJson.slice(1);
                if (cleanJson.endsWith(']')) cleanJson = cleanJson.slice(0, -1);
                
                const json = JSON.parse(cleanJson);
                const text = json.candidates?.[0]?.content?.parts?.[0]?.text;
                if (text) {
                    controller.enqueue(new TextEncoder().encode(text));
                }
             } catch (e) {
                // 解析失败忽略，继续积攒 buffer
             }
          }
        }
        controller.close();
      }
    });

    return new NextResponse(stream, {
      headers: { 'Content-Type': 'text/plain; charset=utf-8' },
    });

  } catch (e: any) {
    console.error(e);
    return NextResponse.json({ error: e.message || 'Server Error' }, { status: 500 });
  }
}