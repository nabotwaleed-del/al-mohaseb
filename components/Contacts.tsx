
import React, { useState, useMemo } from 'react';
import { UserPlus, Search, Phone, Mail, MoreVertical, X, User, Building2, Wallet, Printer, Download, ArrowRightLeft, Calendar, FileText, ArrowUpRight, ArrowDownRight, FileSpreadsheet } from 'lucide-react';
import { Contact, Invoice, Transaction } from '../types';
import * as XLSX from 'xlsx';

interface ContactsProps {
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  triggerLoading: (callback: () => void) => void;
  invoices: Invoice[];
  transactions: Transaction[];
}

interface StatementRow {
  date: string;
  description: string;
  type: 'sale' | 'purchase' | 'payment' | 'initial';
  debit: number;  // مدين
  credit: number; // دائن
  balance: number;
}

const Contacts: React.FC<ContactsProps> = ({ contacts, setContacts, triggerLoading, invoices, transactions }) => {
  const [filterType, setFilterType] = useState<'all' | 'client' | 'supplier'>('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [statementContact, setStatementContact] = useState<Contact | null>(null);
  
  const [newContact, setNewContact] = useState<Partial<Contact>>({
    name: '',
    type: 'client',
    phone: '',
    email: '',
    balance: 0
  });

  const filteredContacts = contacts.filter(c => 
    (filterType === 'all' || c.type === filterType) &&
    (c.name.toLowerCase().includes(searchTerm.toLowerCase()) || c.phone.includes(searchTerm))
  );

  const handleAddContact = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newContact.name || !newContact.type) return;

    triggerLoading(() => {
      const contact: Contact = {
        id: Math.random().toString(36).substr(2, 9),
        name: newContact.name!,
        type: newContact.type as 'client' | 'supplier',
        phone: newContact.phone || '',
        email: newContact.email || '',
        balance: Number(newContact.balance) || 0
      };

      setContacts(prev => [...prev, contact]);
      setShowAddModal(false);
      setNewContact({ name: '', type: 'client', phone: '', email: '', balance: 0 });
    });
  };

  const statementData = useMemo(() => {
    if (!statementContact) return [];

    const rows: StatementRow[] = [];
    const contactInvoices = invoices.filter(inv => inv.contactId === statementContact.id);
    
    contactInvoices.forEach(inv => {
      rows.push({
        date: inv.date,
        description: `فاتورة ${inv.type === 'sale' ? 'مبيعات' : 'مشتريات'} رقم ${inv.number}`,
        type: inv.type,
        debit: inv.type === 'sale' ? inv.total : 0,
        credit: inv.type === 'purchase' ? inv.total : 0,
        balance: 0 
      });
    });

    const invoiceIds = contactInvoices.map(inv => inv.id);
    const contactPayments = transactions.filter(t => t.refId && invoiceIds.includes(t.refId));

    contactPayments.forEach(pay => {
      rows.push({
        date: pay.date,
        description: pay.description,
        type: 'payment',
        debit: statementContact.type === 'supplier' ? pay.amount : 0,
        credit: statementContact.type === 'client' ? pay.amount : 0,
        balance: 0
      });
    });

    rows.sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    let currentBalance = 0; 
    return rows.map(row => {
      if (statementContact.type === 'client') {
        currentBalance += (row.debit - row.credit);
      } else {
        currentBalance += (row.credit - row.debit);
      }
      return { ...row, balance: currentBalance };
    });
  }, [statementContact, invoices, transactions]);

  const handlePrint = () => {
    window.print();
  };

  const handleDownloadExcel = () => {
    if (!statementContact || statementData.length === 0) return;

    const data = statementData.map(r => ({
      "التاريخ": r.date,
      "البيان": r.description,
      "مدين": r.debit,
      "دائن": r.credit,
      "الرصيد التراكمي": r.balance
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "كشف حساب");

    // تفعيل خاصية RTL للنسخة العربية
    if(!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({RTL: true});

    XLSX.writeFile(workbook, `كشف_حساب_${statementContact.name}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">العملاء والموردين</h2>
          <p className="text-slate-500 mt-1">إدارة بيانات جهات الاتصال، كشوف الحسابات والأرصدة.</p>
        </div>
        <button 
          onClick={() => setShowAddModal(true)}
          className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 transition-all active:scale-95"
        >
          <UserPlus size={20} />
          إضافة جهة اتصال
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center">
        <div className="flex gap-2">
          {['all', 'client', 'supplier'].map((type) => (
            <button 
              key={type}
              onClick={() => setFilterType(type as any)}
              className={`px-4 py-2 rounded-xl text-sm font-bold transition-all ${filterType === type ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200' : 'bg-slate-50 text-slate-500 hover:bg-slate-100'}`}
            >
              {type === 'all' ? 'الكل' : type === 'client' ? 'العملاء' : 'الموردين'}
            </button>
          ))}
        </div>
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text" 
            placeholder="ابحث بالاسم، رقم الهاتف..." 
            className="w-full border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 focus:ring-2 focus:ring-indigo-500 outline-none transition-all bg-slate-50 focus:bg-white"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredContacts.map(contact => (
          <div key={contact.id} className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm hover:shadow-md transition-all group relative overflow-hidden">
            <div className={`absolute top-0 right-0 w-1 h-full ${contact.type === 'client' ? 'bg-indigo-500' : 'bg-emerald-500'}`}></div>
            <div className="flex justify-between items-start mb-6">
              <div className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-2xl ${
                contact.type === 'client' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
              }`}>
                {contact.name.charAt(0)}
              </div>
              <button className="text-slate-300 hover:text-slate-500 transition-colors p-1"><MoreVertical size={20} /></button>
            </div>
            <div className="mb-6">
              <h4 className="text-xl font-bold text-slate-800">{contact.name}</h4>
              <p className="text-sm font-bold text-slate-400 mt-1 uppercase tracking-wider flex items-center gap-2">
                {contact.type === 'client' ? <User size={14} className="text-indigo-400" /> : <Building2 size={14} className="text-emerald-400" />}
                {contact.type === 'client' ? 'عميل' : 'مورد'}
              </p>
            </div>
            <div className="space-y-3 mb-8">
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <div className="p-1.5 rounded-lg bg-slate-50"><Phone size={14} className="text-slate-400" /></div>
                {contact.phone || 'لا يوجد رقم'}
              </div>
              <div className="flex items-center gap-3 text-slate-500 text-sm">
                <div className="p-1.5 rounded-lg bg-slate-50"><Mail size={14} className="text-slate-400" /></div>
                <span className="truncate">{contact.email || 'لا يوجد بريد'}</span>
              </div>
            </div>
            <div className="flex items-center justify-between pt-6 border-t border-slate-100">
              <div>
                <p className="text-[10px] text-slate-400 font-bold uppercase mb-1">الرصيد الحالي</p>
                <p className={`text-lg font-black ${contact.balance > 0 ? 'text-emerald-600' : contact.balance < 0 ? 'text-rose-600' : 'text-slate-400'}`}>
                  {Math.abs(contact.balance).toLocaleString()} ج.م
                  <span className="text-[10px] mr-1 font-bold">
                    {contact.balance > 0 ? '(دائن)' : contact.balance < 0 ? '(مدين)' : ''}
                  </span>
                </p>
              </div>
              <button 
                onClick={() => setStatementContact(contact)}
                className="text-indigo-600 text-sm font-bold hover:underline underline-offset-4"
              >
                كشف حساب
              </button>
            </div>
          </div>
        ))}
      </div>

      {statementContact && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 md:p-10 bg-slate-900/60 backdrop-blur-md animate-in fade-in duration-300">
          <div className="bg-slate-50 w-full max-w-6xl h-[90vh] rounded-[3rem] shadow-2xl overflow-hidden flex flex-col animate-in zoom-in-95 duration-300">
            <div className="p-8 bg-white border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6">
              <div className="flex items-center gap-5">
                <div className={`w-16 h-16 rounded-[1.5rem] flex items-center justify-center font-black text-3xl shadow-lg ${
                  statementContact.type === 'client' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white'
                }`}>
                  {statementContact.name.charAt(0)}
                </div>
                <div>
                  <h3 className="text-3xl font-black text-slate-800">{statementContact.name}</h3>
                  <div className="flex items-center gap-4 mt-1">
                    <span className="text-xs font-bold text-slate-400 uppercase flex items-center gap-1.5 tracking-widest">
                      <Calendar size={14} /> كشف حساب تفصيلي
                    </span>
                    <span className={`px-2 py-0.5 rounded-md text-[10px] font-black uppercase ${
                      statementContact.type === 'client' ? 'bg-indigo-50 text-indigo-600' : 'bg-emerald-50 text-emerald-600'
                    }`}>
                      {statementContact.type === 'client' ? 'عميل' : 'مورد'}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <button 
                  onClick={handlePrint}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-slate-600 hover:bg-slate-50 transition-colors shadow-sm no-print"
                  title="طباعة كشف الحساب"
                >
                  <Printer size={20} />
                </button>
                <button 
                  onClick={handleDownloadExcel}
                  className="p-3 bg-white border border-slate-200 rounded-2xl text-emerald-600 hover:bg-emerald-50 transition-colors shadow-sm no-print flex items-center gap-2 px-4"
                  title="تحميل Excel"
                >
                  <FileSpreadsheet size={20} />
                  <span className="text-xs font-bold">تصدير Excel</span>
                </button>
                <div className="w-px h-10 bg-slate-100 mx-2 no-print"></div>
                <button 
                  onClick={() => setStatementContact(null)}
                  className="p-3 bg-rose-50 text-rose-500 rounded-2xl hover:bg-rose-100 transition-colors no-print"
                >
                  <X size={20} />
                </button>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 p-8 bg-white border-b border-slate-100 shadow-sm">
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي الفواتير</p>
                  <p className="text-2xl font-black text-slate-800">
                    {statementData.reduce((acc, row) => acc + (statementContact.type === 'client' ? row.debit : row.credit), 0).toLocaleString()} <span className="text-xs font-bold">ج.م</span>
                  </p>
               </div>
               <div className="p-6 bg-slate-50 rounded-[2rem] border border-slate-100">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">إجمالي المدفوعات</p>
                  <p className="text-2xl font-black text-emerald-600">
                    {statementData.reduce((acc, row) => acc + (statementContact.type === 'client' ? row.credit : row.debit), 0).toLocaleString()} <span className="text-xs font-bold">ج.م</span>
                  </p>
               </div>
               <div className="p-6 bg-indigo-50 rounded-[2rem] border border-indigo-100 md:col-span-2 flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-black text-indigo-400 uppercase tracking-widest mb-1">الرصيد النهائي المستحق</p>
                    <p className={`text-4xl font-black ${statementContact.balance < 0 ? 'text-rose-600' : 'text-indigo-600'}`}>
                      {Math.abs(statementContact.balance).toLocaleString()} <span className="text-sm font-bold">ج.م</span>
                    </p>
                  </div>
                  <div className={`p-4 rounded-3xl ${statementContact.balance < 0 ? 'bg-rose-100 text-rose-600' : 'bg-indigo-100 text-indigo-600'}`}>
                    {statementContact.balance < 0 ? <ArrowUpRight size={32} /> : <ArrowDownRight size={32} />}
                  </div>
               </div>
            </div>

            <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
              <div className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <table className="w-full text-right">
                  <thead className="bg-slate-50 border-b border-slate-100">
                    <tr>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">التاريخ</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">البيان / الحركة</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">مدين (سحب)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">دائن (دفع)</th>
                      <th className="px-8 py-5 text-[10px] font-black text-slate-400 uppercase tracking-widest">الرصيد التراكمي</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {statementData.length > 0 ? statementData.map((row, idx) => (
                      <tr key={idx} className="hover:bg-slate-50 transition-colors group">
                        <td className="px-8 py-5">
                          <span className="text-sm font-bold text-slate-500">{row.date}</span>
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex flex-col">
                            <span className="text-sm font-black text-slate-700">{row.description}</span>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-tighter mt-0.5">
                              {row.type === 'sale' ? 'قيد مبيعات' : row.type === 'purchase' ? 'قيد مشتريات' : 'دفعة نقدية'}
                            </span>
                          </div>
                        </td>
                        <td className={`px-8 py-5 font-black ${row.debit > 0 ? 'text-rose-600' : 'text-slate-200'}`}>
                          {row.debit > 0 ? row.debit.toLocaleString() : '-'}
                        </td>
                        <td className={`px-8 py-5 font-black ${row.credit > 0 ? 'text-emerald-600' : 'text-slate-200'}`}>
                          {row.credit > 0 ? row.credit.toLocaleString() : '-'}
                        </td>
                        <td className="px-8 py-5">
                          <div className="flex items-center gap-2">
                            <span className="text-lg font-black text-indigo-900">{row.balance.toLocaleString()}</span>
                            <span className="text-[10px] font-bold text-indigo-400 uppercase tracking-widest">ج.م</span>
                          </div>
                        </td>
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={5} className="px-8 py-24 text-center">
                           <div className="flex flex-col items-center gap-4 opacity-30 grayscale">
                              <FileText size={64} />
                              <p className="font-black text-xl">لا توجد حركات مسجلة لهذا الحساب</p>
                           </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="p-8 bg-white border-t border-slate-100 text-center">
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-[0.2em]">
                المحاسب الشامل - نظام إدارة مالي ذكي &copy; {new Date().getFullYear()}
              </p>
            </div>
          </div>
        </div>
      )}

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in duration-300">
          <div className="bg-white w-full max-w-lg rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-300">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
                  <UserPlus size={24} />
                </div>
                <div>
                  <h3 className="text-2xl font-black text-slate-800">إضافة جهة اتصال</h3>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-rose-500 transition-colors bg-white p-2 rounded-xl border border-slate-100">
                <X size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddContact} className="p-8 space-y-5">
              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">النوع</label>
                <div className="flex gap-3">
                  <button type="button" onClick={() => setNewContact({...newContact, type: 'client'})} className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${newContact.type === 'client' ? 'bg-indigo-600 text-white shadow-lg shadow-indigo-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    <User size={16} /> عميل
                  </button>
                  <button type="button" onClick={() => setNewContact({...newContact, type: 'supplier'})} className={`flex-1 py-3 rounded-2xl font-black text-sm flex items-center justify-center gap-2 transition-all ${newContact.type === 'supplier' ? 'bg-emerald-600 text-white shadow-lg shadow-emerald-100' : 'bg-slate-50 text-slate-500 border border-slate-100'}`}>
                    <Building2 size={16} /> مورد
                  </button>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الاسم الكامل / الشركة</label>
                <input required type="text" className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" value={newContact.name} onChange={e => setNewContact({...newContact, name: e.target.value})} />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">رقم الهاتف</label>
                  <input type="tel" className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" value={newContact.phone} onChange={e => setNewContact({...newContact, phone: e.target.value})} />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-bold text-slate-700">البريد الإلكتروني</label>
                  <input type="email" className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-bold" value={newContact.email} onChange={e => setNewContact({...newContact, email: e.target.value})} />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-bold text-slate-700">الرصيد الافتتاحي (ج.م)</label>
                <input type="number" className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 font-black text-indigo-600 bg-slate-50 focus:bg-white" value={newContact.balance} onChange={e => setNewContact({...newContact, balance: Number(e.target.value)})} />
              </div>

              <div className="pt-4 flex gap-4">
                <button type="button" onClick={() => setShowAddModal(false)} className="flex-1 py-4 rounded-2xl font-black text-slate-400 hover:bg-slate-100 transition-colors uppercase tracking-widest text-xs">إلغاء</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl shadow-indigo-600/20 hover:bg-indigo-700 transition-all active:scale-[0.98] uppercase tracking-widest text-xs">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Contacts;
