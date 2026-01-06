import { useState, useRef, useEffect } from "react"
import { Send, Paperclip, X, Image as ImageIcon, FileText, ChevronDown } from "lucide-react"
import { Button } from "@/components/ui/button"

// 📦 所有的模型配置数据 (全局导出)
export const ALL_MODELS = [
  // --- 文本模型 (首页) ---
  { 
    id: "gemini-2.5-flash", 
    name: "Gemini 2.5 Flash", 
    desc: "轻量级 | 极速响应，日常助手", 
    category: "text"
  },
  { 
    id: "gemini-2.5-pro", 
    name: "Gemini 2.5 Pro", 
    desc: "均衡型 | 强力逻辑，长文分析", 
    category: "text"
  },
  { 
    id: "gemini-exp-1206", 
    name: "Gemini Thinking", 
    desc: "最强版 | 深度推理，解决难题", 
    category: "text"
  },
  // --- 视频模型 (视频页) ---
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
  // --- 图片模型 (图片页) ---
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
  
  // 过滤可用模型
  const availableModels = ALL_MODELS.filter(m => allowedCategories.includes(m.category));
  // 默认选中第一个
  const [selectedModel, setSelectedModel] = useState(availableModels[0]?.id || "gemini-2.5-flash")
  // 控制模型菜单显示
  const [isModelMenuOpen, setIsModelMenuOpen] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const menuRef = useRef<HTMLDivElement>(null)

  // 点击外部关闭菜单
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsModelMenuOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  // 当允许的分类变化时，重置选中项
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
        
        {/* ✅ 使用原生 textarea 代替 Textarea 组件，修复报错 */}
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
            <div className="flex items-center gap-1 relative" ref={menuRef}>
                {/* ✅ 使用原生 div + absolute 实现下拉菜单，修复 Popover 报错 */}
                <button 
                  onClick={() => setIsModelMenuOpen(!isModelMenuOpen)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors text-xs font-bold text-slate-600 dark:text-slate-300"
                >
                   <span className={`w-2 h-2 rounded-full ${currentModelObj?.id.includes('exp') ? 'bg-indigo-500' : 'bg-blue-500'}`}></span>
                   {currentModelObj?.name}
                   <ChevronDown size={12} className={`opacity-50 transition-transform ${isModelMenuOpen ? 'rotate-180' : ''}`}/>
                </button>

                {/* 下拉菜单内容 */}
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

                <input type="file" multiple ref={fileInputRef} className="hidden" onChange={handleFileSelect} />
                <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-blue-500 rounded-full" onClick={() => fileInputRef.current?.click()}>
                    <Paperclip size={16} />
                </Button>
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