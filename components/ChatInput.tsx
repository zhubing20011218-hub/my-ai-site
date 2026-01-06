import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, X, Image as ImageIcon, FileText, ChevronDown, Sparkles, Loader2, Copy, Check, ArrowRight } from "lucide-react"
import { Button } from "@/components/ui/button"

// 📦 模型配置
export const ALL_MODELS = [
  // --- 文本模型 ---
  { 
    id: "gemini-exp-1206", // 👈 把最强模型放在第一位，作为默认
    name: "Gemini Thinking", 
    desc: "最强版 | 深度推理，解决难题", 
    category: "text"
  },
  { 
    id: "gemini-2.5-pro", 
    name: "Gemini 2.5 Pro", 
    desc: "均衡型 | 强力逻辑，长文分析", 
    category: "text"
  },
  { 
    id: "gemini-2.5-flash", 
    name: "Gemini 2.5 Flash", 
    desc: "轻量级 | 极速响应，日常助手", 
    category: "text"
  },
  // --- 视频模型 ---
  { 
    id: "sora-v1", 
    name: "OpenAI Sora", 
    desc: "电影级视频生成 (VIP)", 
    category: "video" 
  },
  { 
    id: "veo-google", 
    name: "Google Veo", 
    desc: "创意短片制作", 
    category: "video" 
  },
  // --- 图片模型 ---
  { 
    id: "banana-sdxl", 
    name: "Banana SDXL", 
    desc: "极速艺术绘图", 
    category: "image" 
  },
];

interface ChatInputProps {
  onSend: (text: string, attachments: File[], modelId: string, roleId: string) => void;
  disabled?: boolean;
  allowedCategories?: string[]; 
}

export default function ChatInput({ onSend, disabled, allowedCategories = ['text'] }: ChatInputProps) {
  const [input, setInput] = useState("")
  const [files, setFiles] = useState<File[]>([])
  
  const availableModels = ALL_MODELS.filter(m => allowedCategories.includes(m.category));
  // ✅ 默认选中列表里的第一个（现在是 Thinking 最强模型）
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.id || "")
  
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  
  // ✨ 帮我写功能的状态
  const [isOptimizeOpen, setIsOptimizeOpen] = useState(false)
  const [optimizeInput, setOptimizeInput] = useState("")
  const [optimizedResult, setOptimizedResult] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optimizeRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭弹窗
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
      if (optimizeRef.current && !optimizeRef.current.contains(event.target as Node)) {
        setIsOptimizeOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 类别变化时重置模型
  useEffect(() => {
    const currentExists = availableModels.find(m => m.id === selectedModel);
    if (!currentExists) {
        setSelectedModel(availableModels[0]?.id || "");
    }
  }, [allowedCategories]);

  // 发送逻辑
  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || disabled) return
    onSend(input, files, selectedModel, "general")
    setInput("")
    setFiles([])
  }

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setFiles((prev) => [...prev, ...Array.from(e.target.files!)])
    }
  }

  const removeFile = (index: number) => {
    setFiles((prev) => prev.filter((_, i) => i !== index))
  }

  // ✨ 执行“帮我写”优化
  const handleRunOptimize = async () => {
    if (!optimizeInput.trim()) return;
    setIsOptimizing(true);
    setOptimizedResult(""); // 清空旧结果
    try {
        const res = await fetch('/api/optimize', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ prompt: optimizeInput })
        });
        const data = await res.json();
        if (data.optimized) {
            setOptimizedResult(data.optimized);
        } else {
            setOptimizedResult("优化失败，请稍后再试。");
        }
    } catch (error) {
        setOptimizedResult("网络请求错误。");
    } finally {
        setIsOptimizing(false);
    }
  };

  // 复制结果
  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  // 填入输入框
  const handleUse = () => {
    setInput(optimizedResult);
    setIsOptimizeOpen(false);
    setOptimizeInput("");
    setOptimizedResult("");
  }

  const currentModelObj = ALL_MODELS.find(m => m.id === selectedModel) || availableModels[0];

  return (
    <div className="relative">
      {/* 📎 文件预览区域 */}
      {files.length > 0 && (
        <div className="flex gap-2 mb-2 overflow-x-auto px-2">
          {files.map((file, i) => (
            <div key={i} className="relative group bg-slate-100 dark:bg-slate-800 p-2 rounded-xl border border-slate-200 dark:border-slate-700 flex items-center gap-2 shrink-0">
              <div className="w-8 h-8 bg-blue-100 text-blue-600 rounded-lg flex items-center justify-center">
                 {file.type.startsWith('image') ? <ImageIcon size={16}/> : <FileText size={16}/>}
              </div>
              <span className="text-xs max-w-[100px] truncate text-slate-700 dark:text-slate-300 font-bold">{file.name}</span>
              <button onClick={() => removeFile(i)} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                <X size={10} />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* ⌨️ 输入框主体 */}
      <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={disabled}
          rows={1}
          className="flex min-h-[50px] max-h-[200px] w-full rounded-md bg-transparent px-4 py-3.5 pr-32 text-sm placeholder:text-slate-400 focus:outline-none dark:text-slate-200 resize-none"
        />

        {/* 底部工具栏 */}
        <div className="flex justify-between items-center px-2 pb-2">
            
            {/* 左侧功能区：🔗 -> 🤖 -> ✨ */}
            <div className="flex items-center gap-2 relative">
                
                {/* 1. 🔗 附件按钮 */}
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={18} />
                </Button>

                {/* 2. 🤖 模型选择 */}
                <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                       <span className={`w-2 h-2 rounded-full ${currentModelObj?.id.includes('exp') ? 'bg-indigo-500' : 'bg-blue-500'}`}></span>
                       {currentModelObj?.name}
                       <ChevronDown size={12} className={`opacity-50 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}/>
                    </button>

                    {/* 模型下拉菜单 */}
                    {isModelMenuOpen && (
                      <div className="absolute bottom-full left-0 mb-2 w-64 p-2 rounded-xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-xl z-50 animate-in fade-in zoom-in-95 duration-200">
                          <div className="space-y-1">
                              <div className="px-2 py-1 text-[10px] uppercase font-black text-slate-400 tracking-wider">选择模型</div>
                              {availableModels.map(m => (
                                  <button key={m.id} onClick={() => { setSelectedModel(m.id); setIsModelMenuOpen(false); }} className={`w-full text-left px-3 py-2 rounded-lg text-xs font-bold transition-all flex flex-col gap-0.5 ${selectedModel === m.id ? 'bg-blue-50 dark:bg-blue-900/20 text-blue-600' : 'hover:bg-slate-50 dark:hover:bg-slate-900 text-slate-700 dark:text-slate-300'}`}>
                                      <span>{m.name}</span>
                                      <span className="text-[10px] font-normal opacity-60">{m.desc}</span>
                                  </button>
                              ))}
                          </div>
                      </div>
                    )}
                </div>

                {/* 3. ✨ 帮我写 (常亮 + 弹窗) */}
                <div className="relative" ref={optimizeRef}>
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsOptimizeOpen(!isOptimizeOpen)}
                        className={`h-8 px-3 rounded-full flex items-center gap-1.5 transition-colors text-xs font-bold ${isOptimizeOpen ? 'bg-purple-100 text-purple-600' : 'text-slate-400 hover:text-purple-600 hover:bg-purple-50'}`}
                    >
                        <Sparkles size={14} />
                        <span>帮我写</span>
                    </Button>

                    {/* ✨ 优化器弹窗 */}
                    {isOptimizeOpen && (
                        <div className="absolute bottom-full left-0 mb-2 w-80 p-4 rounded-2xl bg-white dark:bg-slate-950 border border-slate-200 dark:border-slate-800 shadow-2xl z-50 animate-in fade-in zoom-in-95 duration-200 ring-1 ring-black/5">
                            <div className="flex justify-between items-center mb-3">
                                <h3 className="text-xs font-black uppercase text-purple-600 flex items-center gap-2"><Sparkles size={12}/> AI 提示词优化</h3>
                                <button onClick={()=>setIsOptimizeOpen(false)} className="text-slate-400 hover:text-slate-600"><X size={14}/></button>
                            </div>
                            
                            <div className="space-y-3">
                                <textarea 
                                    value={optimizeInput}
                                    onChange={(e)=>setOptimizeInput(e.target.value)}
                                    placeholder="输入简单的想法，例如：帮我写个请假条..."
                                    className="w-full h-20 text-xs p-3 rounded-xl bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-1 focus:ring-purple-500 resize-none"
                                />
                                <Button 
                                    onClick={handleRunOptimize} 
                                    disabled={isOptimizing || !optimizeInput.trim()}
                                    className="w-full h-8 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-lg"
                                >
                                    {isOptimizing ? <Loader2 size={12} className="animate-spin mr-1"/> : <Sparkles size={12} className="mr-1"/>}
                                    {isOptimizing ? "正在思考..." : "一键优化"}
                                </Button>

                                {/* 优化结果展示区 */}
                                {optimizedResult && (
                                    <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30">
                                        <div className="text-xs text-slate-700 dark:text-slate-300 max-h-32 overflow-y-auto whitespace-pre-wrap leading-relaxed">
                                            {optimizedResult}
                                        </div>
                                        <div className="flex gap-2 mt-2 pt-2 border-t border-purple-200/50">
                                            <Button onClick={handleUse} size="sm" className="h-6 flex-1 bg-white text-purple-600 border border-purple-200 hover:bg-purple-50 text-[10px] font-bold shadow-sm">
                                                <ArrowRight size={10} className="mr-1"/> 填入输入框
                                            </Button>
                                            <Button onClick={handleCopy} size="sm" variant="ghost" className="h-6 px-2 text-[10px] text-slate-500">
                                                {isCopied ? <Check size={10}/> : <Copy size={10}/>}
                                            </Button>
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                </div>
            </div>

            {/* 右侧：发送按钮 */}
            <Button 
                onClick={handleSend} 
                disabled={disabled || (!input.trim() && files.length === 0)}
                className={`h-9 w-9 rounded-xl transition-all ${(!input.trim() && files.length === 0) ? 'bg-slate-200 text-slate-400 dark:bg-slate-800' : 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 hover:bg-blue-700'}`}
                size="icon"
            >
                <Send size={16} />
            </Button>
        </div>
      </div>
    </div>
  )
}