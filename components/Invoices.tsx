
import React, { useState, useMemo, useEffect } from 'react';
import { Plus, Printer, FileText, Filter, MoreHorizontal, User, CreditCard, Banknote, Clock, AlertCircle, CheckCircle2, Receipt, ShoppingCart, ArrowRightLeft, Minus, Download, FileSpreadsheet } from 'lucide-react';
import { Invoice, Product, Contact, Transaction, InvoiceItem } from '../types';
import * as XLSX from 'xlsx';

interface InvoicesProps {
  type: 'sale' | 'purchase';
  invoices: Invoice[];
  setInvoices: React.Dispatch<React.SetStateAction<Invoice[]>>;
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  contacts: Contact[];
  setContacts: React.Dispatch<React.SetStateAction<Contact[]>>;
  setTransactions: React.Dispatch<React.SetStateAction<Transaction[]>>;
  triggerLoading: (callback: () => void) => void;
}

const Invoices: React.FC<InvoicesProps> = ({ 
  type, invoices, setInvoices, products, setProducts, contacts, setContacts, setTransactions, triggerLoading 
}) => {
  const [showAddModal, setShowAddModal] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState('');
  const [invoiceItems, setInvoiceItems] = useState<InvoiceItem[]>([]);
  const [discount, setDiscount] = useState(0);
  
  const [paymentStatus, setPaymentStatus] = useState<'paid' | 'partial' | 'unpaid'>('paid');
  const [paidAmountInput, setPaidAmountInput] = useState<number>(0);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'credit'>('cash');

  const filteredInvoices = invoices.filter(inv => inv.type === type);

  const subtotal = useMemo(() => invoiceItems.reduce((sum, item) => sum + item.total, 0), [invoiceItems]);
  const tax = useMemo(() => subtotal * 0.14, [subtotal]); 
  const total = useMemo(() => Math.max(0, subtotal + tax - discount), [subtotal, tax, discount]);

  const finalPaidAmount = useMemo(() => {
    if (paymentStatus === 'paid') return total;
    if (paymentStatus === 'unpaid') return 0;
    return Math.max(0, Math.min(paidAmountInput, total));
  }, [paymentStatus, paidAmountInput, total]);

  const remainingBalance = useMemo(() => Math.max(0, total - finalPaidAmount), [total, finalPaidAmount]);

  useEffect(() => {
    if (paymentStatus === 'paid') {
      setPaidAmountInput(total);
    } else if (paymentStatus === 'unpaid') {
      setPaidAmountInput(0);
    }
  }, [total, paymentStatus]);

  const handleAddItem = (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setInvoiceItems(prev => {
      const existing = prev.find(item => item.productId === productId);
      if (existing) {
        return prev.map(item => item.productId === productId ? { ...item, quantity: item.quantity + 1, total: (item.quantity + 1) * item.price } : item);
      }
      return [...prev, { 
        productId: product.id, 
        name: product.name, 
        quantity: 1, 
        price: type === 'sale' ? product.salePrice : product.purchasePrice,
        total: type === 'sale' ? product.salePrice : product.purchasePrice
      }];
    });
  };

  const handleCreateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContactId || invoiceItems.length === 0) return;

    triggerLoading(() => {
      const contact = contacts.find(c => c.id === selectedContactId);
      const calculatedStatus = remainingBalance === 0 ? 'paid' : (finalPaidAmount === 0 ? 'unpaid' : 'partial');
      
      const newInvoice: Invoice = {
        id: Math.random().toString(36).substr(2, 9),
        number: `${type === 'sale' ? 'SAL' : 'PUR'}-${new Date().getFullYear()}-${(invoices.length + 1).toString().padStart(4, '0')}`,
        date: new Date().toISOString().split('T')[0],
        type,
        contactId: selectedContactId,
        contactName: contact?.name || 'غير معروف',
        items: invoiceItems,
        subtotal,
        tax,
        discount,
        total,
        paymentStatus: calculatedStatus,
        paymentMethod,
        paidAmount: finalPaidAmount
      };

      setInvoices(prev => [...prev, newInvoice]);
      setProducts(prev => prev.map(p => {
        const item = invoiceItems.find(it => it.productId === p.id);
        if (item) return { ...p, quantity: type === 'sale' ? p.quantity - item.quantity : p.quantity + item.quantity };
        return p;
      }));

      if (remainingBalance !== 0) {
        setContacts(prev => prev.map(c => {
          if (c.id === selectedContactId) {
            const adjustment = type === 'sale' ? -remainingBalance : remainingBalance;
            return { ...c, balance: c.balance + adjustment };
          }
          return c;
        }));
      }

      if (finalPaidAmount > 0 || calculatedStatus === 'unpaid') {
        setTransactions(prev => [...prev, {
          id: `t-${newInvoice.id}-${Date.now()}`,
          date: newInvoice.date,
          type: type === 'sale' ? 'income' : 'expense',
          category: type === 'sale' ? 'مبيعات' : 'مشتريات',
          amount: finalPaidAmount || total,
          description: `فاتورة ${type === 'sale' ? 'مبيعات' : 'مشتريات'} رقم ${newInvoice.number}`,
          refId: newInvoice.id,
          status: calculatedStatus
        }]);
      }

      setShowAddModal(false);
      setInvoiceItems([]);
      setSelectedContactId('');
      setPaymentStatus('paid');
      setDiscount(0);
    });
  };

  const handlePrintInvoice = (invoice: Invoice) => {
    window.print();
  };

  const exportInvoicesToExcel = () => {
    const data = filteredInvoices.map(inv => ({
      "رقم الفاتورة": inv.number,
      "التاريخ": inv.date,
      "الجهة": inv.contactName,
      "طريقة الدفع": inv.paymentMethod === 'cash' ? 'نقدي' : inv.paymentMethod === 'transfer' ? 'تحويل' : 'آجل',
      "إجمالي المبلغ": inv.total,
      "المبلغ المدفوع": inv.paidAmount,
      "المبلغ المتبقي": inv.total - inv.paidAmount,
      "الحالة": inv.paymentStatus === 'paid' ? 'مدفوعة' : inv.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسددة'
    }));

    const worksheet = XLSX.utils.json_to_sheet(data);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "فواتير");

    // ضبط اتجاه الورقة لليمين
    if(!worksheet['!views']) worksheet['!views'] = [];
    worksheet['!views'].push({RTL: true});

    XLSX.writeFile(workbook, `تقرير_فواتير_${type === 'sale' ? 'مبيعات' : 'مشتريات'}_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">{type === 'sale' ? 'فواتير المبيعات' : 'فواتير المشتريات'}</h2>
          <p className="text-slate-500 mt-1">إدارة العمليات التجارية والتحصيل المالي.</p>
        </div>
        <div className="flex gap-3">
          <button 
            onClick={exportInvoicesToExcel}
            className="px-6 py-3 rounded-2xl font-bold flex items-center gap-2 bg-white border border-slate-200 text-slate-600 hover:bg-slate-50 transition-all shadow-sm"
          >
            <FileSpreadsheet size={20} className="text-emerald-600" /> تصدير Excel
          </button>
          <button 
            onClick={() => setShowAddModal(true)}
            className={`px-6 py-3 rounded-2xl font-bold flex items-center gap-2 shadow-lg transition-all ${
              type === 'sale' ? 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20' : 'bg-emerald-600 hover:bg-emerald-700 shadow-emerald-600/20'
            } text-white`}
          >
            <Plus size={20} /> إنشاء فاتورة جديدة
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-sm">
              <tr>
                <th className="px-8 py-4 font-bold uppercase text-xs">رقم الفاتورة</th>
                <th className="px-8 py-4 font-bold uppercase text-xs">التاريخ</th>
                <th className="px-8 py-4 font-bold uppercase text-xs">{type === 'sale' ? 'العميل' : 'المورد'}</th>
                <th className="px-8 py-4 font-bold uppercase text-xs">الإجمالي</th>
                <th className="px-8 py-4 font-bold uppercase text-xs text-center">الحالة</th>
                <th className="px-8 py-4 font-bold uppercase text-xs text-center">إجراءات</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {filteredInvoices.slice().reverse().map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-indigo-600">{invoice.number}</td>
                  <td className="px-8 py-5 text-slate-500">{invoice.date}</td>
                  <td className="px-8 py-5 font-bold">{invoice.contactName}</td>
                  <td className="px-8 py-5 font-black">{invoice.total.toLocaleString()} ج.م</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-bold inline-block min-w-[70px] ${
                      invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {invoice.paymentStatus === 'paid' ? 'تم السداد' : 
                       invoice.paymentStatus === 'partial' ? 'سداد جزئي' : 'غير مسدد'}
                    </span>
                  </td>
                  <td className="px-8 py-5 flex justify-center gap-2">
                    <button onClick={() => handlePrintInvoice(invoice)} className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg no-print"><Printer size={16} /></button>
                    <button className="p-2 text-slate-400 hover:bg-slate-100 rounded-lg no-print"><FileText size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200 no-print">
          <div className="bg-white w-full max-w-6xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200 h-[92vh] flex flex-col">
            <div className="p-6 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className={`p-3 rounded-2xl ${type === 'sale' ? 'bg-indigo-600' : 'bg-emerald-600'} text-white shadow-lg`}>
                   {type === 'sale' ? <Receipt size={24} /> : <ShoppingCart size={24} />}
                </div>
                <div>
                  <h3 className="text-2xl font-black">فاتورة {type === 'sale' ? 'مبيعات' : 'مشتريات'} جديدة</h3>
                  <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">تحرير قيد مالي ذكي</p>
                </div>
              </div>
              <button onClick={() => setShowAddModal(false)} className="text-slate-400 hover:text-slate-600 text-4xl font-light">&times;</button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-8 grid grid-cols-12 gap-8 custom-scrollbar">
              <div className="col-span-12 lg:col-span-8 space-y-6">
                <div className="grid grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">جهة الاتصال</label>
                    <select 
                      className="w-full border border-slate-200 rounded-2xl py-3.5 px-4 outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 bg-white transition-all font-bold"
                      value={selectedContactId}
                      onChange={e => setSelectedContactId(e.target.value)}
                    >
                      <option value="">-- اختر جهة الاتصال --</option>
                      {contacts.filter(c => c.type === (type === 'sale' ? 'client' : 'supplier')).map(c => (
                        <option key={c.id} value={c.id}>{c.name}</option>
                      ))}
                    </select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-bold text-slate-700">طريقة الدفع</label>
                    <div className="flex gap-3">
                      {(['cash', 'transfer', 'credit'] as const).map((method) => (
                        <button 
                          key={method}
                          type="button"
                          onClick={() => setPaymentMethod(method)}
                          className={`flex-1 py-3.5 rounded-2xl border text-sm font-black transition-all ${
                            paymentMethod === method 
                              ? (type === 'sale' ? 'bg-indigo-600 text-white' : 'bg-emerald-600 text-white')
                              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
                          }`}
                        >
                          {method === 'cash' ? 'نقدي' : method === 'transfer' ? 'تحويل' : 'آجل'}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>

                <div className="bg-white border border-slate-100 rounded-[2rem] overflow-hidden shadow-sm">
                  <table className="w-full text-right text-sm">
                    <thead className="bg-slate-50 text-slate-400">
                      <tr>
                        <th className="px-6 py-3 font-bold uppercase text-[10px]">الصنف</th>
                        <th className="px-6 py-3 font-bold text-center w-24 uppercase text-[10px]">الكمية</th>
                        <th className="px-6 py-3 font-bold uppercase text-[10px]">السعر</th>
                        <th className="px-6 py-3 font-bold uppercase text-[10px]">الإجمالي</th>
                        <th className="px-6 py-3 w-12"></th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-slate-50">
                      {invoiceItems.map(item => (
                        <tr key={item.productId} className="hover:bg-indigo-50/30 transition-colors">
                          <td className="px-6 py-4 font-bold text-slate-800">{item.name}</td>
                          <td className="px-6 py-4 text-center">
                            <input 
                              type="number" 
                              className="w-16 border rounded p-1 text-center font-bold" 
                              value={item.quantity} 
                              onChange={e => {
                                const q = Math.max(1, Number(e.target.value));
                                setInvoiceItems(prev => prev.map(i => i.productId === item.productId ? { ...i, quantity: q, total: q * i.price } : i));
                              }}
                            />
                          </td>
                          <td className="px-6 py-4">{item.price.toLocaleString()}</td>
                          <td className="px-6 py-4 font-black">{item.total.toLocaleString()}</td>
                          <td className="px-6 py-4">
                            <button className="text-rose-500" onClick={() => setInvoiceItems(prev => prev.filter(i => i.productId !== item.productId))}>&times;</button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                <div className="bg-slate-50 p-8 rounded-[2.5rem] border border-slate-200/50 grid grid-cols-2 gap-10">
                   <div className="space-y-6">
                      <label className="text-sm font-bold text-slate-700 block">تفاصيل السداد</label>
                      <div className="flex gap-2">
                        {(['paid', 'partial', 'unpaid'] as const).map(s => (
                          <button key={s} onClick={() => setPaymentStatus(s)} className={`flex-1 py-2 rounded-xl text-xs font-black ${paymentStatus === s ? 'bg-indigo-600 text-white' : 'bg-white border text-slate-500'}`}>
                            {s === 'paid' ? 'سداد كامل' : s === 'partial' ? 'جزئي' : 'آجل'}
                          </button>
                        ))}
                      </div>
                      {paymentStatus === 'partial' && (
                        <input type="number" placeholder="المبلغ المدفوع" className="w-full p-4 rounded-xl border font-bold" value={paidAmountInput} onChange={e => setPaidAmountInput(Number(e.target.value))} />
                      )}
                      <div className="space-y-2">
                        <label className="text-xs font-bold text-slate-400">الخصم المباشر (ج.م)</label>
                        <input type="number" className="w-full p-3 rounded-xl border font-bold" value={discount} onChange={e => setDiscount(Number(e.target.value))} />
                      </div>
                   </div>
                   <div className="bg-white p-6 rounded-3xl shadow-sm space-y-3">
                      <div className="flex justify-between text-sm text-slate-500"><span>المجموع</span><span>{subtotal.toLocaleString()} ج.م</span></div>
                      <div className="flex justify-between text-sm text-slate-500"><span>الضريبة (14%)</span><span>{tax.toLocaleString()} ج.م</span></div>
                      <div className="flex justify-between text-sm text-rose-500 italic"><span>خصم</span><span>- {discount.toLocaleString()} ج.م</span></div>
                      <div className="h-px bg-slate-100 my-2"></div>
                      <div className="flex justify-between font-black text-xl text-indigo-900"><span>الإجمالي</span><span>{total.toLocaleString()} ج.م</span></div>
                   </div>
                </div>
              </div>

              <div className="col-span-12 lg:col-span-4 border-r pr-8 flex flex-col">
                <h4 className="font-black text-xl mb-6">إضافة أصناف</h4>
                <div className="flex-1 overflow-y-auto space-y-2 custom-scrollbar">
                  {products.map(p => (
                    <button key={p.id} onClick={() => handleAddItem(p.id)} className="w-full p-3 border rounded-xl hover:bg-indigo-50 text-right flex justify-between items-center group">
                      <div><p className="font-bold text-sm">{p.name}</p><p className="text-xs text-indigo-600">{type === 'sale' ? p.salePrice : p.purchasePrice} ج.م</p></div>
                      <Plus size={16} className="text-slate-300 group-hover:text-indigo-600" />
                    </button>
                  ))}
                </div>
                <button 
                  onClick={handleCreateInvoice}
                  disabled={!selectedContactId || invoiceItems.length === 0}
                  className={`w-full py-5 text-white rounded-3xl font-black text-xl mt-6 shadow-xl transition-all active:scale-[0.98] ${
                    type === 'sale' ? 'bg-indigo-600 hover:bg-indigo-700' : 'bg-emerald-600 hover:bg-emerald-700'
                  }`}
                >
                  حفظ واعتماد الفاتورة
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Invoices;
