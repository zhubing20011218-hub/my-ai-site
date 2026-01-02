"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Wallet, Copy, Check, Bot, User, Loader2, Terminal, Square, Send, 
  Paperclip, X, FileCode, Lock, LogOut, Shield, History, Coins, AlertCircle, PartyPopper, Eye
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

// --- 类型定义 ---
type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// --- 辅助组件 ---
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  return (
    <button onClick={handle} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors">
      {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
    </button>
  );
}

// ✨ 恢复：思维链分析组件
function Thinking({ plan }: { plan: string[] }) {
  const [step, setStep] = useState(0);
  useEffect(() => { 
    if (step < plan.length - 1) { 
      const t = setTimeout(() => setStep(s => s + 1), 1200); 
      return () => clearTimeout(t); 
    } 
  }, [step, plan.length]);

  return (
    <div className="flex gap-4 my-6 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100 shadow-sm">
        <Loader2 size={14} className="text-blue-500 animate-spin" />
      </div>
      <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 shadow-sm w-full max-w-sm">
        <div className="flex items-center gap-2 text-[9px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 mb-3">
          <Terminal size={10}/> <span>Eureka Processing Engine</span>
        </div>
        {plan.map((text, i) => (
          <div key={i} className={`flex items-center gap-3 mb-2 transition-all duration-500 ${i > step ? 'opacity-20 translate-x-2' : 'opacity-100 translate-x-0'}`}>
            <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${i < step ? 'bg-green-500 border-green-500 text-white' : i === step ? 'border-blue-500 text-blue-600 animate-pulse' : 'text-slate-300'}`}>
              {i < step ? <Check size={10} /> : i + 1}
            </div>
            <span className={`text-[11px] ${i === step ? 'text-blue-700 font-bold' : 'text-slate-500'}`}>{text}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 👤 认证页面
// ==========================================
function AuthPage({ onLogin }: { onLogin: (u: any) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [account, setAccount] = useState("");
  const [password, setPassword] = useState("");
  const [nickname, setNickname] = useState("");
  const [verifyCode, setVerifyCode] = useState("");
  const [realCode, setRealCode] = useState("");
  const [count, setCount] = useState(0);
  const [load, setLoad] = useState(false);

  const sendCode = () => {
    if(!account) return alert("请先输入账号");
    const c = Math.floor(100000+Math.random()*900000).toString();
    setRealCode(c); setCount(60); alert(`验证码: ${c}`);
    const timer = setInterval(() => setCount(v => { if(v<=1){clearInterval(timer); return 0} return v-1 }), 1000);
  };

  const handleAuth = (e: any) => {
    e.preventDefault(); setLoad(true);
    setTimeout(() => {
      setLoad(false);
      if (isReg) {
        if (verifyCode !== realCode) return alert("验证码错误");
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        if (db.find((u:any)=>u.account===account)) return alert("该账号已存在");
        const u = { id: "u_"+Math.random().toString(36).substr(2,6), nickname, account, password, balance: "0.10", regTime: new Date().toLocaleString(), role: 'user' };
        db.push(u); localStorage.setItem("my_ai_users_db", JSON.stringify(db));
        localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u);
      } else {
        if (account==="admin" && password==="admin123") {
          onLogin({ id: "admin_01", nickname: "Eureka管理员", account: "admin", role: 'admin', balance: "9999.00", regTime: "2026/1/1" });
          return;
        }
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        const u = db.find((x:any)=>x.account===account && x.password===password);
        if(u){ localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u); } else alert("账号或密码错误");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex flex-col items-center justify-center p-4 text-slate-900">
      <div className="flex items-center gap-3 mb-10">
        <div className="w-12 h-12 bg-blue-50 rounded-2xl flex items-center justify-center text-3xl shadow-sm">🧊</div>
        <h1 className="text-4xl font-black tracking-tighter">Eureka</h1>
      </div>
      <Card className="w-full max-w-sm p-8 shadow-none border-none text-center">
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {isReg && <Input placeholder="您的昵称" className="bg-slate-50 border-none h-11" value={nickname} onChange={e=>setNickname(e.target.value)} />}
          <Input placeholder="邮箱或手机号" className="bg-slate-50 border-none h-11" value={account} onChange={e=>setAccount(e.target.value)} />
          {isReg && <div className="flex gap-2"><Input placeholder="验证码" className="bg-slate-50 border-none h-11" value={verifyCode} onChange={e=>setVerifyCode(e.target.value)} /><Button type="button" variant="outline" onClick={sendCode} disabled={count>0} className="h-11 text-xs">{count>0?`${count}s`:"获取"}</Button></div>}
          <Input type="password" placeholder="密码" className="bg-slate-50 border-none h-11" value={password} onChange={e=>setPassword(e.target.value)} />
          <Button className="w-full bg-slate-900 h-11 mt-2 shadow-md active:scale-95 text-white border-none" disabled={load}>{load?<Loader2 className="animate-spin"/>:isReg?"创建账户":"安全登录"}</Button>
        </form>
        <div className="mt-8 flex flex-col items-center gap-3">
          <div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-pulse">
            <PartyPopper size={14} className="animate-bounce" />
            <span className="text-[11px] font-bold tracking-wide">注册Eureka送0.10$体验金！！！</span>
          </div>
          <button onClick={()=>setIsReg(!isReg)} className="text-xs text-blue-600 font-medium hover:underline">{isReg ? "已有账号？去登录" : "没有账号？点击注册"}</button>
        </div>
      </Card>
    </div>
  );
}

// ==========================================
// 🚀 主程序
// ==========================================
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [rechargeTab, setRechargeTab] = useState<'card' | 'online'>('card');
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [model, setModel] = useState("gemini");
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<{name:string, content:string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [selectedAdminUser, setSelectedAdminUser] = useState<any>(null);

  useEffect(() => {
    const u = localStorage.getItem("my_ai_user");
    if(u) {
      const parsed = JSON.parse(u); setUser(parsed);
      setTransactions(JSON.parse(localStorage.getItem(`tx_${parsed.id}`) || "[]"));
    }
  }, []);

  useEffect(() => { 
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: "smooth" }); 
    }
  }, [messages, isLoading]);

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); setIsProfileOpen(false); };

  const handleModelChange = (value: string) => {
    if (value === "gemini") setModel(value);
    else alert("正在维护当中，可选择其他模型使用");
  };

  const handleTX = (type: 'topup' | 'consume', amount: number, desc: string) => {
    if(!user) return false;
    const current = parseFloat(user.balance);
    const newVal = type === 'topup' ? current + amount : current - amount;
    if(newVal < 0) { alert("余额不足"); return false; }
    const upd = { ...user, balance: newVal.toFixed(2) };
    const tx: Transaction = { id: "tx_"+Date.now(), type, amount: amount.toFixed(2), description: desc, time: new Date().toLocaleString() };
    const history = [tx, ...transactions];
    setUser(upd); setTransactions(history);
    localStorage.setItem("my_ai_user", JSON.stringify(upd));
    localStorage.setItem(`tx_${user.id}`, JSON.stringify(history));
    return true;
  };

  // ✨ 核心优化：即时发送逻辑
  const handleSend = async (e?: any, textOverride?: string) => {
    e?.preventDefault();
    const content = textOverride || input;
    if (!content.trim() && images.length === 0 && !file) return;

    // 1. 立即扣费并更新状态
    if (!handleTX('consume', 0.01, "AI 服务资源调用")) return;

    // 2. 消息立即上屏，清除输入框（解决5秒延迟感）
    const uiMsg = { role: 'user', content: { text: content, images: [...images], file: file ? file.name : null } };
    setMessages(prev => [...prev, uiMsg]);
    setInput(""); setImages([]); setFile(null); 
    
    // 3. 开启加载动画
    setIsLoading(true);
    const ctrl = new AbortController(); abortRef.current = ctrl;

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messages: messages.concat({ role: 'user', content: content }), model }),
        signal: ctrl.signal
      });
      
      if (!response.body) return;
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        const text = decoder.decode(value);
        setMessages(prev => {
          const last = [...prev];
          last[last.length - 1].content += text;
          return last;
        });
      }
    } catch (err: any) { 
      if(err.name !== 'AbortError') console.error(err); 
    } finally { 
      setIsLoading(false); 
      abortRef.current = null; 
    }
  };

  if (!user) return <AuthPage onLogin={(u)=>{
    setUser(u);
    const init: Transaction = { id: 'init', type: 'topup', amount: '0.10', description: '注册赠送', time: new Date().toLocaleString() };
    setTransactions([init]); localStorage.setItem(`tx_${u.id}`, JSON.stringify([init]));
  }} />;

  return (
    <div className="flex flex-col min-h-screen bg-white text-slate-900 overflow-x-hidden">
      
      {/* 1：欢迎语 */}
      <div className="w-full bg-slate-50 py-2 text-center border-b border-slate-100">
        <p className="text-[11px] font-medium text-slate-500 tracking-tight">
          欢迎来到Eureka，有任何问题可以
          <a href="/kefu.jpg" target="_blank" className="text-blue-600 font-bold hover:underline mx-1">联系客服</a>
        </p>
      </div>

      <nav className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
        <div className="flex items-center gap-2 font-black text-xl tracking-tighter">
          <div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs shadow-sm">🧊</div>
          <span>Eureka</span>
        </div>

        <div className="flex items-center gap-4">
           <Select value={model} onValueChange={handleModelChange}>
              <SelectTrigger className="w-36 h-8 border-none bg-slate-50 text-[10px] font-bold shadow-none focus:ring-0">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="shadow-xl rounded-xl">
                <SelectItem value="gemini" className="text-xs font-bold">Gemini 3 Pro</SelectItem>
                <SelectItem value="gpt4" className="text-xs">ChatGPT Plus</SelectItem>
                <SelectItem value="sora" className="text-xs">Sora</SelectItem>
                <SelectItem value="nano" className="text-xs">Nano Banana</SelectItem>
              </SelectContent>
           </Select>

           <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
             <DialogTrigger asChild>
               <button className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm transition-transform active:scale-90" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                 {user.nickname[0].toUpperCase()}
               </button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
               <div className="bg-white p-6 flex flex-col items-center border-b">
                  <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>{user.nickname[0].toUpperCase()}</div>
                  <h2 className="text-xl font-black">Eureka ID: {user.nickname}</h2>
                  <p className="text-slate-400 text-[10px] mb-4 font-mono">{user.account}</p>
                  <button onClick={handleLogout} className="text-xs text-slate-400 flex items-center gap-1 hover:text-red-500 transition-colors"><LogOut size={12}/> 退出账户</button>
               </div>
               <div className="p-6 bg-slate-50/50">
                  <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-6 shadow-sm">
                     <div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400 uppercase tracking-widest"><span>可用余额 (USD)</span><button onClick={()=>{setIsProfileOpen(false); setTimeout(()=>setIsRechargeOpen(true),200)}} className="text-blue-600 font-bold">充值</button></div>
                     <div className="text-4xl font-black font-mono tracking-tighter">${user.balance}</div>
                  </div>
                  <div className="space-y-4">
                     <div className="flex items-center gap-2 font-bold text-[10px] text-slate-500 uppercase tracking-widest"><History size={12}/> 最近财务记录</div>
                     <div className="max-h-[120px] overflow-y-auto space-y-2 pr-1 scrollbar-hide text-[11px]">
                        {transactions.map(t=>(<div key={t.id} className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 font-bold"><span>{t.description}</span><span className={t.type==='topup'?'text-green-600':'text-slate-500'}>${t.amount}</span></div>))}
                     </div>
                  </div>
               </div>
             </DialogContent>
           </Dialog>
        </div>
      </nav>

      {/* 管理员面板 - 右下角 */}
      {user?.role === 'admin' && (
        <div className="fixed right-6 bottom-32 w-80 bg-slate-950 text-white p-5 rounded-[32px] border border-white/10 shadow-2xl z-50">
           <div className="font-bold text-red-400 mb-4 text-[10px] tracking-widest flex items-center gap-2 border-b border-white/5 pb-3">
             <Shield size={14} className="animate-pulse"/> EUREKA ADMIN CENTER
           </div>
           <div className="max-h-[400px] overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {JSON.parse(localStorage.getItem("my_ai_users_db") || "[]").map((u:any)=>(
                <div key={u.id} className="bg-white/5 p-4 rounded-2xl border border-white/5 transition-all hover:bg-white/10">
                   <div className="flex justify-between items-start mb-2 text-slate-900">
                      <div className="font-black text-blue-300 text-sm">{u.nickname}</div>
                      <div className="bg-green-500/10 text-green-400 px-2 py-0.5 rounded text-[9px] font-mono">${u.balance}</div>
                   </div>
                   <div className="text-[10px] text-white/40 space-y-1 mb-3">
                      <div className="flex justify-between"><span>账号:</span><span className="text-white/60">{u.account}</span></div>
                      <div className="flex justify-between border-t border-white/5 pt-1"><span>密码:</span><span className="text-white/80 font-mono">{u.password}</span></div>
                   </div>
                   <Button onClick={() => setSelectedAdminUser(u)} className="w-full h-8 bg-blue-600/20 hover:bg-blue-600 text-blue-400 hover:text-white border-none text-[10px] font-black rounded-xl">使用详情</Button>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* 用户详情弹窗 */}
      <Dialog open={!!selectedAdminUser} onOpenChange={() => setSelectedAdminUser(null)}>
        <DialogContent className="sm:max-w-2xl p-0 overflow-hidden border-none rounded-[32px] shadow-2xl bg-white text-slate-900">
           {selectedAdminUser && (
             <div className="flex flex-col h-[500px]">
                <div className="p-8 border-b bg-slate-50 flex justify-between items-center">
                   <div><h3 className="text-2xl font-black">{selectedAdminUser.nickname}</h3><p className="text-slate-400 text-xs">{selectedAdminUser.account}</p></div>
                   <div className="text-right text-green-600 font-black text-3xl">${selectedAdminUser.balance}</div>
                </div>
                <div className="flex-1 overflow-y-auto p-8 space-y-3">
                   {(JSON.parse(localStorage.getItem(`tx_${selectedAdminUser.id}`) || "[]")).map((tx:any) => (
                      <div key={tx.id} className="flex justify-between items-center p-4 bg-slate-50 rounded-2xl border border-slate-100">
                         <div className="flex flex-col">
                            <span className="text-xs font-bold">{tx.description}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{tx.time}</span>
                         </div>
                         <span className={`font-bold ${tx.type==='consume'?'text-red-500':'text-green-500'}`}>{tx.type==='consume'?'-':'+'}${tx.amount}</span>
                      </div>
                   ))}
                </div>
             </div>
           )}
        </DialogContent>
      </Dialog>

      <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-10 pb-32">
        <div className="max-w-3xl mx-auto space-y-10">
          {messages.length === 0 && (
            <div className="flex flex-col items-center py-10 text-center animate-in fade-in zoom-in duration-700">
              <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm">🧊</div>
              <h2 className="text-3xl font-black text-slate-800 mb-10 tracking-tight">有什么可以帮您的？</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full">
                 {["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (
                   <button key={idx} onClick={() => handleSend(null, txt)} className="flex items-center justify-center p-6 bg-white border border-slate-100 rounded-3xl hover:bg-slate-50 hover:border-slate-200 transition-all text-sm text-slate-600 font-bold shadow-sm h-24 text-center leading-relaxed">{txt}</button>
                 ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={`flex gap-4 ${m.role==='user'?'justify-end':'justify-start'} animate-in fade-in`}>
              {m.role!=='user' && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mt-1 shrink-0 border border-blue-100 text-blue-600 shadow-sm"><Bot size={16} /></div>}
              <div className="max-w-[85%] flex flex-col gap-2">
                <div className={`rounded-2xl px-5 py-3 shadow-sm ${m.role==='user'?'bg-slate-100':'bg-white border border-slate-100'} text-slate-800`}>
                  {m.role === 'user' && typeof m.content === 'object' ? (
                    <div className="space-y-3 text-sm">
                      {m.content.images?.length > 0 && <div className="grid grid-cols-2 gap-2">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="rounded-xl aspect-square object-cover border"/>))}</div>}
                      {m.content.file && <div className="flex items-center gap-2 opacity-70 border p-1 rounded-lg bg-white/50"><FileCode size={12}/>{m.content.file}</div>}
                      <p className="leading-relaxed font-medium">{m.content.text}</p>
                    </div>
                  ) : (
                    <div className="prose prose-sm max-w-none leading-relaxed font-medium text-slate-800"><ReactMarkdown>{typeof m.content === 'string' ? m.content : m.content.text}</ReactMarkdown></div>
                  )}
                  {m.role!=='user' && <div className="mt-3 pt-2 border-t border-slate-50 flex justify-end"><CopyButton content={typeof m.content === 'string' ? m.content : m.content.text}/></div>}
                </div>
              </div>
              {m.role==='user' && <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mt-1 shrink-0 font-black text-[10px] shadow-md">{user.nickname[0]}</div>}
            </div>
          ))}
          {/* ✨ 恢复并优化动画组件触发条件 */}
          {isLoading && <Thinking plan={["分析意图", "检索知识", "建模响应", "生成回复"]} />}
          <div ref={scrollRef} className="h-4" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-4 sm:p-8 bg-gradient-to-t from-white via-white/90 to-transparent">
        <div className="max-w-3xl mx-auto">
          {(images.length > 0 || file) && (
            <div className="flex flex-wrap gap-2 mb-4 animate-in slide-in-from-bottom-2 bg-white/50 backdrop-blur p-2 rounded-2xl border border-slate-100 shadow-sm">
              {images.map((img,idx)=>(
                <div key={idx} className="relative w-12 h-12">
                  <img src={img} className="w-full h-full object-cover rounded-xl border shadow-sm"/>
                  <button onClick={()=>setImages(p=>p.filter((_,i)=>i!==idx))} className="absolute -top-1.5 -right-1.5 bg-red-500 text-white rounded-full p-0.5 shadow-sm active:scale-90 transition-all"><X size={10}/></button>
                </div>
              ))}
              {file && (<div className="bg-white px-3 py-1.5 rounded-xl text-[10px] flex items-center gap-2 border border-slate-200 font-bold shadow-sm"><span>📄 {file.name}</span><button onClick={()=>setFile(null)} className="text-red-400"><X size={12}/></button></div>)}
            </div>
          )}
          
          <div className="relative shadow-2xl rounded-[32px] overflow-hidden border border-slate-200 bg-white group focus-within:border-blue-200 transition-all">
            {isLoading ? (
              <Button onClick={()=>abortRef.current?.abort()} className="w-full bg-slate-50 text-slate-500 h-14 rounded-none gap-2 font-black border-none hover:bg-slate-100 transition-colors">
                <Square size={14} fill="currentColor"/> 停止生成
              </Button>
            ) : (
              <form onSubmit={handleSend} className="flex items-center p-2 bg-white">
                <input type="file" ref={fileInputRef} hidden multiple accept="image/*,.py,.js,.txt,.md" onChange={(e) => {
                  const files = Array.from(e.target.files as FileList);
                  if (files.length === 0) return;
                  if (files[0].type.startsWith('image/')) {
                    files.forEach(f => {
                      const r = new FileReader(); r.onloadend = () => setImages(p => [...p, r.result as string]); r.readAsDataURL(f);
                    });
                  } else {
                    const r = new FileReader(); r.onloadend = () => setFile({ name: files[0].name, content: r.result as string });
                    r.readAsText(files[0]);
                  }
                }} />
                <Button type="button" variant="ghost" size="icon" onClick={()=>fileInputRef.current?.click()} className="text-slate-400 h-11 w-11 ml-2 rounded-full hover:bg-slate-50 hover:text-blue-600 transition-all"><Paperclip size={22}/></Button>
                <Input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm px-4 h-14 font-medium" placeholder="有问题尽管问我... " />
                <Button type="submit" disabled={!input.trim() && images.length===0 && !file} className="bg-slate-900 hover:bg-blue-600 h-11 w-11 mr-1 rounded-full p-0 flex items-center justify-center transition-all shadow-lg active:scale-90 text-white border-none"><Send size={20} /></Button>
              </form>
            )}
          </div>
          <p className="text-[9px] text-center text-slate-400 mt-4 font-black uppercase tracking-widest opacity-60 text-slate-400">Eureka Site · Gemini 3 Pro Engine</p>
        </div>
      </div>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <div className="p-8 text-center bg-white text-slate-900">
            <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-sm"><Coins size={32}/></div>
            <h3 className="text-2xl font-black mb-4">充值 Eureka</h3>
            <div className="flex bg-slate-100 p-1 rounded-2xl mb-8 text-[11px] font-black">
               <button onClick={()=>setRechargeTab('card')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='card'?'bg-white shadow text-slate-900':'text-slate-400'}`}>卡密核销</button>
               <button onClick={()=>setRechargeTab('online')} className={`flex-1 py-2 rounded-xl transition-all ${rechargeTab==='online'?'bg-white shadow text-slate-900':'text-slate-400'}`}>在线支付</button>
            </div>
            {rechargeTab === 'card' ? (
              <div className="space-y-4 animate-in fade-in duration-300">
                <Input id="card-input" placeholder="BOSS-XXXX-XXXX" className="text-center font-mono uppercase h-12 bg-slate-50 border-none text-base tracking-widest focus-visible:ring-blue-500 rounded-2xl" />
                <Button onClick={()=>{ 
                  const val = (document.getElementById('card-input') as HTMLInputElement).value; 
                  if(val.toUpperCase()==="BOSS"){ handleTX('topup',10,"卡密充值"); setIsRechargeOpen(false); alert("充值成功！"); } else alert("卡密无效"); 
                }} className="w-full bg-slate-900 h-12 rounded-2xl font-black text-white shadow-xl active:scale-95 transition-all border-none">立即核销</Button>
              </div>
            ) : (
              <div className="p-6 bg-orange-50 rounded-3xl border border-orange-100 text-left">
                <div className="flex items-center gap-2 text-orange-600 font-black text-xs mb-2"><AlertCircle size={16}/> 通道维护中</div>
                <p className="text-[11px] text-orange-700 font-bold leading-relaxed">在线维护中，请联系客服获取卡密。</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}