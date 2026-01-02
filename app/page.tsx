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
import { Wallet, Copy, Check, Bot, User } from "lucide-react" // 👈 新增了图标
import ReactMarkdown from 'react-markdown'

// ✨ 小组件：复制按钮
// 把它单独提出来，为了复用和状态管理
function CopyButton({ content }: { content: string }) {
  const [isCopied, setIsCopied] = useState(false)

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000) // 2秒后变回原样
    } catch (err) {
      console.error("复制失败", err)
    }
  }

  return (
    <button 
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors py-1 px-2 rounded hover:bg-gray-100"
      title="复制全部内容"
    >
      {isCopied ? (
        <>
          <Check size={14} className="text-green-500" />
          <span className="text-green-500">已复制</span>
        </>
      ) : (
        <>
          <Copy size={14} />
          <span>复制</span>
        </>
      )}
    </button>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(99999) 
  
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  // 自动滚动
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages])

  // 初始化用户ID
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

  // 充值逻辑
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
            <h1 className="font-bold text-gray-700 flex items-center gap-2">
              <Bot size={20} className="text-blue-500"/> 
              AI 助手
            </h1>
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
                  <div className="text-6xl mb-4">🧊</div>
                  <div className="text-lg">有什么可以帮你的吗？</div>
                </div>
             )}
             
             {messages.map((m, i) => (
               <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                 
                 {/* AI 头像 */}
                 {m.role !== 'user' && (
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                     <Bot size={16} className="text-blue-600" />
                   </div>
                 )}

                 <div 
                   className={`
                     rounded-2xl px-5 py-3 max-w-[85%] shadow-sm overflow-hidden
                     ${m.role === 'user' 
                       ? 'bg-blue-600 text-white' 
                       : 'bg-white border border-gray-100 text-gray-800'
                     }
                   `}
                 >
                   {/* 渲染内容 */}
                   <div className={`
                       prose prose-sm sm:prose-base max-w-none break-words leading-relaxed
                       prose-p:my-2 prose-p:leading-7 
                       prose-headings:font-bold prose-headings:my-3 prose-headings:text-gray-900
                       prose-li:my-1
                       prose-strong:font-bold
                       prose-table:border prose-table:shadow-sm prose-table:rounded-lg
                       prose-th:bg-gray-50 prose-th:p-3 prose-th:text-gray-700
                       prose-td:p-3 prose-td:border-t
                       ${m.role === 'user' ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-blue-600'}
                   `}>
                     <ReactMarkdown>{m.content}</ReactMarkdown>
                   </div>

                   {/* 👇 只有 AI 的消息才显示底部工具栏 */}
                   {m.role !== 'user' && (
                     <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                       <CopyButton content={m.content} />
                     </div>
                   )}
                 </div>

                 {/* 用户头像 */}
                 {m.role === 'user' && (
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                     <User size={16} className="text-gray-500" />
                   </div>
                 )}
               </div>
             ))}

             {isLoading && (
               <div className="flex gap-3">
                 <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-blue-600" />
                 </div>
                 <div className="bg-white border border-gray-100 rounded-2xl px-5 py-3 shadow-sm flex items-center">
                    <span className="flex gap-1">
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0s'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.2s'}}></span>
                      <span className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{animationDelay: '0.4s'}}></span>
                    </span>
                    <span className="text-xs text-gray-400 ml-2">正在思考...</span>
                 </div>
               </div>
             )}
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