
-- 1. جدول المنتجات
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT,
    name TEXT NOT NULL,
    barcode TEXT,
    purchase_price NUMERIC DEFAULT 0,
    sale_price NUMERIC DEFAULT 0,
    quantity NUMERIC DEFAULT 0,
    min_quantity NUMERIC DEFAULT 0,
    category TEXT,
    warehouse TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 2. جدول جهات الاتصال (عملاء وموردين)
CREATE TABLE IF NOT EXISTS contacts (
    id TEXT PRIMARY KEY,
    type TEXT CHECK (type IN ('client', 'supplier')),
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    balance NUMERIC DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 3. جدول الفواتير
CREATE TABLE IF NOT EXISTS invoices (
    id TEXT PRIMARY KEY,
    number TEXT UNIQUE,
    date DATE,
    type TEXT CHECK (type IN ('sale', 'purchase')),
    contact_id TEXT REFERENCES contacts(id),
    contact_name TEXT,
    items JSONB,
    subtotal NUMERIC,
    tax NUMERIC,
    discount NUMERIC,
    total NUMERIC,
    payment_status TEXT CHECK (payment_status IN ('paid', 'partial', 'unpaid')),
    payment_method TEXT CHECK (payment_method IN ('cash', 'transfer', 'credit')),
    paid_amount NUMERIC,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 4. جدول المعاملات المالية
CREATE TABLE IF NOT EXISTS transactions (
    id TEXT PRIMARY KEY,
    date DATE,
    type TEXT CHECK (type IN ('income', 'expense')),
    category TEXT,
    amount NUMERIC,
    description TEXT,
    ref_id TEXT,
    status TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 5. جدول المستخدمين
CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    username TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT,
    email TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW())
);

-- 6. جدول سجل النشاط
CREATE TABLE IF NOT EXISTS activity_logs (
    id TEXT PRIMARY KEY,
    user_id TEXT,
    user_name TEXT,
    action TEXT,
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()),
    details TEXT
);

-- تفعيل ميزة السياسات (Policies) للسماح بالوصول للبيانات
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE contacts ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE activity_logs ENABLE ROW LEVEL SECURITY;

-- إنشاء سياسة تسمح لأي شخص يملك مفتاح API بالوصول (لأغراض البساطة في هذا التطبيق)
CREATE POLICY "Allow all" ON products FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON contacts FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON invoices FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON transactions FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON users FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Allow all" ON activity_logs FOR ALL USING (true) WITH CHECK (true);
