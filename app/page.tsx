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
  Settings2, Upload, Monitor, Smartphone, Square, Film
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

// --- 价格配置 (保留用于后端计算，前端不显示) ---
const MODEL_PRICING: Record<string, number> = {
  "gemini-2.5-flash": 0.01,
  "gemini-2.5-pro": 0.05,
  "gemini-exp-1206": 0.10,
  "sora-v1": 2.50,
  "veo-google": 1.80,
  "banana-sdxl": 0.20,
};

// --- 视频参数配置选项 ---
const ASPECT_RATIOS = [
    { label: "16:9", value: "16:9", icon: Monitor, desc: "横屏/YouTube" },
    { label: "9:16", value: "9:16", icon: Smartphone, desc: "竖屏/TikTok" },
    { label: "1:1", value: "1:1", icon: Square, desc: "正方形/Ins" },
    { label: "4:3", value: "4:3", icon: Monitor, desc: "电视/通用" },
    { label: "3:4", value: "3:4", icon: Smartphone, desc: "竖向通用" },
    { label: "21:9", value: "21:9", icon: Film, desc: "电影宽幕" },
    { label: "9:21", value: "9:21", icon: Smartphone, desc: "超长竖屏" },
    { label: "2:3", value: "2:3", icon: ImageIcon, desc: "经典照片" },
    { label: "3:2", value: "3:2", icon: ImageIcon, desc: "横向照片" },
    { label: "2.35:1", value: "2.35:1", icon: Film, desc: "宽银幕" },
];

const RESOLUTIONS = [
    { label: "720p (高清)", value: "720p" },
    { label: "1080p (全高清)", value: "1080p" },
    { label: "2K (超清)", value: "2k" },
    { label: "4K (极清)", value: "4k" },
];

const DURATIONS = [
    { label: "5秒 (快速)", value: 5 },
    { label: "10秒 (标准)", value: 10 },
    { label: "15秒 (加长)", value: 15 },
    { label: "25秒 (超长)", value: 25 },
];

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

// ... Thinking, AuthPage 组件保持不变 ...
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
          {authMode !== 'forgot' && (<div className="mt-8 pt-6 border-t border-slate-100 flex flex-col items-center gap-3">{authMode === 'register' && (<div className="flex items-center gap-2 px-4 py-1.5 bg-orange-50 text-orange-600 rounded-full border border-orange-100 shadow-sm animate-pulse"><PartyPopper size={14} className="animate-bounce" /><span className="text-[11px] font-bold">新用户注册即送体验金！</span></div>)}<button onClick={()=>{setAuthMode(authMode==='login'?'register':'login'); setError("");}} className="text-xs text-slate-500 hover:text-blue-600 font-bold transition-colors">{authMode === 'login' ? "没有账号？免费注册" : "已有账号？去登录"}</button></div>)}
        </Card>
        <p className="mt-8 text-[10px] text-slate-300 font-mono">Eureka Secure Auth System © 2026</p>
      </div>
    );
  }

// --- ✨ 多媒体生成器 (Pro版：支持自定义时长/分辨率/图生视频) ---
function MediaGenerator({ type, onConsume, showToast }: { type: 'video' | 'image', onConsume: (amount: number, desc: string) => Promise<boolean>, showToast: any }) {
  const [model, setModel] = useState(type === 'video' ? 'sora-v1' : 'banana-sdxl');
  const [prompt, setPrompt] = useState("");
  const [isGenerating, setIsGenerating] = useState(false);
  const [result, setResult] = useState<string | null>(null);
  const [isBlobUrl, setIsBlobUrl] = useState(false);

  // 视频高级参数
  const [aspectRatio, setAspectRatio] = useState("16:9");
  const [resolution, setResolution] = useState("1080p");
  const [duration, setDuration] = useState(5);
  const [refImage, setRefImage] = useState<string | null>(null);

  const availableModels = ALL_MODELS.filter(m => m.category === type);

  // 处理图片上传
  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (file) {
          const reader = new FileReader();
          reader.onloadend = () => {
              setRefImage(reader.result as string);
          };
          reader.readAsDataURL(file);
      }
  };

  const handleGenerate = async () => {
    if (!prompt.trim() && !refImage) {
        alert("请输入提示词或上传参考图片");
        return;
    }
    const cost = MODEL_PRICING[model] || 0.5;
    
    if (type === 'video') {
        const warning = refImage ? "图生视频模式" : "文生视频模式";
        if(!confirm(`${warning}：生成 ${resolution} / ${duration}秒 的视频需要约 1-3 分钟。请勿刷新页面，确认继续？`)) return;
    }

    const success = await onConsume(cost, `使用 ${model} 生成${type === 'video' ? '视频' : '图片'}`);
    if (!success) return;

    setIsGenerating(true);
    setResult(null);
    setIsBlobUrl(false);

    try {
      const response = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          messages: [{ role: 'user', content: prompt }], 
          model: model,
          // 传递高级参数
          aspectRatio,
          resolution,
          duration,
          image: refImage // 如果有图，传给后端
        }),
      });

      const contentType = response.headers.get("content-type");

      if (contentType && contentType.includes("video/mp4")) {
          const blob = await response.blob();
          const blobUrl = window.URL.createObjectURL(blob);
          setResult(blobUrl);
          setIsBlobUrl(true);
          showToast('success', '视频生成并传输成功！');
      } 
      else if (contentType && contentType.includes("application/json")) {
          const data = await response.json();
          if (data.error) {
              alert(`生成失败：${data.error}`);
          } else if (data.url) {
              setResult(data.url);
              setIsBlobUrl(false);
          }
      } else {
          const text = await response.text();
          alert(`未知响应：${text.slice(0, 100)}`);
      }

    } catch (e: any) {
      alert(`生成出错：${e.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  const handleForceDownload = async () => {
    if (!result) return;
    if (isBlobUrl) {
        const a = document.createElement('a');
        a.href = result;
        a.download = `eureka_video_${new Date().getTime()}.mp4`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('success', '已保存源文件');
        return;
    }
    try {
        showToast('loading', '正在请求原始文件...');
        const response = await fetch(result);
        if (!response.ok) throw new Error("文件获取失败");
        const blob = await response.blob();
        const blobUrl = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = blobUrl;
        const ext = type === 'video' ? 'mp4' : 'png';
        a.download = `eureka_${type}_${new Date().getTime()}.${ext}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(blobUrl);
        document.body.removeChild(a);
        showToast('success', '下载成功');
    } catch (e) {
        showToast('error', '下载失败，尝试新窗口打开');
        window.open(result, '_blank');
    }
  };

  return (
    <div className="flex flex-col md:flex-row h-full gap-6 p-6 max-w-7xl mx-auto">
       <div className="w-full md:w-1/3 flex flex-col gap-6 overflow-y-auto pr-2">
          <div>
            <h2 className="text-2xl font-black mb-2 flex items-center gap-2">
                {type === 'video' ? <Video className="text-blue-500"/> : <ImageIcon className="text-yellow-500"/>}
                AI {type === 'video' ? 'Video' : 'Image'} Studio
            </h2>
            <p className="text-sm text-slate-500 dark:text-slate-400">专业级 AI 创作控制台</p>
          </div>

          <div className="space-y-6">
             {/* 模型选择 */}
             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Settings2 size={12}/> 选择模型</label>
                <div className="grid grid-cols-1 gap-2">
                    {availableModels.map(m => (
                        <button 
                            key={m.id} 
                            onClick={() => setModel(m.id)}
                            className={`p-3 rounded-xl border text-left transition-all ${model === m.id ? 'bg-blue-600 border-blue-600 text-white shadow-lg shadow-blue-500/30' : 'bg-white dark:bg-slate-900 border-slate-200 dark:border-slate-800 hover:border-blue-500'}`}
                        >
                            <div className="font-bold text-sm">{m.name}</div>
                            <div className={`text-xs ${model === m.id ? 'text-blue-100' : 'text-slate-500'}`}>{m.desc}</div>
                        </button>
                    ))}
                </div>
             </div>

             {/* 仅在视频模式下显示高级设置 */}
             {type === 'video' && (
                 <>
                    {/* 参考图上传 (图生视频) */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><ImageIcon size={12}/> 参考图 (可选 - 图生视频)</label>
                        <div className="relative group">
                            <input type="file" accept="image/*" onChange={handleImageUpload} className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-10"/>
                            <div className={`border-2 border-dashed rounded-xl p-4 flex flex-col items-center justify-center transition-all ${refImage ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-slate-300 dark:border-slate-700 hover:border-blue-400'}`}>
                                {refImage ? (
                                    <div className="relative w-full h-32">
                                        <img src={refImage} alt="Ref" className="w-full h-full object-cover rounded-lg"/>
                                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-xs opacity-0 group-hover:opacity-100 transition-opacity">点击更换</div>
                                    </div>
                                ) : (
                                    <>
                                        <Upload size={24} className="text-slate-400 mb-2"/>
                                        <span className="text-xs text-slate-500">点击上传图片</span>
                                    </>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* 时长选择 */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Clock size={12}/> 视频时长</label>
                        <div className="grid grid-cols-4 gap-2">
                            {DURATIONS.map(d => (
                                <button key={d.value} onClick={() => setDuration(d.value)} className={`py-2 rounded-lg text-[10px] font-bold border transition-all ${duration === d.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500'}`}>
                                    {d.value}s
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* 分辨率 */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><Maximize2 size={12}/> 清晰度</label>
                        <select value={resolution} onChange={(e) => setResolution(e.target.value)} className="w-full h-10 px-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-transparent text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500">
                            {RESOLUTIONS.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
                        </select>
                    </div>

                    {/* 画幅比 - 10种 */}
                    <div className="space-y-2">
                        <label className="text-xs font-bold uppercase text-slate-400 flex items-center gap-1"><LayoutGrid size={12}/> 画幅比例</label>
                        <div className="grid grid-cols-5 gap-2">
                            {ASPECT_RATIOS.map(r => (
                                <button key={r.value} onClick={() => setAspectRatio(r.value)} className={`flex flex-col items-center justify-center p-1.5 rounded-lg border transition-all ${aspectRatio === r.value ? 'bg-blue-600 border-blue-600 text-white' : 'bg-transparent border-slate-200 dark:border-slate-700 text-slate-500 hover:bg-slate-100 dark:hover:bg-slate-800'}`}>
                                    <r.icon size={14} className="mb-1"/>
                                    <span className="text-[9px] font-bold">{r.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>
                 </>
             )}

             <div className="space-y-2">
                <label className="text-xs font-bold uppercase text-slate-400">提示词 (Prompt)</label>
                <textarea 
                    value={prompt}
                    onChange={(e) => setPrompt(e.target.value)}
                    placeholder={type === 'video' ? (refImage ? "描述如何让这张图片动起来，例如：镜头缓慢推进，烟雾缭绕..." : "一只在未来城市上空飞行的无人机，4k高清，电影感...") : "赛博朋克风格的街道，霓虹灯，雨夜..."}
                    className="flex min-h-[100px] w-full rounded-xl border border-slate-200 bg-white dark:bg-slate-900 px-3 py-2 text-sm shadow-sm placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:border-slate-800 dark:text-slate-200 resize-none"
                />
            </div>

             <Button 
                onClick={handleGenerate} 
                disabled={isGenerating || (!prompt.trim() && !refImage)}
                className={`w-full h-12 text-base font-bold text-white shadow-lg transition-all ${isGenerating ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700 shadow-blue-500/20'}`}
             >
                {isGenerating ? <Loader2 className="animate-spin mr-2"/> : (type === 'video' ? <Video size={18} className="mr-2"/> : <ImageIcon size={18} className="mr-2"/>)}
                {isGenerating ? (type==='video'?"正在渲染视频 (约1-3分钟)...":"正在绘图...") : "开始生成"}
             </Button>
          </div>
       </div>

       <div className="flex-1 bg-slate-950 rounded-3xl border border-slate-800 overflow-hidden relative flex flex-col">
          <div className="px-6 py-4 border-b border-slate-800 bg-slate-900/50 flex justify-between items-center">
             <div className="text-xs font-bold text-slate-400 uppercase tracking-widest">Output Preview</div>
             {result && (
                <div className="flex gap-2">
                    <Button size="sm" onClick={handleForceDownload} className="h-8 text-xs bg-blue-600 hover:bg-blue-700 text-white gap-1 shadow-sm font-bold">
                        <Download size={14}/> 下载源文件
                    </Button>
                </div>
             )}
          </div>
          
          <div className="flex-1 flex items-center justify-center p-6 bg-[url('https://grainy-gradients.vercel.app/noise.svg')] bg-opacity-20 relative min-h-[400px]">
             {!result && !isGenerating && (
                <div className="text-center opacity-30">
                    <div className="mb-4 flex justify-center">{type === 'video' ? <Video size={48}/> : <ImageIcon size={48}/>}</div>
                    <p className="text-sm">暂无生成内容</p>
                    <p className="text-xs">配置参数并点击生成</p>
                </div>
             )}
             
             {isGenerating && (
                <div className="text-center animate-pulse">
                    <Loader2 size={48} className="animate-spin text-blue-500 mx-auto mb-4"/>
                    <p className="text-base text-blue-400 font-black mb-2">AI 正在全力渲染中...</p>
                    <p className="text-xs text-slate-500 font-mono">这可能需要几分钟时间，请耐心等待，不要关闭页面。</p>
                    {type==='video' && <div className="mt-4 px-4 py-2 bg-blue-500/10 text-blue-300 text-xs rounded-full inline-flex items-center gap-2"><Clock size={12}/> 预计耗时: 1-3 分钟</div>}
                </div>
             )}

             {result && !isGenerating && (
                <div className="w-full h-full flex items-center justify-center animate-in fade-in zoom-in duration-500 relative">
                    {type === 'video' ? (
                        <video controls src={result} className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10" autoPlay loop />
                    ) : (
                        <img src={result} alt="Generated" className="max-w-full max-h-full rounded-2xl shadow-2xl border border-white/10 object-contain" />
                    )}
                </div>
             )}
          </div>
       </div>
    </div>
  );
}

// --- Home 组件主体 (保持不变) ---
export default function Home() {
  const [user, setUser] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<TabType>('home');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [chatList, setChatList] = useState<any[]>([]);
  const [currentChatId, setCurrentChatId] = useState<string | null>(null);
  
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [isRechargeOpen, setIsRechargeOpen] = useState(false);
  const [profileTab, setProfileTab] = useState('wallet');

  const [messages, setMessages] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [model, setModel] = useState("gemini-2.5-flash");
  const [isDarkMode, setIsDarkMode] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  
  const [previewTableData, setPreviewTableData] = useState<string | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewDocData, setPreviewDocData] = useState<string | null>(null);
  const [isDocPreviewOpen, setIsDocPreviewOpen] = useState(false);
  const [toastState, setToastState] = useState<{show: boolean, type: 'loading'|'success'|'error', msg: string}>({ show: false, type: 'loading', msg: '' });

  // Admin states
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

  const currentModelName = ALL_MODELS.find(m => m.id === model)?.name || model;

  const parseMessageContent = (content: any) => {
    let rawText = typeof content === 'string' ? content : content.text;
    if (!rawText) return { cleanText: '', suggestions: [] };
    const START_TAG = '___RELATED___';
    const parts = rawText.split(START_TAG);
    const cleanText = parts[0]; 
    let suggestions: string[] = [];
    if (parts[1]) { 
        suggestions = parts[1].split('|').map((q: string) => q.trim()).filter((q: string) => q.length > 0);
    }
    return { cleanText, suggestions };
  };

  useEffect(() => { 
    const u = localStorage.getItem("my_ai_user"); 
    if(u) { 
        const p = JSON.parse(u); 
        setUser(p); 
        syncUserData(p.id, p.role);
        fetchChatList(p.id); 
    }
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme === 'dark') setIsDarkMode(true);
    if (typeof window !== 'undefined' && window.innerWidth < 768) setIsSidebarOpen(false);
  }, []);

  const showToast = (type: 'loading' | 'success' | 'error', msg: string) => { setToastState({ show: true, type, msg }); setTimeout(() => setToastState(prev => ({ ...prev, show: false })), 3000); };
  const handleDownloadExcel = (csvData: string) => { showToast('loading', '正在生成 Excel...'); setTimeout(() => { try { const wb = XLSX.read(csvData, { type: 'string' }); XLSX.writeFile(wb, `eureka_data_${new Date().getTime()}.xlsx`); showToast('success', 'Excel 下载已开始'); } catch (e) { showToast('loading', '下载失败，请重试'); } }, 1500); };
  const handleDownloadWord = (text: string) => { showToast('loading', '正在生成 Word 文档...'); setTimeout(() => { try { const doc = new Document({ sections: [{ properties: {}, children: text.split('\n').map(line => new Paragraph({ children: [new TextRun(line)], spacing: { after: 200 } })), }], }); Packer.toBlob(doc).then(blob => { saveAs(blob, `eureka_doc_${new Date().getTime()}.docx`); showToast('success', 'Word 下载已开始'); }); } catch (e) { showToast('loading', '下载失败'); } }, 1500); };
  const handlePreviewDoc = (text: string) => { showToast('loading', '正在渲染文档...'); setTimeout(() => { setPreviewDocData(text); setIsDocPreviewOpen(true); showToast('success', '渲染完成'); }, 800); };
  const handlePreviewTable = (csvData: string) => { showToast('loading', '正在加载预览...'); setTimeout(() => { setPreviewTableData(csvData); setIsPreviewOpen(true); showToast('success', '加载完毕'); }, 1000); };

  const fetchChatList = async (uid: string) => { try { const res = await fetch(`/api/history?userId=${uid}`); const data = await res.json(); if(data.chats) setChatList(data.chats); } catch(e) { console.error("Fetch history failed", e); } };
  const loadChat = async (chatId: string) => { if (isLoading) return; setCurrentChatId(chatId); setMessages([]); if (window.innerWidth < 768) setIsSidebarOpen(false); setActiveTab('home'); try { const res = await fetch(`/api/history?chatId=${chatId}`, { method: 'PUT' }); const data = await res.json(); if (data.chat && data.chat.messages) { setMessages(data.chat.messages); } } catch(e) { console.error("Load chat failed", e); } };
  const startNewChat = () => { if (isLoading) return; setCurrentChatId(null); setMessages([]); if (window.innerWidth < 768) setIsSidebarOpen(false); setActiveTab('home'); };
  const deleteChat = async (e: any, chatId: string) => { e.stopPropagation(); if(!confirm("确定删除这条记录吗？")) return; await fetch(`/api/history?chatId=${chatId}`, { method: 'DELETE' }); if (currentChatId === chatId) startNewChat(); if (user) fetchChatList(user.id); };
  const handleLogout = () => { localStorage.removeItem("my_ai_user"); setUser(null); setIsProfileOpen(false); setMessages([]); setChatList([]); setCurrentChatId(null); };

  const syncUserData = async (uid: string, role: string) => { try { const res = await fetch(`/api/sync?id=${uid}&role=${role}`); const data = await res.json(); if (data.balance) { setUser((prev:any) => ({ ...prev, balance: data.balance })); setTransactions(data.transactions || []); } if (role === 'admin' && data.users) setAdminUsers(data.users); } catch (e) { console.error("Sync error:", e); } };
  const handleTX = async (type: 'topup' | 'consume', amount: number, desc: string) => { if(!user) return false; if (user.role === 'admin') return true; const cur = parseFloat(user.balance); if(type === 'consume' && cur < amount) { alert(`余额不足！需要 $${amount}`); return false; } try { const res = await fetch('/api/sync', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, type, amount, description: desc }) }); const data = await res.json(); if (!res.ok) { alert(data.error); return false; } setUser((prev:any) => ({ ...prev, balance: data.balance })); syncUserData(user.id, user.role); return true; } catch (e) { alert("网络错误"); return false; } };
  const toggleTheme = () => { const newMode = !isDarkMode; setIsDarkMode(newMode); localStorage.setItem("theme", newMode ? 'dark' : 'light'); };

  useEffect(() => { let interval: any; if (user && (isSupportOpen || (isAdminSupportOpen && activeSessionUser))) { const fetchMsg = async () => { const uid = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id; try { const res = await fetch(`/api/support?action=history&userId=${uid}`); const data = await res.json(); if (data.messages) { setSupportMessages(data.messages); if (supportScrollRef.current) supportScrollRef.current.scrollIntoView({ behavior: "smooth" }); } } catch(e) {} }; fetchMsg(); interval = setInterval(fetchMsg, 3000); } return () => clearInterval(interval); }, [user, isSupportOpen, isAdminSupportOpen, activeSessionUser]);
  const fetchSupportSessions = async () => { try { const res = await fetch('/api/support?action=list'); const data = await res.json(); if(data.sessions) setSupportSessions(data.sessions); } catch(e) {} };
  const sendSupportMessage = async () => { if(!supportInput.trim()) return; const targetUserId = (user.role === 'admin' && activeSessionUser) ? activeSessionUser : user.id; try { await fetch('/api/support', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: targetUserId, content: supportInput, isAdmin: user.role === 'admin' }) }); setSupportInput(""); const res = await fetch(`/api/support?action=history&userId=${targetUserId}`); const data = await res.json(); if (data.messages) setSupportMessages(data.messages); } catch(e) { alert("发送失败"); } };
  const fetchCards = async () => { try { const res = await fetch('/api/admin/cards'); const data = await res.json(); if(data.cards) setCards(data.cards); } catch(e) { console.error(e); } };
  const generateCards = async () => { try { const res = await fetch('/api/admin/cards', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(cardConfig) }); const data = await res.json(); if(data.success) { alert(`成功生成 ${data.count} 张卡密！`); fetchCards(); } else alert(data.error); } catch(e) { alert("生成失败"); } };
  const redeemCard = async () => { const code = (document.getElementById('card-input') as HTMLInputElement).value; if(!code) return alert("请输入卡密"); try { const res = await fetch('/api/card/redeem', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, code }) }); const data = await res.json(); if(data.success) { alert(`充值成功！到账 $${data.amount}`); setUser((prev:any) => ({ ...prev, balance: data.balance })); syncUserData(user.id, user.role); setIsRechargeOpen(false); } else { alert(data.error); } } catch(e) { alert("网络请求失败"); } };

  const handleSendSimple = async (text: string) => { await handleChatSubmit(text, [], model, "general"); };
  const handleChatSubmit = async (text: string, attachments: File[] = [], modelId: string = "gemini-2.5-flash", roleId: string = "general") => {
    setModel(modelId);
    const desc = `使用 ${modelId}: ${text.slice(0, 15)}${text.length > 15 ? '...' : ''}`;
    const cost = MODEL_PRICING[modelId] || 0.01;
    const success = await handleTX('consume', cost, desc);
    if (!success) return; 
    setIsLoading(true);
    const processedImages: string[] = []; const fileInfos: {name: string, type: string}[] = []; 
    if (attachments.length > 0) {
      // (Simplified file logic)
    }
    
    let appendedText = text;
    const newUserMsg = { role: 'user', content: { text: appendedText, images: processedImages, fileInfos: fileInfos } };
    const newHistory = [...messages, newUserMsg];
    setMessages(newHistory); 
    const recentHistory = newHistory.slice(-10);
    const historyForAi = recentHistory.map(m => ({ role: m.role, content: { text: (m === newUserMsg) ? appendedText : (typeof m.content === 'string' ? m.content : m.content.text), images: (m.content as any).images || [] } }));
    try {
      const response = await fetch('/api/chat', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ messages: historyForAi, model: modelId, persona: roleId }), });
      
      const reader = response.body?.getReader(); const decoder = new TextDecoder();
      setMessages(prev => [...prev, { role: 'assistant', content: "" }]);
      let fullResponseText = "";
      while (true) { const { done, value } = await reader?.read()!; if (done) break; const chunk = decoder.decode(value); fullResponseText += chunk; setMessages(prev => { const newMsgs = [...prev]; const lastMsg = newMsgs[newMsgs.length - 1]; lastMsg.content += chunk; return newMsgs; }); }
      const finalMessages = [...newHistory, { role: 'assistant', content: fullResponseText }];
      await fetch('/api/history', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ userId: user.id, chatId: currentChatId, messages: finalMessages, title: currentChatId ? undefined : text.slice(0, 30) }) }).then(res => res.json()).then(data => { if (data.chat) { setCurrentChatId(data.chat.id); fetchChatList(user.id); }});
    } catch (e) { alert("发送失败"); } finally { setIsLoading(false); }
  };
  useEffect(() => { if (scrollRef.current) scrollRef.current.scrollIntoView({ behavior: "smooth" }); }, [messages, isLoading]);

  if (!user) return <AuthPage onLogin={(u)=>{ setUser(u); syncUserData(u.id, u.role); fetchChatList(u.id); }} />;

  const isWithin24Hours = (timeStr: string) => { try { const time = new Date(timeStr).getTime(); const now = new Date().getTime(); return (now - time) < 24 * 60 * 60 * 1000; } catch (e) { return false; } };

  const NAV_ITEMS = [
    { id: 'home', label: '首页', icon: HomeIcon },
    { id: 'video', label: '视频', icon: Video },
    { id: 'image', label: '图片', icon: ImageIcon },
    { id: 'promo', label: '推广', icon: Sparkles },
    { id: 'custom', label: '定制', icon: LayoutGrid },
    { id: 'contact', label: '联系我们', icon: Phone },
  ];

  return (
    <div className={`flex h-screen overflow-hidden transition-colors duration-500 ${isDarkMode ? 'bg-slate-950 text-slate-100' : 'bg-white text-slate-900'}`}>
      <Toast show={toastState.show} type={toastState.type} message={toastState.msg} />
      
      <div className={`${(isSidebarOpen && activeTab === 'home') ? 'w-64' : 'w-0'} h-full flex-shrink-0 bg-slate-50 dark:bg-slate-900 border-r border-slate-200 dark:border-slate-800 transition-all duration-300 flex flex-col overflow-y-auto relative z-20`}>
         <div className="p-4 flex flex-col gap-2">
            <div className="flex items-center gap-2 mb-2 font-black text-xl tracking-tighter px-2"><div className={`w-6 h-6 rounded-lg flex items-center justify-center text-[10px] shadow-sm ${isDarkMode ? 'bg-slate-800 text-white' : 'bg-slate-900 text-white'}`}>🧊</div><span>Eureka</span></div>
            <Button onClick={startNewChat} className="w-full justify-start gap-2 bg-blue-600 hover:bg-blue-700 text-white shadow-md"><Plus size={16}/> 开启新对话</Button>
         </div>
         <div className="flex-1 overflow-y-auto p-2 space-y-1">
            <div className="px-4 py-2 text-[10px] font-bold text-slate-400 uppercase tracking-widest">历史记录</div>
            {chatList.map(chat => (<div key={chat.id} onClick={()=>loadChat(chat.id)} className={`group flex items-center justify-between p-3 rounded-xl text-xs cursor-pointer transition-all ${currentChatId === chat.id ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-bold' : 'hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-500'}`}><div className="truncate flex-1 flex items-center gap-2"><MessageCircle size={12}/> {chat.title || '无标题'}</div><button onClick={(e)=>deleteChat(e, chat.id)} className="opacity-0 group-hover:opacity-100 hover:text-red-500 p-1"><Trash2 size={12}/></button></div>))}
         </div>
         <div className="p-4 border-t border-slate-200 dark:border-slate-800 mt-auto"><div onClick={()=>setIsProfileOpen(true)} className="flex items-center gap-3 cursor-pointer p-2 rounded-xl hover:bg-slate-200 dark:hover:bg-slate-800 transition-all"><div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold text-xs">{user.nickname[0]}</div><div className="flex-1 overflow-hidden"><div className="font-bold text-xs truncate">{user.nickname}</div><div className="text-[10px] text-slate-400 font-mono">专业版用户</div></div></div></div>
      </div>

      <div className="flex-1 flex flex-col h-full overflow-hidden relative">
          <div className={`h-16 flex items-center justify-between px-6 border-b shrink-0 ${isDarkMode ? 'bg-slate-950 border-slate-800' : 'bg-white border-slate-100'}`}>
              <div className="flex items-center gap-4">
                  {activeTab === 'home' && (
                    <button onClick={()=>setIsSidebarOpen(!isSidebarOpen)} className="p-2 hover:bg-slate-100 dark:hover:bg-slate-800 rounded-lg text-slate-500"><Server size={18} className="rotate-90"/></button>
                  )}
                  <div className="flex items-center gap-1 bg-slate-100 dark:bg-slate-900 p-1 rounded-xl">
                      {NAV_ITEMS.map((item) => (
                          <button 
                            key={item.id}
                            onClick={() => setActiveTab(item.id as TabType)}
                            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${activeTab === item.id ? 'bg-white dark:bg-slate-800 text-blue-600 shadow-sm' : 'text-slate-500 hover:text-slate-900 dark:hover:text-slate-300'}`}
                          >
                             <item.icon size={14}/>
                             {item.label}
                          </button>
                      ))}
                  </div>
              </div>
              <div className="flex items-center gap-2">
                  <button onClick={toggleTheme} className={`w-9 h-9 rounded-full flex items-center justify-center transition-colors ${isDarkMode ? 'bg-slate-800 text-yellow-400' : 'bg-slate-100 text-slate-600'}`}>{isDarkMode ? <Sun size={16} /> : <Moon size={16} />}</button>
              </div>
          </div>

          <div className="flex-1 overflow-hidden relative">
              {activeTab === 'home' && (
                 <div className="h-full flex flex-col relative">
                     <div className="flex-1 overflow-y-auto px-4 sm:px-6 pt-4 pb-32">
                        <div className="max-w-3xl mx-auto space-y-6">
                            {messages.length === 0 && (<div className="flex flex-col items-center justify-center py-20 text-center animate-in fade-in zoom-in duration-500"><div className={`w-20 h-20 rounded-3xl flex items-center justify-center text-5xl mb-6 shadow-2xl shadow-blue-500/20 ${isDarkMode ? 'bg-gradient-to-br from-slate-800 to-slate-900' : 'bg-gradient-to-br from-slate-900 to-slate-800'} text-white`}>🧊</div><h2 className="text-3xl font-black mb-2 tracking-tight">Welcome to Eureka</h2><p className="text-slate-400 mb-8 text-sm">您的全能 AI 创意助手</p><div className="grid grid-cols-2 gap-3 w-full max-w-lg">{["分析上海一周天气", "写一段科幻小说", "检查 Python 代码", "制定健康食谱"].map((txt, idx) => (<button key={idx} onClick={() => handleSendSimple(txt)} className={`p-4 border rounded-2xl text-xs font-bold transition-all text-left ${isDarkMode ? 'bg-slate-900 border-slate-800 hover:bg-slate-800 hover:border-blue-500' : 'bg-white border-slate-100 hover:bg-slate-50 hover:border-blue-200'}`}>{txt}</button>))}</div></div>)}
                            {messages.map((m, i) => { const { cleanText, suggestions } = parseMessageContent(m.content); return (<div key={i} className={`flex gap-3 ${m.role==='user'?'justify-end':'justify-start'} group`}>{m.role!=='user' && <div className="w-8 h-8 rounded-lg bg-slate-900 text-white flex items-center justify-center text-xs shrink-0">🧊</div>}<div className={`max-w-[85%] rounded-2xl px-4 py-3 shadow-sm ${m.role==='user' ? 'bg-blue-600 text-white' : (isDarkMode ? 'bg-slate-900 border border-slate-800' : 'bg-white border border-slate-100')}`}><div className={`prose prose-sm max-w-none ${isDarkMode ? 'prose-invert' : ''}`}><ReactMarkdown remarkPlugins={[remarkGfm]}>{cleanText}</ReactMarkdown></div>{suggestions.length > 0 && <div className="mt-4 pt-3 border-t border-slate-200/20 grid gap-3"><div className="flex items-center gap-2 text-[10px] font-black text-slate-400 tracking-widest uppercase"><Sparkles size={12} className="text-blue-500 fill-blue-500"/> 您可能感兴趣</div><div className="flex flex-wrap gap-2">{suggestions.map((q, idx) => (<button key={idx} onClick={() => handleSendSimple(q)} className="group flex items-center gap-1.5 px-4 py-2 bg-slate-50/50 hover:bg-blue-50/80 dark:bg-slate-800 dark:hover:bg-blue-900/30 text-slate-600 dark:text-slate-300 hover:text-blue-600 dark:hover:text-blue-400 rounded-full text-xs font-bold transition-all border border-slate-200 dark:border-slate-700 hover:border-blue-200 active:scale-95 text-left"><span>{q}</span><ArrowRight size={10} className="opacity-0 -ml-2 group-hover:opacity-100 group-hover:ml-0 transition-all"/></button>))}</div></div>}</div></div>); })}
                            {isLoading && <Thinking modelName={currentModelName} />}
                            <div ref={scrollRef} className="h-4" />
                        </div>
                     </div>
                     <div className={`fixed bottom-0 right-0 transition-all duration-300 ${isSidebarOpen ? 'left-64' : 'left-0'} bg-gradient-to-t from-white via-white to-transparent dark:from-slate-950 dark:via-slate-950 pb-4 pt-10 z-10 px-4`}>
                        <div className="max-w-3xl mx-auto"><ChatInput onSend={handleChatSubmit} disabled={isLoading} allowedCategories={['text']} /></div>
                     </div>
                 </div>
              )}

              {activeTab === 'video' && (
                 <div className="h-full overflow-y-auto">
                    <MediaGenerator type="video" onConsume={(amount, desc) => handleTX('consume', amount, desc)} showToast={showToast} />
                 </div>
              )}

              {activeTab === 'image' && (
                 <div className="h-full overflow-y-auto">
                    <MediaGenerator type="image" onConsume={(amount, desc) => handleTX('consume', amount, desc)} showToast={showToast} />
                 </div>
              )}

              {['promo', 'custom', 'contact'].includes(activeTab) && (
                 <div className="h-full flex flex-col items-center justify-center opacity-40">
                    <div className="text-6xl mb-4">🚧</div>
                    <h3 className="text-xl font-bold">功能开发中</h3>
                    <p className="text-sm">该模块尚未开放，敬请期待。</p>
                 </div>
              )}
          </div>
          
          <Dialog open={isPreviewOpen} onOpenChange={setIsPreviewOpen}><DialogContent className="max-w-[95vw] h-[90vh] flex flex-col p-0 rounded-2xl border-none overflow-hidden"><div className="p-4 border-b bg-slate-50 dark:bg-slate-900 flex justify-between items-center shrink-0"><h3 className="font-bold flex items-center gap-2"><FileSpreadsheet size={18} className="text-green-600"/> 表格预览</h3><Button size="sm" onClick={()=>handleDownloadExcel(previewTableData || '')} className="h-8 bg-green-600 hover:bg-green-700 text-white border-none gap-2"><Download size={14}/> 下载 Excel</Button></div><div className="flex-1 overflow-auto p-0 bg-white dark:bg-slate-950 relative">{previewTableData && (<div className="absolute inset-0 overflow-auto"><table className="min-w-full text-sm text-left border-collapse"><thead className="bg-slate-100 dark:bg-slate-800 text-xs uppercase text-slate-500 sticky top-0 z-20 shadow-sm"><tr>{previewTableData.split('\n')[0].split(',').map((h, i) => (<th key={i} className="px-6 py-4 border-b border-r last:border-r-0 border-slate-200 dark:border-slate-700 font-bold whitespace-nowrap bg-slate-100 dark:bg-slate-800">{h}</th>))}</tr></thead><tbody>{previewTableData.split('\n').slice(1).filter(r=>r.trim()).map((row, i) => (<tr key={i} className="border-b border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800/50 transition-colors">{row.split(',').map((cell, j) => (<td key={j} className="px-6 py-3 border-r last:border-r-0 border-slate-200 dark:border-slate-700 whitespace-nowrap min-w-[120px] max-w-[400px] truncate">{cell}</td>))}</tr>))}</tbody></table></div>)}</div></DialogContent></Dialog>
          {/* 其他 Dialog 略，保持原样 */}
      </div>
    </div>
  );
}