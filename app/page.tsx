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
import { Wallet, Copy, Check, Bot, User, Loader2, Terminal, ChevronRight, Square, Send } from "lucide-react"
import ReactMarkdown from 'react-markdown'

// ✨ 组件1：复制按钮 (不变)
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

// 🧠 组件2：终端式思维链 (节奏已优化)
function Thinking({ plan }: { plan: string[] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<string[]>([]) 

  const subTasks = [
    "分配内存堆栈...", "挂载上下文...", "验证Token有效性...", 
    "连接向量数据库...", "执行余弦相似度搜索...", "过滤冗余信息...",
    "构建推理树...", "评估置信度...", "优化语言模型参数...",
    "渲染Markdown流...", "最终格式校验..."
  ]

  // 🔥 优化1：调慢节奏
  // 之前是 1500ms，现在改为 2800ms (接近3秒一步)
  // 这样 4 步走完大概需要 10-12 秒，正好是 Gemini Pro 思考的时间
  useEffect(() => {
    if (currentStep < 3) { // 只自动走到第3步，第4步留给正文出现时触发
      const timer = setTimeout(() => {
        setCurrentStep(prev => prev + 1)
      }, 2800) 
      return () => clearTimeout(timer)
    }
  }, [currentStep])

  useEffect(() => {
    if (currentStep >= 4) return;
    const interval = setInterval(() => {
      const randomLog = subTasks[Math.floor(Math.random() * subTasks.length)]
      setLogs(prev => [randomLog, ...prev].slice(0, 3)) 
    }, 400) // 日志刷新也稍微慢一点点，不那么眼花
    return () => clearInterval(interval)
  }, [currentStep])

  return (
    <div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 my-4 w-full max-w-[85%]">
      <div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0">
        <Loader2 size={16} className="text-blue-500 animate-spin" />
      </div>
      
      <div className="bg-slate-50 border border-blue-100 rounded-xl p-4 shadow-sm w-full font-mono text-sm">
        <div className="flex items-center gap-2 text-xs text-gray-400 mb-3 border-b border-gray-100 pb-2">
          <Terminal size={12} />
          <span>AI Process Monitor</span>
        </div>

        <div className="space-y-3">
          {plan.map((stepText, index) => {
            // 逻辑微调：如果是最后一步，且还在 loading，保持闪烁
            const isDone = index < currentStep;
            const isActive = index === currentStep;
            const isPending = index > currentStep;

            return (
              <div key={index} className={`flex flex-col transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}>
                <div className="flex items-center gap-3">
                  <div className={`
                    w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border
                    ${isDone ? 'bg-green-500 border-green-500 text-white' : ''}
                    ${isActive ? 'bg-blue-600 border-blue-600 text-white animate-pulse' : ''}
                    ${isPending ? 'bg-white border-gray-300 text-gray-300' : ''}
                  `}>
                    {isDone ? <Check size={12} /> : index + 1}
                  </div>
                  <span className={`font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>
                    {stepText}
                  </span>
                </div>

                {isActive && (
                  <div className="ml-8 mt-1 space-y-1">
                    {logs.map((log, i) => (
                      <div key={i} className="text-[10px] text-gray-400 flex items-center gap-1 animate-in slide-in-from-left-2 fade-in duration-300">
                        <ChevronRight size={8} /> {log}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export default function Home() {
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  
  // 🆕 引用：用来控制打断
  const abortControllerRef = useRef<AbortController | null>(null)

  const defaultSteps = ["正在解析用户意图...", "正在构建检索策略...", "正在执行逻辑推理...", "正在生成最终回复..."]
  const [thinkingSteps, setThinkingSteps] = useState<string[]>(defaultSteps)
  
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

  // 🛑 新增：打断功能
  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort() // 掐断网线
      abortControllerRef.current = null
    }
    setIsLoading(false)
    
    // ✨ 体验优化：把最后一条用户发的问题，填回输入框，方便修改
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()
    if (lastUserMsg) {
      setInput(lastUserMsg.content)
    }
  }

  const handleSend = async (e: any) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("") // 清空输入框
    setIsLoading(true)
    setThinkingSteps(defaultSteps) 
    
    // 🆕 初始化打断控制器
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 快脑 (不重要，不需要 abort)
      fetch('/api/plan', {
        method: 'POST',
        body: JSON.stringify({ message: userMsg.content })
      })
      .then(res => res.text())
      .then(text => {
        if (text && text.includes('|')) {
          setThinkingSteps(text.split('|'))
        }
      })
      .catch(() => {}) 

      // 慢脑 (核心请求，绑定 signal)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: [...messages, userMsg],
          model: model
        }),
        signal: controller.signal // 👈 绑定信号
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
      if (error.name === 'AbortError') {
        console.log("用户手动停止生成")
      } else {
        alert("错误: " + error.message)
      }
    } finally {
      setIsLoading(false)
      abortControllerRef.current = null
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

             {isLoading && <Thinking plan={thinkingSteps} />}
             
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t">
            {/* 👇 核心修改：根据状态切换 发送/停止 按钮 */}
            {isLoading ? (
               <div className="flex gap-2">
                 <Button 
                   onClick={stopGeneration} 
                   className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2"
                 >
                   <Square size={16} fill="currentColor" />
                   停止生成 (Stop)
                 </Button>
               </div>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2">
                <Input value={input} onChange={e => setInput(e.target.value)} className="flex-1" placeholder="输入问题..." />
                <Button type="submit" className="bg-blue-600 hover:bg-blue-700">
                  <Send size={18} />
                </Button>
              </form>
            )}
          </div>
        </Card>
      </div>
    </div>
  )
}