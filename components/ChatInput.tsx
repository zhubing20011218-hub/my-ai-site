"use client";

import { useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
// ✅ 引入 Wand2 (魔法棒图标) 和 Loader2 (加载圈)
import { Send, Paperclip, X, Zap, Brain, Star, ChevronDown, FileText, Video, Image as ImageIcon, Sparkles, Briefcase, Smile, BarChart3, Wand2, Loader2 } from "lucide-react";

// ✅ [配置保留] 全平台模型配置
export const MODEL_OPTIONS = [
  { id: "gemini-2.0-flash-exp", name: "Gemini 2.0 Flash", desc: "速度快，低成本", icon: Zap, color: "text-blue-500", type: "text" },
  { id: "gemini-1.5-pro", name: "Gemini 1.5 Pro", desc: "逻辑强，长文本", icon: Star, color: "text-purple-500", type: "text" },
  { id: "gemini-2.0-flash-thinking-exp", name: "Gemini Thinking", desc: "深度思考模式", icon: Brain, color: "text-indigo-500", type: "text" },
  { id: "sora-v1", name: "OpenAI Sora", desc: "视频生成 (VIP)", icon: Video, color: "text-red-500", type: "video" },
  { id: "veo-google", name: "Google Veo", desc: "视频生成", icon: Video, color: "text-green-500", type: "video" },
  { id: "banana-sdxl", name: "Banana SDXL", desc: "极速绘图", icon: ImageIcon, color: "text-yellow-500", type: "image" },
];

// ✅ [配置保留] 角色预设 (既然你不删，我们就完整保留)
export const ROLE_OPTIONS = [
  { id: "general", name: "通用助手", icon: Sparkles, color: "text-slate-600", hint: "有问题尽管问我..." },
  { id: "tiktok_script", name: "爆款脚本", icon: Video, color: "text-pink-500", hint: "输入产品名，生成黄金前3秒脚本..." },
  { id: "sales_copy", name: "金牌销售", icon: Briefcase, color: "text-blue-600", hint: "输入卖点，生成高转化文案..." },
  { id: "customer_service", name: "客服安抚", icon: Smile, color: "text-green-600", hint: "输入买家抱怨，生成得体回复..." },
  { id: "data_analyst", name: "选品分析", icon: BarChart3, color: "text-orange-500", hint: "输入竞品数据，分析优劣势..." },
];

interface ChatInputProps {
  onSend: (message: string, attachments: File[], modelId: string, roleId: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModelId, setSelectedModelId] = useState(MODEL_OPTIONS[0].id);
  const [selectedRoleId, setSelectedRoleId] = useState(ROLE_OPTIONS[0].id); 
  
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [showRoleMenu, setShowRoleMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  // ✅ [新增] 优化加载状态
  const [isOptimizing, setIsOptimizing] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentModel = MODEL_OPTIONS.find(m => m.id === selectedModelId) || MODEL_OPTIONS[0];
  const currentRole = ROLE_OPTIONS.find(r => r.id === selectedRoleId) || ROLE_OPTIONS[0];

  const handleSend = () => {
    if ((!input.trim() && files.length === 0) || disabled) return;
    onSend(input, files, selectedModelId, selectedRoleId);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // ✅ [新增] 调用优化接口
  const handleOptimize = async () => {
    if (!input.trim()) return;
    setIsOptimizing(true);
    try {
      const res = await fetch('/api/optimize', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: input })
      });
      const data = await res.json();
      if (data.optimizedText) {
        setInput(data.optimizedText); // 直接替换输入框内容
      }
    } catch (e) {
      console.error("Optimization failed", e);
    } finally {
      setIsOptimizing(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: React.DragEvent) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault(); setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(e.dataTransfer.files)]);
    }
  };
  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = e.target.files;
    if (selectedFiles && selectedFiles.length > 0) setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };
  const handlePaste = (e: React.ClipboardEvent) => {
    const items = e.clipboardData.items;
    const pastedFiles: File[] = [];
    for (let i = 0; i < items.length; i++) {
        if (items[i].kind === 'file') {
            const file = items[i].getAsFile();
            if (file) pastedFiles.push(file);
        }
    }
    if (pastedFiles.length > 0) {
        e.preventDefault(); 
        setFiles((prev) => [...prev, ...pastedFiles]);
    }
  };
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple accept="image/*,.txt,.md,.csv,.json,.js,.py,.docx,.pdf,.xlsx,.xls" />

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-2xl flex items-center justify-center backdrop-blur-sm pointer-events-none mx-4 my-4">
          <p className="text-blue-600 font-bold text-lg animate-pulse">松开鼠标上传文件</p>
        </div>
      )}

      <div className={`relative bg-white border rounded-2xl shadow-sm transition-all duration-200 ${isDragging ? "border-blue-500" : "border-gray-200 hover:border-gray-300"} focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500`}>
        {files.length > 0 && (
          <div className="flex gap-2 p-3 pb-0 overflow-x-auto">
            {files.map((file, i) => (
              <div key={i} className="relative group flex-shrink-0 bg-gray-50 border rounded-lg p-2 w-20 h-20 flex flex-col items-center justify-center overflow-hidden">
                <button onClick={() => removeFile(i)} className="absolute top-1 right-1 bg-black/50 hover:bg-red-500 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition shadow-sm z-10"><X size={10} /></button>
                {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded" /> : <div className="flex flex-col items-center text-gray-400 w-full pt-1"><FileText size={24} className="mb-1 text-blue-400" /><span className="text-[9px] truncate w-full text-center px-1 leading-tight">{file.name}</span></div>}
              </div>
            ))}
          </div>
        )}

        <TextareaAutosize
          minRows={1} maxRows={8} 
          placeholder={currentRole.hint}
          className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400 text-gray-800"
          value={input} 
          onChange={(e) => setInput(e.target.value)} 
          onKeyDown={handleKeyDown} 
          onPaste={handlePaste} 
          disabled={disabled}
        />

        <div className="flex justify-between items-center px-2 pb-2">
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="上传文件"><Paperclip size={18} /></button>

            {/* ✅ [保留] 角色选择器 */}
            <div className="relative">
              <button onClick={() => setShowRoleMenu(!showRoleMenu)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-bold text-gray-700 hover:bg-gray-100 rounded-lg transition">
                <currentRole.icon size={14} className={currentRole.color} />
                {currentRole.name}
              </button>
              {showRoleMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowRoleMenu(false)} />
                  <div className="absolute bottom-12 left-0 z-50 w-48 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden p-1 animate-in slide-in-from-bottom-2 fade-in">
                    {ROLE_OPTIONS.map((role) => (
                      <button key={role.id} onClick={() => { setSelectedRoleId(role.id); setShowRoleMenu(false); }} className={`w-full text-left flex items-center gap-2 p-2 rounded-lg transition ${selectedRoleId === role.id ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50"}`}>
                        <role.icon size={14} className={role.color} />
                        <span className="text-xs font-bold text-gray-700">{role.name}</span>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ✅ [保留] 模型选择器 */}
            <div className="relative">
              <button onClick={() => setShowModelMenu(!showModelMenu)} className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-500 hover:bg-gray-100 rounded-lg transition">
                <currentModel.icon size={14} />
                {currentModel.name}
                <ChevronDown size={12} className="opacity-50" />
              </button>
              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute bottom-12 left-0 z-50 w-64 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden p-1 animate-in slide-in-from-bottom-2 fade-in max-h-[300px] overflow-y-auto">
                    {MODEL_OPTIONS.map((model) => (
                      <button key={model.id} onClick={() => { setSelectedModelId(model.id); setShowModelMenu(false); }} className={`w-full text-left flex items-start gap-3 p-2 rounded-lg transition ${selectedModelId === model.id ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50"}`}>
                        <div className={`mt-0.5 p-1.5 rounded-md bg-white border shadow-sm ${model.color}`}><model.icon size={16} /></div>
                        <div><div className="text-xs font-bold text-gray-800">{model.name}</div><div className="text-[10px] text-gray-500 leading-tight mt-0.5">{model.desc}</div></div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* ✅ [新增] 帮我写/指令优化按钮 (在你指定的位置) */}
            {input.trim().length > 0 && (
                <button 
                    onClick={handleOptimize} 
                    disabled={isOptimizing}
                    className="flex items-center gap-1 px-2 py-1.5 ml-1 bg-purple-50 hover:bg-purple-100 text-purple-600 rounded-lg text-xs font-bold transition-all animate-in fade-in zoom-in"
                    title="AI 自动优化指令"
                >
                    {isOptimizing ? <Loader2 size={14} className="animate-spin"/> : <Wand2 size={14} />}
                    <span>帮我写</span>
                </button>
            )}

          </div>

          <button onClick={handleSend} disabled={(!input.trim() && files.length === 0) || disabled} className={`p-2 rounded-xl transition-all duration-200 ${(!input.trim() && files.length === 0) ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-md active:scale-95"}`}><Send size={18} /></button>
        </div>
      </div>
      <div className="text-center text-[10px] text-gray-300 mt-3 font-mono">Eureka AI • Multi-Role Engine</div>
    </div>
  );
}