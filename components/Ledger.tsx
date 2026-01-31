
import React, { useState, useMemo } from 'react';
import { Search, Filter, ArrowUpCircle, ArrowDownCircle, Download, FileSpreadsheet, History, ListTodo, Calendar, X, Clock, RefreshCw, CheckCircle2, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { Transaction, ActivityLog } from '../types';
import * as XLSX from 'xlsx';

interface LedgerProps {
  transactions: Transaction[];
  setTransactions?: React.Dispatch<React.SetStateAction<Transaction[]>>;
  logs: ActivityLog[];
}

const Ledger: React.FC<LedgerProps> = ({ transactions, setTransactions, logs }) => {
  const [activeSubTab, setActiveSubTab] = useState<'transactions' | 'logs'>('transactions');
  const [showAddModal, setShowAddModal] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'paid' | 'partial' | 'unpaid'>('all');
  
  const [newTransaction, setNewTransaction] = useState<Partial<Transaction>>({
    date: new Date().toISOString().split('T')[0], 
    type: 'income', 
    category: 'أخرى', 
    amount: 0, 
    description: '', 
    status: 'paid'
  });

  const filteredTransactions = useMemo(() => {
    return transactions.filter(t => {
      const matchesSearch = t.description.toLowerCase().includes(searchTerm.toLowerCase()) || 
                            t.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesDate = (!startDate || t.date >= startDate) && 
                          (!endDate || t.date <= endDate);
      const matchesStatus = statusFilter === 'all' || t.status === statusFilter;
      return matchesSearch && matchesDate && matchesStatus;
    });
  }, [transactions, searchTerm, startDate, endDate, statusFilter]);

  const income = filteredTransactions.filter(t => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const expense = filteredTransactions.filter(t => t.type === 'expense').reduce((s, t) => s + t.amount, 0);

  const exportTransactionsExcel = () => {
    const data = filteredTransactions.map(t => ({
      "التاريخ": t.date,
      "البيان": t.description,
      "التصنيف": t.category,
      "النوع": t.type === 'income' ? "إيداع/إيراد" : "سحب/مصروف",
      "المبلغ": t.amount,
      "الحالة": t.status === 'paid' ? "مسدد" : t.status === 'partial' ? "جزئي" : "آجل"
    }));

    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "القيود المالية");
    
    ws['!cols'] = [{wch: 12}, {wch: 35}, {wch: 15}, {wch: 15}, {wch: 12}, {wch: 12}];
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'].push({RTL: true});

    XLSX.writeFile(wb, `سجل_القيود_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  const handleAdd = (e: React.FormEvent) => {
    e.preventDefault();
    if (setTransactions) {
      const t: Transaction = {
        ...newTransaction as Transaction,
        id: `t-${Date.now()}`
      };
      setTransactions([...transactions, t]);
    }
    setShowAddModal(false);
  };

  const clearFilters = () => {
    setStartDate(''); setEndDate(''); setStatusFilter('all'); setSearchTerm('');
  };

  const setQuickPeriod = (period: 'today' | 'week' | 'month' | 'all') => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    switch(period) {
      case 'today': setStartDate(todayStr); setEndDate(todayStr); break;
      case 'week': 
        const lastWeek = new Date(); lastWeek.setDate(today.getDate() - 7);
        setStartDate(lastWeek.toISOString().split('T')[0]); setEndDate(todayStr); break;
      case 'month':
        const lastMonth = new Date(); lastMonth.setDate(1);
        setStartDate(lastMonth.toISOString().split('T')[0]); setEndDate(todayStr); break;
      case 'all': clearFilters(); break;
    }
  };

  const getStatusStyle = (status?: string) => {
    switch(status) {
      case 'paid': return 'bg-emerald-100 text-emerald-700 border-emerald-200';
      case 'partial': return 'bg-amber-100 text-amber-700 border-amber-200';
      case 'unpaid': return 'bg-rose-100 text-rose-700 border-rose-200';
      default: return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800 tracking-tight">القيود والنشاط</h2>
          <p className="text-slate-500 mt-1 font-medium">إدارة دفتر الأستاذ العام ومراقبة كافة التحركات المالية.</p>
        </div>
        <div className="bg-white p-1.5 rounded-2xl border border-slate-200 shadow-sm flex gap-1">
          <button onClick={() => setActiveSubTab('transactions')} className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${activeSubTab === 'transactions' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <ListTodo size={16} /> سجل الحركات
          </button>
          <button onClick={() => setActiveSubTab('logs')} className={`px-5 py-2.5 rounded-xl text-xs font-black flex items-center gap-2 transition-all ${activeSubTab === 'logs' ? 'bg-indigo-600 text-white shadow-lg' : 'text-slate-400 hover:bg-slate-50'}`}>
            <History size={16} /> تتبع النظام
          </button>
        </div>
      </div>

      {activeSubTab === 'transactions' ? (
        <>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm border-r-8 border-r-emerald-500">
              <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">إجمالي المقبوضات</p><h4 className="text-3xl font-black text-slate-900">{income.toLocaleString()} <span className="text-xs">ج.م</span></h4></div>
              <div className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl"><ArrowUpCircle size={28} /></div>
            </div>
            <div className="bg-white p-6 rounded-[2rem] border border-slate-200 flex items-center justify-between shadow-sm border-r-8 border-r-rose-500">
              <div><p className="text-slate-400 font-bold mb-1 uppercase text-[10px] tracking-widest">إجمالي المدفوعات</p><h4 className="text-3xl font-black text-slate-900">{expense.toLocaleString()} <span className="text-xs">ج.م</span></h4></div>
              <div className="p-3 bg-rose-50 text-rose-600 rounded-2xl"><ArrowDownCircle size={28} /></div>
            </div>
            <div className="bg-indigo-600 p-6 rounded-[2rem] border border-indigo-700 flex items-center justify-between shadow-xl shadow-indigo-200">
              <div><p className="text-indigo-200 font-bold mb-1 uppercase text-[10px] tracking-widest">صافي السيولة</p><h4 className="text-3xl font-black text-white">{(income - expense).toLocaleString()} <span className="text-xs">ج.م</span></h4></div>
              <div className="p-3 bg-indigo-500 text-white rounded-2xl"><FileSpreadsheet size={28} /></div>
            </div>
          </div>

          <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-6 border-b border-slate-100 flex flex-col lg:flex-row gap-4 items-center justify-between">
              <div className="relative flex-1 w-full lg:max-w-md">
                <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
                <input type="text" placeholder="بحث في السجل..." className="w-full bg-slate-50 border border-slate-100 rounded-2xl py-3 px-10 text-sm outline-none font-bold" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
              </div>
              <div className="flex gap-2 w-full lg:w-auto">
                <button onClick={() => setShowAddModal(true)} className="flex-1 lg:flex-none px-6 py-3 bg-slate-900 text-white rounded-2xl text-xs font-black shadow-lg">إضافة قيد يدوي</button>
                <button onClick={exportTransactionsExcel} className="p-3 text-emerald-600 hover:bg-emerald-50 bg-slate-50 rounded-2xl transition-colors border border-slate-100" title="تصدير Excel">
                  <FileSpreadsheet size={20} />
                </button>
              </div>
            </div>

            <div className="px-6 py-5 bg-slate-50/50 border-b border-slate-100">
              <div className="flex flex-wrap items-center gap-6">
                <div className="flex items-center gap-2 bg-white p-1 rounded-2xl border border-slate-200">
                  <input type="date" className="bg-transparent text-xs font-black px-2" value={startDate} onChange={e => setStartDate(e.target.value)} />
                  <ChevronLeft size={16} className="text-slate-300" />
                  <input type="date" className="bg-transparent text-xs font-black px-2" value={endDate} onChange={e => setEndDate(e.target.value)} />
                </div>
                <div className="flex bg-white p-1 rounded-2xl border border-slate-200">
                  <button onClick={() => setQuickPeriod('today')} className="px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-indigo-50 rounded-xl">اليوم</button>
                  <button onClick={() => setQuickPeriod('week')} className="px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-indigo-50 rounded-xl">أسبوع</button>
                  <button onClick={() => setQuickPeriod('month')} className="px-3 py-1.5 text-[10px] font-black text-slate-500 hover:bg-indigo-50 rounded-xl">شهر</button>
                </div>
              </div>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-right">
                <thead className="bg-slate-50/50 text-slate-400 text-[10px] uppercase tracking-widest font-black border-b border-slate-100">
                  <tr><th className="px-8 py-5">التاريخ</th><th className="px-8 py-5">البيان المالي</th><th className="px-8 py-5">التصنيف</th><th className="px-8 py-5">مدين (-)</th><th className="px-8 py-5">دائن (+)</th><th className="px-8 py-5 text-center">الحالة</th></tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-bold text-sm bg-white">
                  {filteredTransactions.slice().reverse().map((t) => (
                    <tr key={t.id} className="hover:bg-indigo-50/10 transition-colors">
                      <td className="px-8 py-5 text-slate-400 font-medium text-xs whitespace-nowrap">{t.date}</td>
                      <td className="px-8 py-5"><span className="text-slate-800 font-black">{t.description}</span></td>
                      <td className="px-8 py-5"><span className="px-3 py-1 bg-slate-100 rounded-full text-[9px] font-black text-slate-500">{t.category}</span></td>
                      <td className="px-8 py-5 text-rose-600 font-black">{t.type === 'expense' ? `${t.amount.toLocaleString()}-` : ''}</td>
                      <td className="px-8 py-5 text-emerald-600 font-black">{t.type === 'income' ? `${t.amount.toLocaleString()}+` : ''}</td>
                      <td className="px-8 py-5 text-center"><span className={`px-4 py-1.5 rounded-xl text-[9px] font-black border inline-block min-w-[90px] ${getStatusStyle(t.status)}`}>{t.status === 'paid' ? 'مسدد' : t.status === 'partial' ? 'جزئي' : 'آجل'}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </>
      ) : (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
           <div className="p-8 border-b border-slate-100 bg-slate-50/50"><h3 className="font-black text-slate-800 flex items-center gap-3 text-sm"><Clock size={24} className="text-indigo-600" /> سجل الأمان وتتبع النشاط</h3></div>
           <div className="overflow-x-auto">
             <table className="w-full text-right">
                <thead className="bg-slate-50 text-slate-400 text-[10px] uppercase font-black tracking-[0.1em]"><tr><th className="px-8 py-5">الوقت والتاريخ</th><th className="px-8 py-5">المستخدم المسؤول</th><th className="px-8 py-5">نوع الإجراء</th><th className="px-8 py-5">بيانات النشاط</th></tr></thead>
                <tbody className="divide-y divide-slate-100 font-bold text-xs">
                  {logs.map(log => (
                    <tr key={log.id} className="hover:bg-slate-50"><td className="px-8 py-6 text-slate-400 font-medium">{new Date(log.timestamp).toLocaleString('ar-SA')}</td><td className="px-8 py-6 font-black">{log.userName}</td><td className="px-8 py-6"><span className="px-3 py-1 rounded-lg text-[9px] font-black bg-indigo-100 text-indigo-700">{log.action}</span></td><td className="px-8 py-6 text-slate-500 italic">{log.details}</td></tr>
                  ))}
                </tbody>
             </table>
           </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-md">
          <div className="bg-white w-full max-w-xl rounded-[3rem] shadow-2xl p-10 animate-in zoom-in-95">
            <div className="flex justify-between items-center mb-10"><h3 className="text-2xl font-black">قيد مالي جديد</h3><button onClick={() => setShowAddModal(false)} className="text-slate-300 hover:text-slate-600 text-3xl font-light">&times;</button></div>
            <form onSubmit={handleAdd} className="space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-black">تاريخ القيد</label><input type="date" className="w-full border-2 border-slate-50 rounded-2xl p-4 font-black bg-slate-50" value={newTransaction.date} onChange={e => setNewTransaction({...newTransaction, date: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-black">نوع العملية</label><select className="w-full border-2 border-slate-50 rounded-2xl p-4 font-black bg-slate-50" value={newTransaction.type} onChange={e => setNewTransaction({...newTransaction, type: e.target.value as any})}><option value="income">إيداع (+)</option><option value="expense">سحب (-)</option></select></div>
              </div>
              <div className="space-y-2"><label className="text-sm font-black">المبلغ (ج.م)</label><input type="number" required className="w-full border-2 border-indigo-50 rounded-2xl p-4 font-black text-3xl text-indigo-600 bg-slate-50" value={newTransaction.amount} onChange={e => setNewTransaction({...newTransaction, amount: Number(e.target.value)})} /></div>
              <div className="space-y-2"><label className="text-sm font-black">البيان / الوصف</label><textarea required className="w-full border-2 border-slate-50 rounded-2xl p-5 font-bold bg-slate-50" rows={3} placeholder="التفاصيل..." value={newTransaction.description} onChange={e => setNewTransaction({...newTransaction, description: e.target.value})} /></div>
              <button type="submit" className="w-full py-5 bg-slate-900 text-white rounded-[1.8rem] font-black hover:bg-black transition-all text-xs uppercase tracking-widest">ترحيل القيد</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Ledger;
