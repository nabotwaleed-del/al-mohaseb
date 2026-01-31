
export enum UserRole {
  ADMIN = 'مدير النظام',
  SALES = 'موظف مبيعات',
  WAREHOUSE = 'موظف مخزن',
  ACCOUNTANT = 'محاسب'
}

export interface User {
  id: string;
  name: string;
  username: string;
  password?: string;
  role: UserRole;
  email: string;
}

export interface Product {
  id: string;
  code: string;
  name: string;
  barcode: string;
  purchasePrice: number;
  salePrice: number;
  quantity: number;
  minQuantity: number;
  category: string;
  warehouse: string;
}

export interface Contact {
  id: string;
  type: 'client' | 'supplier';
  name: string;
  phone: string;
  email: string;
  balance: number;
}

export interface InvoiceItem {
  productId: string;
  name: string;
  quantity: number;
  price: number;
  total: number;
}

export interface Invoice {
  id: string;
  number: string;
  date: string;
  type: 'sale' | 'purchase';
  contactId: string;
  contactName: string;
  items: InvoiceItem[];
  subtotal: number;
  tax: number;
  discount: number;
  total: number;
  paymentStatus: 'paid' | 'partial' | 'unpaid';
  paymentMethod: 'cash' | 'transfer' | 'credit';
  paidAmount: number;
}

export interface Transaction {
  id: string;
  date: string;
  type: 'income' | 'expense';
  category: string;
  amount: number;
  description: string;
  refId?: string;
  status?: 'paid' | 'partial' | 'unpaid';
}

export interface CompanyInfo {
  name: string;
  logo?: string;
  address: string;
  phone: string;
  email: string;
  taxNumber: string;
  currency: string;
  supabaseUrl?: string;
  supabaseKey?: string;
}

export interface ActivityLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  timestamp: string;
  details: string;
}
