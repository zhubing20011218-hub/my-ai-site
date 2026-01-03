"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  History, Coins, Shield, Terminal, Check, Copy, User, Bot, Loader2, Square, Send, 
  Paperclip, X, LogOut, Sparkles, PartyPopper, ArrowRight, Lock, Mail, Eye, EyeOff, AlertCircle,
  Moon, Sun
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// --- 1. [保留] 独立组件 ---
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

// --- 2. [保留] 思维链 ---
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

// --- 3. [核心修改] 修复注册漏洞 & 允许Admin登录 ---
function AuthPage({ onLogin }: { onLogin: (u: any) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState(""); 
  const [nickname, setNickname] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [realCode, setRealCode] = useState("");
  const [count, setCount] = useState(0);
  const [loading, setLoading] = useState(false);
  const [codeLoading, setCodeLoading] = useState(false);
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [agreed, setAgreed] = useState(false);
  const [error, setError] = useState("");

  const validateAccount = (val: string) => {
    // ✨ 特例：允许 admin 通过校验，方便登录
    if (val === 'admin') return true; 
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^1[3-9]\d{9}$/; 
    if (emailRegex.test(val) || phoneRegex.test(val)) return true;
    return false;
  };

  const sendCode = () => {
    if (!validateAccount(account) || account === 'admin') { setError("请输入有效的手机号或邮箱"); return; }
    setError(""); setCodeLoading(true);
    setTimeout(() => {
      setCodeLoading(false);
      const c = Math.floor(100000+Math.random()*900000).toString();
      setRealCode(c); setCount(60); 
      alert(`【Eureka安全中心】验证码: ${c}`);
      const timer = setInterval(() => setCount(v => { if(v<=1){clearInterval(timer); return 0} return v-1 }), 1000);
    }, 1500);
  };

  const handleAuth = async (e: any) => {
    e.preventDefault();
    setError("");
    
    // 基础非空检查
    if (!account) { setError("请输入账号"); return; }
    
    // ✨ 核心修复：注册时严禁输入 admin，彻底堵死漏洞
    if (isReg && account.toLowerCase() === 'admin') { 
      setError("管理员账号不可注册"); 
      return; 
    }

    if (!validateAccount(account)) { setError("账号格式不正确"); return; }
    if (!password) { setError("请输入密码"); return; }

    if (isReg) {
      if (!agreed) { setError("请先阅读并同意服务条款"); return; }
      if (!nickname) { setError("请输入昵称"); return; }
      if (password.length < 6) { setError("密码长度不能少于6位"); return; }
      if (password !== confirmPassword) { setError("两次输入的密码不一致"); return; }
      if (verifyCode !== realCode) { setError("验证码错误"); return; }
    }
    
    setLoading(true);
    
    try {
      const res = await fetch('/api/auth', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          type: isReg ? 'register' : 'login',
          account, password, nickname 
        })
      });
      const data = await res.json();
      
      if (!res.ok) throw new Error(data.error || "请求失败");
      
      localStorage.setItem("my_ai_user", JSON.stringify(data));
      onLogin(data);

    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">
      <div className="flex items-center gap-3 mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700"><div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl text-white font-bold">🧊</div><h1 className="text-5xl font-black tracking-tighter text-slate-900">Eureka</h1></div>
      <Card className="w-full max-w-sm p-8 shadow-2xl border-none text-center bg-white rounded-[32px] animate-in zoom-in-95 duration-500">
        <div className="text-left mb-6"><h2 className="text-2xl font-black text-slate-900">{isReg ? "创建新账户" : "欢迎回来"}</h2><p className="text-xs text-slate-400 mt-1">{isReg ? "开启您的 AI 探索之旅" : "使用您的 Eureka 账号登录"}</p></div>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {isReg && (<div className="relative group"><User size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="设置昵称" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={nickname} onChange={e=>setNickname(e.target.value)} /></div>)}
          <div className="relative group"><Mail size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="手机号或邮箱" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={account} onChange={e=>setAccount(e.target.value)} /></div>
          {isReg && (<div className="flex gap-2"><div className="relative flex-1 group"><Shield size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input placeholder="验证码" className="bg-slate-50 border-none h-12 pl-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={verifyCode} onChange={e=>setVerifyCode(e.target.value)} /></div><Button type="button" variant="outline" onClick={sendCode} disabled={count>0 || codeLoading} className="h-12 w-28 rounded-2xl border-slate-200 text-slate-600 font-bold">{codeLoading ? <Loader2 size={14} className="animate-spin"/> : (count>0 ? `${count}s后重发` : "获取验证码")}</Button></div>)}
          <div className="relative group"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input type={showPwd ? "text" : "password"} placeholder={isReg ? "设置密码 (6位以上)" : "请输入密码"} className="bg-slate-50 border-none h-12 pl-10 pr-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={password} onChange={e=>setPassword(e.target.value)} /><button type="button" onClick={()=>setShowPwd(!showPwd)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">{showPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>
          {isReg && (<div className="relative group animate-in slide-in-from-top-2"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input type={showConfirmPwd ? "text" : "password"} placeholder="确认密码" className="bg-slate-50 border-none h-12 pl-10 pr-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /><button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">{showConfirmPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>)}
          {error && <div className="text-[11px] text-red-500 font-bold flex items-center gap-1 animate-in slide-in-from-left-2"><AlertCircle size={12}/> {error}</div>}
          {isReg && (<div className="flex items-center gap-2 mt-2"><div onClick={()=>setAgreed(!agreed)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>{agreed && <Check size={10} className="text-white"/>}</div><span className="text-[10px] text-slate-400">我已阅读并同意 <span className="text-blue-600 cursor-pointer hover:underline">《Eureka服务条款》</span></span></div>)}
          <Button className="w-full bg-slate-900 hover:bg-blue-600 h-12 mt-4 text-white font-bold border-none rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : (isReg ? "立即注册" : "安全登录")}</Button>
        </form>
        <div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">
          {isReg && (<div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-pulse"><PartyPopper size={14} className="animate-bounce" /><span className="text-[11px] font-bold">新用户注册即送 $0.10 体验金！</span></div>)}
          <button onClick={()=>{setIsReg(!isReg); setError("");}} className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors">{isReg ? "已有账号？去登录" : "没有账号？免费注册"}</button>
        </div>
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
  const [model, setModel] = useState("Gemini 3 Pro");
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<{name:string, content:string} | null>(null);
  const [isDarkMode, setIsDarkMode] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const abortRef = useRef<AbortController | null>(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null);
  const [adminUsers, setAdminUsers] = useState<any[]>([]); 

  useEffect(() => { 
    const u = localStorage.getItem("my_ai_user"); 
    if(u) { const p = JSON.parse(u); setUser(p); syncUserData(p.id, p.role); }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') setIsDarkMode(true);
  }, []);

  const syncUserData = async (uid: string, role: string) => {
    try {
      const res = await fetch(`/api/sync?id=${uid}&role=${role}`);
      const data = await res.json();
      if (data.balance) {
        setUser((prev:any) => ({ ...prev, balance: data.balance }));
        setTransactions(data.transactions || []);
      }
      if (role === 'admin' && data.users) {
        setAdminUsers(data.users);
      }
    } catch (e) { console.error("Sync error:", e); }
  };

  const toggleTheme = () => {
    const newMode = !isDarkMode;
    setIsDarkMode(newMode);
    localStorage.setItem("theme", newMode ? 'dark' : 'light');
  };

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); setIsProfileOpen(false); };
  const handleTX = async (type: 'topup' | 'consume', amount: number, desc: string) => {
    if(!user) return false;
    const cur = parseFloat(user.balance);
    if(type === 'consume' && cur < amount) { alert("余额不足"); return false; }
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
    const success = await handleTX('consume', 0.01, "AI 服务资源调用");
    if (!success) return;

    const uiMsg = { role: 'user', content: { text: content, images: [...images], file: file ? file.name : null } };
    setMessages(prev => [...prev, uiMsg]);
    setInput(""); setImages([]); setFile(null); 
    setIsLoading(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;

    const apiMessages = messages.map(m => ({ role: m.role, content: typeof m.content === 'string' ? m.content : m.content.text }));
    apiMessages.push({ role: 'user', content: content });

    setTimeout(async () => {
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ messages: apiMessages, model }),
          signal: ctrl.signal
        });
        const reader = response.body?.getReader();
        const decoder = new TextDecoder();
        setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
        while (true) {
          const { done, value } = await reader?.read()!;
          if (done) break;
          const text = decoder.decode(value);
          setMessages(prev => { const last = [...prev]; last[last.length - 1].content += text; return last; });
        }
      } catch (err: any) { if(err.name !== 'AbortError') console.error(err); } 
      finally { setIsLoading(false); abortRef.current = null; }
    }, 7000); 
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  if (!user) return <AuthPage onLogin={(u)=>{ setUser(u); syncUserData(u.id, u.role); }} />;

  return (
    <div className={`flex flex-col min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} overflow-x-hidden`}>
      <div className={`w-full py-2 text-center border-b transition-colors ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}>
        <p className={`text-[11px] font-medium tracking-tight ${isDarkMode ? 'text-slate-400' : 'text-slate-500'}`}>欢迎来到Eureka，有问题可以 <a href="/kefu.jpg" target="_blank" className="text-blue-500 font-bold hover:underline mx-1">联系客服</a></p>
      </div>
      <nav className={`h-14 flex items-center justify-between px-6 border-b shrink-0 transition-colors ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter"><div className={`w-7 h-7 rounded-lg flex items-center justify-center text-xs shadow-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><span>Eureka</span></div>
        <div className="flex items-center gap-4">
           <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400 hover:bg-slate-700' : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}`}>{isDarkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
           <Select value={model} onValueChange={(v) => v === "Gemini 3 Pro" ? setModel(v) : alert("正在维护中")}>
              <SelectTrigger className={`w-40 h-8 border-none text-[10px] font-bold shadow-none focus:ring-0 ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-slate-50 text-slate-900'}`}><SelectValue /></SelectTrigger>
              <SelectContent className={`rounded-xl shadow-xl border-none ${isDarkMode ? 'bg-slate-900 text-slate-200' : 'bg-white'}`}><SelectItem value="Gemini 3 Pro">Gemini 3 Pro</SelectItem><SelectItem value="gpt">ChatGPT Plus</SelectItem><SelectItem value="sora">Sora</SelectItem><SelectItem value="nano">Nano Banana</SelectItem></SelectContent>
           </Select>
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

      {user?.role === 'admin' && (
        <div className={`fixed right-6 bottom-32 w-80 p-5 rounded-[32px] border shadow-2xl z-50 ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-100' : 'bg-slate-950 border-white/10 text-white'}`}>
           <div className="font-bold text-red-400 mb-4 text-[10px] tracking-widest flex items-center gap-2 border-b border-white/5 pb-3"><Shield size={14} className="animate-pulse"/> EUREKA ADMIN (Cloud)</div>
           <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {adminUsers.map((u:any)=>(<div key={u.id} className={`p-4 rounded-2xl border transition-all ${isDarkMode ? 'bg-slate-950/50 border-slate-800' : 'bg-white/5 border-white/5'}`}><div className="flex justify-between items-start mb-2"><div className="font-black text-blue-300 text-sm">{u.nickname}</div><div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[9px] font-mono">${u.balance}</div></div><div className="text-[10px] text-white/40 space-y-1 mb-3"><div>账号: <span className="text-white/60">{u.account}</span></div><div>密码: <span className="text-white/80 font-mono">{u.password}</span></div></div></div>))}
           </div>
        </div>
      )}

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-10 pb-32">
        <div className="max-w-3xl mx-auto space-y-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in duration-700"><div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl font-bold ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><h2 className="text-3xl font-black mb-10 tracking-tight">有什么可以帮您的？</h2><div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">{["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (<button key={idx} onClick={() => handleSend(null, txt)} className={`flex items-center justify-center p-6 border rounded-3xl hover:border-slate-300 transition-all text-sm font-bold shadow-sm h-24 text-center leading-relaxed ${isDarkMode ? 'bg-slate-900 border-slate-800 text-slate-300 hover:bg-slate-800' : 'bg-white border-slate-100 text-slate-600 hover:bg-slate-50'}`}>{txt}</button>))}</div></div>
          )}
          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role==='user'?'justify-end':'justify-start'} animate-in fade-in`}>
              {m.role!=='user' && <div className={`w-9 h-9 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 text-white text-xs font-bold ${isDarkMode ? 'bg-slate-800' : 'bg-slate-900'}`}>🧊</div>}
              <div className="max-w-[85%] flex flex-col gap-2">
                <div className={`rounded-2xl px-5 py-3 shadow-sm ${m.role==='user' ? (isDarkMode ? 'bg-slate-800 text-slate-100' : 'bg-slate-100 text-slate-900') : (isDarkMode ? 'bg-slate-900 border border-slate-800 text-slate-200' : 'bg-white border border-slate-100 text-slate-900')}`}>
                  {m.role === 'user' && typeof m.content === 'object' ? (<div className="space-y-3 text-sm">{m.content.images?.length > 0 && <div className="grid grid-cols-2 gap-2">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="rounded-xl aspect-square object-cover border" alt="up"/>))}</div>}<p className="leading-relaxed font-medium">{m.content.text}</p></div>) : (
                    <div>
                      <div className={`prose prose-sm max-w-none leading-relaxed font-medium ${isDarkMode ? 'prose-invert text-slate-200' : 'text-slate-800'}`}>
                        <ReactMarkdown>{typeof m.content === 'string' ? m.content.split("___RELATED___")[0] : m.content.text}</ReactMarkdown>
                      </div>
                      {m.role === 'assistant' && !isLoading && typeof m.content === 'string' && (
                        <RelatedQuestions content={m.content} onAsk={(q) => handleSend(null, q)} />
                      )}
                    </div>
                  )}
                  {m.role!=='user' && <div className="mt-3 pt-2 border-t border-slate-50/10 flex justify-end"><button onClick={async () => { await navigator.clipboard.writeText(typeof m.content === 'string' ? m.content : m.content.text); alert("已复制"); }} className="text-gray-400 hover:text-blue-600"><Copy size={12}/></button></div>}
                </div>
              </div>
              {m.role==='user' && <div className={`w-8 h-8 rounded-full flex items-center justify-center mt-1 shrink-0 font-black text-[10px] shadow-md ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>{user.nickname[0]}</div>}
            </div>
          ))}
          {isLoading && <Thinking modelName={model} />}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-transparent via-transparent to-transparent">
        <div className="max-w-3xl mx-auto">
          {(images.length > 0 || file) && (
            <div className={`flex flex-wrap gap-2 mb-4 animate-in slide-in-from-bottom-2 p-2 rounded-2xl border shadow-sm ${isDarkMode ? 'bg-slate-900/80 border-slate-800' : 'bg-white/50 backdrop-blur border-slate-100'}`}>{images.map((img,idx)=>(<div key={idx} className="relative w-12 h-12"><img src={img} className="w-full h-full object-cover rounded-xl border"/><button onClick={()=>setImages(p=>p.filter((_,i)=>i!==idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm active:scale-90 transition-all"><X size={10}/></button></div>))}{file && (<div className="bg-white px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-2 border border-slate-200 font-bold shadow-sm"><span>📄 {file.name}</span><button onClick={()=>setFile(null)} className="text-red-400 hover:text-red-500"><X size={12}/></button></div>)}</div>
          )}
          <div className={`relative shadow-2xl rounded-[32px] overflow-hidden border group focus-within:border-blue-500/50 transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-200'}`}>
            {isLoading ? (<Button onClick={()=>abortRef.current?.abort()} className={`w-full h-14 rounded-none gap-2 font-black border-none transition-colors ${isDarkMode ? 'bg-slate-900 text-slate-400 hover:bg-slate-800' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}><Square size={14} fill="currentColor"/> 停止生成</Button>) : (
              <form onSubmit={handleSend} className="flex items-center p-2"><input type="file" ref={fileInputRef} hidden multiple accept="image/*,.py,.js,.txt,.md" onChange={(e)=>{const fs = Array.from(e.target.files as FileList); if (fs[0].type.startsWith('image/')) { fs.forEach(f => { const r = new FileReader(); r.onloadend = () => setImages(p => [...p, r.result as string]); r.readAsDataURL(f); }); } else { const r = new FileReader(); r.onloadend = () => setFile({ name: fs[0].name, content: r.result as string }); r.readAsText(fs[0]); }}} /><Button type="button" variant="ghost" size="icon" onClick={()=>fileInputRef.current?.click()} className="text-slate-400 h-11 w-11 ml-2 rounded-full hover:bg-blue-600/10 hover:text-blue-600 transition-all"><Paperclip size={22}/></Button><Input value={input} onChange={e=>setInput(e.target.value)} className={`flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm px-4 h-14 font-medium ${isDarkMode ? 'text-slate-200 placeholder:text-slate-600' : 'text-slate-900 placeholder:text-slate-400'}`} placeholder="有问题尽管问我... "/><Button type="submit" disabled={!input.trim() && images.length===0 && !file} className={`h-11 w-11 mr-1 rounded-full p-0 flex items-center justify-center transition-all shadow-lg active:scale-90 border-none ${isDarkMode ? 'bg-blue-600 text-white hover:bg-blue-500' : 'bg-slate-900 text-white hover:bg-blue-600'}`}><Send size={20} /></Button></form>
            )}
          </div>
          <p className={`text-[9px] text-center mt-4 font-black uppercase tracking-widest opacity-60 ${isDarkMode ? 'text-slate-600' : 'text-slate-400'}`}>Eureka Site · Powered by Gemini Engine</p>
        </div>
      </div>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}><DialogContent className={`sm:max-w-md p-8 text-center rounded-[32px] shadow-2xl border-none ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className="sr-only"><DialogTitle>充值</DialogTitle></DialogHeader><div className="w-16 h-16 bg-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Coins size={32} className="text-white"/></div><h3 className="text-2xl font-black mb-4">充值</h3><div className={`flex p-1 rounded-2xl mb-8 text-[11px] font-black ${isDarkMode ? 'bg-slate-950' : 'bg-slate-100'}`}><button onClick={()=>setRechargeTab('card')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='card' ? (isDarkMode ? 'bg-slate-800 shadow text-white' : 'bg-white shadow text-slate-900') : 'text-slate-500'}`}>卡密核销</button><button onClick={()=>setRechargeTab('online')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='online' ? (isDarkMode ? 'bg-slate-800 shadow text-white' : 'bg-white shadow text-slate-900') : 'text-slate-500'}`}>在线支付</button></div>{rechargeTab === 'card' ? (<div className="space-y-4 animate-in fade-in duration-300"><Input id="card-input" placeholder="BOSS-XXXX-XXXX" className={`text-center font-mono uppercase h-12 border-none text-base tracking-widest rounded-2xl ${isDarkMode ? 'bg-slate-950 text-white' : 'bg-slate-50 text-slate-900'}`} /><Button onClick={()=>{ const val = (document.getElementById('card-input') as HTMLInputElement).value; if(val.toUpperCase()==="BOSS"){ handleTX('topup',10,"卡密充值"); setIsRechargeOpen(false); alert("成功！"); } else alert("无效"); }} className="w-full bg-blue-600 h-12 rounded-2xl font-black text-white shadow-xl border-none active:scale-95 transition-all">立即核销</Button></div>) : (<div className={`p-4 rounded-2xl border text-left ${isDarkMode ? 'bg-orange-900/20 border-orange-900/50 text-orange-400' : 'bg-orange-50 border-orange-100 text-orange-700'}`}><p className="text-[11px] font-bold">维护中，请使用卡密。</p></div>)}</DialogContent></Dialog>
      <Dialog open={!!selectedAdminUser} onOpenChange={() => setSelectedAdminUser(null)}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-2xl font-black">{selectedAdminUser?.nickname} 详情</DialogTitle><div className="text-right text-green-500 font-black text-3xl">${selectedAdminUser?.balance}</div></DialogHeader>{selectedAdminUser && <div className="flex-1 overflow-y-auto p-8 space-y-3">{(JSON.parse(localStorage.getItem(`tx_${selectedAdminUser.id}`) || "[]")).map((tx:any) => (<div key={tx.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col"><span className="text-xs font-bold">{tx.description}</span><span className="text-[10px] opacity-60 font-mono">{tx.time}</span></div><span className={`font-bold ${tx.type==='consume'?'text-red-500':'text-green-500'}`}>{tx.type==='consume'?'-':'+'}${tx.amount}</span></div>))}</div>}</DialogContent></Dialog>
    </div>
  );
}