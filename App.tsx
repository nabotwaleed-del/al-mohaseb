
import React, { useState, useMemo, useEffect, useRef } from 'react';
import { createClient, SupabaseClient } from '@supabase/supabase-js';
import Layout from './components/Layout';
import Dashboard from './components/Dashboard';
import Inventory from './components/Inventory';
import Contacts from './components/Contacts';
import Invoices from './components/Invoices';
import Ledger from './components/Ledger';
import Settings from './components/Settings';
import Login from './components/Login';
import { 
  INITIAL_USER, 
  INITIAL_USERS,
  INITIAL_PRODUCTS, 
  INITIAL_CONTACTS, 
  INITIAL_INVOICES, 
  INITIAL_TRANSACTIONS,
  INITIAL_COMPANY_INFO,
  INITIAL_ACTIVITY_LOGS
} from './constants';
import { Product, Contact, Invoice, Transaction, User, CompanyInfo, ActivityLog, UserRole } from './types';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isLoading, setIsLoading] = useState(false);
  const [supabase, setSupabase] = useState<SupabaseClient | null>(null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => localStorage.getItem('isLoggedIn') === 'true');
  
  const isInitialMount = useRef(true);

  const getInitialData = <T,>(key: string, defaultValue: T): T => {
    const saved = localStorage.getItem(key);
    return saved ? JSON.parse(saved) : defaultValue;
  };

  const [currentUser, setCurrentUser] = useState<User>(() => getInitialData('currentUser', INITIAL_USER));
  const [users, setUsers] = useState<User[]>(() => getInitialData('users', INITIAL_USERS));
  const [products, setProducts] = useState<Product[]>(() => getInitialData('products', INITIAL_PRODUCTS));
  const [contacts, setContacts] = useState<Contact[]>(() => getInitialData('contacts', INITIAL_CONTACTS));
  const [invoices, setInvoices] = useState<Invoice[]>(() => getInitialData('invoices', INITIAL_INVOICES));
  const [transactions, setTransactions] = useState<Transaction[]>(() => getInitialData('transactions', INITIAL_TRANSACTIONS));
  const [companyInfo, setCompanyInfo] = useState<CompanyInfo>(() => getInitialData('companyInfo', INITIAL_COMPANY_INFO));
  const [activityLogs, setActivityLogs] = useState<ActivityLog[]>(() => getInitialData('activityLogs', INITIAL_ACTIVITY_LOGS));

  // جلب البيانات من السحابة وتحديث الحالة المحلية
  const fetchFromCloud = async (client: SupabaseClient) => {
    setIsLoading(true);
    try {
      const { data: p } = await client.from('products').select('*');
      if (p) setProducts(p.map(x => ({
        id: x.id, code: x.code, name: x.name, barcode: x.barcode,
        purchasePrice: x.purchase_price, salePrice: x.sale_price,
        quantity: x.quantity, minQuantity: x.min_quantity,
        category: x.category, warehouse: x.warehouse
      })));

      const { data: c } = await client.from('contacts').select('*');
      if (c) setContacts(c);

      const { data: inv } = await client.from('invoices').select('*');
      if (inv) setInvoices(inv.map(x => ({
        id: x.id, number: x.number, date: x.date, type: x.type,
        contactId: x.contact_id, contactName: x.contact_name,
        items: x.items, subtotal: x.subtotal, tax: x.tax,
        discount: x.discount, total: x.total, paymentStatus: x.payment_status,
        paymentMethod: x.payment_method, paidAmount: x.paid_amount
      })));

      const { data: t } = await client.from('transactions').select('*');
      if (t) setTransactions(t.map(x => ({
        id: x.id, date: x.date, type: x.type, category: x.category,
        amount: x.amount, description: x.description, refId: x.ref_id, status: x.status
      })));
    } catch (err) {
      console.error('Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const syncToCloud = async (table: string, data: any[]) => {
    if (!supabase) return;
    try {
      const mapped = data.map(item => {
        if (table === 'products') return {
          id: item.id, code: item.code, name: item.name, barcode: item.barcode,
          purchase_price: item.purchasePrice, sale_price: item.salePrice,
          quantity: item.quantity, min_quantity: item.minQuantity,
          category: item.category, warehouse: item.warehouse
        };
        if (table === 'invoices') return {
          id: item.id, number: item.number, date: item.date, type: item.type,
          contact_id: item.contactId, contact_name: item.contactName,
          items: item.items, subtotal: item.subtotal, tax: item.tax,
          discount: item.discount, total: item.total, payment_status: item.paymentStatus,
          payment_method: item.paymentMethod, paid_amount: item.paidAmount
        };
        if (table === 'transactions') return {
          id: item.id, date: item.date, type: item.type, category: item.category,
          amount: item.amount, description: item.description, ref_id: item.refId, status: item.status
        };
        return item;
      });
      await supabase.from(table).upsert(mapped);
    } catch (e) {
      console.error(`Sync error on ${table}:`, e);
    }
  };

  const deleteFromCloud = async (table: string, id: string) => {
    if (!supabase) return;
    await supabase.from(table).delete().eq('id', id);
  };

  // تهيئة الاتصال
  useEffect(() => {
    if (companyInfo.supabaseUrl && companyInfo.supabaseKey) {
      try {
        const client = createClient(companyInfo.supabaseUrl, companyInfo.supabaseKey);
        setSupabase(client);
        fetchFromCloud(client);
      } catch (err) {
        console.error('Supabase init failed:', err);
      }
    }
  }, [companyInfo.supabaseUrl, companyInfo.supabaseKey]);

  // تحديث التغييرات
  useEffect(() => {
    if (isInitialMount.current) { isInitialMount.current = false; return; }
    
    // حفظ محلي للطوارئ
    localStorage.setItem('products', JSON.stringify(products));
    localStorage.setItem('contacts', JSON.stringify(contacts));
    localStorage.setItem('invoices', JSON.stringify(invoices));
    localStorage.setItem('transactions', JSON.stringify(transactions));
    localStorage.setItem('companyInfo', JSON.stringify(companyInfo));

    // مزامنة سحابية تلقائية
    if (supabase) {
      const timer = setTimeout(() => {
        syncToCloud('products', products);
        syncToCloud('contacts', contacts);
        syncToCloud('invoices', invoices);
        syncToCloud('transactions', transactions);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [products, contacts, invoices, transactions, companyInfo, supabase]);

  const handleLogin = async (username: string, password: string): Promise<boolean> => {
    const userFound = users.find(u => u.username === username && u.password === password);
    if (userFound) {
      setIsLoggedIn(true);
      setCurrentUser(userFound);
      localStorage.setItem('isLoggedIn', 'true');
      localStorage.setItem('currentUser', JSON.stringify(userFound));
      return true;
    }
    return false;
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem('isLoggedIn');
    setActiveTab('dashboard');
  };

  const triggerLoading = (callback?: () => void) => {
    setIsLoading(true);
    setTimeout(() => { if (callback) callback(); setIsLoading(false); }, 600);
  };

  const stats = useMemo(() => {
    const totalSales = invoices.filter(inv => inv.type === 'sale').reduce((sum, inv) => sum + inv.total, 0);
    const totalPurchases = invoices.filter(inv => inv.type === 'purchase').reduce((sum, inv) => sum + inv.total, 0);
    const totalExpenses = transactions.filter(t => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { totalSales, totalPurchases, totalExpenses, netProfit: totalSales - totalPurchases - totalExpenses, lowStockCount: products.filter(p => p.quantity <= p.minQuantity).length };
  }, [invoices, transactions, products]);

  if (!isLoggedIn) return <Login onLogin={handleLogin} />;

  const canAccess = (tab: string) => {
    if (currentUser.role === UserRole.ADMIN) return true;
    if (currentUser.role === UserRole.ACCOUNTANT) return ['dashboard', 'sales', 'purchases', 'contacts', 'ledger'].includes(tab);
    if (currentUser.role === UserRole.SALES) return ['dashboard', 'sales', 'contacts'].includes(tab);
    return ['dashboard', 'inventory'].includes(tab);
  };

  return (
    <Layout activeTab={activeTab} setActiveTab={setActiveTab} user={currentUser} isLoading={isLoading} onLogout={handleLogout} canAccess={canAccess}>
      {activeTab === 'dashboard' && <Dashboard stats={stats} invoices={invoices} transactions={transactions} products={products} />}
      {activeTab === 'inventory' && <Inventory products={products} setProducts={setProducts} triggerLoading={triggerLoading} onDeleteCloud={(id) => deleteFromCloud('products', id)} />}
      {activeTab === 'sales' && <Invoices type="sale" invoices={invoices} setInvoices={setInvoices} products={products} setProducts={setProducts} contacts={contacts} setContacts={setContacts} setTransactions={setTransactions} triggerLoading={triggerLoading} />}
      {activeTab === 'purchases' && <Invoices type="purchase" invoices={invoices} setInvoices={setInvoices} products={products} setProducts={setProducts} contacts={contacts} setContacts={setContacts} setTransactions={setTransactions} triggerLoading={triggerLoading} />}
      {activeTab === 'contacts' && <Contacts contacts={contacts} setContacts={setContacts} triggerLoading={triggerLoading} invoices={invoices} transactions={transactions} onDeleteCloud={(id) => deleteFromCloud('contacts', id)} />}
      {activeTab === 'ledger' && <Ledger transactions={transactions} setTransactions={setTransactions} logs={activityLogs} />}
      {activeTab === 'settings' && (
        <Settings 
          companyInfo={companyInfo} setCompanyInfo={setCompanyInfo} 
          currentUser={currentUser} setCurrentUser={setCurrentUser} 
          users={users} setUsers={setUsers} triggerLoading={triggerLoading} 
          isConnected={!!supabase} onManualRefresh={() => supabase && fetchFromCloud(supabase)}
          allProducts={products} allContacts={contacts} allInvoices={invoices} allTransactions={transactions}
        />
      )}
    </Layout>
  );
};

export default App;
