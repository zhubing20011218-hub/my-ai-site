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
import { Wallet, MessageSquare, QrCode, Ticket } from "lucide-react"

import { useChat } from "@ai-sdk/react"
import Link from "next/link"
import { useState, useEffect } from "react" // 引入 useEffect 用来初始化
import ReactMarkdown from 'react-markdown'
import { supabase } from "@/lib/supabase" // 引入刚才写的数据库工具

export default function Home() {
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(0)
  const [rechargeCode, setRechargeCode] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [userId, setUserId] = useState("") // 存储当前用户的身份ID

  const { messages, input, handleInputChange, handleSubmit, isLoading } = useChat({
    body: { model: model }
  })

  // 🔄 1. 网页加载时：初始化用户并同步余额
  useEffect(() => {
    const initUser = async () => {
      // A. 尝试从浏览器缓存找 ID
      let id = localStorage.getItem("my_ai_user_id")
      
      // B. 如果没有（新用户），生成一个随机 ID
      if (!id) {
        id = "user_" + Math.random().toString(36).substr(2, 9)
        localStorage.setItem("my_ai_user_id", id)
      }
      setUserId(id)

      // C. 去 Supabase 数据库查这个人的钱
      const { data, error } = await supabase
        .from('profiles')
        .select('balance')
        .eq('id', id)
        .single()

      if (data) {
        // 如果查到了，把钱显示出来
        setBalance(data.balance)
      } else {
        // 如果没查到（说明是纯新用户），在数据库里建个档
        await supabase.from('profiles').insert([{ id: id, balance: 0 }])
        setBalance(0)
      }
    }

    initUser()
  }, [])

  // 💰 2. 充值功能（带数据库更新）
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

      // A. 更新界面
      setBalance(newBalance)
      
      // B. 更新数据库 (永久保存)
      await supabase
        .from('profiles')
        .update({ balance: newBalance })
        .eq('id', userId)

      alert(`✅ 充值成功！余额已更新为 ¥${newBalance}`)
      setRechargeCode("")
      setIsDialogOpen(false)
    } else {
      alert("❌ 无效的兑换码")
    }
  }

  // 💸 3. 消费功能（带数据库扣费）
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault()
    
    const prices: Record<string, number> = {
      'gemini': 0,
      'gpt4': 5,
      'sora': 20
    }
    const cost = prices[model]

    if (balance < cost) {
      if (confirm(`❌ 余额不足！需要 ¥${cost}，当前 ¥${balance}。\n是否去充值？`)) {
        setIsDialogOpen(true)
      }
      return
    }

    // A. 扣费逻辑
    const newBalance = balance - cost
    setBalance(newBalance) // 更新界面
    
    // B. 更新数据库
    await supabase
      .from('profiles')
      .update({ balance: newBalance })
      .eq('id', userId)

    if (model === 'sora') {
      alert(`💸 扣费成功！(数据库已同步)`)
      return
    }

    handleSubmit(e)
  }

  // 下面的界面代码(return部分)跟之前完全一样
  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">
            🚀 AI 聚合站
          </div>
          <div className="flex gap-4 items-center">
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
            <Link href="/" className="text-sm font-medium text-blue-600">对话</Link>
            <Link href="/pricing" className="text-sm font-medium text-gray-600 hover:text-blue-600">价格方案</Link>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl p-0 shadow-xl h-[700px] flex flex-col overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex items-center justify-between">
            <h1 className="text-lg font-bold flex items-center gap-2">
              🤖 AI 助手
              <Badge variant="secondary">{model}</Badge>
            </h1>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (免费)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (¥5)</SelectItem>
                <SelectItem value="sora">Sora (¥20)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.length === 0 && <div className="text-center text-gray-400 mt-20">👋 欢迎回来！</div>}
             {messages.map(m => (
               <div key={m.id} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`rounded-2xl px-5 py-3 max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                   <ReactMarkdown>{m.content}</ReactMarkdown>
                 </div>
               </div>
             ))}
             {isLoading && <div className="text-sm text-gray-400 ml-2">对方正在输入...</div>}
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input value={input} onChange={handleInputChange} className="flex-1" placeholder="说点什么..." />
              <Button type="submit" disabled={isLoading}>发送</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}