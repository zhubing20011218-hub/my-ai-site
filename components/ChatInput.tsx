import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, X, Image as ImageIcon, FileText, ChevronDown, Sparkles, Loader2, Copy, ArrowRight, Wand2 } from "lucide-react"
import { Button } from "@/components/ui/button"

// 📦 模型配置
export const ALL_MODELS = [
  // --- 文本模型 ---
  { 
    id: "gemini-2.5-pro", // 推荐默认：稳定且强
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
  { 
    id: "gemini-exp-1206", 
    name: "Gemini Thinking", 
    desc: "最强版 | 深度推理，解决难题", 
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
  const defaultModelID = availableModels.find(m => m.id === "gemini-2.5-pro") ? "gemini-2.5-pro" : (availableModels[0]?.id || "");
  const [selectedModel, setSelectedModel] = useState(defaultModelID);
  
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  
  // 帮我写状态
  const [isOptimizeModalOpen, setIsOptimizeModalOpen] = useState(false)
  const [optimizeInput, setOptimizeInput] = useState("")
  const [optimizedResult, setOptimizedResult] = useState("")
  const [isOptimizing, setIsOptimizing] = useState(false)
  const [isCopied, setIsCopied] = useState(false)

  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)
  const optimizeRef = useRef<HTMLDivElement>(null)
  // 引用 textarea 以便自动调整高度（可选优化）
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
      if (optimizeRef.current && !optimizeRef.current.contains(event.target as Node)) {
        setIsOptimizeModalOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  useEffect(() => {
    const currentExists = availableModels.find(m => m.id === selectedModel);
    if (!currentExists) {
        setSelectedModel(availableModels[0]?.id || "");
    }
  }, [allowedCategories]);

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

  const handleRunOptimize = async () => {
    if (!optimizeInput.trim()) return;
    setIsOptimizing(true);
    setOptimizedResult(""); 
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
        setOptimizedResult("网络请求错误，请检查网络连接。");
    } finally {
        setIsOptimizing(false);
    }
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(optimizedResult);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  }

  const handlePush = () => {
    setInput(optimizedResult); 
    setIsOptimizeModalOpen(false); 
    setOptimizeInput("");
    setOptimizedResult("");
  }

  const currentModelObj = ALL_MODELS.find(m => m.id === selectedModel) || availableModels[0];

  return (
    <div className="relative">
      {/* 帮我写弹窗 */}
      {isOptimizeModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white dark:bg-slate-900 w-full max-w-lg rounded-3xl shadow-2xl border border-slate-200 dark:border-slate-800 p-6 m-4 scale-100 animate-in zoom-in-95 duration-200">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-black flex items-center gap-2 bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
                        <Wand2 size={20} className="text-purple-600"/> 
                        AI 提示词优化专家
                    </h3>
                    <button onClick={() => setIsOptimizeModalOpen(false)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-full transition-colors">
                        <X size={20} className="text-slate-400"/>
                    </button>
                </div>

                <div className="space-y-4">
                    <div>
                        <label className="text-xs font-bold text-slate-500 mb-1.5 block">您的想法 (简单描述)</label>
                        <textarea 
                            value={optimizeInput}
                            onChange={(e) => setOptimizeInput(e.target.value)}
                            placeholder="例如：帮我写个请假条..."
                            className="w-full h-24 p-4 rounded-xl bg-slate-50 dark:bg-slate-950 border border-slate-200 dark:border-slate-800 focus:outline-none focus:ring-2 focus:ring-purple-500/50 resize-none text-sm"
                        />
                    </div>

                    <Button 
                        onClick={handleRunOptimize} 
                        disabled={isOptimizing || !optimizeInput.trim()}
                        className="w-full h-10 bg-gradient-to-r from-purple-600 to-blue-600 hover:opacity-90 text-white font-bold rounded-xl transition-all active:scale-95"
                    >
                        {isOptimizing ? <Loader2 className="animate-spin mr-2"/> : <Sparkles className="mr-2"/>}
                        {isOptimizing ? "AI 正在思考重写..." : "开始优化"}
                    </Button>

                    {optimizedResult && (
                        <div className="mt-4 pt-4 border-t border-slate-100 dark:border-slate-800 animate-in slide-in-from-top-2">
                            <label className="text-xs font-bold text-slate-500 mb-1.5 block">优化结果</label>
                            <div className="p-4 bg-purple-50 dark:bg-purple-900/10 rounded-xl border border-purple-100 dark:border-purple-800/30 text-sm text-slate-700 dark:text-slate-300 max-h-40 overflow-y-auto leading-relaxed whitespace-pre-wrap">
                                {optimizedResult}
                            </div>
                            <div className="flex gap-3 mt-3">
                                <Button onClick={handleCopy} variant="outline" className="flex-1 border-purple-200 dark:border-purple-800 text-purple-700 dark:text-purple-300 hover:bg-purple-50 dark:hover:bg-purple-900/20">
                                    {isCopied ? "已复制" : <><Copy size={14} className="mr-2"/> 复制内容</>}
                                </Button>
                                <Button onClick={handlePush} className="flex-1 bg-purple-600 hover:bg-purple-700 text-white shadow-lg shadow-purple-500/20 border-none">
                                    <ArrowRight size={14} className="mr-2"/> 一键推送
                                </Button>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
      )}

      {/* 文件预览区 */}
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

      {/* ⚠️ 核心修复：输入框样式 */}
      <div className={`relative bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-[24px] shadow-sm transition-all focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500 ${disabled ? 'opacity-60 cursor-not-allowed' : ''}`}>
        
        {/* 移除 flex，设置 w-full block，确保有高度 */}
        <textarea
          ref={textareaRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="输入消息..."
          disabled={disabled}
          rows={1}
          className="block w-full min-h-[52px] max-h-[200px] rounded-t-[24px] bg-transparent px-4 py-4 pr-4 text-sm placeholder:text-slate-400 focus:outline-none dark:text-slate-200 resize-none"
        />

        {/* 底部工具栏 */}
        <div className="flex justify-between items-center px-3 pb-3 pt-1">
            
            {/* 左侧功能区：🔗 -> 🤖 -> ✨ */}
            <div className="flex items-center gap-2 relative">
                
                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={18} />
                </Button>

                <div className="relative" ref={menuRef}>
                    <button 
                      onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                      className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
                    >
                       <span className={`w-2 h-2 rounded-full ${currentModelObj?.id.includes('exp') ? 'bg-indigo-500' : 'bg-blue-500'}`}></span>
                       {currentModelObj?.name}
                       <ChevronDown size={12} className={`opacity-50 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}/>
                    </button>

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

                <div className="relative" ref={optimizeRef}>
                    <Button 
                        variant="ghost" 
                        onClick={() => setIsOptimizeModalOpen(true)}
                        className="h-8 px-3 rounded-full flex items-center gap-1.5 transition-colors text-xs font-bold text-slate-500 hover:text-purple-600 hover:bg-purple-50 dark:text-slate-400 dark:hover:bg-purple-900/20"
                    >
                        <Sparkles size={14} className="text-purple-500"/>
                        <span>帮我写</span>
                    </Button>
                </div>
            </div>

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