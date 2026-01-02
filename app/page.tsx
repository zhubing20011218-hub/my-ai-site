"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { 
  Wallet, Copy, Check, Bot, User, Loader2, Terminal, Square, Send, 
  Lightbulb, Paperclip, X, FileCode, Lock, LogOut, 
  ShieldCheck, Shield, History, Coins, AlertCircle
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

// --- 类型定义 ---
type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// ==========================================
// 🛠️ 核心功能小组件
// ==========================================
function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  return (
    <button onClick={handle} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors">
      {copied ? <Check size={12} className="text-green-500"/> : <Copy size={12}/>}
    </button>
  );
}

function Thinking({ plan }: { plan: string[] }) {
  const [step, setStep] = useState(0);
  useEffect(() => { if (step < 3) { const t = setTimeout(() => setStep(s => s + 1), 2500); return () => clearTimeout(t); } }, [step]);
  return (
    <div className="flex gap-3 my-4 animate-in fade-in slide-in-from-bottom-2">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0 border border-blue-100"><Loader2 size={14} className="text-blue-500 animate-spin" /></div>
      <div className="bg-slate-50 border border-blue-50 rounded-xl p-3 shadow-sm w-full font-mono text-[11px] max-w-[400px]">
        <div className="flex items-center gap-2 text-gray-400 border-b border-blue-100 pb-1 mb-2 text-[9px] uppercase tracking-widest"><Terminal size={10}/><span>System Process Log</span></div>
        {plan.map((t, i) => (
          <div key={i} className={`flex items-center gap-2 mb-1 transition-opacity duration-500 ${i > step ? 'opacity-20' : 'opacity-100'}`}>
            <div className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[8px] border ${i<step?'bg-green-500 border-green-500 text-white':i===step?'border-blue-500 text-blue-600 animate-pulse':'text-gray-300'}`}>{i<step?<Check size={10}/>:i+1}</div>
            <span className={i===step?'text-blue-700 font-bold':''}>{t}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==========================================
// 👤 极简认证页面
// ==========================================
function AuthPage({ onLogin }: { onLogin: (u: any) => void }) {
  const [isReg, setIsReg] = useState(false);
  const [account, setAcc] = useState("");
  const [password, setPwd] = useState("");
  const [nickname, setNick] = useState("");
  const [code, setCode] = useState("");
  const [realCode, setRealCode] = useState("");
  const [count, setCount] = useState(0);
  const [load, setLoad] = useState(false);

  const sendCode = () => {
    if(!account) return alert("请填账号");
    const c = Math.floor(100000+Math.random()*900000).toString();
    setRealCode(c); setCount(60); alert(`验证码: ${c}`);
    const timer = setInterval(() => setCount(v => { if(v<=1){clearInterval(timer); return 0} return v-1 }), 1000);
  };

  const handleAuth = (e: any) => {
    e.preventDefault(); setLoad(true);
    setTimeout(() => {
      setLoad(false);
      if (isReg) {
        if (code !== realCode) return alert("验证码错误");
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        const u = { id: "u_"+Math.random().toString(36).substr(2,6), nickname, account, password, balance: "0.10", regTime: new Date().toLocaleString(), role: 'user' };
        db.push(u); localStorage.setItem("my_ai_users_db", JSON.stringify(db));
        localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u);
      } else {
        if (account==="admin" && password==="admin123") {
          onLogin({ id: "admin_01", nickname: "超级管理员", account: "admin", role: 'admin', balance: "9999.00", regTime: "2026/1/1" });
          return;
        }
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        const u = db.find((x:any)=>x.account===account && x.password===password);
        if(u){ localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u); } else alert("账号或密码错误");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-white flex items-center justify-center p-4">
      <Card className="w-full max-w-sm p-8 shadow-none border-none text-center">
        <div className="mb-10"><div className="text-6xl mb-4">🧊</div><h1 className="text-2xl font-bold tracking-tight text-slate-900">登录冰式 AI</h1></div>
        <form onSubmit={handleAuth} className="space-y-4 text-left">
          {isReg && <Input placeholder="您的昵称" className="bg-slate-50 border-none h-11" value={nickname} onChange={e=>setNick(e.target.value)} />}
          <Input placeholder="邮箱或手机号" className="bg-slate-50 border-none h-11" value={account} onChange={e=>setAcc(e.target.value)} />
          {isReg && <div className="flex gap-2"><Input placeholder="验证码" className="bg-slate-50 border-none h-11" value={code} onChange={e=>setCode(e.target.value)} /><Button type="button" variant="outline" onClick={sendCode} disabled={count>0} className="h-11 text-xs">{count>0?`${count}s`:"获取"}</Button></div>}
          <Input type="password" placeholder="密码" className="bg-slate-50 border-none h-11" value={password} onChange={e=>setPassword(e.target.value)} />
          <Button className="w-full bg-slate-900 h-11 mt-2 transition-all" disabled={load}>{load?<Loader2 className="animate-spin"/>:isReg?"创建账户":"安全登录"}</Button>
        </form>
        <button onClick={()=>setIsReg(!isReg)} className="text-xs text-blue-600 mt-6 hover:underline">{isReg ? "已有账号？去登录" : "没有账号？点击注册"}</button>
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
  const thinkingPlan = ["分析意图", "检索知识", "建模响应", "生成回复"];

  useEffect(() => {
    const u = localStorage.getItem("my_ai_user");
    if(u) {
      const parsed = JSON.parse(u); setUser(parsed);
      const logs = localStorage.getItem(`tx_${parsed.id}`);
      if(logs) setTransactions(JSON.parse(logs));
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, images]);

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); setIsProfileOpen(false); };

  const handleTX = (type: 'topup' | 'consume', amount: number, desc: string) => {
    if(!user) return false;
    const current = parseFloat(user.balance);
    const newVal = type === 'topup' ? current + amount : current - amount;
    if(newVal < 0) { alert("余额不足，请充值"); return false; }
    const upd = { ...user, balance: newVal.toFixed(2) };
    const tx: Transaction = { id: "tx_"+Date.now(), type, amount: amount.toFixed(2), description: desc, time: new Date().toLocaleString() };
    const history = [tx, ...transactions];
    setUser(upd); setTransactions(history);
    localStorage.setItem("my_ai_user", JSON.stringify(upd));
    localStorage.setItem(`tx_${user.id}`, JSON.stringify(history));
    return true;
  };

  const handleUpload = (e: any) => {
    const files = Array.from(e.target.files as FileList);
    if (files.length === 0) return;
    if (files[0].type.startsWith('image/')) {
      if(images.length + files.length > 9) return alert("上限9张");
      files.forEach(f => {
        const r = new FileReader(); r.onloadend = () => setImages(p => [...p, r.result as string]); r.readAsDataURL(f);
      });
    } else {
      const r = new FileReader(); r.onloadend = () => setFile({ name: files[0].name, content: r.result as string });
      r.readAsText(files[0]);
    }
  };

  const handleSend = async (e?: any, textOverride?: string) => {
    e?.preventDefault();
    const content = textOverride || input;
    if (!content.trim() && images.length === 0 && !file) return;
    if (!handleTX('consume', 0.01, "AI 服务调用")) return;

    const uiMsg = { role: 'user', content: { text: content, images: [...images], file: file ? file.name : null } };
    setMessages(prev => [...prev, uiMsg]);
    setInput(""); setImages([]); setFile(null); setIsLoading(true);
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
    } catch (err: any) { if(err.name !== 'AbortError') console.error(err); } 
    finally { setIsLoading(false); abortRef.current = null; }
  };

  if (!user) return <AuthPage onLogin={(u)=>{
    setUser(u);
    const init: Transaction = { id: 'init', type: 'topup', amount: '0.10', description: '注册赠送', time: new Date().toLocaleString() };
    setTransactions([init]); localStorage.setItem(`tx_${u.id}`, JSON.stringify([init]));
  }} />;

  return (
    <div className="flex min-h-screen bg-white">
      {user?.role === 'admin' && (
        <div className="w-72 bg-slate-950 text-white p-5 border-r border-white/5 flex flex-col">
           <div className="font-bold text-red-400 mb-6 text-xs tracking-widest flex items-center gap-2"><Shield size={14}/> ADMIN CONSOLE</div>
           <div className="flex-1 overflow-y-auto space-y-3 pr-2 scrollbar-hide">
              {JSON.parse(localStorage.getItem("my_ai_users_db") || "[]").map((u:any)=>(
                <div key={u.id} className="bg-white/5 p-3 rounded-xl border border-white/5">
                   <div className="font-bold text-blue-400 text-xs">{u.nickname}</div>
                   <div className="flex justify-between mt-2 font-mono text-[10px] text-green-400"><span>${u.balance}</span></div>
                </div>
              ))}
           </div>
        </div>
      )}

      <div className="flex-1 flex flex-col h-screen relative">
        <nav className="h-14 flex items-center justify-between px-6 border-b border-slate-100 shrink-0">
          <div className="flex items-center gap-2 font-bold text-lg text-slate-800"><div className="w-7 h-7 bg-slate-900 text-white rounded-lg flex items-center justify-center text-xs">冰</div>冰式AI</div>
          <div className="flex items-center gap-4">
             <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-32 h-8 border-none bg-slate-50 text-[10px] font-bold"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="gemini">Gemini 3 Pro</SelectItem></SelectContent>
             </Select>
             {/* 👤 个人账户移至最右侧 */}
             <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
               <DialogTrigger asChild>
                 <button className="w-8 h-8 rounded-full flex items-center justify-center text-white font-bold shadow-sm" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>
                   {user.nickname[0].toUpperCase()}
                 </button>
               </DialogTrigger>
               <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
                 <div className="bg-white p-6 flex flex-col items-center">
                    <div className="w-16 h-16 rounded-full flex items-center justify-center text-white text-2xl font-bold mb-3 shadow-lg" style={{ background: 'linear-gradient(135deg, #6366f1 0%, #a855f7 100%)' }}>{user.nickname[0].toUpperCase()}</div>
                    <h2 className="text-xl font-bold">Hi, {user.nickname}!</h2>
                    <p className="text-slate-400 text-xs mb-4">{user.account}</p>
                    <button onClick={handleLogout} className="text-xs text-slate-400 flex items-center gap-1 hover:text-red-500 transition-colors"><LogOut size={12}/> 退出账户</button>
                 </div>
                 <div className="p-6 bg-slate-50/50">
                    <div className="bg-white rounded-2xl p-5 border border-slate-100 mb-6 shadow-sm">
                       <div className="flex justify-between items-start mb-1 text-[10px] font-bold text-slate-400 uppercase"><span>可用余额</span><button onClick={()=>{setIsProfileOpen(false); setTimeout(()=>setIsRechargeOpen(true),200)}} className="text-blue-600">充值</button></div>
                       <div className="text-3xl font-bold font-mono tracking-tighter text-slate-900">${user.balance}</div>
                    </div>
                    <div className="space-y-4">
                       <div className="flex items-center gap-2 font-bold text-[10px] text-slate-500 uppercase"><History size={12}/> 最近活动</div>
                       <div className="max-h-[150px] overflow-y-auto space-y-2 pr-1 scrollbar-hide">
                          {transactions.map(t=>(<div key={t.id} className="flex justify-between bg-white p-2.5 rounded-xl border border-slate-100 text-[11px] font-medium"><span>{t.description}</span><span className={t.type==='topup'?'text-green-600':'text-slate-500'}>{t.type==='topup'?'+':'-'}${t.amount}</span></div>))}
                       </div>
                    </div>
                 </div>
               </DialogContent>
             </Dialog>
          </div>
        </nav>

        <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-6 pb-32">
          <div className="max-w-3xl mx-auto space-y-6">
            {messages.length === 0 && (
              <div className="flex flex-col items-center py-20 text-center animate-in fade-in zoom-in">
                <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-4xl mb-6 shadow-sm">🧊</div>
                <h2 className="text-2xl font-bold text-slate-800">有什么可以帮您的？</h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-10 w-full">
                   {["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (
                     <button key={idx} onClick={() => handleSend(null, txt)} className="p-4 bg-white border border-slate-100 rounded-2xl text-left hover:bg-slate-50 hover:border-slate-200 transition-all text-sm text-slate-600 font-medium shadow-sm">{txt}</button>
                   ))}
                </div>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role==='user'?'justify-end':'justify-start'} animate-in fade-in`}>
                {m.role!=='user' && <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center mt-1 shrink-0 border border-blue-100"><Bot size={16} className="text-blue-600" /></div>}
                <div className="max-w-[85%] flex flex-col gap-2">
                  <div className={`rounded-2xl px-5 py-3 shadow-sm ${m.role==='user'?'bg-slate-100':'bg-white border border-slate-100'} text-slate-800`}>
                    {m.role === 'user' && typeof m.content === 'object' ? (
                      <div className="space-y-3 text-sm">
                        {m.content.images?.length > 0 && <div className="grid grid-cols-3 gap-2">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="rounded-lg aspect-square object-cover border"/>))}</div>}
                        {m.content.file && <div className="flex items-center gap-2 opacity-70"><FileCode size={12}/>{m.content.file}</div>}
                        <p>{m.content.text}</p>
                      </div>
                    ) : (
                      <div className="prose prose-sm max-w-none"><ReactMarkdown>{typeof m.content === 'string' ? m.content : m.content.text}</ReactMarkdown></div>
                    )}
                    {m.role!=='user' && <div className="mt-3 pt-2 border-t border-slate-50 flex justify-end"><CopyButton content={m.content}/></div>}
                  </div>
                </div>
                {m.role==='user' && <div className="w-8 h-8 rounded-full bg-slate-900 text-white flex items-center justify-center mt-1 shrink-0 font-bold text-[10px]">{user.nickname[0]}</div>}
              </div>
            ))}
            {isLoading && <Thinking plan={thinkingPlan} />}
            <div ref={scrollRef} />
          </div>
        </div>

        <div className="absolute bottom-0 left-0 right-0 p-4 sm:p-6 bg-gradient-to-t from-white via-white/90 to-transparent">
          <div className="max-w-3xl mx-auto">
            <div className="relative shadow-2xl rounded-[28px] overflow-hidden border border-slate-200">
              {isLoading ? (
                <Button onClick={()=>abortRef.current?.abort()} className="w-full bg-slate-50 text-slate-500 h-14 rounded-none gap-2 font-bold"><Square size={14} fill="currentColor"/> 停止生成</Button>
              ) : (
                <form onSubmit={handleSend} className="flex items-center bg-white p-2">
                  <input type="file" ref={fileInputRef} hidden multiple accept="image/*,.py,.js,.txt" onChange={handleUpload} />
                  <Button type="button" variant="ghost" size="icon" onClick={()=>fileInputRef.current?.click()} className="text-slate-400 h-10 w-10 ml-2 rounded-full"><Paperclip size={20}/></Button>
                  <Input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm px-4 h-12" placeholder="有问题尽管问我..." />
                  <Button type="submit" disabled={!input.trim() && images.length===0 && !file} className="bg-slate-900 hover:bg-blue-600 h-10 w-10 mr-1 rounded-full p-0 flex items-center justify-center transition-all">
                    <Send size={18} className="text-white"/>
                  </Button>
                </form>
              )}
            </div>
            <p className="text-[9px] text-center text-slate-400 mt-3 font-medium uppercase tracking-widest">Ice AI Site · Gemini 3 Pro</p>
          </div>
        </div>
      </div>

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-md p-0 overflow-hidden border-none rounded-3xl shadow-2xl">
          <div className="p-8 text-center bg-white">
            <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4"><Coins size={28}/></div>
            <h3 className="text-xl font-bold mb-4">卡密兑换</h3>
            <div className="flex bg-slate-100 p-1 rounded-xl mb-6 text-[10px] font-bold">
               <button onClick={()=>setRechargeTab('card')} className={`flex-1 py-1.5 rounded-lg transition-all ${rechargeTab==='card'?'bg-white shadow text-slate-900':'text-slate-400'}`}>卡密核销</button>
               <button onClick={()=>setRechargeTab('online')} className={`flex-1 py-1.5 rounded-lg transition-all ${rechargeTab==='online'?'bg-white shadow text-slate-900':'text-slate-400'}`}>在线支付</button>
            </div>
            {rechargeTab === 'card' ? (
              <div className="space-y-4 animate-in fade-in">
                <Input id="card-input" placeholder="BOSS-XXXX-XXXX-XXXX" className="text-center font-mono uppercase h-11 bg-slate-50 border-none text-sm" />
                <Button onClick={()=>{
                  const val = (document.getElementById('card-input') as HTMLInputElement).value;
                  if(val.toUpperCase()==="BOSS"){ handleTX('topup',10,"卡密充值"); setIsRechargeOpen(false); alert("充值成功！账户增加 $10.00"); } else alert("卡密无效");
                }} className="w-full bg-slate-900 h-11 rounded-xl font-bold">立即核销</Button>
              </div>
            ) : (
              <div className="p-4 bg-orange-50 rounded-2xl border border-orange-100 flex items-start gap-3 text-left">
                <AlertCircle size={16} className="text-orange-500 shrink-0 mt-0.5"/>
                <p className="text-[10px] text-orange-700 leading-relaxed font-medium">在线支付接口正在维护升级中。目前仅支持通过“卡密核销”进行充值。请联系管理员获取卡密。</p>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}