"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ChatInput from "@/components/ChatInput"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  History, Coins, Shield, Terminal, Check, Copy, User, Bot, Loader2, Square, Send, 
  Paperclip, X, LogOut, Sparkles, PartyPopper, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle,
  Moon, Sun, FileText, ArrowLeft, CreditCard, Plus, Calendar, MessageCircle, RefreshCw, Server
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// ✨ 模型定价表
const MODEL_PRICING: Record<string, number> = {
  "gemini-2.0-flash-exp": 0.01,
  "gemini-1.5-pro": 0.05,
  "gemini-2.0-flash-thinking-exp": 0.10,
  "sora-v1": 2.50,
  "veo-google": 1.80,
  "banana-sdxl": 0.20,
};

// --- 1. 独立组件 ---
function RelatedQuestions({ content, onAsk }: { content: string, onAsk: (q: string) => void }) {
  if (!content || typeof content !== 'string' || !content.includes("___RELATED___")) return null;
  try {
    const parts = content.split("___RELATED___");
    if (parts.length < 2) return null;
    const questions = parts[1].split("|").map(q => q.trim()).filter(q => q.length > 0);
    if (questions.length === 0) return null;
    return (
      <div className="mt-4 pt-3 border-t border-slate-200/20 grid gap-3 animate-in fade-in slide-in-from-top-1">
        <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase">
          <Sparkles size={12} className="text-blue-500 fill-blue-500"/> 您可能感兴趣
        </div>
        <div className="flex flex-wrap gap-2">
          {questions.map((q, idx) => (
            <button key={idx} onClick={() => onAsk(q)} className="group flex items-center gap-1.5 px-4 py-2 bg-slate-50/50 hover:bg-blue-50/80 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-blue-200 active:scale-95 text-left">
              <span>{q}</span><ArrowRight size={10} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/>
            </button>
          ))}
        </div>
      </div>
    );
  } catch (e) { return null; }
}

// --- 2. 思维链 ---
function Thinking({ modelName }: { modelName: string }) {
  const [major, setMajor] = useState(0);
  const [minor, setMinor] = useState(-1);
  const plan = [{ title: "一、 需求语义深度解析", steps: ["提取关键词核心意图", "检索历史上下文关联"] }, { title: "二、 知识库实时广度检索", steps: ["跨域检索分布式知识节点", "验证数据准确性"] }, { title: "三、 响应架构多重建模", steps: ["逻辑推理路径模拟", "优化语言表达风格"] }, { title: "四、 生成结果合规性自检", steps: ["安全性策略实时匹配", "逻辑闭环终审校验"] }];
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
    <div className="flex gap-4 my-8 animate-in fade-in slide-in-from-bottom-3">
      <div className="w-9 h-9 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 text-white text-xs">🧊</div>
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 shadow-sm w-full max-w-md">
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3 mb-4"><Terminal size={10}/> <span>Eureka 使用 {modelName} 处理引擎</span></div>
        <div className="space-y-4">{plan.map((item, i) => (<div key={i} className={`transition-all duration-500 ${i > major ? 'opacity-20' : 'opacity-100'}`}><div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${i < major ? 'bg-green-500 border-green-500 text-white' : i === major ? 'border-blue-500 text-blue-600 animate-pulse' : 'text-slate-300'}`}>{i < major ? <Check size={10} /> : i + 1}</div><span className={`text-[12px] font-black ${i === major ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>{item.title}</span></div><div className="ml-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4">{item.steps.map((step, j) => (<div key={j} className={`flex items-center gap-2 text-[10px] transition-all duration-300 ${(i < major || (i === major && j <= minor)) ? 'opacity-100' : 'opacity-0'}`}><div className="w-1 h-1 rounded-full bg-slate-300" /><span className="text-slate-400 font-medium">{j + 1}. {step}</span></div>))}</div></div>))}</div>
      </div>
    </div>
  );
}

// --- 3. 认证组件 ---
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
  const [failCount, setFailCount] = useState(0); 

  const validateAccount = (val: string) => {
    if (val === 'admin') return true; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/; 
    if (emailRegex.test(val) || phoneRegex.test(val)) return true;
    return false;
  };

  const sendCode = async () => {
    if (!validateAccount(account) || account === 'admin') { setError("请输入有效的手机号"); return; }
    setError(""); setCodeLoading(true);
    try {
      const res = await fetch('/api/send-sms', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ phone: account }) });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "发送失败");
      alert("验证码已发送！"); setCount(60);
      const timer = setInterval(() => setCount(v => { if(v<=1){clearInterval(timer); return 0} return v-1 }), 1000);
    } catch (e: any) { setError(e.message); } finally { setCodeLoading(false); }
  };

  const handleAuth = async (e: any) => {
    e.preventDefault(); setError("");
    if (!account) { setError("请输入账号"); return; }
    if (authMode !== 'login' && !validateAccount(account)) { setError("账号格式不正确"); return; }
    if (!password) { setError("请输入密码"); return; }
    if (authMode === 'register' || authMode === 'forgot') {
      if (authMode === 'register' && !nickname) { setError("请输入昵称"); return; }
      if (password.length < 6) { setError("密码长度不能少于6位"); return; }
      if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
      if (!verifyCode) { setError("请输入验证码"); return; }
      if (authMode === 'register' && !agreed) { setError("请先阅读并同意服务条款"); return; }
    }
    setLoading(true);
    let type = 'login'; if (authMode === 'register') type = 'register'; if (authMode === 'forgot') type = 'reset-password';
    try {
      const res = await fetch('/api/auth', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ type, account, password, nickname, verifyCode }) });
      const data = await res.json();
      if (!res.ok) {
        if (type === 'login') {
          const newCount = failCount + 1; setFailCount(newCount);
          if (newCount >= 5) { alert("您已连续输错5次密码，请重置。"); setAuthMode('forgot'); setError("请验证身份"); setFailCount(0); setLoading(false); return; }
        }
        throw new Error(data.error || "请求失败");
      }
      if (authMode === 'forgot') { alert("密码重置成功！"); setAuthMode('login'); setPassword(""); setConfirmPassword(""); setLoading(false); return; }
      localStorage.setItem("my_ai_user", JSON.stringify(data)); onLogin(data);
    } catch (err: any) { setError(err.message); } finally { setLoading(false); }
  };

  let title = "欢迎回来"; let subtitle = "使用您的 Eureka 账号登录";
  if (authMode === 'register') { title = "创建新账户"; subtitle = "开启您的 AI 探索之旅"; }
  if (authMode === 'forgot') { title = "找回密码"; subtitle = "验证您的身份以重置密码"; }

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"><div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl text-white font-bold">🧊</div><h1 className="text-5xl font-black tracking-tighter text-slate-900">Eureka</h1></div>
      <Card className="w-full max-w-sm p-8 shadow-2xl border-none text-center bg-white rounded-[32px] animate-in zoom-in-95 duration-500">
        <div className="text-left mb-6">
          {authMode === 'forgot' && <button onClick={()=>setAuthMode('login')} className="mb-2 text-slate-400 hover:text-slate-600 flex items-center gap-1 text-xs font-bold"><ArrowLeft size={12}/> 返回登录</button>}
          <h2 className="text-2xl font-black text-slate-900">{title}</h2>
          <p className="text-xs text-slate-400 mt-1">{subtitle}</p>
        </div>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {authMode === 'register' && (<div className="relative group"><User size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="设置昵称" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={nickname} onChange={e=>setNickname(e.target.value)} /></div>)}
          <div className="relative group"><Mail size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="手机号 (仅限中国大陆)" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={account} onChange={e=>setAccount(e.target.value)} /></div>
          {(authMode === 'register' || authMode === 'forgot') && (<div className="flex gap-2"><div className="relative flex-1 group"><Shield size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="短信验证码" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={verifyCode} onChange={e=>setVerifyCode(e.target.value)} /></div><Button type="button" variant="outline" onClick={sendCode} disabled={count>0 || codeLoading} className="h-12 w-28 rounded-2xl border-slate-200 text-slate-600 font-bold">{codeLoading ? <Loader2 size={14} className="animate-spin"/> : (count>0 ? `${count}s后重发` : "获取验证码")}</Button></div>)}
          <div className="relative group"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input type={showPwd ? "text" : "password"} placeholder={authMode === 'login' ? "请输入密码" : "设置新密码"} className="bg-slate-50 border-none h-12 pl-10 pr-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">{showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          {(authMode === 'register' || authMode === 'forgot') && (<div className="relative group animate-in slide-in-from-top-2"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input type={showConfirmPwd ? "text" : "password"} placeholder="确认密码" className="bg-slate-50 border-none h-12 pl-10 pr-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /><button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">{showConfirmPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>)}
          {authMode === 'login' && (<div className="flex justify-end mt-1"><button type="button" onClick={()=>{setAuthMode('forgot'); setError("");}} className="text-[11px] text-slate-400 hover:text-blue-600 font-bold transition-colors">忘记密码？</button></div>)}
          {error && <div className="text-[11px] text-red-500 font-bold flex items-center gap-1 animate-in slide-in-from-left-2"><AlertCircle size={12}/> {error}</div>}
          {authMode === 'register' && (<div className="flex items-center gap-2 mt-2"><div onClick={()=>setAgreed(!agreed)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>{agreed && <Check size={10} className="text-white"/>}</div><span className="text-[10px] text-slate-400">我已阅读并同意 <span className="text-blue-600 cursor-pointer hover:underline">《Eureka服务条款》</span></span></div>)}
          <Button className="w-full bg-slate-900 hover:bg-blue-600 h-12 mt-4 text-white font-bold border-none rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? "安全登录" : (authMode === 'register' ? "立即注册" : "重置密码"))}</Button>
        </form>
        {authMode !== 'forgot' && (<div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">{authMode === 'register' && (<div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-pulse"><PartyPopper size={14} className="animate-bounce" /><span className="text-[11px] font-bold">新用户注册即送 $0.10 体验金！</span></div>)}<button onClick={()=>{setAuthMode(authMode==='login'?'register':'login'); setError("");}} className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors">{authMode === 'login' ? "没有账号？免费注册" : "已有账号？去登录"}</button></div>)}
      </Card>
      <p className="mt-8 text-[10px] text-slate-300 font-mono">Eureka Secure Auth System © 2026</p>
    </div>
  );
}

// --- 4. 主程序 ---
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeTab, setRechargeTab] = useState<'card' | 'online'>('card');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<{name:string, content:string} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null);
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

  // ✨ 解析助手
  const parseMessageContent = (content: any) => {
    let rawText = typeof content === 'string' ? content : content.text;
    if (!rawText) return { cleanText: '', suggestions: [] };

    const START_TAG = '<<<SUGGESTIONS_START>>>';
    const END_TAG = '<<<SUGGESTIONS_END>>>';

    const parts = rawText.split(START_TAG);
    const cleanText = parts[0]; 
    let suggestions: string[] = [];

    if (parts[1]) {
      try {
        const jsonStr = parts[1].split(END_TAG)[0];
        suggestions = JSON.parse(jsonStr);
      } catch (e) {}
    }

    return { cleanText, suggestions };
  };

  useEffect(() => { 
    const u = localStorage.getItem("my_ai_user"); 
    if(u) { const p = JSON.parse(u); setUser(p); syncUserData(p.id, p.role); }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  useEffect(() => {
    let interval: any;
    if (user && (isSupportOpen || (isAdminSupportOpen && activeSessionUser))) {
      const fetchMsg = async () => {
        const uid = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id;
        try {
          const res = await fetch(`/api/support?action=history&userId=${uid}`);
          const data = await res.json();
          if (data.messages) {
             setSupportMessages(data.messages);
             if (supportScrollRef.current) supportScrollRef.current.scrollIntoView({ behavior: "smooth" });
          }
        } catch(e) {}
      };
      fetchMsg();
      interval = setInterval(fetchMsg, 3000); 
    }
    return () => clearInterval(interval);
  }, [user, isSupportOpen, isAdminSupportOpen, activeSessionUser]);

  const fetchSupportSessions = async () => {
    try {
      const res = await fetch('/api/support?action=list');
      const data = await res.json();
      if(data.sessions) setSupportSessions(data.sessions);
    } catch(e) {}
  };

  const sendSupportMessage = async () => {
    if(!supportInput.trim()) return;
    const targetUserId = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id;
    try {
      await fetch('/api/support', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: targetUserId, content: supportInput, isAdmin: user.role === 'admin' })
      });
      setSupportInput("");
      const res = await fetch(`/api/support?action=history&userId=${targetUserId}`);
      const data = await res.json();
      if (data.messages) setSupportMessages(data.messages);
    } catch(e) { alert("发送失败"); }
  };

  const syncUserData = async (uid: string, role: string) => {
    try {
      const res = await fetch(`/api/sync?id=${uid}&role=${role}`);
      const data = await res.json();
      if (data.balance) {
        setUser((prev:any) => ({ ...prev, balance: data.balance }));
        setTransactions(data.transactions || []);
      }
      if (role === 'admin' && data.users) setAdminUsers(data.users);
    } catch (e) { console.error("Sync error:", e); }
  };

  const openAdminDetail = async (targetUser: any) => {
    setSelectedAdminUser(targetUser);
    setAdminUserTx([]); 
    try {
      const res = await fetch(`/api/sync?id=${targetUser.id}`); 
      const data = await res.json();
      if (data.transactions) setAdminUserTx(data.transactions);
    } catch (e) { alert("获取详情失败"); }
  };

  const fetchCards = async () => {
    try {
      const res = await fetch('/api/admin/cards');
      const data = await res.json();
      if(data.cards) setCards(data.cards);
    } catch(e) { console.error(e); }
  };

  const generateCards = async () => {
    try {
      const res = await fetch('/api/admin/cards', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(cardConfig)
      });
      const data = await res.json();
      if(data.success) { alert(`成功生成 ${data.count} 张卡密！`); fetchCards(); }
      else alert(data.error);
    } catch(e) { alert("生成失败"); }
  };

  const redeemCard = async () => {
    const code = (document.getElementById('card-input') as HTMLInputElement).value;
    if(!code) return alert("请输入卡密");
    try {
      const res = await fetch('/api/card/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, code })
      });
      const data = await res.json();
      if(data.success) {
        alert(`充值成功！到账 $${data.amount}`);
        setUser((prev:any) => ({ ...prev, balance: data.balance }));
        syncUserData(user.id, user.role); 
        setIsRechargeOpen(false);
      } else { alert(data.error); }
    } catch(e) { alert("网络请求失败"); }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? 'dark' : 'light');
  };

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); setIsProfileOpen(false); };
  
  const handleTX = async (type: 'topup' | 'consume', amount: number, desc: string) => {
    if(!user) return false;
    if (user.role === 'admin') return true;
    const cur = parseFloat(user.balance);
    if(type === 'consume' && cur < amount) { alert(`余额不足！使用此模型需要 $${amount}，您当前仅有 $${cur}`); return false; }
    try {
      const res = await fetch('/api/sync', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId: user.id, type, amount, description: desc })
      });
      const data = await res.json();
      if (!res.ok) { alert(data.error); return false; }
      setUser((prev:any) => ({ ...prev, balance: data.balance }));
      syncUserData(user.id, user.role); 
      return true;
    } catch (e) { alert("网络错误"); return false; }
  };

  const handleSend = async (e?: any, textOverride?: string) => {
    e?.preventDefault();
    const content = textOverride || input;
    if (!content.trim() && images.length === 0 && !file) return;
    await handleChatSubmit(content, [], model);
    setInput(""); setImages([]); setFile(null); 
  };

  // --- ✨✨✨ 新发送逻辑：完全解锁模型ID ✨✨✨
  const handleChatSubmit = async (
    text: string, 
    attachments: File[] = [], 
    modelId: string = "gemini-2.0-flash-exp" 
  ) => {
    setModel(modelId); 

    // 1. 💰 计算成本 & 权限拦截
    const cost = MODEL_PRICING[modelId] || 0.01;
    const success = await handleTX('consume', cost, `使用 ${modelId} 生成内容`);
    if (!success) return; 

    // ✅ 关键修改：不再强制转为 gemini-2.0，而是把真实 ID (如 sora-v1) 发给后端
    // 这样后端就能根据 ID 进行路由了！
    let apiModel = modelId;
    
    // 处理文件
    const processedImages: string[] = [];
    let processedFile: { name: string, content: string } | null = null;

    if (attachments && attachments.length > 0) {
      for (const file of attachments) {
        const reader = new FileReader();
        const base64 = await new Promise<string>((resolve) => {
          reader.onload = (e) => resolve(e.target?.result as string);
          reader.readAsDataURL(file);
        });
        if (file.type.startsWith("image/")) {
          processedImages.push(base64);
        } else {
          processedFile = { name: file.name, content: base64 };
        }
      }
    }

    // UI 更新
    const uiContent = { 
      text: text, 
      images: processedImages, 
      file: processedFile ? processedFile.name : null 
    };
    setMessages(prev => [...prev, { role: 'user', content: uiContent }]);
    setIsLoading(true);
    
    const history = messages.map(m => ({
      role: m.role,
      content: typeof m.content === 'string' ? m.content : m.content.text
    }));

    history.push({
      role: 'user',
      content: { text, images: processedImages, file: processedFile }
    });

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: history, model: apiModel }),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;
        const chunk = decoder.decode(value);
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          lastMsg.content += chunk; 
          return newMsgs;
        });
      }
    } catch (e) {
      console.error(e);
      alert("发送失败，请联系客服退款");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  if (!user) return <AuthPage onLogin={(u)=>{ setUser(u); syncUserData(u.id, u.role); }} />;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} overflow-x-hidden`}>
      <div className={`w-full py-2 text-center border-b transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        <p className={`text-[11px] font-medium tracking-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>欢迎来到Eureka，有问题可以 <a href="#" onClick={(e)=>{e.preventDefault(); setIsSupportOpen(true)}} className="text-blue-500 font-bold hover:underline mx-1">联系客服</a></p>
      </div>
      <nav className={`h-14 flex items-center justify-between px-6 border-b shrink-0 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter"><div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><span>Eureka</span></div>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{isDarkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
           <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
             <DialogTrigger asChild><button className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>{user.nickname[0].toUpperCase()}</button></DialogTrigger>
             <DialogContent className={`sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}>
               <DialogHeader className="sr-only"><DialogTitle>个人中心</DialogTitle></DialogHeader>
               <div className={`p-6 flex flex-col items-center border-b ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold mb-3 shadow-lg ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><h2 className="text-xl font-black">ID: {user.nickname}</h2><p className={`text-[10px] font-mono ${isDarkMode ? 'text-slate-500' : 'text-slate-400'}`}>{user.account}</p><button onClick={handleLogout} className="text-xs text-slate-400 mt-4 flex items-center gap-1 hover:text-red-500 transition-colors"><LogOut size={12}/> 退出账户</button></div>
               <div className={`p-6 ${isDarkMode ? 'bg-slate-950/50' : 'bg-slate-50/50'}`}>
                 <div className={`rounded-2xl p-5 border shadow-sm mb-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>可用余额</span><button onClick={()=>{setIsProfileOpen(false); setTimeout(()=>setIsRechargeOpen(true),200)}} className="text-blue-600 font-bold">充值</button></div><div className="text-4xl font-black font-mono">${user.balance}</div></div>
                 <div className="space-y-4"><div className="flex items-center gap-2 font-bold text-[10px] text-slate-500 uppercase tracking-widest"><History size={12}/> 记录</div><div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 scrollbar-hide text-[11px]">{transactions.map(t=>(<div key={t.id} className={`flex justify-between p-2.5 rounded-xl border font-bold ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-200' : 'bg-white border-slate-100 text-slate-900'}`}><span>{t.description}</span><span className={t.type==='topup'?'text-green-600':'text-slate-500'}>${t.amount}</span></div>))}</div></div>
               </div>
             </DialogContent>
           </Dialog>
        </div>
      </nav>

      {/* Admin Panel */}
      {user?.role === 'admin' && (
        <div className={`fixed right-6 bottom-32 w-80 p-5 rounded-[32px] border shadow-2xl z-50 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-950 border-white/10 text-white'}`}>
           <div className="font-bold text-red-400 mb-4 text-[10px] tracking-widest flex items-center gap-2 border-b border-white/5 pb-3"><Shield size={14} className="animate-pulse"/> EUREKA ADMIN (Cloud)</div>
           <div className="mb-4 grid grid-cols-2 gap-2">
             <Button onClick={()=>{setIsAdminCardsOpen(true); fetchCards();}} className="h-9 bg-blue-600/20 text-blue-400 hover:bg-blue-600 hover:text-white rounded-xl text-[10px] font-black border-none transition-all flex items-center justify-center gap-2"><CreditCard size={12}/> 卡密中心</Button>
             <Button onClick={()=>{setIsAdminSupportOpen(true); fetchSupportSessions();}} className="h-9 bg-green-600/20 text-green-400 hover:bg-green-600 hover:text-white rounded-xl text-[10px] font-black border-none transition-all flex items-center justify-center gap-2"><MessageCircle size={12}/> 客服中心</Button>
           </div>
           <div className="max-h-[300px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
             {adminUsers.map((u:any)=>(
               <div key={u.id} className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white/5 border-white/5'}`}>
                 <div className="flex justify-between items-start mb-2"><div className="font-black text-blue-300 text-sm">{u.nickname}</div><div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[9px] font-mono">${u.balance}</div></div>
                 <div className="text-[10px] text-white/40 space-y-1 mb-3"><div>账号: <span className="text-white/60">{u.account}</span></div><div>密码: <span className="text-white/80 font-mono">{u.password}</span></div></div>
                 <Button onClick={() => openAdminDetail(u)} className="w-full h-8 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border-none text-[10px] font-black rounded-xl transition-all">使用详情</Button>
               </div>
             ))}
           </div>
           <div className="mt-4 pt-2 border-t border-white/5 flex items-center gap-2 text-[9px] text-slate-500"><Server size={10}/> Env: {typeof window !== 'undefined' ? window.location.hostname : 'Server'}</div>
        </div>
      )}

      {/* Admin Cards Dialog */}
      <Dialog open={isAdminCardsOpen} onOpenChange={setIsAdminCardsOpen}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-6 border-b flex justify-between items-center pr-12 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-xl font-black flex items-center gap-2"><CreditCard size={18} className="text-blue-500"/> 卡密管理</DialogTitle><Button size="icon" variant="ghost" onClick={fetchCards}><RefreshCw size={14}/></Button></DialogHeader><div className="p-6 space-y-6"><div className={`p-4 rounded-2xl border flex flex-wrap gap-2 md:gap-4 items-end ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">面额</label><Input type="number" value={cardConfig.amount} onChange={e=>setCardConfig({...cardConfig, amount: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">数量</label><Input type="number" value={cardConfig.count} onChange={e=>setCardConfig({...cardConfig, count: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">天数</label><Input type="number" value={cardConfig.days} onChange={e=>setCardConfig({...cardConfig, days: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><Button onClick={generateCards} className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"><Plus size={12} className="mr-1"/> 生成</Button></div><div className="max-h-[400px] overflow-y-auto space-y-2 pr-1"><div className="grid grid-cols-2 md:grid-cols-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2"><span>卡密</span><span>面额</span><span className="hidden md:block">状态</span><span className="hidden md:block">有效期</span><span className="hidden md:block">使用者</span></div>{cards.map((c:any)=>(<div key={c.id} className={`grid grid-cols-2 md:grid-cols-5 items-center p-3 rounded-xl border text-[10px] font-mono ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="truncate pr-2 cursor-pointer hover:text-blue-500" onClick={()=>{navigator.clipboard.writeText(c.code); alert("复制成功");}}>{c.code}</div><div className="flex items-center gap-2"><span>${c.amount}</span><span className={`md:hidden px-1.5 py-0.5 rounded ${c.status==='used'?'bg-red-500/10 text-red-500':'bg-green-500/10 text-green-500'}`}>{c.status==='used'?'已用':'正常'}</span></div><div className={`hidden md:block ${c.status==='used'?'text-red-500':'text-green-500'}`}>{c.status==='used'?'已用':'正常'}</div><div className="hidden md:block">{c.expires_at}</div><div className="hidden md:block">{c.used_by || '-'}</div></div>))}{cards.length === 0 && <div className="text-center text-[10px] opacity-40 py-10">暂无卡密，请点击右上角刷新</div>}</div></div></DialogContent></Dialog>
      <Dialog open={isAdminSupportOpen} onOpenChange={setIsAdminSupportOpen}><DialogContent className={`sm:max-w-4xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className="sr-only"><DialogTitle>客服会话管理</DialogTitle></DialogHeader><div className="flex flex-col md:flex-row h-[600px]"><div className={`w-full md:w-1/3 h-[180px] md:h-full border-b md:border-b-0 md:border-r p-4 overflow-y-auto ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}><h3 className="font-black text-sm mb-4 flex items-center justify-between mr-8"><span className="flex items-center gap-2"><MessageCircle size={16}/> 会话列表</span><Button size="icon" variant="ghost" className="h-6 w-6" onClick={fetchSupportSessions}><RefreshCw size={12}/></Button></h3><div className="flex md:flex-col gap-2 overflow-x-auto md:overflow-x-hidden pb-2 md:pb-0">{supportSessions.map(s => (<div key={s.user_id} onClick={()=>setActiveSessionUser(s.user_id)} className={`flex-shrink-0 w-40 md:w-full p-3 rounded-xl cursor-pointer transition-all border ${activeSessionUser===s.user_id ? 'bg-blue-600 text-white border-blue-600 shadow-lg' : (isDarkMode ? 'bg-slate-950 border-slate-800 hover:bg-slate-800' : 'bg-slate-50 border-slate-100 hover:bg-slate-100')}`}><div className="flex justify-between items-center mb-1"><span className="font-bold text-xs truncate max-w-[80px]">{s.nickname || s.user_id}</span>{s.unread > 0 && <span className="bg-red-500 text-white text-[9px] px-1.5 rounded-full">{s.unread}</span>}</div><div className="text-[10px] truncate opacity-60">{s.last_message}</div></div>))}{supportSessions.length === 0 && <div className="text-center text-[10px] opacity-40 py-10 w-full">暂无咨询，点击刷新</div>}</div></div><div className="flex-1 flex flex-col bg-slate-50/50 dark:bg-slate-950/50 relative min-h-0">{activeSessionUser ? (<><div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">{supportMessages.map(m => (<div key={m.id} className={`flex ${m.is_admin ? 'justify-end' : 'justify-start'}`}><div className={`max-w-[85%] p-3 rounded-2xl text-xs font-medium shadow-sm ${m.is_admin ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800')}`}>{m.content}</div></div>))}<div ref={supportScrollRef} /></div><div className="p-4 border-t dark:border-slate-800 bg-white dark:bg-slate-900 flex gap-2"><Input value={supportInput} onChange={e=>setSupportInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') sendSupportMessage()}} placeholder="回复用户..." className="border-none bg-slate-100 dark:bg-slate-950"/><Button onClick={sendSupportMessage} size="icon" className="bg-blue-600"><Send size={16}/></Button></div></>) : (<div className="flex-1 flex items-center justify-center text-slate-400 text-xs">👈 👆 请选择一个会话</div>)}</div></div></DialogContent></Dialog>
      <Dialog open={!!selectedAdminUser} onOpenChange={() => setSelectedAdminUser(null)}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-2xl font-black">{selectedAdminUser?.nickname} 详情</DialogTitle><div className="text-right text-green-500 font-black text-3xl">${selectedAdminUser?.balance}</div></DialogHeader>{selectedAdminUser && <div className="flex-1 overflow-y-auto p-8 space-y-3">{(adminUserTx.length > 0 ? adminUserTx : []).map((tx:any) => (<div key={tx.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col gap-1"><span className="text-xs font-bold">{tx.description}</span><span className="text-xs font-mono opacity-60 flex items-center gap-1"><FileText size={10}/> {tx.time}</span></div><span className={`font-bold ${tx.type==='consume'?'text-red-500':'text-green-500'}`}>{tx.type==='consume'?'-':'+'}${tx.amount}</span></div>))}{adminUserTx.length === 0 && <div className="text-center text-xs opacity-50 py-10">暂无消费记录</div>}</div>}</DialogContent></Dialog>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-10 pb-32">
        <div className="max-w-3xl mx-auto space-y-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in duration-700"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl font-bold ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><h2 className="text-3xl font-black mb-10 tracking-tight">有什么可以帮您的？</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">{["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (<button key={idx} onClick={() => handleSend(null, txt)} className={`flex items-center justify-center p-6 border rounded-3xl hover:border-slate-300 transition-all text-sm font-bold shadow-sm h-24 text-center leading-relaxed ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>{txt}</button>))}</div></div>
          )}
          {messages.map((m, i) => {
            const { cleanText, suggestions } = parseMessageContent(m.content);
            return (
              <div key={i} className={`flex gap-4 ${m.role==='user'?'justify-end':'justify-start'} animate-in fade-in`}>
                {m.role!=='user' && <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 text-white text-xs font-bold ${isDarkMode ? 'bg-slate-800' : 'bg-slate-900'}`}>🧊</div>}
                <div className="max-w-[85%] flex flex-col gap-2">
                  <div className={`rounded-2xl px-5 py-3 shadow-sm ${m.role==='user' ? (isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900') : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-white border border-slate-100 text-slate-900')}`}>
                    {m.role === 'user' && typeof m.content === 'object' ? (
                      <div className="space-y-3 text-sm">
                        {m.content.images?.length > 0 && <div className="grid grid-cols-2 gap-2">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="rounded-xl aspect-square object-cover border" alt="up"/>))}</div>}
                        <p className="leading-relaxed font-medium">{m.content.text}</p>
                      </div>
                    ) : (
                      <div>
                        <div className={`prose prose-sm max-w-none leading-relaxed font-medium ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`}>
                          <ReactMarkdown>{cleanText}</ReactMarkdown>
                        </div>
                        {suggestions.length > 0 && (
                          <div className="mt-4 pt-3 border-t border-slate-200/20 grid gap-2 animate-in fade-in slide-in-from-top-1">
                            <div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase mb-1">
                              <Sparkles size={12} className="text-blue-500 fill-blue-500"/> 猜你想问
                            </div>
                            <div className="flex flex-wrap gap-2">
                              {suggestions.map((q, idx) => (
                                <button 
                                  key={idx} 
                                  onClick={() => handleChatSubmit(q, [], model)} 
                                  className="group flex items-center gap-1.5 px-3 py-1.5 bg-slate-50/50 hover:bg-blue-50/80 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-lg text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-blue-200 active:scale-95 text-left"
                                >
                                  <span>{q}</span><ArrowRight size={10} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/>
                                </button>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                    {m.role!=='user' && <div className="mt-3 pt-2 border-t border-slate-50/10 flex justify-end"><button onClick={async () => { await navigator.clipboard.writeText(cleanText); alert("已复制"); }} className="text-gray-400 hover:text-blue-600"><Copy size={12}/></button></div>}
                  </div>
                </div>
                {m.role==='user' && <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 shrink-0 font-black text-[10px] shadow-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>{user.nickname[0]}</div>}
              </div>
            );
          })}
          {isLoading && <Thinking modelName={model} />}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pb-2 pt-10 z-10">
        <ChatInput onSend={handleChatSubmit} disabled={isLoading} />
      </div>

      {user?.role === 'user' && (
        <div className="fixed right-6 bottom-6 z-40">
            {!isSupportOpen ? (
              <button onClick={()=>setIsSupportOpen(true)} className="w-14 h-14 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-2xl flex items-center justify-center transition-all hover:scale-110 active:scale-95 animate-in zoom-in slide-in-from-bottom-10">
                <MessageCircle size={28} fill="currentColor" className="text-white"/>
                <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white animate-pulse"></span>
              </button>
            ) : (
              <Card className={`w-80 h-[450px] shadow-2xl border-none flex flex-col rounded-[24px] overflow-hidden animate-in zoom-in slide-in-from-bottom-10 origin-bottom-right ${isDarkMode ? 'bg-slate-900' : 'bg-white'}`}>
                 <div className="p-4 bg-blue-600 text-white flex justify-between items-center shrink-0">
                   <div className="flex items-center gap-3">
                     <div className="w-10 h-10 bg-white/20 rounded-full flex items-center justify-center text-xl">👩‍💼</div>
                     <div><div className="font-bold text-sm">Eureka 官方客服</div><div className="text-[10px] opacity-80 flex items-center gap-1"><span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse"></span> 在线中</div></div>
                   </div>
                   <button onClick={()=>setIsSupportOpen(false)} className="opacity-80 hover:opacity-100"><X size={18}/></button>
                 </div>
                 <div className={`flex-1 overflow-y-auto p-4 space-y-3 ${isDarkMode ? 'bg-slate-900' : 'bg-slate-50'}`}>
                   <div className="text-center text-[10px] text-slate-400 my-2">- 官方客服已接入会话 -</div>
                   {supportMessages.map(m => (
                     <div key={m.id} className={`flex ${m.is_admin ? 'justify-start' : 'justify-end'}`}>
                        {m.is_admin && <div className="w-6 h-6 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center text-[10px] font-bold mr-2 mt-1">E</div>}
                        <div className={`max-w-[80%] p-2.5 rounded-2xl text-xs font-medium shadow-sm leading-relaxed ${m.is_admin ? (isDarkMode ? 'bg-slate-800 text-slate-200' : 'bg-white text-slate-800') : 'bg-blue-600 text-white'}`}>{m.content}</div>
                     </div>
                   ))}
                   <div ref={supportScrollRef} />
                 </div>
                 <div className={`p-3 border-t shrink-0 flex gap-2 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}>
                    <Input value={supportInput} onChange={e=>setSupportInput(e.target.value)} onKeyDown={e=>{if(e.key==='Enter') sendSupportMessage()}} placeholder="描述您的问题..." className="h-9 text-xs border-none bg-slate-100 dark:bg-slate-950"/>
                    <Button onClick={sendSupportMessage} size="icon" className="h-9 w-9 bg-blue-600 rounded-xl"><Send size={14}/></Button>
                 </div>
              </Card>
            )}
        </div>
      )}

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}><DialogContent className={`sm:max-w-md p-8 text-center rounded-[32px] shadow-2xl border-none ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className="sr-only"><DialogTitle>充值</DialogTitle></DialogHeader><div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Coins size={32} className="text-white"/></div><h3 className="text-2xl font-black mb-4">充值</h3><div className={`flex p-1 rounded-2xl mb-8 text-[11px] font-black ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}><button onClick={()=>setRechargeTab('card')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='card' ? (isDarkMode ? 'bg-slate-800 shadow text-white' : 'bg-white shadow text-slate-900') : 'text-slate-500'}`}>卡密核销</button><button onClick={()=>setRechargeTab('online')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='online' ? (isDarkMode ? 'bg-slate-800 shadow text-white' : 'bg-white shadow text-slate-900') : 'text-slate-500'}`}>在线支付</button></div>{rechargeTab === 'card' ? (<div className="space-y-4 animate-in fade-in duration-300"><Input id="card-input" placeholder="BOSS-XXXX-XXXX-XXXX" className={`text-center font-mono uppercase h-12 border-none text-base tracking-widest rounded-2xl ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`} /><Button onClick={redeemCard} className="w-full bg-blue-600 h-12 rounded-2xl font-black text-white shadow-xl border-none active:scale-95 transition-all">立即核销</Button></div>) : (<div className={`p-4 rounded-2xl border text-left ${isDarkMode ? 'bg-orange-900/20 border-orange-900/50 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700'}`}><p className="text-[11px] font-bold">维护中，请使用卡密。</p></div>)}</DialogContent></Dialog>
      <Dialog open={!!selectedAdminUser} onOpenChange={() => setSelectedAdminUser(null)}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-2xl font-black">{selectedAdminUser?.nickname} 详情</DialogTitle><div className="text-right text-green-500 font-black text-3xl">${selectedAdminUser?.balance}</div></DialogHeader>{selectedAdminUser && <div className="flex-1 overflow-y-auto p-8 space-y-3">{(adminUserTx.length > 0 ? adminUserTx : []).map((tx:any) => (<div key={tx.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col gap-1"><span className="text-xs font-bold">{tx.description}</span><span className="text-xs font-mono opacity-60 flex items-center gap-1"><FileText size={10}/> {tx.time}</span></div><span className={`font-bold ${tx.type==='consume'?'text-red-500':'text-green-500'}`}>{tx.type==='consume'?'-':'+'}${tx.amount}</span></div>))}{adminUserTx.length === 0 && <div className="text-center text-xs opacity-50 py-10">暂无消费记录</div>}</div>}</DialogContent></Dialog>
    </div>
  );
}