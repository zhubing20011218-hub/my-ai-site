import { google } from '@ai-sdk/google';
import { generateText } from 'ai';

export const runtime = 'edge';

export async function POST(req: Request) {
  try {
    const { message } = await req.json();

    // 🧠 快脑任务：只生成步骤，不生成正文
    // 使用 flash 模型，速度极快，几乎无延迟
    const result = await generateText({
      model: google('gemini-1.5-flash'),
      prompt: `
        你是一个AI任务规划器。
        用户的问题是：“${message}”
        请生成 3 到 4 个简短、专业的执行步骤，用以回答这个问题。
        
        要求：
        1. 每个步骤不超过 10 个字。
        2. 用竖线 "|" 分隔步骤。
        3. 不要包含任何其他废话。
        4. 必须动态针对问题。例如问天气，要说“检索气象数据”；问代码，要说“构建逻辑框架”。

        示例输出：
        分析用户意图|检索上海天气数据|生成Excel格式表格
      `,
    });

    return new Response(result.text);
  } catch (error) {
    // 如果快脑这就挂了，就返回默认步骤，不影响主流程
    return new Response("正在深度思考...|正在组织语言...");
  }
}