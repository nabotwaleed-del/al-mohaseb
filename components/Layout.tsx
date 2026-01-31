
import React from 'react';
import { 
  LayoutDashboard, 
  Package, 
  ShoppingCart, 
  Receipt, 
  Users, 
  BarChart3, 
  Settings as SettingsIcon,
  LogOut,
  Bell,
  Search,
  ChevronLeft
} from 'lucide-react';
import { User } from '../types';
import ProgressBar from './ProgressBar';

interface LayoutProps {
  children: React.ReactNode;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  user: User;
  isLoading: boolean;
  onLogout: () => void;
  canAccess: (tab: string) => boolean;
}

const Layout: React.FC<LayoutProps> = ({ children, activeTab, setActiveTab, user, isLoading, onLogout, canAccess }) => {
  const menuItems = [
    { id: 'dashboard', label: 'لوحة التحكم', icon: <LayoutDashboard size={20} /> },
    { id: 'sales', label: 'المبيعات', icon: <Receipt size={20} /> },
    { id: 'purchases', label: 'المشتريات', icon: <ShoppingCart size={20} /> },
    { id: 'inventory', label: 'المخزون', icon: <Package size={20} /> },
    { id: 'contacts', label: 'العملاء والموردين', icon: <Users size={20} /> },
    { id: 'ledger', label: 'الحسابات والنشاط', icon: <BarChart3 size={20} /> },
    { id: 'settings', label: 'الإعدادات والمستخدمين', icon: <SettingsIcon size={20} /> },
  ];

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900 overflow-x-hidden">
      <ProgressBar isLoading={isLoading} />
      
      {/* Sidebar */}
      <aside className="w-64 bg-indigo-950 text-white fixed h-full transition-all duration-300 z-50">
        <div className="p-6">
          <h1 className="text-2xl font-black tracking-tighter flex items-center gap-2">
            <span className="bg-indigo-600 p-1.5 rounded-lg text-white">AS</span>
            المحاسب الشامل
          </h1>
          <p className="text-indigo-300 text-[10px] mt-1 opacity-70 font-black uppercase tracking-widest">Enterprise Edition</p>
        </div>

        <nav className="mt-4 px-3 space-y-1 overflow-y-auto max-h-[calc(100vh-280px)] custom-scrollbar">
          {menuItems.map((item) => {
            if (!canAccess(item.id)) return null;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`w-full flex items-center gap-3 px-4 py-3.5 rounded-2xl transition-all duration-200 ${
                  activeTab === item.id 
                    ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-900/50' 
                    : 'text-indigo-200 hover:bg-white/5 hover:text-white'
                }`}
              >
                {item.icon}
                <span className="font-bold text-sm">{item.label}</span>
                {activeTab === item.id && <ChevronLeft className="mr-auto" size={16} />}
              </button>
            );
          })}
        </nav>

        <div className="absolute bottom-0 w-full p-6 border-t border-white/5 bg-indigo-950/80 backdrop-blur-md">
          <div className="flex items-center gap-3 mb-6 bg-white/5 p-3 rounded-2xl border border-white/5">
            <div className="w-10 h-10 rounded-full bg-indigo-600 flex items-center justify-center font-black text-lg shadow-inner">
              {user.name.charAt(0)}
            </div>
            <div className="min-w-0">
              <p className="text-xs font-black truncate text-white">{user.name}</p>
              <p className="text-[10px] text-indigo-400 font-black uppercase tracking-tighter">{user.role}</p>
            </div>
          </div>
          <button 
            onClick={onLogout}
            className="w-full py-3.5 flex items-center justify-center gap-2 text-rose-400 bg-rose-400/10 hover:bg-rose-400 hover:text-white rounded-2xl text-xs font-black transition-all active:scale-95"
          >
            <LogOut size={16} />
            تسجيل الخروج
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <main className="flex-1 mr-64">
        {/* Header */}
        <header className="h-20 bg-white border-b border-slate-200 flex items-center justify-between px-8 sticky top-0 z-40 backdrop-blur-md bg-white/80">
          <div className="relative w-96">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input 
              type="text" 
              placeholder="ابحث عن فاتورة، عميل، أو صنف..." 
              className="w-full bg-slate-100 border-none rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-indigo-500 transition-all outline-none font-bold text-sm"
            />
          </div>

          <div className="flex items-center gap-4">
            <button className="relative p-2.5 text-slate-500 hover:bg-slate-100 rounded-2xl transition-colors">
              <Bell size={22} />
              <span className="absolute top-2.5 left-2.5 w-2.5 h-2.5 bg-rose-500 rounded-full border-2 border-white"></span>
            </button>
            <div className="h-8 w-[1px] bg-slate-200"></div>
            <button 
              onClick={() => setActiveTab('settings')}
              className={`p-2.5 rounded-2xl transition-all ${activeTab === 'settings' ? 'bg-indigo-50 text-indigo-600' : 'text-slate-500 hover:bg-slate-100'}`}
            >
              <SettingsIcon size={22} />
            </button>
          </div>
        </header>

        {/* Dynamic Content */}
        <div className={`p-8 pb-12 transition-opacity duration-300 ${isLoading ? 'opacity-50' : 'opacity-100'}`}>
          {children}
        </div>
      </main>
    </div>
  );
};

export default Layout;
