"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { 
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue 
} from "@/components/ui/select"
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger,
} from "@/components/ui/dialog"
import { 
  Wallet, Copy, Check, Bot, User, Loader2, Terminal, ChevronRight, Square, Send, 
  Lightbulb, Paperclip, X, FileCode, FileText, Plus, Mail, Phone, Lock, LogOut, 
  ShieldCheck, Eye, EyeOff, Database, AlertCircle, Shield, Users, CreditCard
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

// ==========================================
// 🛠️ 密码强度组件 (保持不变)
// ==========================================
function getPasswordStrength(password: string) {
  let score = 0
  if (password.length > 6) score++
  if (password.length > 10) score++
  if (/[A-Z]/.test(password)) score++
  if (/[0-9]/.test(password)) score++
  if (/[^A-Za-z0-9]/.test(password)) score++
  return score
}

function PasswordStrengthMeter({ password }: { password: string }) {
  const score = getPasswordStrength(password)
  const strength = ["危险", "太弱", "一般", "强", "非常安全"]
  const colors = ["bg-red-500", "bg-orange-500", "bg-yellow-500", "bg-blue-500", "bg-green-500"]
  if (!password) return null
  return (
    <div className="mt-2 space-y-1 animate-in slide-in-from-top-1">
      <div className="flex gap-1 h-1.5">
        {[0, 1, 2, 3, 4].map((i) => (
          <div key={i} className={`flex-1 rounded-full transition-all duration-500 ${i < score ? colors[score-1] || colors[0] : 'bg-gray-200'}`} />
        ))}
      </div>
      <div className="flex justify-between text-xs text-gray-500">
        <span>强度: <span className={`font-bold ${score < 3 ? 'text-red-500' : 'text-green-600'}`}>{strength[Math.min(score, 4)]}</span></span>
      </div>
    </div>
  )
}

// ==========================================
// 👇 1. 登录/注册组件 (AuthPage)
// ❌ 移除了原来的管理员入口
// ==========================================
function AuthPage({ onLogin }: { onLogin: (userInfo: any) => void }) {
  const [isRegister, setIsRegister] = useState(false)
  const [authMethod, setAuthMethod] = useState<"email" | "phone">("email")
  
  const [nickname, setNickname] = useState("")
  const [account, setAccount] = useState("")
  const [password, setPassword] = useState("")
  const [showPassword, setShowPassword] = useState(false)
  
  const [verifyCode, setVerifyCode] = useState("")
  const [isCodeSent, setIsCodeSent] = useState(false)
  const [countdown, setCountdown] = useState(0)
  const [realCode, setRealCode] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSendCode = () => {
    if (!account) { alert("请先输入账号"); return; }
    const code = Math.floor(100000 + Math.random() * 900000).toString()
    setRealCode(code)
    setIsCodeSent(true)
    setCountdown(60)
    alert(`【冰式AI安全中心】\n您的验证码是：${code}`)
    const timer = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) { clearInterval(timer); setIsCodeSent(false); return 0 }
        return prev - 1
      })
    }, 1000)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!account || !password) { alert("账号密码不能为空"); return; }
    setLoading(true)
    
    setTimeout(() => {
      setLoading(false)

      if (isRegister) {
        if (!nickname) { alert("请输入昵称"); return; }
        if (verifyCode !== realCode) { alert("❌ 验证码错误！"); return; }
        if (getPasswordStrength(password) < 2) { 
           if (!confirm("⚠️ 您的密码过于简单，存在被盗风险。确定要继续使用吗？")) return;
        }

        const dbStr = localStorage.getItem("my_ai_users_db")
        const db = dbStr ? JSON.parse(dbStr) : []
        if (db.find((u: any) => u.account === account)) {
           alert("该账号已被注册！请直接登录"); setIsRegister(false); return;
        }

        const newUser = {
          id: "u_" + Math.random().toString(36).substr(2, 9),
          nickname, account, password, balance: 0.00, regTime: new Date().toLocaleString(),
          role: 'user' // 默认角色
        }
        
        db.push(newUser)
        localStorage.setItem("my_ai_users_db", JSON.stringify(db))
        localStorage.setItem("my_ai_user", JSON.stringify(newUser))
        alert("🎉 注册成功！")
        onLogin(newUser)
      } else {
        // --- 🔒 核心修改：登录逻辑 ---
        
        // 1. 检查是否是特权管理员账号
        if (account === "admin" && password === "admin123") {
            const adminUser = {
                id: "admin_001",
                nickname: "超级管理员",
                account: "admin",
                role: 'admin', // 👑 赋予管理员权限
                balance: 9999999
            }
            alert("👑 欢迎回来，超级管理员！")
            localStorage.setItem("my_ai_user", JSON.stringify(adminUser))
            onLogin(adminUser)
            return
        }

        // 2. 普通用户登录
        const dbStr = localStorage.getItem("my_ai_users_db")
        const db = dbStr ? JSON.parse(dbStr) : []
        const user = db.find((u: any) => u.account === account && u.password === password)
        
        if (user) {
             alert(`欢迎回来，${user.nickname}！`)
             localStorage.setItem("my_ai_user", JSON.stringify(user))
             onLogin(user)
        } else {
             alert("❌ 账号或密码错误")
        }
      }
    }, 1000)
  }

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden pointer-events-none">
         <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] bg-blue-200/20 rounded-full blur-3xl"></div>
         <div className="absolute top-[40%] -right-[10%] w-[40%] h-[40%] bg-purple-200/20 rounded-full blur-3xl"></div>
      </div>

      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-700 z-10">
        <div className="text-6xl mb-4 drop-shadow-sm">🧊</div>
        <h1 className="text-3xl font-bold text-gray-900 tracking-tight">冰式 AI 站</h1>
        <p className="text-gray-500 mt-2 text-sm">企业级安全架构 · 银行级数据防护</p>
      </div>

      <Card className="w-full max-w-md p-8 shadow-2xl bg-white/80 backdrop-blur-xl border border-white/50 animate-in zoom-in duration-500 z-10">
        <div className="flex w-full mb-6 bg-gray-100 p-1 rounded-lg">
          <button onClick={() => setIsRegister(false)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${!isRegister ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>登录账户</button>
          <button onClick={() => setIsRegister(true)} className={`flex-1 py-2 text-sm font-medium rounded-md transition-all ${isRegister ? 'bg-white shadow text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>注册新用户</button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegister && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-xs font-medium text-gray-700 ml-1">用户昵称</label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                <Input placeholder="怎么称呼您？" className="pl-9 bg-gray-50/50" value={nickname} onChange={e => setNickname(e.target.value)} />
              </div>
            </div>
          )}
          {isRegister && (
             <div className="flex gap-4 text-xs mb-1 px-1">
               <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"><input type="radio" name="method" checked={authMethod === 'email'} onChange={() => setAuthMethod('email')} className="accent-blue-600"/><span>邮箱注册</span></label>
               <label className="flex items-center gap-1 cursor-pointer hover:text-blue-600 transition-colors"><input type="radio" name="method" checked={authMethod === 'phone'} onChange={() => setAuthMethod('phone')} className="accent-blue-600"/><span>手机号注册</span></label>
             </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">{isRegister ? (authMethod === 'email' ? '电子邮箱' : '手机号码') : '账号'}</label>
            <div className="relative">
              {authMethod === 'email' || !isRegister ? (<Mail className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />) : (<Phone className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />)}
              <Input placeholder={isRegister ? (authMethod === 'email' ? 'name@example.com' : '13800000000') : '输入账号 (admin)'} className="pl-9 bg-gray-50/50" value={account} onChange={e => setAccount(e.target.value)} />
            </div>
          </div>
          {isRegister && (
            <div className="space-y-1 animate-in slide-in-from-top-2">
              <label className="text-xs font-medium text-gray-700 ml-1">安全验证</label>
              <div className="flex gap-2">
                <div className="relative flex-1">
                   <ShieldCheck className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
                   <Input placeholder="6位数字验证码" className="pl-9 bg-gray-50/50" value={verifyCode} onChange={e => setVerifyCode(e.target.value)} maxLength={6} />
                </div>
                <Button type="button" variant="outline" onClick={handleSendCode} disabled={isCodeSent} className="min-w-[100px] text-xs">{isCodeSent ? `${countdown}s 后重发` : "获取验证码"}</Button>
              </div>
            </div>
          )}
          <div className="space-y-1">
            <label className="text-xs font-medium text-gray-700 ml-1">密码</label>
            <div className="relative">
              <Lock className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
              <Input type={showPassword ? "text" : "password"} placeholder="设置密码" className="pl-9 pr-9 bg-gray-50/50" value={password} onChange={e => setPassword(e.target.value)} />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600">{showPassword ? <EyeOff size={16}/> : <Eye size={16}/>}</button>
            </div>
            {isRegister && <PasswordStrengthMeter password={password} />}
          </div>
          <Button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 mt-6 h-10 shadow-lg shadow-blue-200" disabled={loading}>
            {loading ? <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> 安全校验中...</> : (isRegister ? "立即注册" : "安全登录")}
          </Button>
        </form>
        <div className="mt-8 pt-4 border-t border-gray-100 flex flex-col items-center gap-3">
          <div className="text-center text-[10px] text-gray-400 leading-tight">点击登录即代表您已阅读并同意 <a href="#" className="text-blue-500 hover:underline">《用户服务协议》</a> 与 <a href="#" className="text-blue-500 hover:underline">《隐私保护政策》</a></div>
        </div>
      </Card>
    </div>
  )
}

// ==========================================
// 👑 3. 管理员面板组件 (AdminSidebar)
// ==========================================
function AdminSidebar() {
  const [users, setUsers] = useState<any[]>([])

  useEffect(() => {
    // 读取所有用户数据
    const db = localStorage.getItem("my_ai_users_db")
    if (db) setUsers(JSON.parse(db))
  }, [])

  return (
    <div className="w-[320px] bg-slate-900 text-white flex flex-col h-[700px] rounded-r-xl shadow-2xl border-l border-slate-700 animate-in slide-in-from-right duration-500">
      <div className="p-4 border-b border-slate-700 flex items-center justify-between">
        <div className="flex items-center gap-2 font-bold">
           <Shield size={18} className="text-red-500" />
           管理员控制台
        </div>
        <div className="text-xs bg-red-900/50 text-red-300 px-2 py-0.5 rounded border border-red-800">Root</div>
      </div>
      
      {/* 数据概览 */}
      <div className="grid grid-cols-2 gap-2 p-4 border-b border-slate-800">
         <div className="bg-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 flex items-center gap-1"><Users size={10}/> 总用户</div>
            <div className="text-xl font-bold mt-1">{users.length}</div>
         </div>
         <div className="bg-slate-800 p-3 rounded-lg">
            <div className="text-xs text-slate-400 flex items-center gap-1"><CreditCard size={10}/> 总资金池</div>
            <div className="text-xl font-bold mt-1 text-green-400">$0.00</div>
         </div>
      </div>

      <div className="flex-1 overflow-y-auto p-2">
         <h3 className="text-xs font-bold text-slate-500 mb-2 uppercase px-2">User Database</h3>
         <div className="space-y-2">
            {users.length === 0 ? (
               <div className="text-center text-slate-600 text-xs py-10">暂无注册用户</div>
            ) : (
               users.map((u, i) => (
                  <div key={i} className="bg-slate-800 p-3 rounded border border-slate-700 hover:border-blue-500 transition-colors cursor-default">
                     <div className="flex justify-between items-start mb-1">
                        <span className="font-bold text-sm text-blue-300">{u.nickname}</span>
                        <span className="text-[10px] bg-slate-700 px-1 rounded text-slate-300">{u.id}</span>
                     </div>
                     <div className="text-xs text-slate-400 mb-0.5">账号: {u.account}</div>
                     <div className="text-xs text-slate-400 mb-0.5">密码: <span className="text-red-400 font-mono">{u.password}</span></div>
                     <div className="flex justify-between items-center mt-2 pt-2 border-t border-slate-700/50">
                        <span className="text-[10px] text-slate-500">{u.regTime}</span>
                        <span className="text-xs text-green-400 font-mono">${u.balance}</span>
                     </div>
                  </div>
               ))
            )}
         </div>
      </div>
      <div className="p-3 text-[10px] text-slate-600 text-center border-t border-slate-800">
         仅限内部人员访问 · 操作已记录
      </div>
    </div>
  )
}

// ==========================================
// 👇 4. 主程序 (Home)
// ==========================================
// ... (CopyButton, Thinking 等保持不变) ...
function CopyButton({ content }: { content: string }) { const [isCopied, setIsCopied] = useState(false); const handleCopy = async () => { try { await navigator.clipboard.writeText(content); setIsCopied(true); setTimeout(() => setIsCopied(false), 2000); } catch (err) { console.error("复制失败", err); } }; return (<button onClick={handleCopy} className="flex items-center gap-1 text-xs text-gray-400 hover:text-blue-600 transition-colors py-1 px-2 rounded hover:bg-gray-100">{isCopied ? <><Check size={14} className="text-green-500"/><span className="text-green-500">已复制</span></> : <><Copy size={14}/><span>复制</span></>}</button>) }
function Thinking({ plan }: { plan: string[] }) { const [currentStep, setCurrentStep] = useState(0); const [logs, setLogs] = useState<string[]>([]); const subTasks = ["分配内存堆栈...", "挂载上下文...", "验证Token有效性...", "连接向量数据库...", "执行余弦相似度搜索...", "过滤冗余信息...", "构建推理树...", "评估置信度...", "优化语言模型参数...", "渲染Markdown流..."]; useEffect(() => { if (currentStep < 3) { const timer = setTimeout(() => setCurrentStep(prev => prev + 1), 2800); return () => clearTimeout(timer); } }, [currentStep]); useEffect(() => { if (currentStep >= 4) return; const interval = setInterval(() => { const randomLog = subTasks[Math.floor(Math.random() * subTasks.length)]; setLogs(prev => [randomLog, ...prev].slice(0, 3)); }, 400); return () => clearInterval(interval); }, [currentStep]); return (<div className="flex gap-3 animate-in fade-in slide-in-from-bottom-2 duration-500 my-4 w-full max-w-[85%]"><div className="w-8 h-8 rounded-full bg-blue-50 border border-blue-100 flex items-center justify-center flex-shrink-0"><Loader2 size={16} className="text-blue-500 animate-spin" /></div><div className="bg-slate-50 border border-blue-100 rounded-xl p-4 shadow-sm w-full font-mono text-sm"><div className="flex items-center gap-2 text-xs text-gray-400 mb-3 border-b border-gray-100 pb-2"><Terminal size={12} /><span>AI Process Monitor</span></div><div className="space-y-3">{plan.map((stepText, index) => { const isDone = index < currentStep; const isActive = index === currentStep; const isPending = index > currentStep; return (<div key={index} className={`flex flex-col transition-all duration-300 ${isPending ? 'opacity-30' : 'opacity-100'}`}><div className="flex items-center gap-3"><div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold border ${isDone ? 'bg-green-500 border-green-500 text-white' : ''} ${isActive ? 'bg-blue-600 border-blue-600 text-white animate-pulse' : ''} ${isPending ? 'bg-white border-gray-300 text-gray-300' : ''}`}>{isDone ? <Check size={12} /> : index + 1}</div><span className={`font-medium ${isActive ? 'text-blue-700' : isDone ? 'text-gray-600' : 'text-gray-400'}`}>{stepText}</span></div>{isActive && <div className="ml-8 mt-1 space-y-1">{logs.map((log, i) => (<div key={i} className="text-[10px] text-gray-400 flex items-center gap-1 animate-in slide-in-from-left-2 fade-in duration-300"><ChevronRight size={8} /> {log}</div>))}</div>}</div>) })}</div></div></div>) }

export default function Home() {
  const [user, setUser] = useState<any>(null)
  
  useEffect(() => { const stored = localStorage.getItem("my_ai_user"); if (stored) { setUser(JSON.parse(stored)); } }, [])
  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); }

  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const abortControllerRef = useRef<AbortController | null>(null)
  const [selectedImages, setSelectedImages] = useState<string[]>([])
  const [selectedFile, setSelectedFile] = useState<{name: string, content: string} | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const defaultSteps = ["正在解析用户意图...", "正在构建检索策略...", "正在执行逻辑推理...", "正在生成最终回复..."]
  const [thinkingSteps, setThinkingSteps] = useState<string[]>(defaultSteps)
  const [model, setModel] = useState("gemini")
  const messagesEndRef = useRef<HTMLDivElement>(null)
  
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }) }, [messages, isLoading, thinkingSteps, selectedImages, selectedFile])

  const stopGeneration = () => { if (abortControllerRef.current) { abortControllerRef.current.abort(); abortControllerRef.current = null; } setIsLoading(false); const lastUserMsg = messages.filter(m => m.role === 'user').pop(); if (lastUserMsg) { const text = typeof lastUserMsg.content === 'string' ? lastUserMsg.content : lastUserMsg.content.text; setInput(text); } }
  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => { const files = e.target.files; if (!files || files.length === 0) return; const firstFile = files[0]; if (!firstFile.type.startsWith('image/')) { const reader = new FileReader(); reader.onloadend = () => { setSelectedFile({ name: firstFile.name, content: reader.result as string }); setSelectedImages([]); }; reader.readAsText(firstFile); return; } const remainingSlots = 9 - selectedImages.length; if (remainingSlots <= 0) { alert("图片已达上限"); return; } let filesToProcess = Array.from(files); if (filesToProcess.length > remainingSlots) filesToProcess = filesToProcess.slice(0, remainingSlots); const newImages: string[] = []; await Promise.all(filesToProcess.map(file => new Promise<void>((resolve) => { if (file.size > 5*1024*1024) { resolve(); return; } const reader = new FileReader(); reader.onloadend = () => { newImages.push(reader.result as string); resolve(); }; reader.readAsDataURL(file); }))); if (newImages.length > 0) { setSelectedImages(prev => [...prev, ...newImages]); setSelectedFile(null); } if (fileInputRef.current) fileInputRef.current.value = ""; }
  const removeImage = (index: number) => { setSelectedImages(prev => prev.filter((_, i) => i !== index)) }
  const handleSend = async (e?: any, textOverride?: string) => { e?.preventDefault(); const contentToSend = textOverride || input; if ((!contentToSend.trim() && selectedImages.length === 0 && !selectedFile) || isLoading) return; let apiContent: any = contentToSend; let uiContent: any = contentToSend; if (selectedImages.length > 0) { uiContent = { type: 'images_mixed', text: contentToSend, images: selectedImages }; apiContent = [{ type: 'text', text: contentToSend || "分析图片" }, ...selectedImages.map(img => ({ type: 'image', image: img }))]; } else if (selectedFile) { const promptWithFile = `${contentToSend}\n\n附件: ${selectedFile.name}\n${selectedFile.content}`; uiContent = { type: 'file_mixed', text: contentToSend, fileName: selectedFile.name }; apiContent = promptWithFile; } const userMsg = { role: 'user', content: uiContent }; setMessages(prev => [...prev, userMsg]); setInput(""); setSelectedImages([]); setSelectedFile(null); setIsLoading(true); setThinkingSteps(defaultSteps); const controller = new AbortController(); abortControllerRef.current = controller; try { const planText = typeof apiContent === 'string' ? apiContent : (contentToSend || "分析多图"); fetch('/api/plan', { method: 'POST', body: JSON.stringify({ message: planText.substring(0, 500) }) }).then(res => res.text()).then(text => { if (text && text.includes('|')) setThinkingSteps(text.split('|')) }).catch(() => {}); const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: messages.map(m => { if (typeof m.content !== 'string') return { role: m.role, content: m.content.text || "[附件]" }; return { role: m.role, content: m.content }; }).concat({ role: 'user', content: apiContent }), model }), signal: controller.signal }); if (!response.ok) throw new Error("Busy"); if (!response.body) return; const reader = response.body.getReader(); const decoder = new TextDecoder(); setMessages(prev => [...prev, { role: 'assistant', content: "" }]); while (true) { const { done, value } = await reader.read(); if (done) break; const text = decoder.decode(value, { stream: true }); setMessages(prev => { const newMsgs = [...prev]; const lastMsg = newMsgs[newMsgs.length - 1]; if (lastMsg.role === 'assistant') { lastMsg.content += text; } return newMsgs; }); } } catch (error: any) { if (error.name !== 'AbortError') alert(error.message); } finally { setIsLoading(false); abortControllerRef.current = null; } }
  
  const [rechargeCode, setRechargeCode] = useState("")
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const handleRecharge = () => { if (rechargeCode.toUpperCase() === "BOSS-9999") { alert("✅ 充值成功！"); setIsDialogOpen(false); } else { alert("❌ 无效卡密"); } }

  if (!user) { return <AuthPage onLogin={(u) => setUser(u)} /> }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 h-16 flex items-center justify-between">
          <div className="font-bold text-xl flex items-center gap-2">🧊 冰式AI站</div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 mr-2 bg-gray-100 px-3 py-1.5 rounded-full text-sm">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center text-xs ${user.role === 'admin' ? 'bg-red-500' : 'bg-blue-500'} text-white`}>
                  {user.nickname ? user.nickname[0].toUpperCase() : "U"}
                </div>
                <span className="text-gray-700 font-medium">{user.nickname}</span>
                {user.role === 'admin' && <span className="bg-red-100 text-red-600 text-[10px] px-1 rounded border border-red-200">ADMIN</span>}
             </div>
             <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
              <DialogTrigger asChild><Button variant="outline" className="text-orange-600 border-orange-200"><Wallet className="w-4 h-4 mr-2"/>余额: ${user.balance || "0.00"}</Button></DialogTrigger>
              <DialogContent className="sm:max-w-md"><DialogHeader><DialogTitle>账户充值 (USD)</DialogTitle></DialogHeader><Input placeholder="输入卡密" value={rechargeCode} onChange={e => setRechargeCode(e.target.value)} /><Button onClick={handleRecharge} className="w-full bg-orange-500 mt-4">立即核销</Button></DialogContent>
            </Dialog>
            <Button variant="ghost" size="icon" onClick={handleLogout} title="退出登录"><LogOut size={18} className="text-gray-500"/></Button>
          </div>
        </div>
      </nav>

      <div className="flex-1 flex items-center justify-center p-4">
        {/* 核心布局变化：管理员可见右侧面板 */}
        <div className={`flex w-full max-w-7xl gap-4 ${user.role === 'admin' ? 'justify-between' : 'justify-center'}`}>
          
          {/* 左侧：聊天主界面 (如果不是管理员，就居中显示；如果是管理员， flex-1 撑开) */}
          <Card className={`h-[700px] flex flex-col bg-white shadow-xl ${user.role === 'admin' ? 'flex-1' : 'w-full max-w-3xl'}`}>
             <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
              <h1 className="font-bold text-gray-700 flex items-center gap-2"><Bot size={20} className="text-blue-500"/> AI 助手 (Gemini 3 Pro)</h1>
              <Select value={model} onValueChange={setModel}><SelectTrigger className="w-[180px]"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="gemini">Gemini (免费)</SelectItem><SelectItem value="gpt4">GPT-4 (VIP)</SelectItem></SelectContent></Select>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-6 scroll-smooth">
               {messages.length === 0 && (<div className="text-center mt-20 text-gray-400"><div className="text-6xl mb-4">🧊</div><div className="text-lg">你好，{user.nickname}！有什么可以帮你的吗？</div><div className="flex gap-2 justify-center mt-4"><button onClick={() => handleSend(null, "分析上海未来一周天气")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 text-gray-600 transition">🌦️ 上海天气</button><button onClick={() => handleSend(null, "写一个科幻短篇故事")} className="px-3 py-1 bg-gray-100 rounded-full text-sm hover:bg-gray-200 text-gray-600 transition">📝 写个故事</button></div></div>)}
               {messages.map((m, i) => { let content = ""; let images: string[] = []; let fileName = null; if (typeof m.content === 'string') { content = m.content } else if (m.content.type === 'images_mixed') { content = m.content.text; images = m.content.images || []; } else if (m.content.type === 'file_mixed') { content = m.content.text; fileName = m.content.fileName; } const [mainText, relatedStr] = content.split('___RELATED___'); const suggestions = relatedStr ? relatedStr.split('|').filter((s: string) => s.trim()) : []; return (<div key={i} className={`flex gap-3 ${m.role === 'user' ? 'justify-end' : 'justify-start'} animate-in fade-in slide-in-from-bottom-2 duration-300`}>{m.role !== 'user' && <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-1"><Bot size={16} className="text-blue-600" /></div>}<div className="flex flex-col gap-2 max-w-[85%]"><div className={`rounded-2xl px-5 py-3 shadow-sm overflow-hidden ${m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-white border border-gray-100 text-gray-800'}`}>{images.length > 0 && (<div className={`mb-3 ${images.length === 1 ? '' : 'grid gap-2 grid-cols-2 sm:grid-cols-3'}`}>{images.map((img, idx) => (<div key={idx} className={`rounded-lg overflow-hidden border border-white/20 relative group ${images.length === 1 ? 'max-w-[280px]' : 'aspect-square'}`}><img src={img} alt={`img-${idx}`} className="w-full h-full object-cover" /></div>))}</div>)}{fileName && (<div className="mb-3 p-3 bg-black/10 rounded-lg flex items-center gap-3 border border-white/10"><div className="p-2 bg-white rounded-lg"><FileCode size={20} className="text-blue-600" /></div><div className="flex flex-col"><span className="text-sm font-bold opacity-90">已上传文件</span><span className="text-xs opacity-75">{fileName}</span></div></div>)}<div className={`prose prose-sm sm:prose-base max-w-none break-words leading-relaxed prose-p:my-2 prose-p:leading-7 prose-headings:font-bold prose-headings:my-3 prose-headings:text-gray-900 prose-li:my-1 prose-strong:font-bold prose-table:border prose-table:shadow-sm prose-table:rounded-lg prose-th:bg-gray-50 prose-th:p-3 prose-th:text-gray-700 prose-td:p-3 prose-td:border-t ${m.role === 'user' ? 'prose-invert prose-strong:text-white' : 'prose-strong:text-blue-600'}`}><ReactMarkdown>{mainText}</ReactMarkdown></div>{m.role !== 'user' && <div className="mt-2 pt-2 border-t border-gray-50 flex justify-end"><CopyButton content={mainText} /></div>}</div>{suggestions.length > 0 && m.role !== 'user' && (<div className="flex flex-wrap gap-2 mt-1"><div className="flex items-center gap-1 text-xs text-blue-500 font-medium mb-1 w-full"><Lightbulb size={12} /> 猜你想问:</div>{suggestions.map((s: string, idx: number) => (<button key={idx} onClick={() => handleSend(null, s.trim())} className="px-3 py-1.5 bg-white border border-blue-100 rounded-xl text-sm text-gray-600 hover:bg-blue-50 hover:text-blue-600 hover:border-blue-200 transition-all shadow-sm text-left animate-in zoom-in duration-300" style={{ animationDelay: `${idx * 100}ms` }}>{s.trim()}</button>))}</div>)}</div>{m.role === 'user' && <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center flex-shrink-0 mt-1"><User size={16} className="text-gray-500" /></div>}</div>) })}
               {isLoading && <Thinking plan={thinkingSteps} />}
               <div ref={messagesEndRef} />
            </div>
            <div className="p-4 bg-white border-t space-y-3">
               {selectedImages.length > 0 && (<div className="flex flex-wrap gap-2">{selectedImages.map((img, idx) => (<div key={idx} className="relative w-16 h-16 group animate-in zoom-in duration-300"><img src={img} alt="preview" className="w-full h-full object-cover rounded-lg border border-gray-200 shadow-sm" /><button onClick={() => removeImage(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm z-10"><X size={12} /></button></div>))}{selectedImages.length < 9 && (<button onClick={() => fileInputRef.current?.click()} className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400 hover:border-blue-400 hover:text-blue-400 transition-colors"><Plus size={20} /></button>)}</div>)}
               {selectedFile && (<div className="relative inline-block animate-in slide-in-from-bottom-2 fade-in"><div className="h-16 w-auto px-4 flex items-center gap-2 bg-gray-50 border border-gray-200 rounded-lg"><FileText size={20} className="text-blue-500"/><span className="text-sm text-gray-600 max-w-[150px] truncate">{selectedFile.name}</span></div><button onClick={() => setSelectedFile(null)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 hover:bg-red-600 shadow-sm z-10"><X size={12} /></button></div>)}
              {isLoading ? (<div className="flex gap-2"><Button onClick={stopGeneration} className="w-full bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 flex items-center justify-center gap-2"><Square size={16} fill="currentColor" /> 停止生成 (Stop)</Button></div>) : (<form onSubmit={(e) => handleSend(e)} className="flex gap-2 items-center"><input type="file" ref={fileInputRef} multiple accept="image/*,.txt,.md,.js,.py,.html,.css,.json,.csv" className="hidden" onChange={handleFileSelect} /><Button type="button" variant="ghost" size="icon" className="text-gray-500 hover:text-blue-600 hover:bg-blue-50" onClick={() => fileInputRef.current?.click()} title="上传图片(最多9张)或文件"><Paperclip size={20} /></Button><Input value={input} onChange={e => setInput(e.target.value)} className="flex-1" placeholder="输入问题..." /><Button type="submit" className="bg-blue-600 hover:bg-blue-700"><Send size={18} /></Button></form>)}
            </div>
          </Card>

          {/* 右侧：管理员面板 (仅 Admin 可见) */}
          {user.role === 'admin' && <AdminSidebar />}
          
        </div>
      </div>
    </div>
  )
}