
import React, { useState, useMemo } from 'react';
import { Plus, Search, Filter, Edit2, Trash2, PackageSearch, X, AlertTriangle, FileSpreadsheet } from 'lucide-react';
import { Product } from '../types';
import * as XLSX from 'xlsx';

interface InventoryProps {
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  triggerLoading: (callback: () => void) => void;
  onDeleteCloud?: (id: string) => void;
}

const Inventory: React.FC<InventoryProps> = ({ products, setProducts, triggerLoading, onDeleteCloud }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('');
  const [selectedWarehouse, setSelectedWarehouse] = useState<string>('');
  const [showAddModal, setShowAddModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  
  const initialProductState: Partial<Product> = {
    code: '', name: '', barcode: '', purchasePrice: 0, salePrice: 0, quantity: 0, minQuantity: 0, category: '', warehouse: 'المستودع الرئيسي'
  };

  const [productForm, setProductForm] = useState<Partial<Product>>(initialProductState);

  const categories = useMemo(() => Array.from(new Set(products.map(p => p.category))).filter(Boolean), [products]);
  const warehouses = useMemo(() => Array.from(new Set(products.map(p => p.warehouse))).filter(Boolean), [products]);

  const filteredProducts = products.filter(p => {
    const matchesSearch = p.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          p.code.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          p.barcode.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = selectedCategory === '' || p.category === selectedCategory;
    const matchesWarehouse = selectedWarehouse === '' || p.warehouse === selectedWarehouse;
    return matchesSearch && matchesCategory && matchesWarehouse;
  });

  const handleOpenAddModal = () => {
    setEditingId(null);
    setProductForm(initialProductState);
    setShowAddModal(true);
  };

  const handleOpenEditModal = (product: Product) => {
    setEditingId(product.id);
    setProductForm(product);
    setShowAddModal(true);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerLoading(() => {
      if (editingId) {
        setProducts(prev => prev.map(p => p.id === editingId ? { ...p, ...productForm } as Product : p));
      } else {
        const product: Product = {
          ...productForm as Product,
          id: Math.random().toString(36).substr(2, 9),
        };
        setProducts(prev => [...prev, product]);
      }
      handleCloseModal();
    });
  };

  const handleDeleteProduct = (id: string) => {
    if (confirm('هل أنت متأكد من رغبتك في حذف هذا الصنف نهائياً؟')) {
      triggerLoading(() => {
        setProducts(prev => prev.filter(p => p.id !== id));
        if (onDeleteCloud) onDeleteCloud(id);
      });
    }
  };

  const handleCloseModal = () => {
    setShowAddModal(false);
    setEditingId(null);
    setProductForm(initialProductState);
  };

  const exportInventoryExcel = () => {
    const data = filteredProducts.map(p => ({
      "الكود": p.code, "اسم الصنف": p.name, "الفئة": p.category, "المستودع": p.warehouse,
      "سعر الشراء": p.purchasePrice, "سعر البيع": p.salePrice, "الكمية الحالية": p.quantity
    }));
    const ws = XLSX.utils.json_to_sheet(data);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "المخزون");
    if(!ws['!views']) ws['!views'] = [];
    ws['!views'].push({RTL: true});
    XLSX.writeFile(wb, `تقرير_المخزون_${new Date().toISOString().split('T')[0]}.xlsx`);
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">إدارة المخزون</h2>
          <p className="text-slate-500 mt-1 font-bold">إدارة الأصناف، تتبع الكميات، والربط السحابي.</p>
        </div>
        <button onClick={handleOpenAddModal} className="bg-indigo-600 text-white px-6 py-3 rounded-2xl font-bold flex items-center gap-2 hover:bg-indigo-700 shadow-lg active:scale-95 transition-all">
          <Plus size={20} /> إضافة صنف جديد
        </button>
      </div>

      <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm flex flex-col lg:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input type="text" placeholder="البحث..." className="w-full border border-slate-200 rounded-xl py-2.5 pr-10 pl-4 outline-none font-bold bg-slate-50" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
        </div>
        <button onClick={exportInventoryExcel} className="flex items-center gap-2 px-4 py-2.5 bg-emerald-50 text-emerald-700 border border-emerald-100 rounded-xl font-bold">
          <FileSpreadsheet size={18} /> تقرير الجرد
        </button>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <table className="w-full text-right">
          <thead className="bg-slate-50 text-slate-500 text-xs font-black uppercase tracking-widest">
            <tr><th className="px-6 py-4">الكود</th><th className="px-6 py-4">الاسم</th><th className="px-6 py-4">السعر</th><th className="px-6 py-4">الكمية</th><th className="px-6 py-4 text-center">الإجراءات</th></tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredProducts.map(product => (
              <tr key={product.id} className="hover:bg-indigo-50/20 transition-colors">
                <td className="px-6 py-5 text-xs font-bold text-slate-400">{product.code}</td>
                <td className="px-6 py-5 font-bold text-slate-800">{product.name}</td>
                <td className="px-6 py-5 font-black text-slate-900">{product.salePrice.toLocaleString()} ج.م</td>
                <td className="px-6 py-5"><span className={`font-black ${product.quantity <= product.minQuantity ? 'text-rose-600 animate-pulse' : 'text-slate-800'}`}>{product.quantity}</span></td>
                <td className="px-6 py-5 flex justify-center gap-2">
                  <button onClick={() => handleOpenEditModal(product)} className="p-2 text-slate-400 hover:text-indigo-600"><Edit2 size={16} /></button>
                  <button onClick={() => handleDeleteProduct(product.id)} className="p-2 text-slate-400 hover:text-rose-600"><Trash2 size={16} /></button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showAddModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-2xl rounded-[2.5rem] shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-8 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center gap-4">
                <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">{editingId ? <Edit2 size={24} /> : <Plus size={24} />}</div>
                <h3 className="text-2xl font-black text-slate-800">{editingId ? 'تعديل الصنف' : 'إضافة صنف جديد'}</h3>
              </div>
              <button onClick={handleCloseModal} className="text-slate-400 hover:text-rose-500 text-4xl font-light">&times;</button>
            </div>
            <form onSubmit={handleSubmit} className="p-8 space-y-6">
              <div className="grid grid-cols-2 gap-6">
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">الاسم</label><input required type="text" className="w-full border border-slate-200 rounded-xl p-3 font-bold bg-slate-50 outline-none focus:border-indigo-500" value={productForm.name} onChange={e => setProductForm({...productForm, name: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">الكود</label><input required type="text" className="w-full border border-slate-200 rounded-xl p-3 font-bold bg-slate-50" value={productForm.code} onChange={e => setProductForm({...productForm, code: e.target.value})} /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">سعر البيع</label><input required type="number" className="w-full border border-slate-200 rounded-xl p-3 font-bold bg-slate-50" value={productForm.salePrice} onChange={e => setProductForm({...productForm, salePrice: Number(e.target.value)})} /></div>
                <div className="space-y-2"><label className="text-sm font-bold text-slate-700">الكمية</label><input required type="number" className="w-full border border-slate-200 rounded-xl p-3 font-bold bg-slate-50" value={productForm.quantity} onChange={e => setProductForm({...productForm, quantity: Number(e.target.value)})} /></div>
              </div>
              <div className="flex gap-4 pt-4">
                <button type="button" onClick={handleCloseModal} className="flex-1 py-4 font-black text-slate-400">إلغاء</button>
                <button type="submit" className="flex-[2] py-4 bg-indigo-600 text-white rounded-2xl font-black shadow-xl hover:bg-indigo-700 active:scale-95 transition-all">حفظ البيانات</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Inventory;
