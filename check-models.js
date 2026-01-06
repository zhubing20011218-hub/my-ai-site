// check-models.js
// ⚠️ 把下面的 "你的_GOOGLE_API_KEY" 换成你 .env.local 里那个真实的 Key (以 AIza 开头的)
const apiKey = "AIzaSyDuH28dGjYfjwJJNWnsHvlFKcqfRiC5zag"; 

const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`;

async function listModels() {
  try {
    console.log("正在连接 Google 查询权限...");
    const response = await fetch(url);
    const data = await response.json();

    if (data.error) {
      console.error("❌ 查询失败:", data.error.message);
      return;
    }

    console.log("\n✅ 你当前可用的 Gemini 模型列表：\n");
    
    // 过滤出 gemini 系列，并按版本排序
    const models = data.models
      .filter(m => m.name.includes("gemini"))
      .sort((a, b) => b.name.localeCompare(a.name));

    models.forEach(model => {
      console.log(`🔹 模型ID: ${model.name.replace("models/", "")}`);
      console.log(`   描述: ${model.displayName}`);
      console.log(`   支持方法: ${model.supportedGenerationMethods.join(", ")}`);
      console.log("------------------------------------------------");
    });

  } catch (error) {
    console.error("网络错误:", error);
  }
}

listModels();