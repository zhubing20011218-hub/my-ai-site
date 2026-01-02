"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
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
} from "@/components/ui/dialog"
import { Wallet, MessageSquare, QrCode, Ticket } from "lucide-react"
import ReactMarkdown from 'react-markdown'

// ⚠️ 注意：这里完全没有引用 @ai-sdk/react，彻底根除报错源头！

export default function Home() {
  // 1. 定义所有状态
  // 不再用库来管理消息，我们自己管理，这样最稳！
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(99999) // 无限余额
  
  // 弹窗相关状态
  const [rechargeCode, setRechargeCode] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isContactOpen, setIsContactOpen] = useState(false)
  
  // 滚动到底部的引用
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 自动滚动到底部
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 2. 纯手写的发送函数 (核心功能)
  // 这个函数直接找后端要数据，不经过任何中间商，所以绝对不会报 "h is not a function"
  const handleSend = async (e: any) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // 1. 先把你的问题显示在界面上
    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    const currentInput = input // 暂存输入内容
    setInput("") // 清空输入框
    setIsLoading(true)

    try {
      // 2. 直接发请求给后端 (这里对应你的 route.ts)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg], // 把历史记录也发过去
          model: model
        })
      })

      if (!response.ok) throw new Error("连接服务器失败，请检查网络")

      // 3. 准备接收 AI 的回复 (流式传输)
      const assistantMsg = { role: 'assistant', content: "" }
      setMessages(prev => [...prev, assistantMsg])

      // 开始读取数据流
      const reader = response.body?.getReader()
      const decoder = new TextDecoder()

      if (!reader) return

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        
        // 解码收到的文字片段
        const text = decoder.decode(value, { stream: true })
        
        // 把新收到的文字拼接到最后一条消息上
        setMessages(prev => {
          const newMsgs = [...prev]
          const lastMsg = newMsgs[newMsgs.length - 1]
          if (lastMsg.role === 'assistant') {
            lastMsg.content += text
          }
          return newMsgs
        })
      }

    } catch (error: any) {
      console.error("发送出错:", error)
      alert("发送失败: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  // 3. 充值逻辑 (模拟)
  const handleRecharge = () => {
    const code = rechargeCode.trim().toUpperCase()
    if (code === "BOSS-9999" || code === "DEV-TEST") {
      alert("✅ 充值成功！(这是模拟功能，您现在是无限余额)")
      setIsDialogOpen(false)
      setRechargeCode("")
    } else {
      alert("❌ 无效兑换码")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      {/* 顶部导航 */}
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">🧊 冰式AI站</div>
          <div className="flex gap-4 items-center">
            <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" className="text-orange-600 border-orange-200 hover:bg-orange-50 font-bold">
                  <Wallet className="w-4 h-4 mr-2"/>余额: ¥{balance}
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-center">账户充值</DialogTitle>
                </DialogHeader>
                <Input 
                  placeholder="输入卡密 (如: BOSS-9999)" 
                  value={rechargeCode}
                  onChange={(e) => setRechargeCode(e.target.value)}
                  className="text-center uppercase"
                />
                <Button onClick={handleRecharge} className="w-full bg-orange-500 hover:bg-orange-600 font-bold">
                  <Ticket className="w-4 h-4 mr-2" />立即核销
                </Button>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </nav>

      {/* 公告 */}
      <div className="w-full bg-blue-50 border-b border-blue-100 p-2 text-center text-sm text-gray-700">
        欢迎各位老板，有问题请 <span onClick={() => setIsContactOpen(true)} className="text-blue-600 font-bold underline cursor-pointer">联系客服</span>
      </div>

      {/* 客服弹窗 */}
      <Dialog open={isContactOpen} onOpenChange={setIsContactOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle className="text-center">扫码添加客服</DialogTitle></DialogHeader>
          <div className="flex justify-center py-4">
             <div className="w-48 h-48 bg-gray-100 flex items-center justify-center border-2 border-dashed rounded-lg">
               {/* 这里放你的图片，如果没有就显示文字 */}
               <img src="/kefu.jpg" alt="二维码" className="w-full h-full object-cover" onError={(e) => e.currentTarget.style.display='none'}/>
               <span className="text-gray-400 text-xs absolute">暂无图片</span>
             </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 聊天区域 */}
      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl p-0 shadow-xl h-[700px] flex flex-col overflow-hidden bg-white">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h1 className="font-bold flex items-center gap-2">🤖 选择模型</h1>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (免费)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (模拟)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.length === 0 && (
                <div className="text-center mt-20 text-gray-400 space-y-4">
                  <div className="text-4xl">🧊</div>
                  <div>欢迎使用冰式AI站<br/>请直接提问</div>
                </div>
             )}
             {messages.map((m, index) => (
               <div key={index} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div className={`rounded-2xl px-5 py-3 max-w-[85%] text-sm ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-gray-100'}`}>
                   <ReactMarkdown>{m.content}</ReactMarkdown>
                 </div>
               </div>
             ))}
             {isLoading && (
                <div className="text-sm text-gray-400 ml-2 animate-pulse">🧊 正在思考中...</div>
             )}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input 
                 value={input} 
                 onChange={(e) => setInput(e.target.value)} 
                 className="flex-1" 
                 placeholder="请输入您的问题..." 
              />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700 font-bold">
                {isLoading ? "发送中..." : "发送"}
              </Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}