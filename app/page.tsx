"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { 
  Wallet, Copy, Check, Bot, User, Loader2, Terminal, ChevronRight, Square, Send, 
  Lightbulb, Paperclip, X, FileCode, FileText, Plus, Mail, Lock, LogOut, 
  ShieldCheck, Eye, EyeOff, Shield, Users, CreditCard,
  Calendar, Ticket, History
} from "lucide-react"
import ReactMarkdown from 'react-markdown'

// --- 类型定义 ---
type Transaction = {
  id: string;
  type: 'topup' | 'consume';
  amount: string;
  description: string;
  time: string;
}

// --- 个人中心看板组件 ---
function UserProfile({ user, transactions, onLogout, onRechargeClick }: { 
  user: any, 
  transactions: Transaction[], 
  onLogout: () => void,
  onRechargeClick: () => void
}) {
  return (
    <div className="space-y-6">
       <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center text-xl font-bold shadow-md">
               {user.nickname ? user.nickname[0].toUpperCase() : "U"}
            </div>
            <div>
               <h2 className="text-lg font-bold text-gray-900">{user.nickname}</h2>
               <p className="text-xs text-gray-400 font-mono">UID: {user.id}</p>
            </div>
          </div>
          <Button variant="ghost" size="icon" onClick={onLogout} className="text-red-500 hover:bg-red-50">
             <LogOut size={18}/>
          </Button>
       </div>

       <div className="bg-slate-900 rounded-2xl p-5 text-white relative overflow-hidden shadow-xl">
          <div className="relative z-10">
             <div className="flex justify-between items-start">
                <div>
                   <p className="text-slate-400 text-[10px] mb-1">可用余额 (USD)</p>
                   <h3 className="text-3xl font-bold font-mono">${user.balance}</h3>
                </div>
                <Button onClick={onRechargeClick} className="bg-blue-600 hover:bg-blue-500 text-xs h-8 px-3">
                   立即充值
                </Button>
             </div>
          </div>
       </div>

       <div className="space-y-3">
          <div className="flex items-center gap-2 font-bold text-sm text-gray-700">
             <History size={16} className="text-blue-500"/>
             财务流水明细
          </div>
          <div className="border rounded-xl overflow-hidden bg-white max-h-[250px] overflow-y-auto">
             <table className="w-full text-[11px] text-left">
                <thead className="bg-gray-50 border-b sticky top-0">
                   <tr>
                      <th className="p-2">明细</th>
                      <th className="p-2 text-right">金额</th>
                   </tr>
                </thead>
                <tbody className="divide-y">
                   {transactions.length === 0 ? (
                     <tr><td colSpan={2} className="p-6 text-center text-gray-400">暂无记录</td></tr>
                   ) : (
                     transactions.map((t) => (
                        <tr key={t.id}>
                           <td className="p-2">
                              <div className="font-medium">{t.description}</div>
                              <div className="text-[9px] text-gray-400">{t.time}</div>
                           </td>
                           <td className={`p-2 text-right font-bold ${t.type === 'topup' ? 'text-green-600' : 'text-red-500'}`}>
                              {t.type === 'topup' ? '+' : '-'}${t.amount}
                           </td>
                        </tr>
                     ))
                   )}
                </tbody>
             </table>
          </div>
       </div>
    </div>
  )
}

export default function Home() {
  const [user, setUser] = useState<any>(null)
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [isProfileOpen, setIsProfileOpen] = useState(false)
  const [isRechargeOpen, setIsRechargeOpen] = useState(false)
  const [messages, setMessages] = useState<any[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [model, setModel] = useState("gemini")
  const messagesEndRef = useRef<HTMLDivElement>(null)

  // 初始化加载用户和流水
  useEffect(() => {
    const stored = localStorage.getItem("my_ai_user")
    if (stored) {
      const u = JSON.parse(stored)
      setUser(u)
      const logs = localStorage.getItem(`tx_${u.id}`)
      if (logs) setTransactions(JSON.parse(logs))
    }
  }, [])

  // 财务逻辑：处理交易
  const handleTransaction = (type: 'topup' | 'consume', amount: number, desc: string) => {
    if (!user) return false
    const currentBal = parseFloat(user.balance)
    const newBal = type === 'topup' ? (currentBal + amount) : (currentBal - amount)
    
    if (newBal < 0) { alert("余额不足，请充值"); return false }

    const updatedUser = { ...user, balance: newBal.toFixed(2) }
    const newTx: Transaction = {
      id: "tx_" + Date.now(),
      type,
      amount: amount.toFixed(2),
      description: desc,
      time: new Date().toLocaleString()
    }

    const newHistory = [newTx, ...transactions]
    setUser(updatedUser)
    setTransactions(newHistory)
    localStorage.setItem("my_ai_user", JSON.stringify(updatedUser))
    localStorage.setItem(`tx_${user.id}`, JSON.stringify(newHistory))
    return true
  }

  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); }

  const handleSend = async (e?: any) => {
    e?.preventDefault()
    if (!input.trim() || isLoading) return

    // 每次发送扣除 0.01 美元
    if (!handleTransaction('consume', 0.01, "AI 对话消耗")) return

    const userMsg = { role: 'user', content: input }
    setMessages(prev => [...prev, userMsg])
    setInput("")
    setIsLoading(true)
    
    // 模拟 AI 回复 (此处需根据你实际的 API 调整)
    setTimeout(() => {
        setMessages(prev => [...prev, { role: 'assistant', content: "收到你的问题，正在分析中..." }])
        setIsLoading(false)
    }, 1000)
  }

  // --- 登录/注册逻辑封装 ---
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
        <Card className="w-full max-w-sm p-8 text-center space-y-6">
          <div className="text-5xl">🧊</div>
          <h1 className="text-2xl font-bold">欢迎回来</h1>
          <Button onClick={() => {
            const newUser = { id: "u_123", nickname: "冰式用户", account: "test@ai.com", balance: "0.10", regTime: new Date().toLocaleString(), role: 'user' }
            localStorage.setItem("my_ai_user", JSON.stringify(newUser))
            setUser(newUser)
            // 记录初始注册金流水
            const initTx: Transaction = { id: 'init', type: 'topup', amount: '0.10', description: '注册奖励', time: new Date().toLocaleString() }
            localStorage.setItem(`tx_${newUser.id}`, JSON.stringify([initTx]))
            setTransactions([initTx])
          }} className="w-full bg-blue-600">模拟一键登录/注册 (送$0.1)</Button>
        </Card>
      </div>
    )
  }

  return (
    <div className="flex min-h-screen flex-col bg-gray-50">
      <nav className="w-full bg-white border-b shadow-sm sticky top-0 z-50 h-16 flex items-center justify-between px-6">
        <div className="font-bold text-xl flex items-center gap-2">🧊 冰式AI站</div>
        
        <Dialog open={isProfileOpen} onOpenChange={setIsProfileOpen}>
          <DialogTrigger asChild>
            <button className="flex items-center gap-2 bg-gray-100 p-1 pr-3 rounded-full hover:bg-gray-200 border border-gray-200">
               <div className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center font-bold">
                 {user.nickname[0].toUpperCase()}
               </div>
               <div className="text-left hidden sm:block">
                  <div className="text-xs font-bold text-gray-800">{user.nickname}</div>
                  <div className="text-[9px] text-gray-400">点击查看余额</div>
               </div>
            </button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-md">
            <UserProfile 
              user={user} 
              transactions={transactions} 
              onLogout={handleLogout} 
              onRechargeClick={() => { setIsProfileOpen(false); setTimeout(() => setIsRechargeOpen(true), 300) }}
            />
          </DialogContent>
        </Dialog>
      </nav>

      {/* 充值弹窗 */}
      <Dialog open={isRechargeOpen} onOpenChange={setIsRechargeOpen}>
         <DialogContent className="sm:max-w-xs">
            <div className="p-4 space-y-4">
                <h3 className="text-center font-bold">核销兑换卡密</h3>
                <Input id="redeem-code" placeholder="输入卡密" className="text-center font-mono" />
                <Button onClick={() => {
                    const el = document.getElementById('redeem-code') as HTMLInputElement
                    if (el.value === "BOSS") {
                        handleTransaction('topup', 10, "卡密充值");
                        setIsRechargeOpen(false);
                        alert("充值成功 $10");
                    } else { alert("卡密无效") }
                }} className="w-full bg-blue-600">立即核销</Button>
            </div>
         </DialogContent>
      </Dialog>

      <main className="flex-1 flex justify-center p-4">
        <Card className="w-full max-w-3xl flex flex-col bg-white shadow-xl h-[700px]">
          <div className="p-4 border-b bg-gray-50 flex justify-between items-center text-sm font-bold">
             <span>🤖 AI 助手</span>
             <Select value={model} onValueChange={setModel}>
                <SelectTrigger className="w-32 h-8 border-none"><SelectValue /></SelectTrigger>
                <SelectContent><SelectItem value="gemini">Gemini 3 Pro</SelectItem></SelectContent>
             </Select>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((m, i) => (
              <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-4 py-2 rounded-2xl shadow-sm border ${
                    m.role === 'user' ? 'bg-blue-600 text-white border-blue-600' : 'bg-white text-gray-800 border-gray-100'
                }`}>
                  {/* ✅ 修复报错的关键：在外层 div 挂样式，Markdown 内部不传 className */}
                  <div className={`prose prose-sm max-w-none ${m.role === 'user' ? 'prose-invert' : ''}`}>
                    <ReactMarkdown>{m.content}</ReactMarkdown>
                  </div>
                </div>
              </div>
            ))}
            <div ref={messagesEndRef} />
          </div>

          <form onSubmit={handleSend} className="p-4 border-t bg-white flex gap-2">
            <Input value={input} onChange={e => setInput(e.target.value)} placeholder="有问题尽管问我..." className="flex-1" />
            <Button type="submit" disabled={isLoading} className="bg-blue-600 px-6">发送</Button>
          </form>
          <div className="pb-2 text-[10px] text-center text-gray-400">
            对话将消耗账户余额 · 每次提问 $0.01
          </div>
        </Card>
      </main>
    </div>
  )
}