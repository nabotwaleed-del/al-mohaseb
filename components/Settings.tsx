
import React, { useState } from 'react';
import { 
  Save, Building2, Phone, CheckCircle2, Trash2, Cloud, CloudOff, Link, Info, 
  ShieldAlert, User as UserIcon, Lock, Users, UserPlus, ShieldCheck, Mail, X, Database, FileArchive, Globe, Key, RefreshCw
} from 'lucide-react';
import { CompanyInfo, User, UserRole, Product, Contact, Invoice, Transaction } from '../types';
import * as XLSX from 'xlsx';

interface SettingsProps {
  companyInfo: CompanyInfo;
  setCompanyInfo: React.Dispatch<React.SetStateAction<CompanyInfo>>;
  currentUser: User;
  setCurrentUser: React.Dispatch<React.SetStateAction<User>>;
  users: User[];
  setUsers: React.Dispatch<React.SetStateAction<User[]>>;
  triggerLoading: (callback: () => void) => void;
  isConnected: boolean;
  onManualRefresh?: () => void;
  allProducts?: Product[];
  allContacts?: Contact[];
  allInvoices?: Invoice[];
  allTransactions?: Transaction[];
}

const Settings: React.FC<SettingsProps> = ({ 
  companyInfo, setCompanyInfo, currentUser, setCurrentUser, users, setUsers, triggerLoading, isConnected, onManualRefresh,
  allProducts = [], allContacts = [], allInvoices = [], allTransactions = []
}) => {
  const [formData, setFormData] = useState<CompanyInfo>(companyInfo);
  const [userData, setUserData] = useState<User>(currentUser);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showUserModal, setShowUserModal] = useState(false);
  
  const [newUser, setNewUser] = useState<Partial<User>>({
    name: '', username: '', password: '', role: UserRole.SALES, email: ''
  });

  const isAdmin = currentUser.role === UserRole.ADMIN;

  const handleManualSync = () => {
    if (onManualRefresh) {
      triggerLoading(() => {
        onManualRefresh();
        setShowSuccess(true);
        setTimeout(() => setShowSuccess(false), 3000);
      });
    }
  };

  const exportFullDatabaseExcel = () => {
    triggerLoading(() => {
      const wb = XLSX.utils.book_new();
      const productsWs = XLSX.utils.json_to_sheet(allProducts.map(p => ({ "الكود": p.code, "الاسم": p.name, "الكمية": p.quantity, "سعر البيع": p.salePrice })));
      XLSX.utils.book_append_sheet(wb, productsWs, "المخزون");
      const contactsWs = XLSX.utils.json_to_sheet(allContacts.map(c => ({ "الاسم": c.name, "النوع": c.type, "الهاتف": c.phone, "الرصيد": c.balance })));
      XLSX.utils.book_append_sheet(wb, contactsWs, "جهات الاتصال");
      XLSX.writeFile(wb, `قاعدة_بيانات_المحاسب_الشامل_${new Date().toISOString().split('T')[0]}.xlsx`);
    });
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerLoading(() => {
      setCompanyInfo(formData);
      setCurrentUser(userData);
      setUsers(prev => prev.map(u => u.id === userData.id ? userData : u));
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 3000);
    });
  };

  const handleAddUser = (e: React.FormEvent) => {
    e.preventDefault();
    triggerLoading(() => {
      const user: User = { ...newUser as User, id: `u-${Date.now()}` };
      setUsers(prev => [...prev, user]);
      setShowUserModal(false);
      setNewUser({ name: '', username: '', password: '', role: UserRole.SALES, email: '' });
    });
  };

  const handleDeleteUser = (id: string) => {
    if (id === currentUser.id) { alert("لا يمكنك حذف حسابك الحالي."); return; }
    if (confirm('هل أنت متأكد من حذف هذا المستخدم؟')) {
      triggerLoading(() => setUsers(prev => prev.filter(u => u.id !== id)));
    }
  };

  return (
    <div className="max-w-5xl mx-auto space-y-10 animate-in fade-in slide-in-from-bottom-4 duration-500 pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-3xl font-black text-slate-800 tracking-tighter">الإعدادات والتحكم</h2>
          <p className="text-slate-500 mt-1 font-bold">إدارة بيانات المنشأة، حماية النظام، وصلاحيات المستخدمين.</p>
        </div>
        {isAdmin && (
          <button onClick={exportFullDatabaseExcel} className="px-6 py-3 bg-indigo-900 text-white rounded-2xl font-black flex items-center gap-3 hover:bg-indigo-950 active:scale-95 transition-all shadow-lg text-xs">
            <Database size={20} /> تصدير قاعدة البيانات
          </button>
        )}
      </div>

      {showSuccess && (
        <div className="bg-emerald-50 border border-emerald-100 text-emerald-700 px-6 py-4 rounded-3xl flex items-center gap-3">
          <CheckCircle2 size={24} /><p className="font-black text-sm">تم تنفيذ كافة عمليات المزامنة والحفظ بنجاح.</p>
        </div>
      )}

      {isAdmin && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className={`p-3 rounded-2xl shadow-lg ${isConnected ? 'bg-emerald-500' : 'bg-slate-400'} text-white`}>
                {isConnected ? <Cloud size={24} /> : <CloudOff size={24} />}
              </div>
              <div>
                <h4 className="font-black text-slate-800 text-lg">الربط السحابي (Supabase)</h4>
                <p className="text-xs font-bold text-slate-400">{isConnected ? 'الجسر نشط ويعمل بكفاءة' : 'النظام يعمل حالياً بشكل محلي فقط'}</p>
              </div>
            </div>
            {isConnected && (
              <button onClick={handleManualSync} className="px-4 py-2 bg-indigo-50 text-indigo-600 rounded-xl font-black text-[10px] flex items-center gap-2 hover:bg-indigo-100 uppercase tracking-widest transition-all">
                <RefreshCw size={14} /> مزامنة فورية
              </button>
            )}
          </div>
          <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Globe size={14} /> URL</label><input type="text" placeholder="https://..." className="w-full border-2 border-slate-50 rounded-2xl py-3.5 px-5 font-bold bg-slate-50 outline-none focus:bg-white" value={formData.supabaseUrl || ''} onChange={e => setFormData({...formData, supabaseUrl: e.target.value})} /></div>
             <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Key size={14} /> API Key</label><input type="password" placeholder="anon key" className="w-full border-2 border-slate-50 rounded-2xl py-3.5 px-5 font-bold bg-slate-50 outline-none focus:bg-white" value={formData.supabaseKey || ''} onChange={e => setFormData({...formData, supabaseKey: e.target.value})} /></div>
          </div>
        </div>
      )}

      {/* باقي واجهة الإعدادات كما هي */}
      <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-4"><div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg"><ShieldCheck size={24} /></div><h4 className="font-black text-slate-800 text-lg">حسابك الشخصي</h4></div>
        <div className="p-8 grid grid-cols-1 md:grid-cols-2 gap-8">
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><UserIcon size={14} /> اسم العرض</label><input type="text" className="w-full border-2 border-slate-50 rounded-2xl py-3.5 px-5 font-bold bg-slate-50" value={userData.name} onChange={e => setUserData({...userData, name: e.target.value})} /></div>
           <div className="space-y-2"><label className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2"><Lock size={14} /> كلمة المرور</label><input type="password" className="w-full border-2 border-slate-50 rounded-2xl py-3.5 px-5 font-bold bg-slate-50" value={userData.password} onChange={e => setUserData({...userData, password: e.target.value})} /></div>
        </div>
        <div className="p-8 bg-slate-50 border-t border-slate-100 flex justify-end"><button onClick={handleSubmit} className="px-10 py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-lg hover:bg-indigo-700 active:scale-95 transition-all text-xs uppercase tracking-widest">حفظ وتثبيت الإعدادات</button></div>
      </div>
    </div>
  );
};

export default Settings;
