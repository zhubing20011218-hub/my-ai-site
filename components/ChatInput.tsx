"use client";

import { useState, useRef } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Send, Paperclip, X, Zap, Brain, Star, ChevronDown, FileText, Video, Image as ImageIcon, Box } from "lucide-react";

// ✨✨✨ 1. 定义全平台模型配置 (新增了 Sora, Veo, Banana) ✨✨✨
export const MODEL_OPTIONS = [
  // --- 文本/多模态组 ---
  {
    id: "gemini-2.0-flash-exp", 
    name: "Gemini 2.0 Flash",
    desc: "全能选手，速度快，免费/低成本",
    icon: Zap,
    color: "text-blue-500",
    type: "text"
  },
  {
    id: "gemini-1.5-pro", 
    name: "Gemini 1.5 Pro",
    desc: "长文档分析，逻辑更强",
    icon: Star,
    color: "text-purple-500",
    type: "text"
  },
  {
    id: "gemini-2.0-flash-thinking-exp", 
    name: "Gemini Thinking",
    desc: "深度思考模式 (Beta)",
    icon: Brain,
    color: "text-indigo-500",
    type: "text"
  },
  // --- 视频/图像生成组 (高价值工具) ---
  {
    id: "sora-v1", 
    name: "OpenAI Sora",
    desc: "好莱坞级视频生成 (VIP专享)",
    icon: Video,
    color: "text-red-500",
    type: "video" 
  },
  {
    id: "veo-google", 
    name: "Google Veo",
    desc: "高清 1080p 视频生成",
    icon: Video,
    color: "text-green-500",
    type: "video"
  },
  {
    id: "banana-sdxl", 
    name: "Banana SDXL",
    desc: "极速绘图 (基于 Banana GPU)",
    icon: ImageIcon,
    color: "text-yellow-500",
    type: "image"
  },
];

interface ChatInputProps {
  onSend: (message: string, attachments: File[], modelId: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  // 默认选中第一个
  const [selectedModelId, setSelectedModelId] = useState(MODEL_OPTIONS[0].id);
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  const fileInputRef = useRef<HTMLInputElement>(null);
  const currentModel = MODEL_OPTIONS.find(m => m.id === selectedModelId) || MODEL_OPTIONS[0];

  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input, files, selectedModelId);
    setInput("");
    setFiles([]);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- 📂 拖拽逻辑 ---
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
    if (selectedFiles && selectedFiles.length > 0) {
      setFiles((prev) => [...prev, ...Array.from(selectedFiles)]);
    }
    if (fileInputRef.current) fileInputRef.current.value = ""; 
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      setFiles((prev) => [...prev, ...Array.from(e.clipboardData.files)]);
    }
  };

  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-4 relative">
      <input type="file" ref={fileInputRef} onChange={handleFileSelect} className="hidden" multiple />

      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-2xl flex items-center justify-center backdrop-blur-sm pointer-events-none mx-4 my-4">
          <p className="text-blue-600 font-bold text-lg">松开鼠标上传文件</p>
        </div>
      )}

      <div 
        className={`relative bg-white border rounded-2xl shadow-sm transition-all duration-200
          ${isDragging ? "border-blue-500" : "border-gray-200 hover:border-gray-300"}
          focus-within:ring-2 focus-within:ring-blue-500/20 focus-within:border-blue-500
        `}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {files.length > 0 && (
          <div className="flex gap-2 p-3 pb-0 overflow-x-auto">
            {files.map((file, i) => (
              <div key={i} className="relative group flex-shrink-0 bg-gray-50 border rounded-lg p-2 w-20 h-20 flex flex-col items-center justify-center">
                <button onClick={() => removeFile(i)} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm z-10"><X size={10} /></button>
                {file.type.startsWith("image/") ? <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded" /> : <div className="flex flex-col items-center text-gray-400"><FileText size={24} className="mb-1" /><span className="text-[10px] truncate w-16 text-center">{file.name}</span></div>}
              </div>
            ))}
          </div>
        )}

        <TextareaAutosize
          minRows={1} maxRows={8} 
          // ✨ 动态提示词：根据选择的工具变化
          placeholder={currentModel.type === 'video' ? `描述画面细节，${currentModel.name} 将为您生成视频...` : `有问题尽管问我... (${currentModel.name})`}
          className="w-full resize-none border-none bg-transparent px-4 py-3 text-sm focus:ring-0 focus:outline-none placeholder:text-gray-400 text-gray-800"
          value={input} onChange={(e) => setInput(e.target.value)} onKeyDown={handleKeyDown} onPaste={handlePaste} disabled={disabled}
        />

        <div className="flex justify-between items-center px-2 pb-2">
          <div className="flex items-center gap-1">
            <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition" title="上传文件"><Paperclip size={18} /></button>

            {/* 模型选择器 */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 px-2 py-1.5 text-xs font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition"
              >
                <currentModel.icon size={14} className={currentModel.color} />
                {currentModel.name}
                <ChevronDown size={12} className="opacity-50" />
              </button>

              {/* 下拉菜单 */}
              {showModelMenu && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setShowModelMenu(false)} />
                  <div className="absolute bottom-12 left-0 z-50 w-64 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden p-1 animate-in slide-in-from-bottom-2 fade-in max-h-[300px] overflow-y-auto">
                    {MODEL_OPTIONS.map((model) => (
                      <button
                        key={model.id}
                        onClick={() => { setSelectedModelId(model.id); setShowModelMenu(false); }}
                        className={`w-full text-left flex items-start gap-3 p-2 rounded-lg transition ${selectedModelId === model.id ? "bg-gray-50 ring-1 ring-gray-200" : "hover:bg-gray-50"}`}
                      >
                        <div className={`mt-0.5 p-1.5 rounded-md bg-white border shadow-sm ${model.color}`}><model.icon size={16} /></div>
                        <div><div className="text-xs font-bold text-gray-800">{model.name}</div><div className="text-[10px] text-gray-500 leading-tight mt-0.5">{model.desc}</div></div>
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>

          <button onClick={handleSend} disabled={(!input.trim() && files.length === 0) || disabled} className={`p-2 rounded-xl transition-all duration-200 ${(!input.trim() && files.length === 0) ? "bg-gray-100 text-gray-300 cursor-not-allowed" : "bg-black text-white hover:bg-gray-800 shadow-md active:scale-95"}`}><Send size={18} /></button>
        </div>
      </div>
      
      <div className="text-center text-[10px] text-gray-300 mt-3 font-mono">Eureka AI • Powered by Gemini, Sora & Veo</div>
    </div>
  );
}