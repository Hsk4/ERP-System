
-- 001_initial.sql
-- Create initial tables for the ERP system

-- Settings table
CREATE TABLE IF NOT EXISTS settings (
    key TEXT PRIMARY KEY,
    value TEXT NOT NULL
);

-- Customers table
CREATE TABLE IF NOT EXISTS customers (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance REAL NOT NULL DEFAULT 0,
    credit_limit REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    account_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Vendors table
CREATE TABLE IF NOT EXISTS vendors (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    phone TEXT,
    email TEXT,
    address TEXT,
    balance REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    account_id TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Products table
CREATE TABLE IF NOT EXISTS products (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    unit TEXT NOT NULL,
    sale_price REAL NOT NULL,
    purchase_price REAL NOT NULL,
    stock_qty REAL NOT NULL DEFAULT 0,
    reorder_level REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Accounts table
CREATE TABLE IF NOT EXISTS accounts (
    id TEXT PRIMARY KEY,
    code TEXT NOT NULL UNIQUE,
    name TEXT NOT NULL,
    type TEXT NOT NULL,
    category TEXT NOT NULL,
    parent_id TEXT,
    linked_party_id TEXT,
    phone TEXT,
    email TEXT,
    address TEXT,
    credit_limit REAL,
    balance REAL NOT NULL DEFAULT 0,
    is_active INTEGER NOT NULL DEFAULT 1,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Ledger Entries table
CREATE TABLE IF NOT EXISTS ledger_entries (
    id TEXT PRIMARY KEY,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    date TEXT NOT NULL,
    description TEXT NOT NULL,
    ref_type TEXT NOT NULL,
    ref_no TEXT NOT NULL,
    debit REAL NOT NULL DEFAULT 0,
    credit REAL NOT NULL DEFAULT 0,
    balance REAL NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Sale Invoices table
CREATE TABLE IF NOT EXISTS sale_invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL UNIQUE,
    sale_type TEXT NOT NULL,
    date TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    subtotal REAL NOT NULL,
    discount_total REAL NOT NULL,
    tax_total REAL NOT NULL,
    additional_discount REAL,
    carriage_freight REAL,
    grand_total REAL NOT NULL,
    amount_paid REAL NOT NULL,
    balance REAL NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id)
);

-- Sale Invoice Lines table
CREATE TABLE IF NOT EXISTS sale_invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_pct REAL NOT NULL,
    tax_pct REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES sale_invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Purchase Invoices table
CREATE TABLE IF NOT EXISTS purchase_invoices (
    id TEXT PRIMARY KEY,
    invoice_no TEXT NOT NULL UNIQUE,
    purchase_type TEXT NOT NULL,
    date TEXT NOT NULL,
    vendor_id TEXT NOT NULL,
    vendor_name TEXT NOT NULL,
    vendor_invoice_no TEXT,
    vendor_invoice_date TEXT,
    purchase_order_no TEXT,
    purchase_order_date TEXT,
    terms_of_payment TEXT,
    expense_account_id TEXT,
    expense_account_name TEXT,
    subtotal REAL NOT NULL,
    discount_total REAL NOT NULL,
    tax_total REAL NOT NULL,
    additional_discount REAL,
    carriage_freight REAL,
    grand_total REAL NOT NULL,
    amount_paid REAL NOT NULL,
    balance REAL NOT NULL,
    status TEXT NOT NULL,
    remarks TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (vendor_id) REFERENCES vendors(id)
);

-- Purchase Invoice Lines table
CREATE TABLE IF NOT EXISTS purchase_invoice_lines (
    id TEXT PRIMARY KEY,
    invoice_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_pct REAL NOT NULL,
    tax_pct REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES purchase_invoices(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Vouchers table
CREATE TABLE IF NOT EXISTS vouchers (
    id TEXT PRIMARY KEY,
    voucher_no TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    account_id TEXT NOT NULL,
    account_name TEXT NOT NULL,
    party_id TEXT,
    party_name TEXT,
    amount REAL NOT NULL,
    reference TEXT,
    remarks TEXT,
    is_posted INTEGER NOT NULL DEFAULT 0,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts(id)
);

-- Delivery Challans table
CREATE TABLE IF NOT EXISTS delivery_challans (
    id TEXT PRIMARY KEY,
    challan_no TEXT NOT NULL UNIQUE,
    date TEXT NOT NULL,
    customer_id TEXT NOT NULL,
    customer_name TEXT NOT NULL,
    invoice_id TEXT NOT NULL,
    invoice_no TEXT NOT NULL,
    status TEXT NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (customer_id) REFERENCES customers(id),
    FOREIGN KEY (invoice_id) REFERENCES sale_invoices(id)
);

-- Delivery Challan Lines table
CREATE TABLE IF NOT EXISTS delivery_challan_lines (
    id TEXT PRIMARY KEY,
    challan_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_pct REAL NOT NULL,
    tax_pct REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (challan_id) REFERENCES delivery_challans(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);

-- Gate Passes table
CREATE TABLE IF NOT EXISTS gate_passes (
    id TEXT PRIMARY KEY,
    gp_no TEXT NOT NULL UNIQUE,
    type TEXT NOT NULL,
    date TEXT NOT NULL,
    party_id TEXT,
    party_name TEXT,
    remarks TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL
);

-- Gate Pass Lines table
CREATE TABLE IF NOT EXISTS gate_pass_lines (
    id TEXT PRIMARY KEY,
    gate_pass_id TEXT NOT NULL,
    product_id TEXT NOT NULL,
    product_name TEXT NOT NULL,
    product_code TEXT NOT NULL,
    qty REAL NOT NULL,
    unit_price REAL NOT NULL,
    discount_pct REAL NOT NULL,
    tax_pct REAL NOT NULL,
    total REAL NOT NULL,
    FOREIGN KEY (gate_pass_id) REFERENCES gate_passes(id),
    FOREIGN KEY (product_id) REFERENCES products(id)
);
