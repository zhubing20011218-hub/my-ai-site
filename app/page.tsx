"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
// 🛡️ 兼容处理：如果 Tabs 还没安装好，我们用普通 div 代替，防止崩溃
import * as TabsPrimitive from "@radix-ui/react-tabs" 

import { 
  Wallet, Copy, Check, Bot, User, Loader2, Terminal, ChevronRight, Square, Send, 
  Lightbulb, Paperclip, X, FileCode, FileText, Plus, Mail, Phone, Lock, LogOut, 
  ShieldCheck, Eye, EyeOff, Shield, Users, CreditCard, Calendar, History
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

// --- 类型定义 ---
type Transaction = { id: string; type: 'topup' | 'consume'; amount: string; description: string; time: string; }

// ==========================================
// 🛠️ 辅助小组件 (密码强度/复制/思维链)
// ==========================================
function PasswordStrengthMeter({ password }: { password: string }) {
  const getStrength = (p: string) => {
    let s = 0; if (p.length > 6) s++; if (/[A-Z]/.test(p)) s++; if (/[0-9]/.test(p)) s++; if (/[^A-Za-z0-9]/.test(p)) s++; return s;
  };
  const score = getStrength(password);
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"];
  if (!password) return null;
  return (
    <div className="mt-2 space-y-1">
      <div className="flex gap-1 h-1">{[0,1,2,3,4].map(i=>(<div key={i} className={`flex-1 rounded-full ${i<score?colors[score-1]:'bg-gray-200'}`}/>))}</div>
      <p className="text-[10px] text-gray-500 text-right">安全等级: {["危险","弱","一般","强","极高"][Math.min(score,4)]}</p>
    </div>
  );
}

function CopyButton({ content }: { content: string }) {
  const [copied, setCopied] = useState(false);
  const handle = async () => { await navigator.clipboard.writeText(content); setCopied(true); setTimeout(()=>setCopied(false), 2000); };
  return (
    <button onClick={handle} className="flex items-center gap-1 text-[10px] text-gray-400 hover:text-blue-600 transition-colors">
      {copied ? <><Check size={12} className="text-green-500"/>已复制</> : <><Copy size={12}/>复制</>}
    </button>
  );
}

function Thinking({ plan }: { plan: string[] }) {
  const [step, setStep] = useState(0);
  const [logs, setLogs] = useState<string[]>([]);
  useEffect(() => {
    if (step < 3) { const t = setTimeout(() => setStep(s => s + 1), 2500); return () => clearTimeout(t); }
  }, [step]);
  useEffect(() => {
    if (step >= 4) return;
    const i = setInterval(() => {
      const tasks = ["分配内存...", "验证Token...", "检索库...", "优化参数...", "逻辑校准..."];
      setLogs(p => [tasks[Math.floor(Math.random()*tasks.length)], ...p].slice(0, 2));
    }, 600);
    return () => clearInterval(i);
  }, [step]);
  return (
    <div className="flex gap-3 my-4 animate-in fade-in slide-in-from-bottom-2 duration-500">
      <div className="w-8 h-8 rounded-full bg-blue-50 flex items-center justify-center flex-shrink-0"><Loader2 size={16} className="text-blue-500 animate-spin" /></div>
      <div className="bg-slate-50 border border-blue-100 rounded-xl p-3 shadow-sm w-full font-mono text-[11px]">
        <div className="flex items-center gap-2 text-gray-400 border-b pb-1 mb-2"><Terminal size={10}/><span>PROCESS_LOG</span></div>
        {plan.map((t, i) => (
          <div key={i} className={`flex flex-col mb-1 ${i > step ? 'opacity-20' : 'opacity-100'}`}>
            <div className="flex items-center gap-2">
              <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[8px] border ${i<step?'bg-green-500 border-green-500 text-white':i===step?'border-blue-500 text-blue-600':'text-gray-300'}`}>{i<step?<Check size={8}/>:i+1}</div>
              <span className={i===step?'text-blue-700 font-bold':''}>{t}</span>
            </div>
            {i===step && logs.map((l,li)=>(<div key={li} className="ml-6 text-[9px] text-gray-400 opacity-70 animate-in slide-in-from-left-1">{'> '}{l}</div>))}
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
  const [nickname, setNick] = useState("");
  const [account, setAcc] = useState("");
  const [password, setPwd] = useState("");
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
        if (code !== realCode) return alert("验证码错");
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        if (db.find((u:any)=>u.account===account)) return alert("账号已存在");
        const u = { id: "u_"+Math.random().toString(36).substr(2,6), nickname, account, password, balance: "0.10", regTime: new Date().toLocaleString(), role: 'user' };
        db.push(u); localStorage.setItem("my_ai_users_db", JSON.stringify(db));
        localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u);
      } else {
        if (account==="admin" && password==="admin123") {
          const adm = { id: "admin_01", nickname: "超级管理员", account: "admin", role: 'admin', balance: "9999.00", regTime: "2026/1/1" };
          onLogin(adm); return;
        }
        const db = JSON.parse(localStorage.getItem("my_ai_users_db") || "[]");
        const u = db.find((x:any)=>x.account===account && x.password===password);
        if(u){ localStorage.setItem("my_ai_user", JSON.stringify(u)); onLogin(u); } else alert("账号或密码错误");
      }
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md p-8 shadow-2xl bg-white/90 backdrop-blur-md">
        <div className="text-center mb-8"><div className="text-5xl mb-2">🧊</div><h1 className="text-2xl font-bold">冰式 AI 安全网关</h1></div>
        <div className="flex bg-gray-100 p-1 rounded-lg mb-6">
          <button onClick={()=>setIsReg(false)} className={`flex-1 py-1.5 text-sm rounded ${!isReg?'bg-white shadow text-blue-600':''}`}>登录</button>
          <button onClick={()=>setIsReg(true)} className={`flex-1 py-1.5 text-sm rounded ${isReg?'bg-white shadow text-blue-600':''}`}>注册</button>
        </div>
        <form onSubmit={handleAuth} className="space-y-4">
          {isReg && <Input placeholder="昵称" value={nickname} onChange={e=>setNick(e.target.value)} />}
          <Input placeholder="邮箱/手机号" value={account} onChange={e=>setAcc(e.target.value)} />
          {isReg && <div className="flex gap-2"><Input placeholder="6位验证码" value={code} onChange={e=>setCode(e.target.value)} /><Button type="button" variant="outline" onClick={sendCode} disabled={count>0} className="w-32 text-xs">{count>0?`${count}s`:"获取"}</Button></div>}
          <Input type="password" placeholder="密码" value={password} onChange={e=>setPwd(e.target.value)} />
          {isReg && <PasswordStrengthMeter password={password} />}
          <Button className="w-full bg-blue-600" disabled={load}>{load?<Loader2 className="animate-spin"/>:isReg?"创建账户":"安全登录"}</Button>
        </form>
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
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const abortRef = useRef<AbortController | null>(null);
  const [model, setModel] = useState("gemini");
  const [images, setImages] = useState<string[]>([]);
  const [file, setFile] = useState<{name:string, content:string} | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);
  const thinkingPlan = ["意图识别", "数据挖掘", "逻辑建模", "渲染回复"];

  useEffect(() => {
    const u = localStorage.getItem("my_ai_user");
    if(u) {
      const parsed = JSON.parse(u); setUser(parsed);
      const logs = localStorage.getItem(`tx_${parsed.id}`);
      if(logs) setTransactions(JSON.parse(logs));
    }
  }, []);

  useEffect(() => { scrollRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading, images]);

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); };

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

  const handleUpload = (e: any) => {
    const files = Array.from(e.target.files as FileList);
    if (files.length === 0) return;
    if (files[0].type.startsWith('image/')) {
      if(images.length + files.length > 9) return alert("最多9张");
      files.forEach(f => {
        const r = new FileReader(); r.onloadend = () => setImages(p => [...p, r.result as string]); r.readAsDataURL(f);
      });
      setFile(null);
    } else {
      const r = new FileReader(); r.onloadend = () => setFile({ name: files[0].name, content: r.result as string });
      r.readAsText(files[0]); setImages([]);
    }
  };

  const handleSend = async (e?: any, textOverride?: string) => {
    e?.preventDefault();
    const content = textOverride || input;
    if (!content.trim() && images.length === 0 && !file) return;
    if (!handleTX('consume', 0.01, "AI 提问消耗")) return;

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
    const init: Transaction = { id: 'init', type: 'topup', amount: '0.10', description: '注册奖励', time: new Date().toLocaleString() };
    setTransactions([init]); localStorage.setItem(`tx_${u.id}`, JSON.stringify([init]));
  }} />;

  return (
    <div className="flex min-h-screen bg-slate-50">
      <div className="flex flex-1 flex-col items-center justify-center p-4 transition-all duration-500">
        <nav className="w-full max-w-4xl bg-white border-b h-14 flex items-center justify-between px-6 sticky top-0 z-50 rounded-t-2xl shadow-sm">
          <div className="font-bold flex items-center gap-2 text-blue-600">🧊 冰式AI站</div>
          <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
            <DialogTrigger asChild>
              <button className="flex items-center gap-2 bg-gray-50 hover:bg-gray-100 p-1 pr-3 rounded-full border transition-all">
                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white font-bold ${user.role==='admin'?'bg-red-500':'bg-blue-600'}`}>{user.nickname[0].toUpperCase()}</div>
                <div className="text-left leading-tight hidden sm:block">
                  <div className="text-[10px] font-bold text-gray-800">{user.nickname}</div>
                  <div className="text-[8px] text-gray-400">点击查询余额</div>
                </div>
              </button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-md">
              <div className="space-y-6 pt-4">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold">个人看板</h2>
                  <Button variant="ghost" size="icon" onClick={handleLogout} className="text-red-500"><LogOut size={18}/></Button>
                </div>
                <div className="bg-slate-900 rounded-2xl p-6 text-white shadow-xl relative overflow-hidden">
                  <div className="relative z-10">
                    <p className="text-slate-400 text-xs mb-1">可用余额 (USD)</p>
                    <h3 className="text-4xl font-bold font-mono">${user.balance}</h3>
                    <Button onClick={()=>{setIsProfileOpen(false); setTimeout(()=>setIsRechargeOpen(true),300)}} className="mt-4 w-full bg-blue-600 hover:bg-blue-500">立即充值</Button>
                  </div>
                </div>
                <div className="space-y-2">
                  <div className="flex items-center gap-2 font-bold text-sm"><History size={16} className="text-blue-500"/> 流水明细</div>
                  <div className="border rounded-xl max-h-[200px] overflow-y-auto">
                    <table className="w-full text-[11px] text-left">
                      <thead className="bg-gray-50 border-b sticky top-0"><tr><th className="p-2">明细</th><th className="p-2 text-right">金额</th></tr></thead>
                      <tbody className="divide-y">{transactions.map(t=>(<tr key={t.id}><td className="p-2"><div>{t.description}</div><div className="text-[9px] text-gray-400">{t.time}</div></td><td className={`p-2 text-right font-bold ${t.type==='topup'?'text-green-600':'text-red-500'}`}>{t.type==='topup'?'+':'-'}${t.amount}</td></tr>))}</tbody>
                    </table>
                  </div>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </nav>

        <Card className="w-full max-w-4xl flex flex-col bg-white shadow-xl h-[750px] border-none rounded-t-none rounded-b-2xl overflow-hidden">
          <div className="p-3 border-b bg-gray-50/50 flex justify-between items-center">
            <div className="flex gap-2">{user.role==='admin' && <span className="text-[8px] bg-red-100 text-red-500 px-1 rounded flex items-center font-bold animate-pulse">ADMIN_MODE</span>}</div>
            <Select value={model} onValueChange={setModel}>
              <SelectTrigger className="w-32 h-8 border-none bg-transparent font-bold text-xs"><SelectValue /></SelectTrigger>
              <SelectContent><SelectItem value="gemini">Gemini 3 Pro</SelectItem></SelectContent>
            </Select>
          </div>

          <div className="flex-1 overflow-y-auto p-6 space-y-6 scroll-smooth">
            {messages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-gray-300">
                <div className="text-8xl mb-4">🧊</div>
                <p className="text-sm font-medium">你好，{user.nickname}。今天需要什么帮助？</p>
              </div>
            )}
            {messages.map((m, i) => (
              <div key={i} className={`flex gap-4 ${m.role==='user'?'justify-end':'justify-start'} animate-in fade-in slide-in-from-bottom-2`}>
                {m.role!=='user' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center mt-1"><Bot size={16} className="text-blue-600" /></div>}
                <div className="max-w-[85%] flex flex-col gap-2">
                  <div className={`rounded-2xl px-4 py-2.5 shadow-sm ${m.role==='user'?'bg-blue-600 text-white':'bg-white border text-gray-800'}`}>
                    {m.role === 'user' && typeof m.content === 'object' ? (
                      <div className="space-y-2">
                        {m.content.images?.length > 0 && <div className="grid grid-cols-3 gap-1">{m.content.images.map((img:any,idx:number)=>(<img key={idx} src={img} className="w-full aspect-square object-cover rounded-lg"/>))}</div>}
                        {m.content.file && <div className="flex items-center gap-1 text-[10px] opacity-70"><FileCode size={10}/>{m.content.file}</div>}
                        <p className="text-sm">{m.content.text}</p>
                      </div>
                    ) : (
                      <div className={`prose prose-sm max-w-none ${m.role==='user' ? 'prose-invert' : ''}`}>
                         <ReactMarkdown>{typeof m.content === 'string' ? m.content : m.content.text}</ReactMarkdown>
                      </div>
                    )}
                    {m.role!=='user' && <div className="mt-2 pt-2 border-t flex justify-end"><CopyButton content={m.content}/></div>}
                  </div>
                </div>
              </div>
            ))}
            {isLoading && <Thinking plan={thinkingPlan} />}
            <div ref={scrollRef} />
          </div>

          <div className="p-4 bg-white border-t space-y-2">
            {images.length > 0 && <div className="flex gap-1 mb-2">{images.map((img,idx)=>(<div key={idx} className="relative w-12 h-12"><img src={img} className="w-full h-full object-cover rounded border"/><button onClick={()=>setImages(p=>p.filter((_,i)=>i!==idx))} className="absolute -top-1 -right-1 bg-red-500 text-white rounded-full p-0.5"><X size={10}/></button></div>))}</div>}
            {file && <div className="bg-slate-50 p-2 rounded text-xs flex justify-between items-center border mb-2"><span>📄 {file.name}</span><button onClick={()=>setFile(null)}><X size={14}/></button></div>}
            
            {isLoading ? (
              <Button onClick={()=>abortRef.current?.abort()} className="w-full bg-red-50 text-red-600 border-red-200 hover:bg-red-100 gap-2"><Square size={14} fill="currentColor"/> 停止生成</Button>
            ) : (
              <form onSubmit={handleSend} className="flex gap-2 items-center bg-gray-100 p-1 rounded-xl border">
                <input type="file" ref={fileInputRef} hidden multiple accept="image/*,.py,.js,.txt" onChange={handleUpload} />
                <Button type="button" variant="ghost" size="icon" onClick={()=>fileInputRef.current?.click()} className="text-gray-400 hover:text-blue-600"><Paperclip size={18}/></Button>
                <Input value={input} onChange={e=>setInput(e.target.value)} className="flex-1 bg-transparent border-none focus-visible:ring-0 shadow-none text-sm" placeholder="输入消息 (消耗 $0.01)" />
                <Button type="submit" disabled={!input.trim() && images.length===0 && !file} className="bg-blue-600 hover:bg-blue-700 h-9 px-4 rounded-lg"><Send size={16}/></Button>
              </form>
            )}
          </div>
        </Card>
      </div>

      {user?.role === 'admin' && (
        <div className="w-80 bg-slate-900 text-white p-4 h-screen border-l flex flex-col">
          <h3 className="font-bold mb-4 flex items-center gap-2 text-red-400"><Shield size={16}/> 管理后台</h3>
          <div className="flex-1 overflow-y-auto space-y-2">
            {JSON.parse(localStorage.getItem("my_ai_users_db") || "[]").map((u:any)=>(
              <div key={u.id} className="bg-slate-800 p-3 rounded-lg text-xs">
                <div className="font-bold text-blue-400">{u.nickname}</div>
                <div>ID: {u.id} | 余额: <span className="text-green-400">${u.balance}</span></div>
              </div>
            ))}
          </div>
        </div>
      )}

      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
        <DialogContent className="sm:max-w-xs text-center p-6">
          <h3 className="font-bold mb-2">卡密兑换</h3>
          <Input id="card-input" placeholder="输入卡密" className="text-center mb-4 uppercase" />
          <Button onClick={()=>{
            const val = (document.getElementById('card-input') as HTMLInputElement).value;
            if(val==="BOSS"){ handleTX('topup',10,"卡密充值"); setIsRechargeOpen(false); alert("成功充值 $10"); } else { alert("卡密无效"); }
          }} className="w-full bg-blue-600">核销卡密</Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}