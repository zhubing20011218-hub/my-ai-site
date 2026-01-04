"use client";

import { useState, useRef, useEffect } from "react";
import TextareaAutosize from "react-textarea-autosize";
import { Send, Paperclip, X, Zap, Brain, Star, ChevronDown, FileText } from "lucide-react";

// 1. 定义三种模型配置 (前端展示用)
const MODELS = [
  {
    id: "fast", // 对应 gemini-2.0-flash-exp
    name: "极速版 (Fast)",
    desc: "速度最快，适合闲聊、翻译、短文案",
    icon: Zap,
    color: "text-green-500",
  },
  {
    id: "pro", // 对应 gemini-1.5-pro
    name: "专业版 (Pro)",
    desc: "能力均衡，适合写代码、分析文档",
    icon: Star,
    color: "text-blue-500",
  },
  {
    id: "thinking", // 对应 gemini-2.0-flash-thinking
    name: "深度版 (Thinking)",
    desc: "逻辑超强，适合数学、复杂推理",
    icon: Brain,
    color: "text-purple-500",
  },
];

interface ChatInputProps {
  onSend: (message: string, attachments: File[], modelId: string) => void;
  disabled?: boolean;
}

export default function ChatInput({ onSend, disabled }: ChatInputProps) {
  const [input, setInput] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [selectedModelId, setSelectedModelId] = useState("fast");
  const [showModelMenu, setShowModelMenu] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  
  // 获取当前选中的模型对象
  const currentModel = MODELS.find(m => m.id === selectedModelId) || MODELS[0];

  // 发送处理
  const handleSend = () => {
    if (!input.trim() && files.length === 0) return;
    onSend(input, files, selectedModelId);
    setInput("");
    setFiles([]);
  };

  // 键盘回车发送 (Shift+Enter 换行)
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // --- 📂 拖拽文件核心逻辑 ---
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      const newFiles = Array.from(e.dataTransfer.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // --- 📋 粘贴图片/文件逻辑 ---
  const handlePaste = (e: React.ClipboardEvent) => {
    if (e.clipboardData.files.length > 0) {
      e.preventDefault();
      const newFiles = Array.from(e.clipboardData.files);
      setFiles((prev) => [...prev, ...newFiles]);
    }
  };

  // 移除文件
  const removeFile = (index: number) => {
    setFiles(files.filter((_, i) => i !== index));
  };

  return (
    <div className="w-full max-w-4xl mx-auto p-4 relative">
      {/* 拖拽时的蒙版提示 */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-blue-500/10 border-2 border-blue-500 border-dashed rounded-2xl flex items-center justify-center backdrop-blur-sm pointer-events-none">
          <p className="text-blue-600 font-bold text-lg">松开鼠标上传文件</p>
        </div>
      )}

      <div 
        className={`relative bg-white border rounded-2xl shadow-sm transition-all duration-200 ${
          isDragging ? "border-blue-500" : "border-gray-200 focus-within:border-blue-400 focus-within:shadow-md"
        }`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {/* 1. 文件预览区域 (如果有文件) */}
        {files.length > 0 && (
          <div className="flex gap-2 p-3 pb-0 overflow-x-auto">
            {files.map((file, i) => (
              <div key={i} className="relative group flex-shrink-0 bg-gray-50 border rounded-lg p-2 w-24 h-24 flex flex-col items-center justify-center">
                <button 
                  onClick={() => removeFile(i)}
                  className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition shadow-sm"
                >
                  <X size={12} />
                </button>
                {file.type.startsWith("image/") ? (
                  <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover rounded" />
                ) : (
                  <div className="flex flex-col items-center text-gray-500 text-xs">
                    <FileText size={24} className="mb-1" />
                    <span className="truncate w-20 text-center">{file.name}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* 2. 自动长高输入框 */}
        <TextareaAutosize
          minRows={1}
          maxRows={8} // 最多显示8行，再多出滚动条
          placeholder="有问题尽管问我... (支持拖拽上传)"
          className="w-full resize-none border-none bg-transparent px-4 py-3 focus:ring-0 text-gray-800 placeholder:text-gray-400"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          onPaste={handlePaste}
          disabled={disabled}
        />

        {/* 3. 底部工具栏：模型选择 + 发送按钮 */}
        <div className="flex justify-between items-center px-2 pb-2">
          <div className="flex items-center gap-2">
            {/* 上传按钮 (备用) */}
            <button className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-full transition">
              <Paperclip size={20} />
            </button>

            {/* 🔥 核心：模型选择下拉菜单 🔥 */}
            <div className="relative">
              <button
                onClick={() => setShowModelMenu(!showModelMenu)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-600 bg-gray-100 hover:bg-gray-200 rounded-lg transition"
              >
                <currentModel.icon size={14} className={currentModel.color} />
                {currentModel.name}
                <ChevronDown size={12} className="opacity-50" />
              </button>

              {/* 弹出的菜单 */}
              {showModelMenu && (
                <>
                  {/* 点击外部关闭 */}
                  <div className="fixed inset-0 z-10" onClick={() => setShowModelMenu(false)} />
                  
                  <div className="absolute bottom-10 left-0 z-20 w-64 bg-white border border-gray-200 shadow-xl rounded-xl overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                    <div className="p-1 bg-gray-50/50">
                      {MODELS.map((model) => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedModelId(model.id);
                            setShowModelMenu(false);
                          }}
                          className={`w-full text-left flex items-start gap-3 p-2.5 rounded-lg transition ${
                            selectedModelId === model.id ? "bg-white shadow-sm ring-1 ring-gray-200" : "hover:bg-gray-100"
                          }`}
                        >
                          <div className={`mt-0.5 p-1.5 rounded-md bg-gray-50 ${model.color}`}>
                            <model.icon size={16} />
                          </div>
                          <div>
                            <div className="text-sm font-semibold text-gray-800">{model.name}</div>
                            <div className="text-xs text-gray-500 mt-0.5">{model.desc}</div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* 发送按钮 */}
          <button
            onClick={handleSend}
            disabled={(!input.trim() && files.length === 0) || disabled}
            className="p-2 bg-black text-white rounded-lg hover:bg-gray-800 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
      
      <div className="text-center text-xs text-gray-300 mt-2">
        Eureka AI • Powered by Gemini Engine
      </div>
    </div>
  );
}