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
import { Wallet } from "lucide-react"
import ReactMarkdown from 'react-markdown'

export default function Home() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(99999) 
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  useEffect(() => {
    if (!localStorage.getItem("my_ai_user_id")) {
      localStorage.setItem("my_ai_user_id", "user_" + Math.random().toString(36).substr(2, 9))
    }
  }, [])

  const handleSend = async (e: any) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          model: model
        })
      })

      if (!response.ok) {
        const errData = await response.json().catch(() => ({}))
        throw new Error(errData.error || "服务器连接失败")
      }

      if (!response.body) return
      const reader = response.body.getReader()
      const decoder = new TextDecoder()
      
      setMessages(prev => [...prev, { role: 'assistant', content: "" }])

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const text = decoder.decode(value, { stream: true })
        
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
      console.error("发送失败:", error)
      alert("发送失败: " + error.message)
    } finally {
      setIsLoading(false)
    }
  }

  const [rechargeCode, setRechargeCode] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const handleRecharge = () => {
    if (rechargeCode.toUpperCase() === "BOSS-9999") {
        alert("✅ 充值成功！")
        setIsDialogOpen(false)
    } else {
        alert("❌ 无效卡密")
    }
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">🧊 冰式AI站</div>
          <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="text-orange-600 border-orange-200">
                <Wallet className="w-4 h-4 mr-2"/>余额: ¥{balance}
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <DialogHeader><DialogTitle>账户充值</DialogTitle></DialogHeader>
              <Input placeholder="输入卡密" value={rechargeCode} onChange={e => setRechargeCode(e.target.value)} />
              <Button onClick={handleRecharge} className="w-full bg-orange-500 mt-4">立即核销</Button>
            </DialogContent>
          </Dialog>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        <Card className="w-full max-w-3xl p-0 shadow-xl h-[700px] flex flex-col bg-white">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
            <h1 className="font-bold">🤖 选择模型</h1>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (免费)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (VIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6">
             {messages.length === 0 && (
                <div className="text-center mt-20 text-gray-400">
                  <div className="text-4xl mb-2">🧊</div>
                  <div>欢迎使用，请直接提问</div>
                </div>
             )}
             
             {messages.map((m, i) => (
               <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 <div 
                   className={`
                     rounded-2xl px-5 py-3 max-w-[85%] shadow-sm
                     
                     // 1️⃣ 基础排版 (Typography)
                     prose prose-sm sm:prose-base max-w-none break-words leading-relaxed
                     
                     // 2️⃣ 细节美化
                     prose-p:my-2 prose-p:leading-7 
                     prose-headings:font-bold prose-headings:my-3 prose-headings:text-gray-900
                     prose-li:my-1
                     prose-strong:font-bold
                     prose-table:border prose-table:shadow-sm prose-table:rounded-lg
                     prose-th:bg-gray-50 prose-th:p-3 prose-th:text-gray-700
                     prose-td:p-3 prose-td:border-t

                     // 3️⃣ 颜色逻辑 (用户蓝底白字，AI白底黑字)
                     ${m.role === 'user' 
                       ? 'bg-blue-600 text-white prose-invert prose-strong:text-white' // 用户
                       : 'bg-white border border-gray-100 text-gray-800 prose-strong:text-blue-600' // AI
                     }
                   `}
                 >
                   {/* ✅ 移除了这里的 className，彻底解决报错 */}
                   <ReactMarkdown>
                     {m.content}
                   </ReactMarkdown>
                 </div>
               </div>
             ))}

             {isLoading && <div className="text-sm text-gray-400 ml-2 animate-pulse">正在思考...</div>}
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t">
            <form onSubmit={handleSend} className="flex gap-2">
              <Input value={input} onChange={e => setInput(e.target.value)} className="flex-1" placeholder="输入问题..." />
              <Button type="submit" disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">发送</Button>
            </form>
          </div>
        </Card>
      </div>
    </div>
  )
}