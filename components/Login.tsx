
import React, { useState } from 'react';
import { Lock, User, LogIn, AlertCircle, ShieldCheck } from 'lucide-react';
import { User as UserType } from '../types';

interface LoginProps {
  onLogin: (username: string, password: string) => Promise<boolean>;
}

const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(false);
    
    const success = await onLogin(username, password);
    if (!success) {
      setError(true);
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-indigo-950 flex items-center justify-center p-6 relative overflow-hidden">
      {/* Background Orbs */}
      <div className="absolute top-0 -left-20 w-96 h-96 bg-indigo-600 rounded-full blur-[120px] opacity-20"></div>
      <div className="absolute bottom-0 -right-20 w-96 h-96 bg-blue-600 rounded-full blur-[120px] opacity-20"></div>

      <div className="w-full max-w-md bg-white/10 backdrop-blur-2xl border border-white/10 p-10 rounded-[3rem] shadow-2xl relative z-10 animate-in zoom-in-95 duration-500">
        <div className="text-center mb-10">
          <div className="size-20 bg-indigo-600 rounded-[2rem] flex items-center justify-center mx-auto mb-6 shadow-2xl shadow-indigo-600/40">
            <ShieldCheck className="text-white" size={40} />
          </div>
          <h1 className="text-3xl font-black text-white tracking-tighter">المحاسب الشامل</h1>
          <p className="text-indigo-200 text-xs font-bold uppercase tracking-widest mt-2">نظام الإدارة المالية الذكي</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mr-2">اسم المستخدم</label>
            <div className="relative">
              <User className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
              <input 
                type="text" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white font-bold outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                placeholder="أدخل اسم المستخدم"
                value={username}
                onChange={e => setUsername(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black text-indigo-300 uppercase tracking-widest block mr-2">كلمة المرور</label>
            <div className="relative">
              <Lock className="absolute right-4 top-1/2 -translate-y-1/2 text-indigo-300" size={18} />
              <input 
                type="password" 
                required
                className="w-full bg-white/5 border border-white/10 rounded-2xl py-4 pr-12 pl-4 text-white font-bold outline-none focus:ring-4 focus:ring-indigo-600/20 focus:border-indigo-600 transition-all"
                placeholder="••••••••"
                value={password}
                onChange={e => setPassword(e.target.value)}
              />
            </div>
          </div>

          {error && (
            <div className="bg-rose-500/10 border border-rose-500/20 text-rose-400 p-4 rounded-2xl flex items-center gap-3 animate-in shake-in duration-300">
              <AlertCircle size={18} />
              <p className="text-xs font-bold">بيانات الدخول غير صحيحة، حاول مجدداً.</p>
            </div>
          )}

          <button 
            type="submit" 
            disabled={loading}
            className="w-full py-5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-[1.8rem] font-black shadow-2xl shadow-indigo-600/30 transition-all active:scale-95 flex items-center justify-center gap-2 group"
          >
            {loading ? (
              <div className="size-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
            ) : (
              <>
                <LogIn size={20} className="group-hover:-translate-x-1 transition-transform" />
                تسجيل الدخول للنظام
              </>
            )}
          </button>
        </form>

        <div className="mt-10 text-center">
          <p className="text-[10px] text-indigo-400 font-bold uppercase tracking-widest opacity-60">
            كافة الحقوق محفوظة &copy; {new Date().getFullYear()}
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
