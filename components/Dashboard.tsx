
import React, { useMemo } from 'react';
import { 
  TrendingUp, 
  TrendingDown, 
  Wallet, 
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';
import { 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis
} from 'recharts';
import { Invoice, Transaction, Product } from '../types';

interface DashboardProps {
  stats: {
    totalSales: number;
    totalPurchases: number;
    totalExpenses: number;
    netProfit: number;
    lowStockCount: number;
  };
  invoices: Invoice[];
  transactions: Transaction[];
  products: Product[];
}

const Dashboard: React.FC<DashboardProps> = ({ stats, invoices, transactions, products }) => {
  // Aggregate data for the chart by date
  const chartData = useMemo(() => {
    const dailyData: Record<string, { date: string, sales: number, expenses: number }> = {};
    
    // Last 7 days logic
    const today = new Date();
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      const dateStr = d.toISOString().split('T')[0];
      dailyData[dateStr] = { date: dateStr, sales: 0, expenses: 0 };
    }

    invoices.forEach(inv => {
      if (dailyData[inv.date]) {
        if (inv.type === 'sale') dailyData[inv.date].sales += inv.total;
        else dailyData[inv.date].expenses += inv.total;
      }
    });

    transactions.forEach(t => {
      if (dailyData[t.date]) {
        if (t.type === 'income') dailyData[t.date].sales += t.amount;
        else dailyData[t.date].expenses += t.amount;
      }
    });

    return Object.values(dailyData).sort((a, b) => a.date.localeCompare(b.date));
  }, [invoices, transactions]);

  const recentSales = invoices.filter(i => i.type === 'sale').slice(-5).reverse();

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-slate-800">لوحة التحكم</h2>
          <p className="text-slate-500 mt-1">أهلاً بك مجدداً، نظرة سريعة على أداء عملك اليوم.</p>
        </div>
        <div className="bg-white p-1 rounded-xl shadow-sm border border-slate-200 flex">
          <button className="px-4 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-bold">اليوم</button>
          <button className="px-4 py-2 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50">الأسبوع</button>
          <button className="px-4 py-2 text-slate-500 rounded-lg text-sm font-medium hover:bg-slate-50">الشهر</button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KpiCard 
          title="إجمالي المبيعات" 
          value={`${stats.totalSales.toLocaleString()} ج.م`} 
          trend="+12.5%" 
          positive={true}
          icon={<TrendingUp className="text-emerald-600" />}
          color="bg-emerald-50"
        />
        <KpiCard 
          title="إجمالي المصروفات" 
          value={`${(stats.totalPurchases + stats.totalExpenses).toLocaleString()} ج.م`} 
          trend="-2.4%" 
          positive={false}
          icon={<TrendingDown className="text-rose-600" />}
          color="bg-rose-50"
        />
        <KpiCard 
          title="صافي الربح" 
          value={`${stats.netProfit.toLocaleString()} ج.م`} 
          trend="+5.2%" 
          positive={true}
          icon={<Wallet className="text-blue-600" />}
          color="bg-blue-50"
        />
        <KpiCard 
          title="نواقص المخزون" 
          value={stats.lowStockCount.toString()} 
          trend="تنبيه" 
          positive={stats.lowStockCount === 0}
          icon={<AlertTriangle className="text-amber-600" />}
          color="bg-amber-50"
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Sales Chart */}
        <div className="lg:col-span-2 bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <div className="flex items-center justify-between mb-8">
            <h3 className="text-xl font-bold">حركة السيولة (آخر 7 أيام)</h3>
            <div className="flex items-center gap-4 text-sm font-medium">
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-indigo-500"></span> مبيعات</div>
              <div className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-full bg-rose-400"></span> مصروفات</div>
            </div>
          </div>
          <div className="h-80 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData}>
                <defs>
                  <linearGradient id="colorSales" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#6366f1" stopOpacity={0.1}/>
                    <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="date" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 10}} />
                <Tooltip 
                  contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                  labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                />
                <Area type="monotone" dataKey="sales" stroke="#6366f1" strokeWidth={3} fillOpacity={1} fill="url(#colorSales)" />
                <Area type="monotone" dataKey="expenses" stroke="#fb7185" strokeWidth={3} fill="none" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Quick Stock Status */}
        <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm">
          <h3 className="text-xl font-bold mb-6">حالة المخزون</h3>
          <div className="space-y-6">
            {products.slice(0, 6).map(product => (
              <div key={product.id} className="flex items-center justify-between">
                <div className="flex-1">
                  <p className="font-bold text-slate-800 text-sm truncate">{product.name}</p>
                  <p className="text-[10px] text-slate-400 font-bold uppercase tracking-tighter">كود: {product.code}</p>
                </div>
                <div className="text-left">
                  <p className={`font-black text-xs ${product.quantity <= product.minQuantity ? 'text-rose-500' : 'text-slate-700'}`}>
                    {product.quantity} وحدة
                  </p>
                  <div className="w-20 h-1 bg-slate-100 rounded-full mt-1 overflow-hidden">
                    <div 
                      className={`h-full rounded-full ${product.quantity <= product.minQuantity ? 'bg-rose-500 animate-pulse' : 'bg-emerald-500'}`}
                      style={{ width: `${Math.min(100, (product.quantity / (product.minQuantity * 3 || 1)) * 100)}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ))}
            {products.length === 0 && <p className="text-center text-slate-400 py-10 italic">لا توجد أصناف في المخزن</p>}
          </div>
        </div>
      </div>

      {/* Recent Activity Table */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-8 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-xl font-bold">آخر فواتير المبيعات</h3>
          <button className="text-indigo-600 font-bold text-sm hover:underline">عرض الكل</button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-right">
            <thead className="bg-slate-50 text-slate-500 text-[10px] uppercase font-black tracking-widest">
              <tr>
                <th className="px-8 py-4">رقم الفاتورة</th>
                <th className="px-8 py-4">التاريخ</th>
                <th className="px-8 py-4">العميل</th>
                <th className="px-8 py-4">الإجمالي</th>
                <th className="px-8 py-4 text-center">الحالة</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {recentSales.map(invoice => (
                <tr key={invoice.id} className="hover:bg-slate-50/50 transition-colors">
                  <td className="px-8 py-5 font-bold text-indigo-600">{invoice.number}</td>
                  <td className="px-8 py-5 text-slate-500 text-sm">{invoice.date}</td>
                  <td className="px-8 py-5 font-bold">{invoice.contactName}</td>
                  <td className="px-8 py-5 font-black">{invoice.total.toLocaleString()} ج.م</td>
                  <td className="px-8 py-5 text-center">
                    <span className={`px-3 py-1 rounded-full text-[10px] font-black uppercase ${
                      invoice.paymentStatus === 'paid' ? 'bg-emerald-100 text-emerald-700' : 
                      invoice.paymentStatus === 'partial' ? 'bg-amber-100 text-amber-700' : 'bg-rose-100 text-rose-700'
                    }`}>
                      {invoice.paymentStatus === 'paid' ? 'تم الدفع' : invoice.paymentStatus === 'partial' ? 'جزئي' : 'آجل'}
                    </span>
                  </td>
                </tr>
              ))}
              {recentSales.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-8 py-16 text-center text-slate-400 italic">لا توجد عمليات مبيعات حديثة</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const KpiCard: React.FC<{ title: string, value: string, trend: string, positive: boolean, icon: React.ReactNode, color: string }> = ({ title, value, trend, positive, icon, color }) => (
  <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-sm transition-transform hover:scale-[1.02] cursor-pointer group">
    <div className="flex items-center justify-between mb-4">
      <div className={`p-3 rounded-2xl ${color} group-hover:scale-110 transition-transform`}>
        {icon}
      </div>
      <div className={`flex items-center gap-1 text-[10px] font-black px-2 py-1 rounded-lg ${positive ? 'bg-emerald-50 text-emerald-600' : 'bg-rose-50 text-rose-600'}`}>
        {positive ? <ArrowUpRight size={14} /> : <ArrowDownRight size={14} />}
        {trend}
      </div>
    </div>
    <div>
      <p className="text-slate-500 text-[11px] font-black uppercase tracking-wider mb-1 opacity-70">{title}</p>
      <h4 className="text-2xl font-black text-slate-900">{value}</h4>
    </div>
  </div>
);

export default Dashboard;
