
import React from 'react';
import { Product, Contact, User, UserRole, Invoice, Transaction, CompanyInfo, ActivityLog } from './types';

export const INITIAL_USER: User = {
  id: '1',
  name: 'أحمد المحاسب',
  username: 'admin',
  password: 'admin',
  role: UserRole.ADMIN,
  email: 'admin@system.com'
};

export const INITIAL_USERS: User[] = [
  INITIAL_USER,
  {
    id: '2',
    name: 'سارة مبيعات',
    username: 'sales',
    password: '123',
    role: UserRole.SALES,
    email: 'sales@almohaseb.eg'
  }
];

export const INITIAL_COMPANY_INFO: CompanyInfo = {
  name: 'شركة المحاسب الشامل للتجارة',
  address: 'القاهرة - مدينة نصر - شارع عباس العقاد',
  phone: '02-22700000',
  email: 'contact@almohaseb.eg',
  taxNumber: '100-200-300',
  currency: 'ج.م'
};

export const INITIAL_PRODUCTS: Product[] = [
  { id: '1', code: 'P001', name: 'لابتوب ديل XPS', barcode: '123456', purchasePrice: 45000, salePrice: 55000, quantity: 15, minQuantity: 5, category: 'إلكترونيات', warehouse: 'المستودع الرئيسي' },
  { id: '2', code: 'P002', name: 'شاشة سامسونج 27', barcode: '234567', purchasePrice: 8000, salePrice: 12000, quantity: 2, minQuantity: 10, category: 'إلكترونيات', warehouse: 'المستودع الرئيسي' },
  { id: '3', code: 'P003', name: 'ماوس لاسلكي', barcode: '345678', purchasePrice: 500, salePrice: 900, quantity: 50, minQuantity: 20, category: 'ملحقات', warehouse: 'مستودع فرعي 1' },
];

export const INITIAL_CONTACTS: Contact[] = [
  { id: 'c1', type: 'client', name: 'شركة النيل للتوريدات', phone: '01012345678', email: 'info@nile.com', balance: -15000 },
  { id: 'c2', type: 'client', name: 'محمد علي', phone: '01298765432', email: 'm.ali@email.com', balance: 0 },
  { id: 's1', type: 'supplier', name: 'مورد التقنية الحديثة', phone: '0223456789', email: 'sales@moderntech.eg', balance: 50000 },
];

export const INITIAL_INVOICES: Invoice[] = [
  {
    id: 'inv-1',
    number: 'SAL-2024-001',
    date: '2024-05-01',
    type: 'sale',
    contactId: 'c1',
    contactName: 'شركة النيل للتوريدات',
    items: [{ productId: '1', name: 'لابتوب ديل XPS', quantity: 1, price: 55000, total: 55000 }],
    subtotal: 55000,
    tax: 7700,
    discount: 0,
    total: 62700,
    paymentStatus: 'paid',
    paymentMethod: 'transfer',
    paidAmount: 62700
  }
];

export const INITIAL_TRANSACTIONS: Transaction[] = [
  { id: 't1', date: '2024-05-01', type: 'income', category: 'مبيعات', amount: 62700, description: 'فاتورة مبيعات رقم SAL-2024-001', refId: 'inv-1', status: 'paid' },
  { id: 't2', date: '2024-05-02', type: 'expense', category: 'إيجار', amount: 20000, description: 'إيجار المكتب لشهر مايو', status: 'paid' },
];

export const INITIAL_ACTIVITY_LOGS: ActivityLog[] = [
  {
    id: 'l1',
    userId: '1',
    userName: 'أحمد المحاسب',
    action: 'دخول النظام',
    timestamp: new Date().toISOString(),
    details: 'قام المستخدم بتسجيل الدخول من القاهرة، مصر'
  }
];
