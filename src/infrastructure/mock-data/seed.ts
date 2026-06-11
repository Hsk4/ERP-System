import type {
    Account,
    Customer,
    DashboardStats,
    DeliveryChallan,
    LedgerEntry,
    Product,
    PurchaseInvoice,
    SaleInvoice,
    Vendor,
    Voucher
} from '@erp/domain'
import { makeId } from '@erp/domain'

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86_400_000)
const id = (s: string) => makeId(s)

export const mockCustomers: Customer[] = [
  { id: id('c1'), code: 'CUST-001', name: 'Ahmed Traders',        phone: '0300-1234567', email: 'ahmed@traders.pk',   address: 'Karachi',    balance: 45000,  creditLimit: 100000, isActive: true,  createdAt: d(90), updatedAt: d(2)  },
  { id: id('c2'), code: 'CUST-002', name: 'Fatima Enterprises',   phone: '0321-9876543', email: 'fatima@ent.pk',      address: 'Lahore',     balance: 120000, creditLimit: 200000, isActive: true,  createdAt: d(80), updatedAt: d(5)  },
  { id: id('c3'), code: 'CUST-003', name: 'National Supplies Co.',phone: '0333-5551234', email: 'info@national.pk',   address: 'Islamabad',  balance: 0,      creditLimit: 50000,  isActive: true,  createdAt: d(70), updatedAt: d(10) },
  { id: id('c4'), code: 'CUST-004', name: 'Raza Brothers',        phone: '0345-2223333', email: 'raza@bros.pk',       address: 'Faisalabad', balance: 75000,  creditLimit: 150000, isActive: true,  createdAt: d(60), updatedAt: d(1)  },
  { id: id('c5'), code: 'CUST-005', name: 'Sunrise Retail',       phone: '0312-4445566', email: 'sunrise@retail.pk',  address: 'Karachi',    balance: 22500,  creditLimit: 80000,  isActive: false, createdAt: d(50), updatedAt: d(20) },
]

export const mockVendors: Vendor[] = [
  { id: id('v1'), code: 'VEND-001', name: 'Al-Noor Distributors', phone: '0311-1112222', email: 'alnoor@dist.pk',   address: 'Karachi',     balance: 85000,  isActive: true, createdAt: d(100), updatedAt: d(3)  },
  { id: id('v2'), code: 'VEND-002', name: 'Crown Suppliers',      phone: '0322-3334444', email: 'crown@sup.pk',    address: 'Lahore',      balance: 42000,  isActive: true, createdAt: d(90),  updatedAt: d(7)  },
  { id: id('v3'), code: 'VEND-003', name: 'Metro Wholesale',      phone: '0333-6667777', email: 'metro@whole.pk',  address: 'Karachi',     balance: 0,      isActive: true, createdAt: d(85),  updatedAt: d(15) },
  { id: id('v4'), code: 'VEND-004', name: 'Pak Industrial',       phone: '0344-8889999', email: 'pak@ind.pk',      address: 'Rawalpindi',  balance: 165000, isActive: true, createdAt: d(60),  updatedAt: d(4)  },
]

export const mockProducts: Product[] = [
  { id: id('p1'), code: 'PRD-001', name: 'Premium Rice (50kg)',   unit: 'Bag',  salePrice: 5500,  purchasePrice: 4800, stockQty: 150, reorderLevel: 20,  isActive: true, createdAt: d(120), updatedAt: d(1) },
  { id: id('p2'), code: 'PRD-002', name: 'Cooking Oil (5L)',      unit: 'Tin',  salePrice: 1850,  purchasePrice: 1600, stockQty: 8,   reorderLevel: 15,  isActive: true, createdAt: d(115), updatedAt: d(2) },
  { id: id('p3'), code: 'PRD-003', name: 'Sugar (50kg)',          unit: 'Bag',  salePrice: 6200,  purchasePrice: 5500, stockQty: 45,  reorderLevel: 10,  isActive: true, createdAt: d(110), updatedAt: d(3) },
  { id: id('p4'), code: 'PRD-004', name: 'Wheat Flour (20kg)',    unit: 'Bag',  salePrice: 2100,  purchasePrice: 1800, stockQty: 5,   reorderLevel: 25,  isActive: true, createdAt: d(105), updatedAt: d(1) },
  { id: id('p5'), code: 'PRD-005', name: 'Basmati Rice (25kg)',   unit: 'Bag',  salePrice: 4200,  purchasePrice: 3600, stockQty: 200, reorderLevel: 30,  isActive: true, createdAt: d(100), updatedAt: d(5) },
  { id: id('p6'), code: 'PRD-006', name: 'Lentils (10kg)',        unit: 'Pack', salePrice: 1400,  purchasePrice: 1100, stockQty: 3,   reorderLevel: 20,  isActive: true, createdAt: d(95),  updatedAt: d(2) },
  { id: id('p7'), code: 'PRD-007', name: 'Tomato Paste (1kg)',    unit: 'Can',  salePrice: 280,   purchasePrice: 220,  stockQty: 300, reorderLevel: 50,  isActive: true, createdAt: d(90),  updatedAt: d(8) },
  { id: id('p8'), code: 'PRD-008', name: 'Salt (1kg)',            unit: 'Pack', salePrice: 95,    purchasePrice: 70,   stockQty: 500, reorderLevel: 100, isActive: true, createdAt: d(88),  updatedAt: d(10) },
]

const line = (lid: string, pid: string, name: string, code: string, qty: number, price: number, disc: number, tax: number) => {
  const net = qty * price * (1 - disc / 100)
  return { id: lid, productId: makeId(pid), productName: name, productCode: code, qty, unitPrice: price, discountPct: disc, taxPct: tax, total: net * (1 + tax / 100) }
}

export const mockSaleInvoices: SaleInvoice[] = [
  {
    id: id('si1'), invoiceNo: 'SIT-2026-001', saleType: 'tax', date: d(0), customerId: id('c1'), customerName: 'Ahmed Traders',
    lines: [
      line('l1','p1','Premium Rice (50kg)','PRD-001',5,5500,0,5),
      line('l2','p3','Sugar (50kg)',        'PRD-003',2,6200,0,5),
    ],
    subtotal: 43500, discountTotal: 0, taxTotal: 2175, carriageFreight: 0, grandTotal: 45675,
    amountPaid: 0, balance: 45675, status: 'posted', createdAt: d(0), updatedAt: d(0),
  },
  {
    id: id('si2'), invoiceNo: 'SIT-2026-002', saleType: 'tax', date: d(1), customerId: id('c2'), customerName: 'Fatima Enterprises',
    lines: [line('l3','p5','Basmati Rice (25kg)','PRD-005',10,4200,5,5)],
    subtotal: 42000, discountTotal: 2100, taxTotal: 1995, carriageFreight: 0, grandTotal: 41895,
    amountPaid: 41895, balance: 0, status: 'paid', createdAt: d(1), updatedAt: d(1),
  },
  {
    id: id('si3'), invoiceNo: 'SIT-2026-003', saleType: 'tax', date: d(2), customerId: id('c4'), customerName: 'Raza Brothers',
    lines: [
      line('l4','p2','Cooking Oil (5L)',   'PRD-002',20,1850,0,5),
      line('l5','p7','Tomato Paste (1kg)', 'PRD-007',50,280,0,5),
    ],
    subtotal: 51000, discountTotal: 0, taxTotal: 2550, carriageFreight: 0, grandTotal: 53550,
    amountPaid: 20000, balance: 33550, status: 'posted', createdAt: d(2), updatedAt: d(2),
  },
  {
    id: id('si4'), invoiceNo: 'SIN-2026-001', saleType: 'non_tax', date: d(5), customerId: id('c3'), customerName: 'National Supplies Co.',
    lines: [line('l6','p8','Salt (1kg)','PRD-008',100,95,10,0)],
    subtotal: 9500, discountTotal: 950, taxTotal: 0, additionalDiscount: 0, carriageFreight: 0, grandTotal: 8550,
    amountPaid: 8550, balance: 0, status: 'paid', createdAt: d(5), updatedAt: d(4),
  },
  {
    id: id('si5'), invoiceNo: 'SIT-2026-004', saleType: 'tax', date: d(7), customerId: id('c1'), customerName: 'Ahmed Traders',
    lines: [line('l7','p4','Wheat Flour (20kg)','PRD-004',30,2100,0,5)],
    subtotal: 63000, discountTotal: 0, taxTotal: 3150, carriageFreight: 0, grandTotal: 66150,
    amountPaid: 0, balance: 66150, status: 'draft', createdAt: d(7), updatedAt: d(7),
  },
]

export const mockPurchaseInvoices: PurchaseInvoice[] = [
  {
    id: id('pi1'), invoiceNo: 'PIT-2026-001', purchaseType: 'tax', date: d(0), vendorId: id('v1'), vendorName: 'Al-Noor Distributors',
    lines: [line('pl1','p1','Premium Rice (50kg)','PRD-001',50,4800,0,5)],
    subtotal: 240000, discountTotal: 0, taxTotal: 12000, grandTotal: 252000,
    amountPaid: 0, balance: 252000, status: 'posted', createdAt: d(0), updatedAt: d(0),
  },
  {
    id: id('pi2'), invoiceNo: 'PIT-2026-002', purchaseType: 'tax', date: d(3), vendorId: id('v2'), vendorName: 'Crown Suppliers',
    lines: [line('pl2','p2','Cooking Oil (5L)','PRD-002',100,1600,2,5)],
    subtotal: 160000, discountTotal: 3200, taxTotal: 7840, grandTotal: 164640,
    amountPaid: 164640, balance: 0, status: 'paid', createdAt: d(3), updatedAt: d(3),
  },
  {
    id: id('pi3'), invoiceNo: 'PIT-2026-003', purchaseType: 'tax', date: d(6), vendorId: id('v4'), vendorName: 'Pak Industrial',
    lines: [line('pl3','p5','Basmati Rice (25kg)','PRD-005',80,3600,0,5)],
    subtotal: 288000, discountTotal: 0, taxTotal: 14400, grandTotal: 302400,
    amountPaid: 150000, balance: 152400, status: 'posted', createdAt: d(6), updatedAt: d(6),
  },
]

export const mockVouchers: Voucher[] = [
  { id: id('vo1'), voucherNo: 'CR-2026-001', type: 'cash_receipt',  date: d(0), accountId: id('a1'), accountName: 'Cash in Hand',       partyId: id('c2'), partyName: 'Fatima Enterprises', amount: 41895,  reference: 'SI-2026-002', isPosted: true,  createdAt: d(0), updatedAt: d(0) },
  { id: id('vo2'), voucherNo: 'CP-2026-001', type: 'cash_payment',  date: d(1), accountId: id('a1'), accountName: 'Cash in Hand',       partyId: id('v2'), partyName: 'Crown Suppliers',    amount: 164640, reference: 'PI-2026-002', isPosted: true,  createdAt: d(1), updatedAt: d(1) },
  { id: id('vo3'), voucherNo: 'BR-2026-001', type: 'bank_receipt',  date: d(2), accountId: id('a2'), accountName: 'HBL Current Acct',   partyId: id('c4'), partyName: 'Raza Brothers',      amount: 20000,  reference: 'SI-2026-003', isPosted: true,  createdAt: d(2), updatedAt: d(2) },
  { id: id('vo4'), voucherNo: 'CR-2026-002', type: 'cash_receipt',  date: d(4), accountId: id('a1'), accountName: 'Cash in Hand',       partyId: id('c3'), partyName: 'National Supplies',  amount: 8550,   reference: 'SI-2026-004', isPosted: true,  createdAt: d(4), updatedAt: d(4) },
  { id: id('vo5'), voucherNo: 'BP-2026-001', type: 'bank_payment',  date: d(5), accountId: id('a2'), accountName: 'HBL Current Acct',   partyId: id('v4'), partyName: 'Pak Industrial',     amount: 150000, reference: 'PI-2026-003', isPosted: false, createdAt: d(5), updatedAt: d(5) },
]

export const mockChallans: DeliveryChallan[] = [
  { id: id('dc1'), challanNo: 'DC-2026-001', date: d(0), customerId: id('c1'), customerName: 'Ahmed Traders',      invoiceId: id('si1'), invoiceNo: 'SIT-2026-001', lines: mockSaleInvoices[0].lines, status: 'pending',   createdAt: d(0), updatedAt: d(0) },
  { id: id('dc2'), challanNo: 'DC-2026-002', date: d(1), customerId: id('c2'), customerName: 'Fatima Enterprises', invoiceId: id('si2'), invoiceNo: 'SIT-2026-002', lines: mockSaleInvoices[1].lines, status: 'delivered', createdAt: d(1), updatedAt: d(1) },
  { id: id('dc3'), challanNo: 'DC-2026-003', date: d(2), customerId: id('c4'), customerName: 'Raza Brothers',      invoiceId: id('si3'), invoiceNo: 'SIT-2026-003', lines: mockSaleInvoices[2].lines, status: 'pending',   createdAt: d(2), updatedAt: d(2) },
]

export const mockAccounts: Account[] = [
  { id: id('a1'), code: '1001', name: 'Cash in Hand',        type: 'asset',     category: 'cash',     balance: 285000,  isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a2'), code: '1002', name: 'HBL Current Account', type: 'asset',     category: 'bank',     balance: 1250000, isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a3'), code: '1003', name: 'MCB Savings Account', type: 'asset',     category: 'bank',     balance: 450000,  isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a4'), code: '2001', name: 'Accounts Payable',    type: 'liability', category: 'vendor',   balance: 252000,  isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a8'), code: '2101', name: 'GST Output',          type: 'liability', category: 'general',  balance: 9870,    isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a5'), code: '4001', name: 'Sales Revenue',       type: 'income',    category: 'general',  balance: 210990,  isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a6'), code: '5001', name: 'Cost of Goods Sold',  type: 'expense',   category: 'general',  balance: 168000,  isActive: true, createdAt: d(200), updatedAt: d(0) },
  { id: id('a7'), code: '1101', name: 'GST Input',           type: 'asset',     category: 'general',  balance: 0,       isActive: true, createdAt: d(200), updatedAt: d(0) },
]

export const mockDashboardStats: DashboardStats = {
  todaySales: 45675,
  todayPurchases: 252000,
  cashBalance: 285000,
  bankBalance: 1700000,
  receivables: 262445,
  payables: 404400,
  lowStockCount: 4,
  recentTransactions: [
    { id: 'rt1', type: 'sale',     description: 'SI-2026-001 · Ahmed Traders',       amount: 45675,  date: d(0), status: 'posted' },
    { id: 'rt2', type: 'purchase', description: 'PI-2026-001 · Al-Noor Distributors', amount: 252000, date: d(0), status: 'posted' },
    { id: 'rt3', type: 'receipt',  description: 'CR-2026-001 · Fatima Enterprises',   amount: 41895,  date: d(0), status: 'posted' },
    { id: 'rt4', type: 'payment',  description: 'CP-2026-001 · Crown Suppliers',      amount: 164640, date: d(1), status: 'posted' },
    { id: 'rt5', type: 'receipt',  description: 'BR-2026-001 · Raza Brothers',        amount: 20000,  date: d(2), status: 'posted' },
    { id: 'rt6', type: 'sale',     description: 'SI-2026-002 · Fatima Enterprises',   amount: 41895,  date: d(1), status: 'paid'   },
    { id: 'rt7', type: 'purchase', description: 'PI-2026-002 · Crown Suppliers',      amount: 164640, date: d(3), status: 'paid'   },
  ],
  salesTrend: [
    { date: 'May 27', sales: 28000,  purchases: 95000  },
    { date: 'May 28', sales: 45000,  purchases: 0      },
    { date: 'May 29', sales: 12000,  purchases: 164640 },
    { date: 'May 30', sales: 66150,  purchases: 302400 },
    { date: 'May 31', sales: 38000,  purchases: 0      },
    { date: 'Jun 1',  sales: 53550,  purchases: 0      },
    { date: 'Jun 2',  sales: 8550,   purchases: 0      },
    { date: 'Jun 3',  sales: 0,      purchases: 0      },
    { date: 'Jun 4',  sales: 41895,  purchases: 0      },
    { date: 'Jun 5',  sales: 45675,  purchases: 252000 },
  ],
  topProducts: [
    { name: 'Premium Rice (50kg)',  qty: 55,  revenue: 302500 },
    { name: 'Basmati Rice (25kg)',  qty: 10,  revenue: 42000  },
    { name: 'Cooking Oil (5L)',     qty: 20,  revenue: 37000  },
    { name: 'Wheat Flour (20kg)',   qty: 30,  revenue: 63000  },
    { name: 'Sugar (50kg)',         qty: 2,   revenue: 12400  },
  ],
}

// ─── Mock Ledger Entries ──────────────────────────────────────────────────────
// Running balances per account (positive = debit side for assets, credit for liabilities)
export const mockLedgerEntries: LedgerEntry[] = [
  // Cash in Hand (a1)
  { id: id('le1'), accountId: id('a1'), accountName: 'Cash in Hand', date: d(10), description: 'Opening Balance', refType: 'manual', refNo: 'OB-001', debit: 400000, credit: 0, balance: 400000, createdAt: d(10), updatedAt: d(10) },
  { id: id('le2'), accountId: id('a1'), accountName: 'Cash in Hand', date: d(4),  description: 'Receipt from Fatima Enterprises', refType: 'voucher', refNo: 'CR-2026-001', debit: 41895, credit: 0, balance: 441895, createdAt: d(4), updatedAt: d(4) },
  { id: id('le3'), accountId: id('a1'), accountName: 'Cash in Hand', date: d(3),  description: 'Payment to Crown Suppliers', refType: 'voucher', refNo: 'CP-2026-001', debit: 0, credit: 164640, balance: 277255, createdAt: d(3), updatedAt: d(3) },
  { id: id('le4'), accountId: id('a1'), accountName: 'Cash in Hand', date: d(1),  description: 'Receipt from National Supplies', refType: 'voucher', refNo: 'CR-2026-002', debit: 8550, credit: 0, balance: 285805, createdAt: d(1), updatedAt: d(1) },
  // HBL Current Account (a2)
  { id: id('le5'), accountId: id('a2'), accountName: 'HBL Current Account', date: d(10), description: 'Opening Balance', refType: 'manual', refNo: 'OB-002', debit: 1380000, credit: 0, balance: 1380000, createdAt: d(10), updatedAt: d(10) },
  { id: id('le6'), accountId: id('a2'), accountName: 'HBL Current Account', date: d(2),  description: 'Receipt from Raza Brothers', refType: 'voucher', refNo: 'BR-2026-001', debit: 20000, credit: 0, balance: 1400000, createdAt: d(2), updatedAt: d(2) },
  { id: id('le7'), accountId: id('a2'), accountName: 'HBL Current Account', date: d(1),  description: 'Payment to Pak Industrial', refType: 'voucher', refNo: 'BP-2026-001', debit: 0, credit: 150000, balance: 1250000, createdAt: d(1), updatedAt: d(1) },
  // Sales Revenue (a5)
  { id: id('le8'),  accountId: id('a5'), accountName: 'Sales Revenue', date: d(7),  description: 'Sale Invoice SI-2026-001', refType: 'sale_invoice', refNo: 'SI-2026-001', debit: 0, credit: 45675, balance: 45675,  createdAt: d(7),  updatedAt: d(7)  },
  { id: id('le9'),  accountId: id('a5'), accountName: 'Sales Revenue', date: d(5),  description: 'Sale Invoice SI-2026-002', refType: 'sale_invoice', refNo: 'SI-2026-002', debit: 0, credit: 41895, balance: 87570,  createdAt: d(5),  updatedAt: d(5)  },
  { id: id('le10'), accountId: id('a5'), accountName: 'Sales Revenue', date: d(3),  description: 'Sale Invoice SI-2026-003', refType: 'sale_invoice', refNo: 'SI-2026-003', debit: 0, credit: 53550, balance: 141120, createdAt: d(3),  updatedAt: d(3)  },
  { id: id('le11'), accountId: id('a5'), accountName: 'Sales Revenue', date: d(2),  description: 'Sale Invoice SI-2026-004', refType: 'sale_invoice', refNo: 'SI-2026-004', debit: 0, credit: 8550,  balance: 149670, createdAt: d(2),  updatedAt: d(2)  },
  { id: id('le12'), accountId: id('a5'), accountName: 'Sales Revenue', date: d(0),  description: 'Sale Invoice SI-2026-005', refType: 'sale_invoice', refNo: 'SI-2026-005', debit: 0, credit: 61320, balance: 210990, createdAt: d(0),  updatedAt: d(0)  },
  // COGS (a6)
  { id: id('le13'), accountId: id('a6'), accountName: 'Cost of Goods Sold', date: d(3), description: 'Purchase PI-2026-002', refType: 'purchase_invoice', refNo: 'PI-2026-002', debit: 164640, credit: 0, balance: 164640, createdAt: d(3), updatedAt: d(3) },
  { id: id('le14'), accountId: id('a6'), accountName: 'Cost of Goods Sold', date: d(1), description: 'Purchase PI-2026-003 partial', refType: 'purchase_invoice', refNo: 'PI-2026-003', debit: 3360,  credit: 0, balance: 168000, createdAt: d(1), updatedAt: d(1) },
]
