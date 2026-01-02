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
import { Wallet, Copy, Check, Bot, User, Loader2, Terminal, ChevronRight, Square, Send, Lightbulb, Paperclip, X, FileCode, FileText, Image as ImageIcon } from "lucide-react"
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

// 🧠 组件2：终端式思维链
function Thinking({ plan }: { plan: string[] }) {
  const [currentStep, setCurrentStep] = useState(0)
  const [logs, setLogs] = useState<string[]>([]) 

  const subTasks = [
    "分配内存堆栈...", "挂载上下文...", "验证Token有效性...", 
    "连接向量数据库...", "执行余弦相似度搜索...", "过滤冗余信息...",
    "构建推理树...", "评估置信度...", "优化语言模型参数...",
    "渲染Markdown流...", "最终格式校验..."
  ]

  useEffect(() => {
    if (currentStep < 3) {
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
    }, 400)
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
  const abortControllerRef = useRef<AbortController | null>(null)
  
  // 📁 附件状态管理
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const defaultSteps = ["正在解析用户意图...", "正在构建检索策略...", "正在执行逻辑推理...", "正在生成最终回复..."]
  const [thinkingSteps, setThinkingSteps] = useState<string[]>(defaultSteps)
  
  const [model, setModel] = useState("gemini")
  const [balance, setBalance] = useState(99999) 
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }, [messages, isLoading, thinkingSteps, selectedImage, selectedFile])

  useEffect(() => {
    if (!localStorage.getItem("my_ai_user_id")) {
      localStorage.setItem("my_ai_user_id", "user_" + Math.random().toString(36).substr(2, 9))
    }
  }, [])

  const stopGeneration = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort()
      abortControllerRef.current = null
    }
    setIsLoading(false)
    const lastUserMsg = messages.filter(m => m.role === 'user').pop()
    if (lastUserMsg) {
       // 如果上一条消息是混合内容，只恢复文本部分到输入框
       const text = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : lastUserMsg.content.text
       setInput(text)
    }
  }

  // 📂 核心逻辑：处理文件上传
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // 限制大小 (5MB)
    if (file.size > 5 * 1024 * 1024) { 
      alert("文件太大啦，请上传 5MB 以内的文件")
      return
    }

    // A. 如果是图片 -> 转 Base64
    if (file.type.startsWith('image/')) {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedImage(reader.result as string)
        setSelectedFile(null) // 互斥，清空文件
      }
      reader.readAsDataURL(file)
    } 
    // B. 如果是文本/代码 -> 读取内容
    else {
      const reader = new FileReader()
      reader.onloadend = () => {
        setSelectedFile({
          name: file.name,
          content: reader.result as string
        })
        setSelectedImage(null) // 互斥，清空图片
      }
      reader.readAsText(file) // 关键：作为文本读取
    }
  }

  const handleSend = async (e?: any, textOverride?: string) => {
    e?.preventDefault()
    
    const contentToSend = textOverride || input
    // 如果没有输入文本，也没有附件，就不发送
    if ((!contentToSend.trim() && !selectedImage && !selectedFile) || isLoading) return

    // 构建发给后端的 API 消息体
    let apiContent: any = contentToSend
    
    // 构建显示在前端 UI 的消息体
    let uiContent: any = contentToSend

    // 场景 1: 有图片
    if (selectedImage) {
      uiContent = { type: 'image_mixed', text: contentToSend, image: selectedImage }
      apiContent = [
        { type: 'text', text: contentToSend || "请分析这张图片" },
        { type: 'image', image: selectedImage }
      ]
    }
    // 场景 2: 有代码/文档
    else if (selectedFile) {
      // 策略：把文件内容“拼”在用户问题的后面，假装是用户粘贴进去的
      const promptWithFile = `${contentToSend}\n\n--- 附件文件: ${selectedFile.name} ---\n${selectedFile.content}\n--- 文件结束 ---`
      
      uiContent = { type: 'file_mixed', text: contentToSend, fileName: selectedFile.name }
      apiContent = promptWithFile // 直接发拼接好的长文本
    }

    const userMsg = { role: 'user', content: uiContent }
    setMessages(prev => [...prev, userMsg])
    
    // 清空输入区
    setInput("") 
    setSelectedImage(null)
    setSelectedFile(null)
    if(fileInputRef.current) fileInputRef.current.value = ""

    setIsLoading(true)
    setThinkingSteps(defaultSteps) 
    
    const controller = new AbortController()
    abortControllerRef.current = controller

    try {
      // 快脑 (只发文本摘要去分析意图)
      const planText = typeof apiContent === 'string' ? apiContent : (contentToSend || "分析附件")
      
      fetch('/api/plan', {
        method: 'POST',
        body: JSON.stringify({ message: planText.substring(0, 500) }) // 截取一下防止太长
      })
      .then(res => res.text())
      .then(text => {
        if (text && text.includes('|')) setThinkingSteps(text.split('|'))
      })
      .catch(() => {}) 

      // 慢脑 (发送完整内容)
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          messages: messages.map(m => {
             // 历史消息如果是对象，需要还原成文本给 API (简化处理)
             if (typeof m.content !== 'string') return { role: m.role, content: m.content.text || "[附件]" }
             return { role: m.role, content: m.content }
          }).concat({ role: 'user', content: apiContent }), 
          model: model
        }),
        signal: controller.signal
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
      if (error.name !== 'AbortError') alert("错误: " + error.message)
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
                  <div className="flex gap-2 justify-center mt-4">
                     <button onClick={() => handleSend(null, "分析上海未来一周天气")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 text-gray-600 transition">🌦️ 上海天气</button>
                     <button onClick={() => handleSend(null, "写一个科幻短篇故事")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 text-gray-600 transition">📝 写个故事</button>
                  </div>
                </div>
             )}
             
             {messages.map((m, i) => {
               // 处理渲染：支持 纯文本 / 图片混合 / 文件混合
               let content = ""
               let imageSrc = null
               let fileName = null
               
               if (typeof m.content === 'string') {
                 content = m.content
               } else if (m.content.type === 'image_mixed') {
                 content = m.content.text
                 imageSrc = m.content.image
               } else if (m.content.type === 'file_mixed') {
                 content = m.content.text
                 fileName = m.content.fileName
               }

               // 切割“猜你想问”
               const [mainText, relatedStr] = content.split('___RELATED___')
               const suggestions = relatedStr ? relatedStr.split('|').filter((s: string) => s.trim()) : []

               return (
                 <div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>
                   {m.role !== 'user' && (
                     <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1">
                       <Bot size={16} className="text-blue-600" />
                     </div>
                   )}
                   
                   <div className="flex flex-col gap-2 max-w-[85%]">
                     <div className={`rounded-2xl px-5 py-3 shadow-sm overflow-hidden ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>
                       
                       {/* 📸 渲染图片附件 */}
                       {imageSrc && (
                         <div className="mb-3 rounded-lg overflow-hidden border border-white/20">
                           <img src={imageSrc} alt="uploaded" className="max-w-full max-h-[300px] object-cover" />
                         </div>
                       )}

                       {/* 📄 渲染文件附件 */}
                       {fileName && (
                         <div className="mb-3 p-3 bg-black/10 rounded-lg flex items-center gap-3 border border-white/10">
                           <div className="p-2 bg-white rounded-lg">
                             <FileCode size={20} className="text-blue-600" />
                           </div>
                           <div className="flex flex-col">
                             <span className="text-sm font-bold opacity-90">已上传文件</span>
                             <span className="text-xs opacity-75">{fileName}</span>
                           </div>
                         </div>
                       )}

                       <div className={`prose prose-sm sm:prose-base max-w-none break-words leading-relaxed prose-p:my-2 prose-p:leading-7 prose-headings:font-bold prose-headings:my-3 prose-headings:text-gray-900 prose-li:my-1 prose-strong:font-bold prose-table:border prose-table:shadow-sm prose-table:rounded-lg prose-th:bg-gray-50 prose-th:p-3 prose-th:text-gray-700 prose-td:p-3 prose-td:border-t ${m.role === 'user' ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-blue-600'}`}>
                         <ReactMarkdown>{mainText}</ReactMarkdown>
                       </div>
                       {m.role !== 'user' && (
                         <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end">
                           <CopyButton content={mainText} />
                         </div>
                       )}
                     </div>

                     {suggestions.length > 0 && m.role !== 'user' && (
                       <div className="flex flex-wrap gap-2 mt-1">
                         <div className="flex items-center gap-1 text-xs text-blue-500 font-medium mb-1 w-full">
                            <Lightbulb size={12} /> 猜你想问:
                         </div>
                         {suggestions.map((s: string, idx: number) => (
                           <button 
                             key={idx}
                             onClick={() => handleSend(null, s.trim())}
                             className="px-3 py-1.5 bg-white border border-blue-100 rounded-xl text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm text-left animate-in zoom-in duration-300"
                             style={{ animationDelay: `${idx * 100}ms` }}
                           >
                             {s.trim()}
                           </button>
                         ))}
                       </div>
                     )}
                   </div>

                   {m.role === 'user' && (
                     <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1">
                       <User size={16} className="text-gray-500" />
                     </div>
                   )}
                 </div>
               )
             })}

             {isLoading && <Thinking plan={thinkingSteps} />}
             
             <div ref={messagesEndRef} />
          </div>

          <div className="p-4 bg-white border-t space-y-3">
             {/* 📸 附件预览区 (图片或文件) */}
             {(selectedImage || selectedFile) && (
               <div className="relative inline-block animate-in slide-in-from-bottom-2 fade-in">
                 {selectedImage ? (
                   <img src={selectedImage} alt="preview" className="h-16 w-16 object-cover rounded-lg border border-gray-200 shadow-sm" />
                 ) : (
                   <div className="h-16 w-auto px-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg">
                     <FileText size={20} className="text-blue-500"/>
                     <span className="text-sm text-gray-600 max-w-[150px] truncate">{selectedFile?.name}</span>
                   </div>
                 )}
                 
                 <button 
                   onClick={() => { setSelectedImage(null); setSelectedFile(null); }}
                   className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm z-10"
                 >
                   <X size={12} />
                 </button>
               </div>
             )}

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
              <form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center">
                {/* 📂 隐藏的文件输入框: 接受图片、文本、代码 */}
                <input 
                  type="file" 
                  ref={fileInputRef}
                  accept="image/*,.txt,.md,.js,.py,.html,.css,.json,.csv"
                  className="hidden"
                  onChange={handleFileSelect}
                />
                
                {/* 📎 附件按钮 */}
                <Button 
                  type="button" 
                  variant="ghost" 
                  size="icon"
                  className="text-gray-500 hover:text-blue-600 hover:bg-blue-50"
                  onClick={() => fileInputRef.current?.click()}
                  title="上传图片或文件"
                >
                  <Paperclip size={20} />
                </Button>

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