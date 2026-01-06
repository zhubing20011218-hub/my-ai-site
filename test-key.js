// test-key.js

// 🔴 请务必将下面的引号内容换成你 .env.local 里真实的 GOOGLE_GENERATIVE_AI_API_KEY
// (就是以 AIza 开头的那串字符)
const API_KEY = "AIzaSyDuH28dGjYfjwJJNWnsHvlFKcqfRiC5zag";

async function checkModels() {
  const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

  console.log("🔄 正在连接 Google 服务器查询权限...");

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("\n❌ 查询失败！原因：", data.error.message);
      return;
    }

    console.log("\n✅ 验证成功！你的账号拥有以下 Gemini 模型权限：\n");

    // 筛选 Gemini 系列并排序
    const models = data.models
      .filter(m => m.name.includes("gemini"))
      .sort((a, b) => b.name.localeCompare(a.name)); // 倒序，让新模型排前面

    models.forEach(model => {
      const id = model.name.replace("models/", "");
      console.log(`🌟 模型ID: ${id}`);
      console.log(`   描述:   ${model.displayName}`);
      console.log("------------------------------------------------");
    });

    console.log("\n👉 请根据上面的列表，告诉我你看到了哪些带有 'pro' 或 'exp' 的名字。");

  } catch (error) {
    console.error("\n❌ 网络错误，请检查代理或网络连接。", error.message);
  }
}

checkModels();