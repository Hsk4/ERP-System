// ─── Branded ID type ──────────────────────────────────────────────────────────
export type ID = string & { readonly __brand: unique symbol }
export const makeId = (raw: string): ID => raw as ID

// ─── Shared entity base ───────────────────────────────────────────────────────
interface Entity {
  id: ID
  createdAt: Date
  updatedAt: Date
}

// ─── Customers ────────────────────────────────────────────────────────────────
export interface Customer extends Entity {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  balance: number
  creditLimit: number
  isActive: boolean
  accountId?: ID
}

// ─── Vendors ──────────────────────────────────────────────────────────────────
export interface Vendor extends Entity {
  code: string
  name: string
  phone?: string
  email?: string
  address?: string
  balance: number
  isActive: boolean
  accountId?: ID
}

// ─── Products ─────────────────────────────────────────────────────────────────
export interface Product extends Entity {
  code: string
  name: string
  unit: string
  salePrice: number
  purchasePrice: number
  stockQty: number
  reorderLevel: number
  isActive: boolean
}

// ─── Invoice Line ─────────────────────────────────────────────────────────────
export interface InvoiceLine {
  id: string
  productId: ID
  productName: string
  productCode: string
  qty: number
  unitPrice: number
  discountPct: number
  taxPct: number
  total: number
}

// ─── Sale Invoice ─────────────────────────────────────────────────────────────
export type InvoiceStatus = 'draft' | 'posted' | 'paid' | 'cancelled'

export type SaleType = 'tax' | 'non_tax'

export interface SaleInvoice extends Entity {
  invoiceNo: string
  saleType: SaleType
  date: Date
  customerId: ID
  customerName: string
  lines: InvoiceLine[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  additionalDiscount?: number
  carriageFreight?: number
  grandTotal: number
  amountPaid: number
  balance: number
  status: InvoiceStatus
  remarks?: string
}

// ─── Purchase Invoice ─────────────────────────────────────────────────────────
export type PurchaseType = 'tax' | 'non_tax'

export interface PurchaseInvoice extends Entity {
  invoiceNo: string
  purchaseType: PurchaseType
  date: Date
  vendorId: ID
  vendorName: string
  vendorInvoiceNo?: string
  vendorInvoiceDate?: Date
  purchaseOrderNo?: string
  purchaseOrderDate?: Date
  termsOfPayment?: string
  expenseAccountId?: ID
  expenseAccountName?: string
  lines: InvoiceLine[]
  subtotal: number
  discountTotal: number
  taxTotal: number
  additionalDiscount?: number
  carriageFreight?: number
  grandTotal: number
  amountPaid: number
  balance: number
  status: InvoiceStatus
  remarks?: string
}

// ─── Vouchers ─────────────────────────────────────────────────────────────────
export type VoucherType = 'cash_receipt' | 'cash_payment' | 'bank_receipt' | 'bank_payment'

export interface Voucher extends Entity {
  voucherNo: string
  type: VoucherType
  date: Date
  accountId: ID
  accountName: string
  partyId?: ID
  partyName?: string
  amount: number
  reference?: string
  remarks?: string
  isPosted: boolean
}

// ─── Delivery Challans ────────────────────────────────────────────────────────
export type ChallanStatus = 'pending' | 'delivered' | 'cancelled'

export interface DeliveryChallan extends Entity {
  challanNo: string
  date: Date
  customerId: ID
  customerName: string
  invoiceId: ID
  invoiceNo: string
  lines: InvoiceLine[]
  status: ChallanStatus
}

// ─── Gate Passes ───────────────────────────────────────────────────────────────
export type GatePassType = 'inwards' | 'outwards'

export interface GatePass extends Entity {
  gpNo: string
  type: GatePassType
  date: Date
  partyId?: ID
  partyName?: string
  lines: InvoiceLine[]
  remarks?: string
}

// ─── Trial Balance ────────────────────────────────────────────────────────────
export interface TrialBalanceEntry {
  accountId: ID
  accountName: string
  accountType: 'asset' | 'liability' | 'equity' | 'income' | 'expense'
  debit: number
  credit: number
}

// ─── Accounts ─────────────────────────────────────────────────────────────────
export type AccountType = 'asset' | 'liability' | 'equity' | 'income' | 'expense'
export type AccountCategory = 'customer' | 'vendor' | 'cash' | 'bank' | 'general'

export interface Account extends Entity {
  code: string
  name: string
  type: AccountType
  category: AccountCategory
  parentId?: ID
  linkedPartyId?: ID
  phone?: string
  email?: string
  address?: string
  creditLimit?: number
  balance: number
  isActive: boolean
}

// ─── Ledger Entries ───────────────────────────────────────────────────────────
export type LedgerRefType = 'sale_invoice' | 'purchase_invoice' | 'voucher' | 'manual'

export interface LedgerEntry extends Entity {
  accountId: ID
  accountName: string
  date: Date
  description: string
  refType: LedgerRefType
  refNo: string
  debit: number
  credit: number
  balance: number
}

// ─── Dashboard ────────────────────────────────────────────────────────────────
export interface DashboardStats {
  todaySales: number
  todayPurchases: number
  cashBalance: number
  bankBalance: number
  receivables: number
  payables: number
  lowStockCount: number
  recentTransactions: {
    id: string
    type: string
    description: string
    amount: number
    date: Date
    status: string
  }[]
  salesTrend: {
    date: string
    sales: number
    purchases: number
  }[]
  topProducts: {
    name: string
    qty: number
    revenue: number
  }[]
}
