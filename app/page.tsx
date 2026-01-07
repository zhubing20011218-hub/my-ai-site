"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ChatInput, { ALL_MODELS } from "@/components/ChatInput" 
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  History, Shield, Terminal, Check, Copy, User, Loader2, Send, 
  X, LogOut, Sparkles, PartyPopper, ArrowRight, ArrowLeft, Lock, Mail, Eye, EyeOff, AlertCircle,
  Moon, Sun, FileText, CreditCard, Plus, MessageCircle, RefreshCw, Server, Trash2,
  FileSpreadsheet, Download, Maximize2, Lock as LockIcon, FileType, ThumbsUp, ThumbsDown,
  Wallet, PieChart, Video, Image as ImageIcon, Clock, Home as HomeIcon, LayoutGrid, Phone, ExternalLink,
  Settings2, Upload, Monitor, Smartphone, Square, Film, Type, ImagePlus, Clapperboard, Sparkle,
  Headphones, Ticket, CreditCard as CardIcon
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';
const { saveAs } = require('file-saver');
import { Document, Packer, Paragraph, TextRun } from "docx";

// --- 类型定义 ---
type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }
type TabType = 'home' | 'video' | 'image' | 'promo' | 'custom' | 'contact';

// --- 价格配置 ---
const MODEL_PRICING: Record<string, number> = {
  "gemini-2.5-flash": 0.01,
  "gemini-2.5-pro": 0.05,
  "gemini-exp-1206": 0.10,
  "sora-v1": 2.50, // Minimax 高品质视频
  "veo-google": 1.80,
  "banana-sdxl": 0.20,
};

const Toast = ({ message, type, show }: { message: string, type: 'loading' | 'success' | 'error', show: boolean }) => {
  if (!show) return null;
  let Icon = Check;
  let textColor = "text-green-400";
  if (type === 'loading') { Icon = Loader2; textColor = "text-blue-400"; }
  if (type === 'error') { Icon = X; textColor = "text-red-400"; }
  return (
    <div className="fixed bottom-6 left-6 z-[100] animate-in slide-in-from-bottom-5 fade-in duration-300">
      <div className="bg-slate-900 text-white px-4 py-3 rounded-xl shadow-2xl flex items-center gap-3 border border-slate-700">
        <Icon size={18} className={type === 'loading' ? "animate-spin " + textColor : textColor} />
        <span className="text-xs font-bold">{message}</span>
      </div>
    </div>
  );
};

// --- Thinking 组件 ---
function Thinking({ modelName }: { modelName: string }) {
    const [major, setMajor] = useState(0);
    const [minor, setMinor] = useState(-1);
    const plan = [
        { title: "一、 需求语义深度解析", steps: ["提取关键词核心意图", "检索历史上下文关联"] },
        { title: "二、 知识库实时广度检索", steps: ["跨域检索分布式知识节点", "验证数据准确性"] },
        { title: "三、 响应架构多重建模", steps: ["逻辑推理路径模拟", "优化语言表达风格"] },
        { title: "四、 生成结果合规性自检", steps: ["安全性策略实时匹配", "逻辑闭环终审校验"] }
    ];
    useEffect(() => {
      let m1 = 0; let m2 = -1;
      const interval = setInterval(() => {
        if (m1 < plan.length) {
          if (m2 < plan[m1].steps.length - 1) { m2++; setMinor(m2); }
          else { m1++; if (m1 < plan.length) { m2 = -1; setMajor(m1); setMinor(-1); } }
        } else { clearInterval(interval); }
      }, 700);
      return () => clearInterval(interval);
    }, []);
    return (
      <div className="flex gap-4 my-8">
        <div className="w-9 h-9 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 text-white text-xs">🧊</div>
        <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 shadow-sm w-full max-w-md">
          <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3 mb-4"><Terminal size={10}/> <span>Eureka 使用 {modelName} 处理引擎</span></div>
          <div className="space-y-4">{plan.map((item, i) => (<div key={i} className={`transition-all duration-500 ${i > major ? 'opacity-20' : 'opacity-100'}`}><div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${i < major ? 'bg-green-500 border-green-500 text-white' : i === major ? 'border-blue-500 text-blue-600 animate-pulse' : 'text-slate-300'}`}>{i < major ? <Check size={10} /> : i + 1}</div><span className={`text-[12px] font-black ${i === major ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>{item.title}</span></div><div className="ml-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4">{item.steps.map((step, j) => (<div key={j} className={`flex items-center gap-2 text-[10px] transition-all duration-300 ${(i < major || (i === major && j <= minor)) ? 'opacity-100' : 'opacity-0'}`}><div className="w-1 h-1 rounded-full bg-slate-300" /><span className="text-slate-400 font-medium">{j + 1}. {step}</span></div>))}</div></div>))}</div>
        </div>
      </div>
    );
  }

// --- AuthPage 组件 ---
function AuthPage({ onLogin }: { onLogin: (u: any) => void }) {
    const [authMode, setAuthMode] = useState<'login' | 'register' | 'forgot'>('login'); 
    const [account, setAccount] = useState("");
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState(""); 
    const [nickname, setNickname] = useState("");
    const [verifyCode, setVerifyCode] = useState("");
    const [count, setCount] = useState(0);
    const [loading, setLoading] = useState(false);
    const [codeLoading, setCodeLoading] = useState(false);
    const [showPwd, setShowPwd] = useState(false);
    const [showConfirmPwd, setShowConfirmPwd] = useState(false);
    const [agreed, setAgreed] = useState(false);
    const [error, setError] = useState("");

    const validateAccount = (val: string) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const phoneRegex = /^1[3-9]\d{9}$/; 
      return emailRegex.test(val) || phoneRegex.test(val) || val === 'admin';
    };

    const sendCode = async () => {
      if (!validateAccount(account)) { setError("请输入有效的账号"); return; }
      setError(""); setCodeLoading(true);
      try {
        const res = await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: account }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "发送失败");
        setCount(60);
        const timer = setInterval(() => setCount(v => { if(v<=1){clearInterval(timer); return 0} return v-1 }), 1000);
      } catch (e: any) { setError(e.message); } finally { setCodeLoading(false); }
    };

    const handleAuth = async (e: any) => {
      e.preventDefault(); setError("");
      if (!account || !password) { setError("请填写完整信息"); return; }
      setLoading(true);
      let type = authMode === 'register' ? 'register' : (authMode === 'forgot' ? 'reset-password' : 'login');
      try {
        const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, account, password, nickname, verifyCode }) });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || "认证失败");
        if (authMode === 'forgot') { alert("重置成功"); setAuthMode('login'); }
        else { localStorage.setItem("my_ai_user", JSON.stringify(data)); onLogin(data); }
      } catch (err: any) { setError(err.message); } finally { setLoading(false); }
    };

    return (
      <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
        <div className="flex items-center gap-3 mb-8"><div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl text-white font-bold">🧊</div><h1 className="text-5xl font-black tracking-tighter text-slate-900">Eureka</h1></div>
        <Card className="w-full max-w-sm p-8 shadow-2xl border-none bg-white rounded-[32px]">
          <form onSubmit={handleAuth} className="space-y-4">
            <h2 className="text-2xl font-black text-slate-900">{authMode === 'login' ? '欢迎回来' : (authMode === 'register' ? '创建账户' : '找回密码')}</h2>
            {authMode === 'register' && <Input placeholder="设置昵称" value={nickname} onChange={e=>setNickname(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none"/>}
            <Input placeholder="邮箱/手机号" value={account} onChange={e=>setAccount(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none"/>
            {authMode !== 'login' && <div className="flex gap-2"><Input placeholder="验证码" value={verifyCode} onChange={e=>setVerifyCode(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none"/><Button type="button" variant="outline" onClick={sendCode} disabled={count>0} className="h-12 rounded-xl">{count>0?`${count}s`:'获取'}</Button></div>}
            <Input type="password" placeholder="密码" value={password} onChange={e=>setPassword(e.target.value)} className="rounded-xl h-12 bg-slate-50 border-none"/>
            {error && <p className="text-xs text-red-500 font-bold">{error}</p>}
            <Button className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white rounded-xl font-bold transition-all shadow-xl" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : '立即提交'}</Button>
            <button type="button" onClick={()=>setAuthMode(authMode==='login'?'register':'login')} className="text-xs text-slate-400 w-full text-center hover:underline mt-2">切换登录/注册</button>
          </form>
        </Card>
      </div>
    );
  }

// --- ✨ MediaGenerator (Minimax Video-01 重构版) ---
function MediaGenerator({ type, onConsume, showToast }: { type: 'video' | 'image', onConsume: (amount: number, desc: string) => Promise<boolean>, showToast: any }) {
  const [prompt, setPrompt] = useState("");
  const [optPrompt, setOptPrompt] = useState(true); 
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [refImage, setRefImage] = useState<string | null>(null);

  // 强力压缩：512px, 0.6质量 (防止 413)
  const compressImage = (file: File): Promise<string> => {
      return new Promise((resolve) => {
          const reader = new FileReader();
          reader.readAsDataURL(file);
          reader.onload = (event) => {
              const img = new Image();
              img.src = event.target?.result as string;
              img.onload = () => {
                  const canvas = document.createElement('canvas');
                  const MAX_WIDTH = 512; 
                  let width = img.width; let height = img.height;
                  if (width > height) { if (width > MAX_WIDTH) { height *= MAX_WIDTH / width; width = MAX_WIDTH; } }
                  else { if (height > 512) { width *= 512 / height; height = 512; } }
                  canvas.width = width; canvas.height = height;
                  const ctx = canvas.getContext('2d');
                  if (ctx) { ctx.drawImage(img, 0, 0, width, height); resolve(canvas.toDataURL('image/jpeg', 0.6)); }
              };
          };
      });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          showToast('loading', '正在压缩优化图片...');
          try {
              const compressedDataUrl = await compressImage(file);
              setRefImage(compressedDataUrl);
              showToast('success', '参考图就绪');
          } catch (e) { showToast('error', '图片处理失败'); }
      }
  };

  const handleGenerate = async () => {
    if (!prompt.trim()) { alert("请输入提示词"); return; }
    const cost = type === 'video' ? 2.5 : 0.2;
    const success = await onConsume(cost, type === 'video' ? "生成 Sora 级高清视频" : "AI 绘画");
    if (!success) return;

    setIsGenerating(true); setResult(null);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          model: type === 'video' ? 'sora-v1' : 'banana-sdxl', 
          prompt: prompt,
          prompt_optimizer: optPrompt,
          first_frame_image: refImage 
        }),
      });

      const data = await response.json();
      if (data.type === 'async_job') {
          const jobId = data.id; let jobStatus = data.status; let finalOutput = null;
          while (jobStatus !== 'succeeded' && jobStatus !== 'failed') {
              await new Promise(r => setTimeout(r, 4000));
              const statusRes = await fetch(`/api/chat?id=${jobId}`);
              const statusData = await statusRes.json();
              jobStatus = statusData.status;
              if (jobStatus === 'succeeded') finalOutput = statusData.output;
              if (jobStatus === 'failed') throw new Error("AI生成失败");
          }
          setResult(Array.isArray(finalOutput) ? finalOutput[0] : finalOutput);
          showToast('success', '制作完成');
      } else if (data.url) { setResult(data.url); showToast('success', '生成成功'); }
      else { throw new Error(data.error || "请求失败"); }
    } catch (e: any) { alert(`错误：${e.message}`); } finally { setIsGenerating(false); }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-6 max-w-7xl mx-auto">
       <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
          <div>
            <h2 className="text-2xl font-black flex items-center gap-2"><Clapperboard className="text-blue-500"/> AI {type === 'video' ? 'Video' : 'Art'}</h2>
            <p className="text-xs text-slate-400 font-mono tracking-tighter uppercase">Minimax-01 Sora-Grade Model</p>
          </div>
          <div className="space-y-6">
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><Type size={12}/> 提示词 (PROMPT)</label>
                <textarea value={prompt} onChange={(e)=>setPrompt(e.target.value)} placeholder="描述你想看到的画面..." className="flex min-h-[150px] w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-xs shadow-sm focus:ring-2 focus:ring-blue-500 resize-none" />
             </div>
             {type === 'video' && (
                 <div className="flex items-center justify-between p-3 bg-slate-50 dark:bg-slate-900 rounded-xl">
                    <div className="flex items-center gap-2"><Sparkle size={14} className="text-yellow-500"/><span className="text-[10px] font-bold">提示词优化</span></div>
                    <button onClick={()=>setOptPrompt(!optPrompt)} className={`w-10 h-5 rounded-full transition-all relative ${optPrompt?'bg-blue-600':'bg-slate-300'}`}><div className={`absolute top-1 w-3 h-3 bg-white rounded-full transition-all ${optPrompt?'left-6':'left-1'}`}/></button>
                 </div>
             )}
             <div className="space-y-2">
                <label className="text-[10px] font-black uppercase text-slate-400 flex items-center gap-1"><ImagePlus size={12}/> 参考图 (可选)</label>
                <div className="relative h-32 border-2 border-dashed rounded-xl overflow-hidden hover:border-blue-400 transition-colors flex items-center justify-center">
                    <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 opacity-0 z-10 cursor-pointer"/>
                    {refImage ? <img src={refImage} className="w-full h-full object-cover" /> : <div className="text-center text-slate-400 text-[10px]">点击上传参考图<br/>(自动压缩优化)</div>}
                </div>
             </div>
             <Button onClick={handleGenerate} disabled={isGenerating || !prompt.trim()} className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl shadow-xl transition-all">
                {isGenerating?<Loader2 className="animate-spin mr-2"/>:<Send size={16} className="mr-2"/>}{isGenerating?"制作中 (约3分钟)...":"立即生成"}
             </Button>
          </div>
       </div>
       <div className="flex-1 bg-slate-950 rounded-[32px] border border-slate-800 overflow-hidden relative flex flex-col shadow-2xl">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center text-[10px] font-black text-slate-400 uppercase tracking-widest">Output Preview</div>
          <div className="flex-1 flex items-center justify-center p-4">
             {result ? (
                 result.endsWith('.mp4') ? <video src={result} controls autoPlay loop className="max-w-full max-h-full rounded-xl shadow-2xl" /> : <img src={result} className="max-w-full max-h-full rounded-xl object-contain shadow-2xl" />
             ) : isGenerating ? (
                 <div className="text-center animate-pulse"><Loader2 size={40} className="text-blue-500 mx-auto mb-4 animate-spin"/><p className="text-xs text-blue-400 font-black uppercase tracking-widest">AI Processing...</p></div>
             ) : (
                 <div className="text-center opacity-20"><Clapperboard size={60} className="mx-auto mb-2"/><p className="text-xs font-bold tracking-widest uppercase">Ready to Action</p></div>
             )}
          </div>
          {result && <Button onClick={()=>window.open(result,'_blank')} className="absolute bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white gap-2 font-bold px-4 h-10 rounded-full shadow-2xl transition-all"><Download size={14}/> 下载文件</Button>}
       </div>
    </div>
  );
}

// --- Home 组件 (完整逻辑恢复) ---
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatList, setChatList] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gemini-2.5-flash");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [previewTableData, setPreviewTableData] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocData, setPreviewDocData] = useState<string | null>(null);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [toastState, setToastState] = useState({ show: false, type: 'loading' as any, msg: '' });

  // Admin & Support Logic
  const [adminUsers, setAdminUsers] = useState<any[]>([]);
  const [adminUserTx, setAdminUserTx] = useState<any[]>([]);
  const [isAdminCardsOpen, setIsAdminCardsOpen] = useState(false); 
  const [cards, setCards] = useState<any[]>([]);
  const [cardConfig, setCardConfig] = useState({amount: 10, count: 1, days: 0});
  const [isSupportOpen, setIsSupportOpen] = useState(false);
  const [supportMessages, setSupportMessages] = useState<any[]>([]);
  const [supportInput, setSupportInput] = useState("");
  const [isAdminSupportOpen, setIsAdminSupportOpen] = useState(false);
  const [supportSessions, setSupportSessions] = useState<any[]>([]);
  const [activeSessionUser, setActiveSessionUser] = useState<string|null>(null);
  const supportScrollRef = useRef<HTMLDivElement>(null);

  const currentModelName = ALL_MODELS.find(m => m.id === model)?.name || model;

  const parseMessageContent = (content: any) => {
    let rawText = typeof content === 'string' ? content : content.text;
    if (!rawText) return { cleanText: '', suggestions: [] };
    const parts = rawText.split('___RELATED___');
    const cleanText = parts[0]; 
    let suggestions: string[] = [];
    if (parts[1]) suggestions = parts[1].split('|').map((q: string) => q.trim()).filter((q: string) => q.length > 0);
    return { cleanText, suggestions };
  };

  useEffect(() => { 
    const u = localStorage.getItem("my_ai_user"); 
    if(u) { const p = JSON.parse(u); setUser(p); syncUserData(p.id, p.role); fetchChatList(p.id); }
    if (typeof window !== 'undefined' && window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const showToast = (type: any, msg: string) => { setToastState({ show: true, type, msg }); setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 3000); };
  
  const syncUserData = async (uid: string, role: string) => { 
    try { 
        const res = await fetch(`/api/sync?id=${uid}&role=${role}`); 
        const data = await res.json(); 
        if (data.balance) { setUser((prev:any) => ({ ...prev, balance: data.balance })); setTransactions(data.transactions || []); }
        if (role === 'admin' && data.users) setAdminUsers(data.users);
    } catch (e) {} 
  };

  const fetchChatList = async (uid: string) => { try { const res = await fetch(`/api/history?userId=${uid}`); const data = await res.json(); setChatList(data.chats || []); } catch(e) {} };
  
  const handleTX = async (type: 'topup' | 'consume', amount: number, desc: string) => {
      if(!user) return false; if (user.role === 'admin') return true;
      if(type === 'consume' && parseFloat(user.balance) < amount) { alert(`余额不足，需要 $${amount}`); return false; }
      const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type, amount, description: desc }) });
      const data = await res.json();
      if(res.ok) { setUser((p:any)=>({...p, balance: data.balance})); syncUserData(user.id, user.role); return true; }
      return false;
  };

  const loadChat = async (id: string) => { 
    if (isLoading) return; setCurrentChatId(id);
    const res = await fetch(`/api/history?chatId=${id}`, { method: 'PUT' });
    const data = await res.json(); setMessages(data.chat?.messages || []);
    if(window.innerWidth < 768) setIsSidebarOpen(false); setActiveTab('home');
  };

  const handleChatSubmit = async (text: string, attachments: File[] = [], modelId: string = "gemini-2.5-flash") => {
    const cost = MODEL_PRICING[modelId] || 0.01;
    if (!await handleTX('consume', cost, `对话: ${text.slice(0,10)}`)) return;
    setIsLoading(true); setModel(modelId);
    const newMsg = { role: 'user', content: { text } }; const newHistory = [...messages, newMsg];
    setMessages(newHistory);
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ messages: newHistory.slice(-10), model: modelId }) });
      const reader = response.body?.getReader(); const decoder = new TextDecoder();
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
      let fullText = "";
      while (true) { 
          const { done, value } = await reader?.read()!; if (done) break; 
          const chunk = decoder.decode(value); fullText += chunk;
          setMessages(prev => { const msgs = [...prev]; msgs[msgs.length-1].content = fullText; return msgs; }); 
      }
      await fetch('/api/history', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ userId: user.id, chatId: currentChatId, messages: [...newHistory, {role:'assistant', content: fullText}], title: currentChatId ? undefined : text.slice(0,30) }) }).then(res=>res.json()).then(d=>{if(d.chat){setCurrentChatId(d.chat.id); fetchChatList(user.id);}});
    } catch(e) { alert("对话请求失败"); } finally { setIsLoading(false); }
  };

  const startNewChat = () => { setCurrentChatId(null); setMessages([]); setActiveTab('home'); };
  const deleteChat = async (e:any, id:string) => { e.stopPropagation(); if(confirm("确定删除？")){ await fetch(`/api/history?chatId=${id}`, {method:'DELETE'}); fetchChatList(user.id); if(currentChatId===id) startNewChat(); }};
  const toggleTheme = () => { const n = !isDarkMode; setIsDarkMode(n); localStorage.setItem("theme", n?'dark':'light'); };

  const fetchCards = async () => { try { const res = await fetch('/api/admin/cards'); const data = await res.json(); if(data.cards) setCards(data.cards); } catch(e) {} };
  const generateCards = async () => { try { const res = await fetch('/api/admin/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardConfig) }); const data = await res.json(); if(data.success) { alert(`成功生成 ${data.count} 张卡密！`); fetchCards(); } else alert(data.error); } catch(e) { alert("生成失败"); } };
  
  // ✅ 修复 redeemCard 语法报错：完整展开 then/catch
  const redeemCard = async () => { 
      const codeInput = document.getElementById('card-input') as HTMLInputElement;
      const code = codeInput?.value; 
      if(!code) return alert("请输入卡密"); 
      try { 
          const res = await fetch('/api/card/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, code }) }); 
          const data = await res.json(); 
          if(data.success) { 
              alert(`充值成功！到账 $${data.amount}`); 
              setUser((prev:any) => ({ ...prev, balance: data.balance })); 
              syncUserData(user.id, user.role); 
              setIsRechargeOpen(false); 
          } else { 
              alert(data.error); 
          } 
      } catch(e) { 
          alert("请求失败"); 
      } 
  };

  useEffect(() => { let interval: any; if (user && (isSupportOpen || (isAdminSupportOpen && activeSessionUser))) { const fetchMsg = async () => { const uid = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id; try { const res = await fetch(`/api/support?action=history&userId=${uid}`); const data = await res.json(); if (data.messages) { setSupportMessages(data.messages); if (supportScrollRef.current) supportScrollRef.current.scrollIntoView({ behavior: "smooth" }); } } catch(e) {} }; fetchMsg(); interval = setInterval(fetchMsg, 3000); } return () => clearInterval(interval); }, [user, isSupportOpen, isAdminSupportOpen, activeSessionUser]);
  const fetchSupportSessions = async () => { try { const res = await fetch('/api/support?action=list'); const data = await res.json(); if(data.sessions) setSupportSessions(data.sessions); } catch(e) {} };
  const sendSupportMessage = async () => { if(!supportInput.trim()) return; const targetUserId = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id; try { await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: targetUserId, content: supportInput, isAdmin: user.role === 'admin' }) }); setSupportInput(""); } catch(e) { alert("发送失败"); } };

  const handleDownloadExcel = (csv: string) => { const wb = XLSX.read(csv, { type: 'string' }); XLSX.writeFile(wb, `eureka_${Date.now()}.xlsx`); };

  // ✅ 重构渲染逻辑：解决 Line 484-500 的 JSX 嵌套报错
  const renderMainContent = () => {
      switch(activeTab) {
          case 'home':
              return (
                 <div className="h-full flex flex-col">
                    <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-32">
                       <div className="max-w-3xl mx-auto">
                          {messages.length === 0 && (<div className="py-20 text-center animate-in zoom-in duration-700"><div className="w-24 h-24 rounded-[36px] bg-slate-900 text-white flex items-center justify-center text-6xl mx-auto mb-8 shadow-2xl font-bold">🧊</div><h2 className="text-4xl font-black tracking-tighter mb-2">Welcome to Eureka</h2><p className="text-slate-400 text-sm">您的全能创意 AI 助手</p></div>)}
                          {messages.map((m,i)=>{ const { cleanText } = parseMessageContent(m.content); return (<div key={i} className={`flex gap-3 mb-6 ${m.role==='user'?'justify-end':'justify-start'} group animate-in slide-in-from-bottom-2`}>{m.role!=='user' && <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0 shadow-lg">🧊</div>}<div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role==='user' ? 'bg-blue-600 text-white shadow-blue-500/20' : 'bg-slate-100 dark:bg-slate-900 border dark:border-slate-800'}`}><div className="prose prose-sm dark:prose-invert leading-relaxed"><ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown></div></div></div>)})}
                          {isLoading && <Thinking modelName={currentModelName} />}
                          <div ref={scrollRef} className="h-2" />
                       </div>
                    </div>
                    <div className={`fixed bottom-0 right-0 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'} bg-gradient-to-t from-white dark:from-slate-950 p-4 pt-10 z-10`}><div className="max-w-3xl mx-auto"><ChatInput onSend={handleChatSubmit} disabled={isLoading} /></div></div>
                 </div>
              );
          case 'video':
              // 修复：传入箭头函数以匹配类型
              return <MediaGenerator type="video" onConsume={(a, d) => handleTX('consume', a, d)} showToast={showToast} />;
          case 'image':
              // 修复：传入箭头函数以匹配类型
              return <MediaGenerator type="image" onConsume={(a, d) => handleTX('consume', a, d)} showToast={showToast} />;
          case 'contact':
              return (
                  <div className="h-full flex flex-col p-6 max-w-3xl mx-auto">
                    <div className="bg-white dark:bg-slate-900 rounded-3xl border border-slate-100 dark:border-slate-800 flex-1 flex flex-col overflow-hidden shadow-xl">
                        <div className="p-4 border-b bg-slate-50 dark:bg-slate-950/50 font-bold flex items-center gap-2"><Headphones size={18}/> 在线客服</div>
                        <div className="flex-1 overflow-y-auto p-4 space-y-4">
                            {supportMessages.map((m:any,i)=>(<div key={i} className={`flex ${m.sender==='user'?'justify-end':'justify-start'}`}><div className={`px-4 py-2 rounded-2xl text-sm ${m.sender==='user'?'bg-blue-600 text-white':'bg-slate-100 dark:bg-slate-800'}`}>{m.content}</div></div>))}
                        </div>
                        <div className="p-4 border-t flex gap-2"><Input value={supportInput} onChange={e=>setSupportInput(e.target.value)} placeholder="输入您的问题..." className="flex-1"/><Button onClick={sendSupportMessage}><Send size={16}/></Button></div>
                    </div>
                  </div>
              );
          default:
              return (
                  <div className="h-full flex items-center justify-center opacity-30 flex-col"><LayoutGrid size={64} className="mb-4"/><p className="text-xl font-black italic tracking-widest uppercase">Module Under Construction</p></div>
              );
      }
  };

  if (!user) return <AuthPage onLogin={(u)=>{ setUser(u); syncUserData(u.id, u.role); fetchChatList(u.id); }} />;

  return (
    <div className={`flex h-screen overflow-hidden transition-all duration-500 ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-white text-slate-900'}`}>
      <Toast show={toastState.show} type={toastState.type} message={toastState.msg} />
      
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-slate-50 dark:bg-slate-900 border-r transition-all duration-300 flex flex-col relative z-20 overflow-hidden`}>
         <div className="p-4 flex flex-col gap-4 shrink-0">
            <div className="text-xl font-black flex items-center gap-2 px-2"><div className="w-6 h-6 bg-slate-900 text-white flex items-center justify-center rounded-lg text-xs font-bold">🧊</div>Eureka</div>
            <Button onClick={startNewChat} className="w-full bg-blue-600 hover:bg-blue-700 text-white rounded-xl shadow-lg"><Plus size={16}/> 开启新对话</Button>
         </div>
         <div className="flex-1 overflow-y-auto px-2 space-y-1 py-2">
            <div className="px-4 py-2 text-[10px] font-black text-slate-400 uppercase tracking-widest">历史记录</div>
            {chatList.map(chat => (<div key={chat.id} onClick={()=>loadChat(chat.id)} className={`group p-3 rounded-xl text-xs cursor-pointer truncate flex justify-between items-center transition-all ${currentChatId === chat.id ? 'bg-blue-100 text-blue-700 font-bold shadow-sm' : 'hover:bg-slate-200'}`}><span>{chat.title || '无标题'}</span><button onClick={(e)=>deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 text-red-500 transition-opacity"><Trash2 size={12}/></button></div>))}
         </div>
         <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto relative z-[60] bg-inherit">
             <button onClick={()=>setIsProfileOpen(true)} className="w-full flex items-center gap-3 p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all text-left">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shadow-md">{user.nickname?.[0]}</div>
                <div className="flex-1 truncate"><div className="font-bold text-xs truncate">{user.nickname}</div><div className="text-[10px] text-slate-400 uppercase font-black">PRO Account</div></div>
             </button>
         </div>
      </div>

      <div className="flex-1 flex flex-col relative overflow-hidden bg-inherit">
          <header className="h-16 flex items-center justify-between px-6 border-b z-30 bg-white/80 dark:bg-slate-950/80 backdrop-blur-md">
              <div className="flex items-center gap-4">
                  <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 rounded-lg transition-colors"><Server size={18} className="rotate-90 text-slate-400"/></button>
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      {[ { id: 'home', label: '首页', icon: HomeIcon }, { id: 'video', label: '视频', icon: Video }, { id: 'image', label: '图片', icon: ImageIcon }, { id: 'contact', label: '客服', icon: Headphones } ].map((item:any) => (
                          <button key={item.id} onClick={()=>setActiveTab(item.id)} className={`flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === item.id ? 'bg-white text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900'}`}><item.icon size={14}/>{item.label}</button>
                      ))}
                  </div>
              </div>
              <Button variant="ghost" onClick={toggleTheme} className="w-9 h-9 rounded-full p-0 transition-colors">{isDarkMode ? <Sun size={18} className="text-yellow-400"/> : <Moon size={18}/>}</Button>
          </header>

          <main className="flex-1 overflow-hidden relative">
              {renderMainContent()}
          </main>
      </div>

      <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}><DialogContent className="max-w-md rounded-[32px] p-0 overflow-hidden border-none shadow-2xl bg-white dark:bg-slate-950"><div className="p-8 space-y-6"><div className="flex items-center gap-4"><div className="w-16 h-16 rounded-3xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white text-2xl font-black shadow-lg">{user.nickname?.[0]}</div><div><h3 className="text-xl font-black">{user.nickname}</h3><p className="text-xs text-slate-400 font-mono">ID: {user.id.slice(-8)}</p></div></div><div className="grid grid-cols-2 gap-3"><div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-2xl border border-blue-100 dark:border-blue-800 text-center"><span className="text-[10px] font-black text-blue-600 uppercase block mb-1">Balance</span><span className="text-2xl font-black text-blue-700 dark:text-blue-400">${user.balance}</span></div><div className="p-4 bg-slate-50 dark:bg-slate-900 rounded-2xl border border-slate-100 dark:border-slate-800 text-center"><span className="text-[10px] font-black text-slate-400 uppercase block mb-1">Status</span><span className="text-xs font-bold text-green-500 flex items-center justify-center gap-1 uppercase tracking-tighter"><Shield size={10}/> Pro Active</span></div></div><div className="space-y-2"><Button onClick={()=>{setIsProfileOpen(false); setIsRechargeOpen(true);}} className="w-full h-12 bg-slate-900 hover:bg-blue-600 text-white font-black rounded-xl shadow-xl transition-all">立即充值额度</Button>{user.role === 'admin' && <Button onClick={()=>{setIsProfileOpen(false); setIsAdminCardsOpen(true);}} variant="outline" className="w-full h-12 rounded-xl border-slate-200 font-bold">进入管理中心</Button>}<Button variant="ghost" onClick={()=>{localStorage.removeItem("my_ai_user"); window.location.reload();}} className="w-full text-red-500 font-bold hover:bg-red-50">退出当前账号</Button></div></div></DialogContent></Dialog>
      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}><DialogContent className="max-w-sm rounded-3xl p-6"><h3 className="text-lg font-black mb-4 flex items-center gap-2"><Ticket/> 兑换卡密</h3><Input id="card-input" placeholder="请输入卡密代码" className="mb-4"/><Button onClick={redeemCard} className="w-full">立即兑换</Button></DialogContent></Dialog>
      <Dialog open={isAdminCardsOpen} onOpenChange={setIsAdminCardsOpen}><DialogContent className="max-w-2xl rounded-3xl p-6 h-[80vh] flex flex-col"><div className="flex justify-between items-center mb-6"><h3 className="text-xl font-black flex items-center gap-2"><CardIcon/> 卡密管理</h3><Button onClick={fetchCards} variant="outline" size="sm">刷新列表</Button></div><div className="grid grid-cols-3 gap-2 mb-6"><Input type="number" placeholder="金额" value={cardConfig.amount} onChange={e=>setCardConfig({...cardConfig, amount: Number(e.target.value)})}/><Input type="number" placeholder="数量" value={cardConfig.count} onChange={e=>setCardConfig({...cardConfig, count: Number(e.target.value)})}/><Button onClick={generateCards}>生成</Button></div><div className="flex-1 overflow-auto bg-slate-50 rounded-xl p-2 space-y-2">{cards.map((c:any)=>(<div key={c.id} className="flex justify-between p-3 bg-white rounded-lg text-xs shadow-sm"><span className="font-mono">{c.code}</span><span className="font-bold text-green-600">${c.amount}</span><span className={c.isUsed?'text-red-500':'text-green-500'}>{c.isUsed?'已使用':'未使用'}</span></div>))}</div></DialogContent></Dialog>
      <Dialog open={isDocPreviewOpen} onOpenChange={setIsDocPreviewOpen}><DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto"><div className="prose dark:prose-invert p-6"><ReactMarkdown>{previewDocData || ""}</ReactMarkdown></div></DialogContent></Dialog>
      <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="max-w-[95vw] h-[90vh] p-0"><div className="p-4 border-b flex justify-between items-center"><h3 className="font-bold flex items-center gap-2"><FileSpreadsheet className="text-green-600"/> 数据预览</h3><Button size="sm" onClick={()=>handleDownloadExcel(previewTableData || "")} className="bg-green-600 hover:bg-green-700 text-white gap-2 font-bold"><Download size={14}/> 下载 Excel</Button></div><div className="overflow-auto h-full p-4"><table className="min-w-full text-sm"><thead><tr>{previewTableData?.split('\n')[0].split(',').map((h,i)=>(<th key={i} className="px-4 py-2 bg-slate-100 border">{h}</th>))}</tr></thead><tbody>{previewTableData?.split('\n').slice(1).map((row,i)=>(<tr key={i}>{row.split(',').map((c,j)=>(<td key={j} className="px-4 py-2 border">{c}</td>))}</tr>))}</tbody></table></div></DialogContent></Dialog>
    </div>
  );
}