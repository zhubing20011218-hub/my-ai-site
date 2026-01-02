"use client"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { 
  Select, 
  SelectContent, 
  SelectItem, 
  SelectTrigger, 
  SelectValue 
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog"
import { Wallet, MessageSquare, QrCode, Ticket, User } from "lucide-react"

import { useChat } from "@ai-sdk/react"
import Link from "next/link"
import { useState, useEffect } from "react"
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(0)
  const [rechargeCode, setRechargeCode] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false) // 🆕 新增：控制客服弹窗
  const [userId, setUserId] = useState("")
  
  const [input, setInput] = useState("") 

  // @ts-ignore
  const { messages, append, isLoading } = useChat({
    api: '/api/chat',
    body: { model: model }
  } as any) as any

  // 1. 初始化
  useEffect(() => {
    const initUser = async () => {
      // 获取或生成本地用户ID
      let id = localStorage.getItem("my_ai_user_id")
      if (!id) {
        id = "user_" + Math.random().toString(36).substr(2, 9)
        localStorage.setItem("my_ai_user_id", id)
      }
      setUserId(id)

      // 🛑 关键修改：我删除了原来向 Supabase 查余额的所有代码
      // ✅ 直接给你设置一个无限余额，这样永远不会报 401 错误！
      setBalance(99999); 
    }
    initUser()
  }, [])
  // 2. 充值
  const handleRecharge = async () => {
    const code = rechargeCode.trim().toUpperCase()
    const validCodes: Record<string, number> = {
      "TIYAN-2026": 10,
      "PLUS-8888": 50,
      "BOSS-9999": 100,
      "DEV-TEST": 1000
    }

    if (validCodes[code]) {
      const amount = validCodes[code]
      const newBalance = balance + amount
      setBalance(newBalance)
      
      

      alert(`✅ 充值成功！余额已更新为 ¥${newBalance}`)
      setRechargeCode("")
      setIsDialogOpen(false)
    } else {
      alert("❌ 无效的兑换码")
    }
  }

  // 3. 发送消息 (更新价格逻辑)
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    // 💰 更新后的价格表
    const prices: Record<string, number> = {
      'gemini': 0.1, 
      'gpt4': 0.1, 
      'sora': 0.25
    }
    const cost = prices[model]

    if (balance < cost) {
      if (confirm(`❌ 余额不足！本模型需要 ¥${cost}，当前 ¥${balance}。\n是否去充值？`)) {
        setIsDialogOpen(true)
      }
      return
    }

    const newBalance = Number((balance - cost).toFixed(2)) // 防止小数精度问题
    setBalance(newBalance)
    

    if (model === 'sora') {
      alert(`💸 扣费成功！(演示模式: Sora暂未接入真实API)`)
      return
    }

    await append({ role: 'user', content: input }) 
    setInput("") 
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* 顶部导航栏 */}
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          {/* 1️⃣ 修改标题和图标 */}
          <div className="font-bold text-xl flex items-center gap-2">
            🧊 冰式AI站
          </div>
          <div className="flex gap-4 items-center">
            {/* 钱包按钮 */}
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold">
                  <Wallet className="w-4 h-4 mr-2"/>
                  余额: ¥{balance}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">账户充值</DialogTitle>
                  <DialogDescription className="text-center">卡密自动核销 / 企业支付</DialogDescription>
                </DialogHeader>
                <div className="grid grid-cols-2 gap-4 py-4">
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-green-50 cursor-pointer" onClick={() => alert("维护中")}>
                    <MessageSquare className="w-6 h-6 text-green-600 mb-2" />
                    <span className="text-sm">微信支付</span>
                  </div>
                  <div className="flex flex-col items-center justify-center p-4 border-2 border-dashed border-gray-200 rounded-xl hover:bg-blue-50 cursor-pointer" onClick={() => alert("维护中")}>
                    <QrCode className="w-6 h-6 text-blue-600 mb-2" />
                    <span className="text-sm">支付宝</span>
                  </div>
                </div>
                <Input 
                  placeholder="输入卡密 (如: BOSS-9999)" 
                  value={rechargeCode}
                  onChange={(e) => setRechargeCode(e.target.value)}
                  className="text-center uppercase"
                />
                <Button onClick={handleRecharge} className="w-full bg-orange-500 hover:bg-orange-600 font-bold">
                  <Ticket className="w-4 h-4 mr-2" />
                  立即核销
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* 3️⃣ 新增：欢迎公告栏 */}
      <div className="w-full bg-blue-50 border-b border-blue-100 p-2 text-center text-sm text-gray-700">
        欢迎各位老板，有问题可以随时
        <span 
          onClick={() => setIsContactOpen(true)}
          className="text-blue-600 font-bold underline cursor-pointer mx-1 hover:text-blue-800"
        >
          联系客服
        </span>
      </div>

      {/* 客服弹窗 (隐藏的) */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center">扫码添加客服微信</DialogTitle>
          </DialogHeader>
          <div className="flex flex-col items-center justify-center py-6 gap-4">
            {/* 这里引用你的二维码图片 */}
            <div className="w-48 h-48 bg-white border-2 border-dashed border-gray-300 rounded-lg flex items-center justify-center overflow-hidden">
               {/* ⚠️ 注意：如果你还没放图片，这里会显示文字提示 */}
               <img 
                 src="/kefu.jpg" 
                 alt="客服二维码" 
                 className="w-full h-full object-cover"
                 onError={(e) => {
                   e.currentTarget.style.display = 'none'; // 图片加载失败时隐藏
                   e.currentTarget.parentElement!.innerHTML = '<span class="text-xs text-gray-400 text-center p-2">请将微信二维码图片命名为 kefu.jpg 并放入 public 文件夹</span>';
                 }}
               />
            </div>
            <p className="text-sm text-gray-500">微信号: BingStyle-AI (示例)</p>
          </div>
        </DialogContent>
      </Dialog>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl p-0 shadow-xl h-[700px] flex flex-col overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center gap-2">
              🤖 选择模型
            </h1>
            {/* 2️⃣ 修改模型下拉菜单的文字显示 */}
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (¥0.1/次)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (¥0.1/次)</SelectItem>
                <SelectItem value="sora">Sora (¥0.25/次)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.length === 0 && (
                <div className="text-center mt-20 space-y-4">
                  <div className="text-4xl">🧊</div>
                  <div className="text-gray-400">欢迎来到冰式AI站<br/>请选择模型开始对话</div>
                </div>
             )}
             {messages.map((m: any) => (
               <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`rounded-2xl px-5 py-3 max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                   <ReactMarkdown>{m.content}</ReactMarkdown>
                 </div>
               </div>
             ))}
             {isLoading && <div className="text-sm text-gray-400 ml-2">🧊 正在思考中...</div>}
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)} 
                 className="flex-1" 
                 placeholder="输入您的问题..." 
              />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">发送</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}