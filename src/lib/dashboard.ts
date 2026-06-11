import type { Account, Customer, DashboardStats, PurchaseInvoice, SaleInvoice, Vendor, Voucher } from '@erp/domain'
import { getCustomerParties, getVendorParties } from './parties'

interface DashboardInput {
  saleInvoices: SaleInvoice[]
  purchaseInvoices: PurchaseInvoice[]
  vouchers: Voucher[]
  customers: Customer[]
  vendors: Vendor[]
  accounts: Account[]
  products: { name: string; stockQty: number; reorderLevel: number; isActive: boolean }[]
}

const sameDay = (a: Date, b: Date) =>
  a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate()

const emptyTrend = () => {
  const days: DashboardStats['salesTrend'] = []
  for (let i = 9; i >= 0; i--) {
    const d = new Date()
    d.setDate(d.getDate() - i)
    days.push({
      date: d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' }),
      sales: 0,
      purchases: 0,
    })
  }
  return days
}

export function computeDashboardStats(input: DashboardInput): DashboardStats {
  const today = new Date()
  const postedSales = input.saleInvoices.filter(i => i.status === 'posted' || i.status === 'paid')
  const postedPurchases = input.purchaseInvoices.filter(i => i.status === 'posted' || i.status === 'paid')

  const todaySales = postedSales
    .filter(i => sameDay(new Date(i.date), today))
    .reduce((s, i) => s + i.grandTotal, 0)

  const todayPurchases = postedPurchases
    .filter(i => sameDay(new Date(i.date), today))
    .reduce((s, i) => s + i.grandTotal, 0)

  const cashBalance = input.accounts
    .filter(a => a.category === 'cash' || /cash/i.test(a.name))
    .reduce((s, a) => s + a.balance, 0)
  const bankBalance = input.accounts
    .filter(a => a.category === 'bank' || (/bank|hbl|mcb|ubl|account/i.test(a.name) && !/payable|receivable/i.test(a.name)))
    .reduce((s, a) => s + a.balance, 0)
  const receivables = getCustomerParties(input.accounts, input.customers).reduce((s, c) => s + Math.max(0, c.balance), 0)
  const payables = getVendorParties(input.accounts, input.vendors).reduce((s, v) => s + Math.max(0, v.balance), 0)
  const lowStockCount = input.products.filter(p => p.isActive && p.stockQty <= p.reorderLevel).length

  const trend = emptyTrend()
  for (const inv of postedSales) {
    const d = new Date(inv.date)
    const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    const row = trend.find(t => t.date === label)
    if (row) row.sales += inv.grandTotal
  }
  for (const inv of postedPurchases) {
    const d = new Date(inv.date)
    const label = d.toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })
    const row = trend.find(t => t.date === label)
    if (row) row.purchases += inv.grandTotal
  }

  const productMap = new Map<string, { name: string; qty: number; revenue: number }>()
  for (const inv of postedSales) {
    for (const line of inv.lines) {
      const cur = productMap.get(line.productId as string) ?? { name: line.productName, qty: 0, revenue: 0 }
      cur.qty += line.qty
      cur.revenue += line.qty * line.unitPrice * (1 - line.discountPct / 100)
      productMap.set(line.productId as string, cur)
    }
  }
  const topProducts = [...productMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5)

  const recentTransactions: DashboardStats['recentTransactions'] = [
    ...postedSales.map(i => ({
      id: i.id as string,
      type: 'sale',
      description: `Sale ${i.invoiceNo} — ${i.customerName}`,
      amount: i.grandTotal,
      date: new Date(i.date),
      status: i.status,
    })),
    ...postedPurchases.map(i => ({
      id: i.id as string,
      type: 'purchase',
      description: `Purchase ${i.invoiceNo} — ${i.vendorName}`,
      amount: i.grandTotal,
      date: new Date(i.date),
      status: i.status,
    })),
    ...input.vouchers.filter(v => v.isPosted).map(v => ({
      id: v.id as string,
      type: v.type,
      description: `${v.voucherNo} — ${v.partyName ?? v.accountName}`,
      amount: v.amount,
      date: new Date(v.date),
      status: v.isPosted ? 'posted' : 'draft',
    })),
  ]
    .sort((a, b) => b.date.getTime() - a.date.getTime())
    .slice(0, 10)

  return {
    todaySales,
    todayPurchases,
    cashBalance,
    bankBalance,
    receivables,
    payables,
    lowStockCount,
    recentTransactions,
    salesTrend: trend,
    topProducts,
  }
}
