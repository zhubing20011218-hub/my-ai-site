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
import { Wallet, Copy, Check, Bot, User, Sparkles, Loader2 } from "lucide-react"
import ReactMarkdown from 'react-markdown'

// ✨ 组件1：复制按钮
function CopyButton({ content }: { content: string }) {
  const [isCopied, setIsCopied] = useState(false)
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(content)
      setIsCopied(true)
      setTimeout(() => setIsCopied(false), 2000)
    } catch (err) { console.error("复制失败", err) }
  }
  return (
    <button 
      onClick={handleCopy}
      className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors py-1 px-2 rounded hover:bg-gray-100"
    >
      {isCopied ? <><Check size={14} className="text-green-500"/><span className="text-green-500">已复制</span></> : <><Copy size={14}/><span>复制</span></>}
    </button>
  )
}

// 🧠 组件2：真实思维链 (Real Thinking)
// 接收真实的 steps 数据，不再是死循环
function Thinking({ steps }: { steps: string[] }) {
  const [currentStepIndex, setCurrentStepIndex] = useState(0)

  useEffect(() => {
    // 如果没有步骤，显示默认的
    if (!steps || steps.length === 0) return;

    // 每 1.5 秒切换一个步骤
    const interval = setInterval(() => {
      setCurrentStepIndex((prev) => {
        // 如果走到最后一步，就停在最后一步，不要循环了，等待正文出来
        if (prev >= steps.length - 1) return prev; 
        return prev + 1;
      })
    }, 1500)
    return () => clearInterval(interval)
  }, [steps])

  const currentText = steps && steps.length > 0 ? steps[currentStepIndex] : "正在分析意图..."

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 my-4">
      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
        <Sparkles size={16} className="text-blue-500 animate-pulse" />
      </div>
      <div className="bg-white border border-blue-100 rounded-2xl px-5 py-3 shadow-sm flex items-center gap-3">
        {/* 动态加载圈 */}
        <Loader2 size={16} className="text-blue-500 animate-spin" />
        
        <div className="flex flex-col">
           <span className="text-sm text-blue-600 font-medium transition-all duration-300">
             {currentText}
           </span>
           {/* 显示进度条小点 */}
           <div className="flex gap-1 mt-1">
             {steps.map((_, idx) => (
               <div 
                 key={idx} 
                 className={`h-1 rounded-full transition-all duration-300 ${idx === currentStepIndex ? 'w-4 bg-blue-500' : 'w-1 bg-blue-200'}`}
               />
             ))}
           </div>
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 🆕 新增：专门存储 AI 的思考步骤
  const [thinkingSteps, setThinkingSteps] = useState<string[]>([])
  
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(99999) 
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading, thinkingSteps])

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
    setThinkingSteps(["正在启动AI大脑..."]) // 初始状态

    try {
      // 🚀 第一步：先呼叫“快脑”，获取针对这个问题的真实计划
      // 这个请求非常快 (0.5秒左右)
      fetch('/api/plan', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.content })
      })
      .then(res => res.text())
      .then(text => {
        // 如果获取成功，比如 "检索天气|分析数据|绘图"，就切割成数组
        if (text && text.includes('|')) {
          setThinkingSteps(text.split('|'))
        }
      })
      .catch(err => console.log("快脑偷懒了，使用默认计划"))

      // 🚀 第二步：同时呼叫“慢脑”，获取正文
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          model: model
        })
      })

      if (!response.ok) throw new Error("服务器繁忙")
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
      alert("错误: " + error.message)
    } finally {
      setIsLoading(false)
      setThinkingSteps([]) // 思考结束，清空步骤
    }
  }

  // 充值逻辑保持不变
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
              AI 助手 (Gemini 3 Pro)
            </h1>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="gemini">Gemini (免费)</SelectItem>
                <SelectItem value="gpt4">GPT-4 (VIP)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
             {messages.length === 0 && (
                <div className="text-center mt-20 text-gray-400">
                  <div className="text-6xl mb-4">🧊</div>
                  <div className="text-lg">有什么可以帮你的吗？</div>
                </div>
             )}
             
             {messages.map((m, i) => (
               <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                 {m.role !== 'user' && (
                   <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                     <Bot size={16} className="text-blue-600" />
                   </div>
                 )}
                 <div className={`rounded-2xl px-5 py-3 max-w-[85%] shadow-sm overflow-hidden ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                   <div className={`prose prose-sm sm:prose-base max-w-none break-words leading-relaxed prose-p:my-2 prose-p:leading-7 prose-headings:font-bold prose-headings:my-3 prose-headings:text-gray-900 prose-li:my-1 prose-strong:font-bold prose-table:border prose-table:shadow-sm prose-table:rounded-lg prose-th:bg-gray-50 prose-th:p-3 prose-th:text-gray-700 prose-td:p-3 prose-td:border-t ${m.role === 'user' ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-blue-600'}`}>
                     <ReactMarkdown>{m.content}</ReactMarkdown>
                   </div>
                   {m.role !== 'user' && (
                     <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                       <CopyButton content={m.content} />
                     </div>
                   )}
                 </div>
                 {m.role === 'user' && (
                   <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                     <User size={16} className="text-gray-500" />
                   </div>
                 )}
               </div>
             ))}

             {/* 👇 核心升级：传入真实的 thinkingSteps */}
             {isLoading && <Thinking steps={thinkingSteps} />}
             
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