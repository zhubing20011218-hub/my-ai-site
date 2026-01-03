import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function POST(req: Request) {
  try {
    const apiKey = process.env.GEMINI_API_KEY;
    
    // 1. 检查环境变量
    if (!apiKey) {
      return makeStreamResponse("❌ 错误：Vercel 环境变量中未找到 GEMINI_API_KEY。请去 Vercel Settings 检查。");
    }

    // 2. 直接向 Google 发起“模型列表”查询 (绕过 SDK，使用原生 HTTP 请求)
    // 这样可以排除 SDK 版本过旧的问题
    const response = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`, {
      method: 'GET',
      headers: { 'Content-Type': 'application/json' }
    });

    const data = await response.json();

    // 3. 分析结果
    let debugText = "🔍 **Google API 诊断报告**\n\n";
    debugText += `**API Key 状态**: ${response.status === 200 ? "✅ 有效" : "❌ 异常"}\n`;
    debugText += `**HTTP 状态码**: ${response.status}\n\n`;

    if (data.error) {
      debugText += `❌ **账号/权限错误详情**:\n`;
      debugText += `Code: ${data.error.code}\n`;
      debugText += `Message: ${data.error.message}\n`;
      debugText += `Status: ${data.error.status}\n`;
    } else if (data.models) {
      debugText += `✅ **账号可用模型列表** (请截图发给我):\n`;
      // 过滤出 gemini 开头的模型
      const geminiModels = data.models
        .filter((m: any) => m.name.includes('gemini'))
        .map((m: any) => `- \`${m.name.replace('models/', '')}\``)
        .join('\n');
      debugText += geminiModels || "没有找到 Gemini 相关模型";
    } else {
      debugText += "⚠️ **未知响应格式**: \n" + JSON.stringify(data, null, 2);
    }

    return makeStreamResponse(debugText);

  } catch (error: any) {
    return makeStreamResponse(`❌ **系统内部错误**: ${error.message}`);
  }
}

// 辅助函数：模拟打字机效果返回给前端
function makeStreamResponse(text: string) {
  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      controller.enqueue(encoder.encode(text));
      controller.close();
    }
  });
  return new NextResponse(stream);
}