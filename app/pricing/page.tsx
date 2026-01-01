import { Check } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"

export default function PricingPage() {
  const plans = [
    {
      name: "白嫖版",
      price: "¥0",
      desc: "适合随便玩玩的尝鲜用户",
      features: ["每天免费 5 次对话", "使用基础 Gemini 模型", "社区支持"],
      buttonText: "当前版本",
      popular: false
    },
    {
      name: "专业版",
      price: "¥29.9",
      desc: "适合需要经常使用的高效人士",
      features: ["无限次对话", "解锁 GPT-4 和 Sora 绘画", "优先响应速度", "去广告"],
      buttonText: "升级专业版",
      popular: true // 这个是推荐款
    },
    {
      name: "老板版",
      price: "¥299",
      desc: "适合土豪和企业用户",
      features: ["专属客服经理", "API 接口调用权限", "自定义模型微调", "开发票"],
      buttonText: "联系销售",
      popular: false
    }
  ]

  return (
    <div className="min-h-screen bg-gray-50 py-20 px-4">
      <div className="text-center mb-16">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">选择适合你的计划</h1>
        <p className="text-xl text-gray-500">无论是小白还是大佬，都有适合你的方案</p>
      </div>

      <div className="max-w-7xl mx-auto grid md:grid-cols-3 gap-8">
        {plans.map((plan, index) => (
          <Card key={index} className={`p-8 flex flex-col relative ${plan.popular ? 'border-2 border-blue-500 shadow-2xl scale-105' : 'border border-gray-200'}`}>
            
            {plan.popular && (
              <div className="absolute top-0 right-0 bg-blue-500 text-white px-3 py-1 text-sm font-bold rounded-bl-lg">
                超值推荐
              </div>
            )}

            <div className="mb-4">
              <h3 className="text-xl font-bold text-gray-900">{plan.name}</h3>
              <p className="text-sm text-gray-500 mt-1">{plan.desc}</p>
            </div>

            <div className="mb-6">
              <span className="text-4xl font-bold">{plan.price}</span>
              <span className="text-gray-400">/月</span>
            </div>

            <ul className="space-y-4 mb-8 flex-1">
              {plan.features.map((feature, i) => (
                <li key={i} className="flex items-center text-gray-600">
                  <Check className="w-5 h-5 text-green-500 mr-2" />
                  {feature}
                </li>
              ))}
            </ul>

            <Button className={`w-full ${plan.popular ? 'bg-blue-600 hover:bg-blue-700' : ''}`} variant={plan.popular ? "default" : "outline"}>
              {plan.buttonText}
            </Button>
          </Card>
        ))}
      </div>
    </div>
  )
}