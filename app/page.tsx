"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import ChatInput from "@/components/ChatInput" 
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { 
  History, Shield, Terminal, Check, Copy, User, Loader2, Send, 
  X, LogOut, Sparkles, PartyPopper, ArrowRight, ArrowLeft, Lock, Mail, Eye, EyeOff, AlertCircle,
  Moon, Sun, FileText, CreditCard, Plus, MessageCircle, RefreshCw, Server, Trash2
} from "lucide-react"
import ReactMarkdown from 'react-markdown'
import * as XLSX from 'xlsx';
import mammoth from 'mammoth';

type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// ✅ 模型定价表
const MODEL_PRICING: Record<string, number> = {
  "gemini-2.0-flash-exp": 0.01,
  "gemini-1.5-pro": 0.05,
  "gemini-2.0-flash-thinking-exp": 0.10,
  "sora-v1": 2.50,
  "veo-google": 1.80,
  "banana-sdxl": 0.20,
};

// ✅ 推荐问题组件
function RelatedQuestions({ content, onAsk }: { content: string, onAsk: (q: string) => void }) {
  if (!content || typeof content !== 'string' || !content.includes("___RELATED___")) return null;
  try {
    const parts = content.split("___RELATED___");
    if (parts.length < 2) return null;
    const questions = parts[1].split("|").map(q => q.trim()).filter(q => q.length > 0);
    if (questions.length === 0) return null;
    return (
      <div className="mt-4 pt-3 border-t border-slate-200/20 grid gap-3">
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

// ✅ 思维链组件
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
    <div className="flex gap-4 my-8">
      <div className="w-9 h-9 bg-slate-900 dark:bg-slate-800 rounded-xl flex items-center justify-center shrink-0 shadow-lg border border-white/10 text-white text-xs">🧊</div>
      <div className="bg-slate-50 dark:bg-slate-900 border border-slate-100 dark:border-slate-800 rounded-[24px] p-5 shadow-sm w-full max-w-md">
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 dark:border-slate-800 pb-3 mb-4"><Terminal size={10}/> <span>Eureka 使用 {modelName} 处理引擎</span></div>
        <div className="space-y-4">{plan.map((item, i) => (<div key={i} className={`transition-all duration-500 ${i > major ? 'opacity-20' : 'opacity-100'}`}><div className="flex items-center gap-2 mb-2"><div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${i < major ? 'bg-green-500 border-green-500 text-white' : i === major ? 'border-blue-500 text-blue-600 animate-pulse' : 'text-slate-300'}`}>{i < major ? <Check size={10} /> : i + 1}</div><span className={`text-[12px] font-black ${i === major ? 'text-slate-900 dark:text-slate-100' : 'text-slate-500'}`}>{item.title}</span></div><div className="ml-6 space-y-1.5 border-l-2 border-slate-100 dark:border-slate-800 pl-4">{item.steps.map((step, j) => (<div key={j} className={`flex items-center gap-2 text-[10px] transition-all duration-300 ${(i < major || (i === major && j <= minor)) ? 'opacity-100' : 'opacity-0'}`}><div className="w-1 h-1 rounded-full bg-slate-300" /><span className="text-slate-400 font-medium">{j + 1}. {step}</span></div>))}</div></div>))}</div>
      </div>
    </div>
  );
}

// ✅ 登录/注册组件
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
      <div className="flex items-center gap-3 mb-8"><div className="w-14 h-14 bg-slate-900 rounded-2xl flex items-center justify-center text-4xl shadow-2xl text-white font-bold">🧊</div><h1 className="text-5xl font-black tracking-tighter text-slate-900">Eureka</h1></div>
      <Card className="w-full max-w-sm p-8 shadow-2xl border-none text-center bg-white rounded-[32px]">
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
          {(authMode === 'register' || authMode === 'forgot') && (<div className="relative group"><Lock size={16} className="absolute left-4 top-3.5 text-slate-400 group-focus-within:text-blue-600 transition-colors"/><Input type={showConfirmPwd ? "text" : "password"} placeholder="确认密码" className="bg-slate-50 border-none h-12 pl-10 pr-10 rounded-2xl focus-visible:ring-1 focus-visible:ring-blue-600 text-slate-900" value={confirmPassword} onChange={e=>setConfirmPassword(e.target.value)} /><button type="button" onClick={()=>setShowConfirmPwd(!showConfirmPwd)} className="absolute right-4 top-3.5 text-slate-400 hover:text-slate-600">{showConfirmPwd ? <EyeOff size={16}/> : <Eye size={16}/>}</button></div>)}
          {authMode === 'login' && (<div className="flex justify-end mt-1"><button type="button" onClick={()=>{setAuthMode('forgot'); setError("");}} className="text-[11px] text-slate-400 hover:text-blue-600 font-bold transition-colors">忘记密码？</button></div>)}
          {error && <div className="text-[11px] text-red-500 font-bold flex items-center gap-1"><AlertCircle size={12}/> {error}</div>}
          {authMode === 'register' && (<div className="flex items-center gap-2 mt-2"><div onClick={()=>setAgreed(!agreed)} className={`w-4 h-4 rounded border flex items-center justify-center cursor-pointer transition-colors ${agreed ? 'bg-blue-600 border-blue-600' : 'border-slate-300 bg-white'}`}>{agreed && <Check size={10} className="text-white"/>}</div><span className="text-[10px] text-slate-400">我已阅读并同意 <span className="text-blue-600 cursor-pointer hover:underline">《Eureka服务条款》</span></span></div>)}
          <Button className="w-full bg-slate-900 hover:bg-blue-600 h-12 mt-4 text-white font-bold border-none rounded-2xl shadow-xl shadow-slate-200 transition-all active:scale-95" disabled={loading}>{loading ? <Loader2 className="animate-spin"/> : (authMode === 'login' ? "安全登录" : (authMode === 'register' ? "立即注册" : "重置密码"))}</Button>
        </form>
        {authMode !== 'forgot' && (<div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">{authMode === 'register' && (<div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-pulse"><PartyPopper size={14} className="animate-bounce" /><span className="text-[11px] font-bold">新用户注册即送 $0.10 体验金！</span></div>)}<button onClick={()=>{setAuthMode(authMode==='login'?'register':'login'); setError("");}} className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors">{authMode === 'login' ? "没有账号？免费注册" : "已有账号？去登录"}</button></div>)}
      </Card>
      <p className="mt-8 text-[10px] text-slate-300 font-mono">Eureka Secure Auth System © 2026</p>
    </div>
  );
}

// ✅ [完整修正版] 主程序：包含侧边栏、隐私修复、用户头像、多模态发送(含文档解析、文件显示、图片修复)
export default function Home() {
  // --- 🆕 记忆与侧边栏状态 ---
  const [user, setUser] = useState<any>(null);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // 侧边栏开关
  const [chatList, setChatList] = useState<any[]>([]); // 历史记录列表
  const [currentChatId, setCurrentChatId] = useState<string | null>(null); // 当前对话ID
  
  // 原有状态保留
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gemini-2.0-flash-exp");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  // Admin 相关状态
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

  const parseMessageContent = (content: any) => {
    let rawText = typeof content === 'string' ? content : content.text;
    if (!rawText) return { cleanText: '', suggestions: [] };
    const START_TAG = '<<<SUGGESTIONS_START>>>';
    const END_TAG = '<<<SUGGESTIONS_END>>>';
    const parts = rawText.split(START_TAG);
    const cleanText = parts[0]; 
    let suggestions: string[] = [];
    if (parts[1]) { try { const jsonStr = parts[1].split(END_TAG)[0]; suggestions = JSON.parse(jsonStr); } catch (e) {} }
    return { cleanText, suggestions };
  };

  // --- 初始化与同步 ---
  useEffect(() => { 
    const u = localStorage.getItem("my_ai_user"); 
    if(u) { 
        const p = JSON.parse(u); 
        setUser(p); 
        syncUserData(p.id, p.role);
        fetchChatList(p.id); // 登录后拉取历史列表
    }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') setIsDarkMode(true);
    
    // 移动端自动收起侧边栏
    if (typeof window !== 'undefined' && window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  // --- 🆕 记忆功能核心逻辑 ---
  
  // 1. 获取左侧列表
  const fetchChatList = async (uid: string) => {
    try {
        const res = await fetch(`/api/history?userId=${uid}`);
        const data = await res.json();
        if(data.chats) setChatList(data.chats);
    } catch(e) { console.error("Fetch history failed", e); }
  };

  // 2. 加载某个具体对话
  const loadChat = async (chatId: string) => {
    if (isLoading) return; // 防止生成中切换
    setCurrentChatId(chatId);
    setMessages([]); // 先清空，给用户反应
    if (window.innerWidth < 768) setIsSidebarOpen(false); // 移动端点击后收起
    try {
        const res = await fetch(`/api/history?chatId=${chatId}`, { method: 'PUT' });
        const data = await res.json();
        if (data.chat && data.chat.messages) {
            setMessages(data.chat.messages);
        }
    } catch(e) { console.error("Load chat failed", e); }
  };

  // 3. 开启新对话
  const startNewChat = () => {
    if (isLoading) return;
    setCurrentChatId(null);
    setMessages([]);
    if (window.innerWidth < 768) setIsSidebarOpen(false);
  };

  // 4. 删除对话
  const deleteChat = async (e: any, chatId: string) => {
      e.stopPropagation();
      if(!confirm("确定删除这条记录吗？")) return;
      await fetch(`/api/history?chatId=${chatId}`, { method: 'DELETE' });
      if (currentChatId === chatId) startNewChat();
      if (user) fetchChatList(user.id);
  }

  // --- 隐私修复：退出登录逻辑 ---
  const handleLogout = () => { 
      localStorage.removeItem("my_ai_user"); 
      setUser(null); 
      setIsProfileOpen(false); 
      
      // 清空当前屏幕上的对话
      setMessages([]); 
      // 清空左侧历史记录列表
      setChatList([]); 
      // 重置当前对话ID
      setCurrentChatId(null); 
  };

  // --- 原有辅助功能保留 ---
  const syncUserData = async (uid: string, role: string) => { try { const res = await fetch(`/api/sync?id=${uid}&role=${role}`); const data = await res.json(); if (data.balance) { setUser((prev:any) => ({ ...prev, balance: data.balance })); setTransactions(data.transactions || []); } if (role === 'admin' && data.users) setAdminUsers(data.users); } catch (e) { console.error("Sync error:", e); } };
  const handleTX = async (type: 'topup' | 'consume', amount: number, desc: string) => { if(!user) return false; if (user.role === 'admin') return true; const cur = parseFloat(user.balance); if(type === 'consume' && cur < amount) { alert(`余额不足！需要 $${amount}`); return false; } try { const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type, amount, description: desc }) }); const data = await res.json(); if (!res.ok) { alert(data.error); return false; } setUser((prev:any) => ({ ...prev, balance: data.balance })); syncUserData(user.id, user.role); return true; } catch (e) { alert("网络错误"); return false; } };
  const toggleTheme = () => { const newMode = !isDarkMode; setIsDarkMode(newMode); localStorage.setItem("theme", newMode ? 'dark' : 'light'); };
  
  // 客服相关
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

  const fetchSupportSessions = async () => { try { const res = await fetch('/api/support?action=list'); const data = await res.json(); if(data.sessions) setSupportSessions(data.sessions); } catch(e) {} };
  const sendSupportMessage = async () => { if(!supportInput.trim()) return; const targetUserId = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id; try { await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: targetUserId, content: supportInput, isAdmin: user.role === 'admin' }) }); setSupportInput(""); const res = await fetch(`/api/support?action=history&userId=${targetUserId}`); const data = await res.json(); if (data.messages) setSupportMessages(data.messages); } catch(e) { alert("发送失败"); } };
  
  // Admin相关
  const openAdminDetail = async (targetUser: any) => { setSelectedAdminUser(targetUser); setAdminUserTx([]); try { const res = await fetch(`/api/sync?id=${targetUser.id}`); const data = await res.json(); if (data.transactions) setAdminUserTx(data.transactions); } catch (e) { alert("获取详情失败"); } };
  const fetchCards = async () => { try { const res = await fetch('/api/admin/cards'); const data = await res.json(); if(data.cards) setCards(data.cards); } catch(e) { console.error(e); } };
  const generateCards = async () => { try { const res = await fetch('/api/admin/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardConfig) }); const data = await res.json(); if(data.success) { alert(`成功生成 ${data.count} 张卡密！`); fetchCards(); } else alert(data.error); } catch(e) { alert("生成失败"); } };
  const redeemCard = async () => { const code = (document.getElementById('card-input') as HTMLInputElement).value; if(!code) return alert("请输入卡密"); try { const res = await fetch('/api/card/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, code }) }); const data = await res.json(); if(data.success) { alert(`充值成功！到账 $${data.amount}`); setUser((prev:any) => ({ ...prev, balance: data.balance })); syncUserData(user.id, user.role); setIsRechargeOpen(false); } else { alert(data.error); } } catch(e) { alert("网络请求失败"); } };

  // --- 核心逻辑：发送与AI对话 (已更新支持多模态解析) ---
  
  // 1. 给欢迎页/推荐问题用的简单发送入口
  const handleSendSimple = async (text: string) => {
    await handleChatSubmit(text, [], model, "general"); 
  };

  // 2. 核心发送逻辑 (对接 ChatInput)
  const handleChatSubmit = async (
    text: string, 
    attachments: File[] = [], 
    modelId: string = "gemini-2.0-flash-exp",
    roleId: string = "general" 
  ) => {
    setModel(modelId);
    
    // 1. 扣费
    const cost = MODEL_PRICING[modelId] || 0.01;
    const success = await handleTX('consume', cost, `使用 ${modelId}`);
    if (!success) return; 

    setIsLoading(true);

    // 2. 预处理文件 (关键修改：解析 Word 和 Excel，并记录文件信息用于UI显示)
    const processedImages: string[] = [];
    const fileInfos: {name: string, type: string}[] = []; 
    let appendedText = text; 

    if (attachments.length > 0) {
      for (const file of attachments) {
        // 记录文件信息
        fileInfos.push({ name: file.name, type: file.type });

        // A. 图片 -> Base64
        if (file.type.startsWith("image/")) {
          const reader = new FileReader();
          const base64 = await new Promise<string>((resolve) => { 
            reader.onload = (e) => resolve(e.target?.result as string); 
            reader.readAsDataURL(file); 
          });
          processedImages.push(base64);
        } 
        // B. Word 文档 (.docx) -> 提取纯文本
        else if (file.name.endsWith(".docx")) {
           try {
             const arrayBuffer = await file.arrayBuffer();
             const result = await mammoth.extractRawText({ arrayBuffer });
             appendedText += `\n\n=== Word文档内容 (${file.name}) ===\n${result.value}\n`;
           } catch(e) {
             console.error(e);
             alert(`解析 Word 文档失败: ${file.name}`);
           }
        }
        // C. Excel 表格 (.xlsx, .xls) -> 提取为 CSV 文本
        else if (file.name.endsWith(".xlsx") || file.name.endsWith(".xls")) {
           try {
             const arrayBuffer = await file.arrayBuffer();
             const workbook = XLSX.read(arrayBuffer);
             const sheetName = workbook.SheetNames[0]; // 只读取第一个 sheet
             const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[sheetName]);
             appendedText += `\n\n=== 表格数据 (${file.name}) ===\n${csv}\n`;
           } catch(e) {
             console.error(e);
             alert(`解析 Excel 表格失败: ${file.name}`);
           }
        }
        // D. 纯文本/代码文件 -> 直接读取
        else if (
            file.type === "text/plain" || file.name.endsWith(".txt") || file.name.endsWith(".csv") || 
            file.name.endsWith(".md") || file.name.endsWith(".json") || file.name.endsWith(".js") || file.name.endsWith(".py")
        ) {
           const reader = new FileReader();
           const textContent = await new Promise<string>((resolve) => {
             reader.onload = (e) => resolve(e.target?.result as string);
             reader.readAsText(file);
           });
           appendedText += `\n\n[文件内容 ${file.name}]:\n${textContent}\n`;
        } 
        // E. 其他格式
        else {
           alert(`暂不支持解析 ${file.name}，请复制内容粘贴。`);
        }
      }
    }

    // 3. 乐观UI更新 (在界面上显示文件卡片)
    const newUserMsg = { 
        role: 'user', 
        content: { text: text, images: processedImages, fileInfos: fileInfos } 
    };
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory); 

    // 4. 构造API请求数据 (✅ 修复：把图片塞回 content 里面！)
    const historyForAi = newHistory.map(m => ({
      role: m.role,
      content: { 
         // 如果是当前用户发的消息，用处理后的 appendedText；否则用历史记录
         text: (m === newUserMsg) ? appendedText : (typeof m.content === 'string' ? m.content : m.content.text),
         // ✅ 关键：确保 images 属性存在，哪怕是空数组
         images: (m.content as any).images || []
      }
    }));

    // 5. 调用 AI
    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: historyForAi, model: modelId, persona: roleId }),
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
      let fullResponseText = "";

      while (true) {
        const { done, value } = await reader?.read()!;
        if (done) break;
        const chunk = decoder.decode(value);
        fullResponseText += chunk;
        setMessages(prev => {
          const newMsgs = [...prev];
          const lastMsg = newMsgs[newMsgs.length - 1];
          lastMsg.content += chunk; 
          return newMsgs;
        });
      }

      // 6. 自动保存到 Supabase
      const finalMessages = [...newHistory, { role: 'assistant', content: fullResponseText }];
      
      await fetch('/api/history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
              userId: user.id,
              chatId: currentChatId, 
              messages: finalMessages,
              title: currentChatId ? undefined : text.slice(0, 30) 
          })
      }).then(res => res.json()).then(data => {
          if (data.chat) {
              setCurrentChatId(data.chat.id); 
              fetchChatList(user.id); 
          }
      });

    } catch (e) {
      console.error(e);
      alert("发送失败");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  if (!user) return <AuthPage onLogin={(u)=>{ setUser(u); syncUserData(u.id, u.role); fetchChatList(u.id); }} />;

  return (
    <div className={`flex min-h-screen transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'} overflow-hidden`}>
      
      {/* 左侧侧边栏 */}
      <div className={`${isSidebarOpen ? 'w-64' : 'w-0'} bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col shrink-0 overflow-hidden relative z-20`}>
         <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 font-black text-xl tracking-tighter px-2"><div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><span>Eureka</span></div>
            <Button onClick={startNewChat} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus size={16}/> 开启新对话</Button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">历史记录</div>
            {chatList.map(chat => (
                <div key={chat.id} onClick={()=>loadChat(chat.id)} className={`group flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}>
                    <div className="truncate flex-1 flex items-center gap-2"><MessageCircle size={12}/> {chat.title || '无标题'}</div>
                    <button onClick={(e)=>deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"><Trash2 size={12}/></button>
                </div>
            ))}
            {chatList.length === 0 && <div className="text-center text-[10px] text-slate-300 py-10">暂无历史记录</div>}
         </div>
         <div className="p-4 border-t border-slate-200 dark:border-slate-800">
            <div onClick={()=>setIsProfileOpen(true)} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all">
                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{user.nickname[0]}</div>
                <div className="flex-1 overflow-hidden">
                    <div className="font-bold text-xs truncate">{user.nickname}</div>
                    <div className="text-[10px] text-slate-400 font-mono">${user.balance}</div>
                </div>
            </div>
         </div>
      </div>

      {/* 右侧主聊天区 */}
      <div className="flex-1 flex flex-col h-screen relative">
          
          {/* 顶部导航 */}
          <div className={`h-14 flex items-center justify-between px-4 border-b shrink-0 ${isDarkMode ? 'border-slate-800' : 'border-slate-100'}`}>
            <div className="flex items-center gap-2">
                <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg"><Server size={18} className="rotate-90"/></button>
                <div className="font-bold text-sm text-slate-400 flex items-center gap-2">{currentChatId ? '历史对话' : '新对话'}</div>
            </div>
            <div className="flex items-center gap-2">
                <button onClick={toggleTheme} className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>{isDarkMode ? <Sun size={14} /> : <Moon size={14} />}</button>
            </div>
          </div>

          {/* 聊天内容区 */}
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-32">
             <div className="max-w-3xl mx-auto space-y-6">
                {/* 欢迎语 */}
                {messages.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                        <div className={`w-16 h-16 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-xl ${isDarkMode ? 'bg-slate-800' : 'bg-slate-900'} text-white`}>🧊</div>
                        <h2 className="text-2xl font-black mb-8">有什么可以帮您的？</h2>
                        <div className="grid grid-cols-2 gap-3 w-full max-w-lg">
                            {["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (
                                <button key={idx} onClick={() => handleSendSimple(txt)} className={`p-4 border rounded-2xl text-xs font-bold transition-all ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800' : 'bg-white border-slate-100 hover:bg-slate-50'}`}>{txt}</button>
                            ))}
                        </div>
                    </div>
                )}

                {/* 消息列表 */}
                {messages.map((m, i) => {
                    const { cleanText, suggestions } = parseMessageContent(m.content);
                    return (
                        <div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':'justify-start'}`}>
                            {m.role!=='user' && <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">🧊</div>}
                            <div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role==='user' ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100')}`}>
                                {m.role === 'user' && typeof m.content === 'object' ? (
                                    <div className="space-y-2">
                                        {/* 图片渲染 */}
                                        {m.content.images?.length > 0 && <div className="flex gap-2">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="w-20 h-20 rounded-lg object-cover bg-white" alt="up"/>))}</div>}
                                        
                                        {/* 文件卡片渲染 (Word/Excel/TXT) */}
                                        {m.content.fileInfos?.length > 0 && (
                                           <div className="flex flex-wrap gap-2 mb-2">
                                             {m.content.fileInfos.map((f: any, idx: number) => (
                                               <div key={idx} className="flex items-center gap-2 bg-white/20 p-2 rounded-lg text-xs border border-white/10">
                                                 <FileText size={14} className="text-white" />
                                                 <span className="font-bold text-white truncate max-w-[150px]">{f.name}</span>
                                               </div>
                                             ))}
                                           </div>
                                        )}

                                        {/* 文本内容 */}
                                        <div className="text-sm whitespace-pre-wrap">{m.content.text}</div>
                                    </div>
                                ) : (
                                    <div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}>
                                        <ReactMarkdown>{cleanText}</ReactMarkdown>
                                        {suggestions.length > 0 && <RelatedQuestions content={`___RELATED___${suggestions.join("|")}`} onAsk={(q)=>handleSendSimple(q)} />}
                                    </div>
                                )}
                            </div>
                            {/* 用户头像 */}
                            {m.role === 'user' && (
                                <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs shrink-0 shadow-sm mt-1">
                                    {user.nickname[0]}
                                </div>
                            )}
                        </div>
                    );
                })}
                {isLoading && <Thinking modelName={model} />}
                <div ref={scrollRef} className="h-4" />
             </div>
          </div>

          {/* 输入框区 */}
          <div className={`fixed bottom-0 right-0 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'} bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pb-4 pt-10 z-10 px-4`}>
             <div className="max-w-3xl mx-auto">
                 <ChatInput onSend={handleChatSubmit} disabled={isLoading} />
             </div>
          </div>

          {/* 弹窗 (Profile, Admin, Support) - 已保留 */}
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}><DialogContent className="sm:max-w-md p-6"><div className="flex flex-col items-center"><div className="w-16 h-16 bg-slate-900 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-4">{user.nickname[0]}</div><h2 className="text-xl font-bold">{user.nickname}</h2><p className="text-slate-400 text-xs mb-6">{user.account}</p><div className={`rounded-2xl p-5 border shadow-sm w-full mb-6 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-white border-slate-100'}`}><div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>可用余额</span><button onClick={()=>{setIsProfileOpen(false); setTimeout(()=>setIsRechargeOpen(true),200)}} className="text-blue-600 font-bold">充值</button></div><div className="text-4xl font-black font-mono">${user.balance}</div></div><Button onClick={handleLogout} variant="destructive" className="w-full">退出登录</Button></div></DialogContent></Dialog>
          
          <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}><DialogContent className="sm:max-w-sm p-6"><h2 className="font-black text-xl mb-4">充值中心</h2><div className="space-y-4"><Input id="card-input" placeholder="请输入卡密 (XXXX-XXXX-XXXX)" className="h-12"/><Button onClick={redeemCard} className="w-full h-12 bg-blue-600 font-bold">立即兑换</Button></div></DialogContent></Dialog>
          
          {user?.role === 'user' && !isSupportOpen && <button onClick={()=>setIsSupportOpen(true)} className="fixed right-6 bottom-24 w-12 h-12 bg-blue-600 text-white rounded-full shadow-lg flex items-center justify-center z-50 hover:scale-110 transition-transform"><MessageCircle size={24}/></button>}
          
          {isSupportOpen && (
              <div className="fixed right-6 bottom-24 z-50 w-80 h-96 bg-white dark:bg-slate-900 shadow-2xl rounded-2xl flex flex-col overflow-hidden border dark:border-slate-800">
                  <div className="p-3 bg-blue-600 text-white flex justify-between items-center"><span className="font-bold text-xs">客服</span><button onClick={()=>setIsSupportOpen(false)}><X size={14}/></button></div>
                  <div className="flex-1 overflow-y-auto p-3 space-y-2">
                      {supportMessages.map(m=><div key={m.id} className={`p-2 rounded-lg text-xs max-w-[80%] ${m.is_admin ? 'bg-slate-100 dark:bg-slate-800 self-start' : 'bg-blue-100 text-blue-800 self-end ml-auto'}`}>{m.content}</div>)}
                      <div ref={supportScrollRef}/>
                  </div>
                  <div className="p-2 border-t flex gap-2"><Input value={supportInput} onChange={e=>setSupportInput(e.target.value)} className="h-8 text-xs"/><Button size="icon" className="h-8 w-8" onClick={sendSupportMessage}><Send size={12}/></Button></div>
              </div>
          )}
          
          {user?.role === 'admin' && (
              <div className="fixed right-6 bottom-6 flex gap-2 z-50">
                  <Button onClick={()=>{setIsAdminCardsOpen(true); fetchCards();}}>卡密管理</Button>
                  <Button onClick={()=>{setIsAdminSupportOpen(true); fetchSupportSessions();}}>客服后台</Button>
              </div>
          )}

          {/* Admin Dialogs - 已保留 */}
          <Dialog open={isAdminCardsOpen} onOpenChange={setIsAdminCardsOpen}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-6 border-b flex justify-between items-center pr-12 ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-xl font-black flex items-center gap-2"><CreditCard size={18} className="text-blue-500"/> 卡密管理</DialogTitle><Button size="icon" variant="ghost" onClick={fetchCards}><RefreshCw size={14}/></Button></DialogHeader><div className="p-6 space-y-6"><div className={`p-4 rounded-2xl border flex flex-wrap gap-2 md:gap-4 items-end ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-200'}`}><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">面额</label><Input type="number" value={cardConfig.amount} onChange={e=>setCardConfig({...cardConfig, amount: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">数量</label><Input type="number" value={cardConfig.count} onChange={e=>setCardConfig({...cardConfig, count: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><div className="space-y-1"><label className="text-[9px] font-bold uppercase text-slate-400">天数</label><Input type="number" value={cardConfig.days} onChange={e=>setCardConfig({...cardConfig, days: Number(e.target.value)})} className="h-8 w-20 text-xs bg-transparent border-slate-300/20"/></div><Button onClick={generateCards} className="h-8 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl text-xs"><Plus size={12} className="mr-1"/> 生成</Button></div><div className="max-h-[400px] overflow-y-auto space-y-2 pr-1"><div className="grid grid-cols-2 md:grid-cols-5 text-[10px] font-black text-slate-400 uppercase tracking-widest px-2"><span>卡密</span><span>面额</span><span className="hidden md:block">状态</span><span className="hidden md:block">有效期</span><span className="hidden md:block">使用者</span></div>{cards.map((c:any)=>(<div key={c.id} className={`grid grid-cols-2 md:grid-cols-5 items-center p-3 rounded-xl border text-[10px] font-mono ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="truncate pr-2 cursor-pointer hover:text-blue-500" onClick={()=>{navigator.clipboard.writeText(c.code); alert("复制成功");}}>{c.code}</div><div className="flex items-center gap-2"><span>${c.amount}</span><span className={`md:hidden px-1.5 py-0.5 rounded ${c.status==='used'?'bg-red-500/10 text-red-500':'bg-green-500/10 text-green-500'}`}>{c.status==='used'?'已用':'正常'}</span></div><div className={`hidden md:block ${c.status==='used'?'text-red-500':'text-green-500'}`}>{c.status==='used'?'已用':'正常'}</div><div className="hidden md:block">{c.expires_at}</div><div className="hidden md:block">{c.used_by || '-'}</div></div>))}{cards.length === 0 && <div className="text-center text-[10px] opacity-40 py-10">暂无卡密，请点击右上角刷新</div>}</div></div></DialogContent></Dialog>
          <Dialog open={!!selectedAdminUser} onOpenChange={() => setSelectedAdminUser(null)}><DialogContent className={`sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl ${isDarkMode ? 'bg-slate-900 text-slate-100' : 'bg-white text-slate-900'}`}><DialogHeader className={`p-8 border-b flex justify-between items-center ${isDarkMode ? 'bg-slate-900 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><DialogTitle className="text-2xl font-black">{selectedAdminUser?.nickname} 详情</DialogTitle><div className="text-right text-green-500 font-black text-3xl">${selectedAdminUser?.balance}</div></DialogHeader>{selectedAdminUser && <div className="flex-1 overflow-y-auto p-8 space-y-3">{(adminUserTx.length > 0 ? adminUserTx : []).map((tx:any) => (<div key={tx.id} className={`flex justify-between items-center p-4 rounded-2xl border ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-slate-50 border-slate-100'}`}><div className="flex flex-col gap-1"><span className="text-xs font-bold">{tx.description}</span><span className="text-xs font-mono opacity-60 flex items-center gap-1"><FileText size={10}/> {tx.time}</span></div><span className={`font-bold ${tx.type==='consume'?'text-red-500':'text-green-500'}`}>{tx.type==='consume'?'-':'+'}${tx.amount}</span></div>))}{adminUserTx.length === 0 && <div className="text-center text-xs opacity-50 py-10">暂无消费记录</div>}</div>}</DialogContent></Dialog>

      </div>
    </div>
  );
}