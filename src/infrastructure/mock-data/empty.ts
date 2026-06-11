import type {
  Customer, Vendor, Product, SaleInvoice, PurchaseInvoice,
  Voucher, DeliveryChallan, Account, LedgerEntry, DashboardStats
} from '@erp/domain'

export const mockCustomers: Customer[] = []
export const mockVendors: Vendor[] = []
export const mockProducts: Product[] = []
export const mockSaleInvoices: SaleInvoice[] = []
export const mockPurchaseInvoices: PurchaseInvoice[] = []
export const mockVouchers: Voucher[] = []
export const mockChallans: DeliveryChallan[] = []
export const mockAccounts: Account[] = []
export const mockLedgerEntries: LedgerEntry[] = []
export const mockDashboardStats: DashboardStats = {
  todaySales: 0,
  todayPurchases: 0,
  cashBalance: 0,
  bankBalance: 0,
  receivables: 0,
  payables: 0,
  lowStockCount: 0,
  recentTransactions: [],
  salesTrend: [],
  topProducts: [],
}
