import type { Account } from '@erp/domain'
import { Card, StatCard, Tabs, Th, TrEmpty } from '@erp/ui'
import React, { useMemo, useState } from 'react'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { computeDashboardStats } from '../../lib/dashboard'
import { getCustomerParties, getVendorParties } from '../../lib/parties'
import { useStore } from '../../store'

const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
const PIE_COLORS = ['#38bdf8','#a78bfa','#34d399','#fb923c','#f472b6']
const Tip = ({ active, payload, label }: any) => !active || !payload?.length ? null : (
  <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs shadow-xl">
    <p className="text-slate-600 mb-1">{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtC(p.value)}</p>)}
  </div>
)

const TABS = ['overview','sales', 'purchases', 'inventory', 'customer balances', 'vendor balances', 'trial balance'] as const
type Tab = typeof TABS[number]

export const ReportsModule: React.FC = () => {
  const state = useStore()
  const { saleInvoices, purchaseInvoices, products, accounts, customers, vendors, ledgerEntries } = state
  const customerParties = getCustomerParties(accounts, customers)
  const vendorParties = getVendorParties(accounts, vendors)
  const dashboardStats = computeDashboardStats(state)
  const [tab, setTab] = useState<Tab>('overview')

  const postedSales     = saleInvoices.filter(i => i.status !== 'cancelled')
  const postedPurchases = purchaseInvoices.filter(i => i.status !== 'cancelled')
  const totalSales     = postedSales.reduce((s, i) => s + i.grandTotal, 0)
  const totalPurchases = postedPurchases.reduce((s, i) => s + i.grandTotal, 0)
  const grossProfit    = totalSales - totalPurchases
  const paidSales      = postedSales.filter(i => i.status === 'paid').reduce((s, i) => s + i.grandTotal, 0)
  const collectionRate = totalSales > 0 ? Math.round((paidSales / totalSales) * 100) : 0

  const salesByCustomer = customerParties
    .map(c => ({
      name: c.name.split(' ')[0],
      total: postedSales.filter(i => i.customerId === c.id || i.customerId === c.accountId).reduce((s, i) => s + i.grandTotal, 0),
    }))
    .filter(c => c.total > 0).sort((a, b) => b.total - a.total).slice(0, 5)

  const stockPie = products.filter(p => p.isActive).slice(0, 5)
    .map(p => ({ name: p.name.split('(')[0].trim(), value: p.stockQty * p.purchasePrice }))

  const customerBalances = useMemo(() => {
    return customerParties.map(c => ({
      id: c.id,
      code: c.code,
      name: c.name,
      balance: c.balance
    })).sort((a, b) => b.balance - a.balance)
  }, [customerParties])

  const vendorBalances = useMemo(() => {
    return vendorParties.map(v => ({
      id: v.id,
      code: v.code,
      name: v.name,
      balance: v.balance
    })).sort((a, b) => b.balance - a.balance)
  }, [vendorParties])

  const trialBalance = useMemo(() => {
    const balances = new Map<string, { account: Account, debit: number, credit: number }>()
    accounts.forEach(acc => {
      balances.set(acc.id, { account: acc, debit: 0, credit: 0 })
    })
    ledgerEntries.forEach(entry => {
      const existing = balances.get(entry.accountId)
      if (existing) {
        existing.debit += entry.debit
        existing.credit += entry.credit
      }
    })
    return Array.from(balances.values()).map(item => ({
      id: item.account.id,
      name: item.account.name,
      type: item.account.type,
      debit: item.debit,
      credit: item.credit,
    }))
  }, [accounts, ledgerEntries])

  const totalDebit = trialBalance.reduce((s, t) => s + t.debit, 0)
  const totalCredit = trialBalance.reduce((s, t) => s + t.credit, 0)

  return (
    <div className="space-y-5">
      <Card>
        <Tabs tabs={TABS.map(t => ({ id: t, label: t.charAt(0).toUpperCase() + t.slice(1) }))} active={tab} onChange={id => setTab(id as Tab)} />
      </Card>

      {tab === 'overview' && (
        <>
          <div className="grid grid-cols-4 gap-4">
            <StatCard label="Total Revenue" value={fmtC(totalSales)} accent="text-sky-600"
              icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
            <StatCard label="Total COGS" value={fmtC(totalPurchases)} accent="text-violet-600"
              icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>} />
            <StatCard label="Gross Profit" value={fmtC(Math.abs(grossProfit))} subtext={grossProfit >= 0 ? 'Profit' : 'Loss'} accent={grossProfit >= 0 ? 'text-emerald-600' : 'text-red-600'}
              icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} />
            <StatCard label="Collection Rate" value={`${collectionRate}%`} accent="text-amber-600"
              icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Sales vs Purchases Trend</p>
              <ResponsiveContainer width="100%" height={210}>
                <BarChart data={dashboardStats.salesTrend} margin={{ left: -10, right: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                  <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
                  <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtC} />
                  <Tooltip content={<Tip />} />
                  <Bar dataKey="sales"     name="Sales"     fill="#38bdf8" radius={[3,3,0,0]} />
                  <Bar dataKey="purchases" name="Purchases" fill="#a78bfa" radius={[3,3,0,0]} />
                </BarChart>
              </ResponsiveContainer>
            </Card>
            <Card className="p-5">
              <p className="text-sm font-medium text-slate-700 mb-4">Stock Value Distribution</p>
              <ResponsiveContainer width="100%" height={210}>
                <PieChart>
                  <Pie data={stockPie} cx="50%" cy="50%" outerRadius={75} dataKey="value"
                    label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                    labelLine={false} fontSize={10}>
                    {stockPie.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                  </Pie>
                  <Tooltip formatter={(v: number) => fmt(v)} />
                </PieChart>
              </ResponsiveContainer>
            </Card>
          </div>
        </>
      )}

      {tab === 'sales' && (
        <div className="grid grid-cols-2 gap-4">
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-700 mb-4">Top 5 Customers by Revenue</p>
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={salesByCustomer} layout="vertical" margin={{ left: 10, right: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtC} />
                <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={65} />
                <Tooltip content={<Tip />} />
                <Bar dataKey="total" name="Sales" fill="#38bdf8" radius={[0,3,3,0]} />
              </BarChart>
            </ResponsiveContainer>
          </Card>
          <Card className="p-5">
            <p className="text-sm font-medium text-slate-700 mb-3">Invoice Summary by Status</p>
            <div className="space-y-1">
              {(['draft','posted','paid','cancelled'] as const).map(s => {
                const items = saleInvoices.filter(i => i.status === s)
                const total = items.reduce((sum, i) => sum + i.grandTotal, 0)
                return (
                  <div key={s} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                    <span className="text-sm text-slate-600 capitalize">{s}</span>
                    <div className="text-right">
                      <p className="text-sm font-mono text-slate-800">{fmt(total)}</p>
                      <p className="text-xs text-slate-600">{items.length} invoice{items.length !== 1 ? 's' : ''}</p>
                    </div>
                  </div>
                )
              })}
            </div>
          </Card>
        </div>
      )}

      {tab === 'purchases' && (
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Purchases by Vendor</p>
          <div className="space-y-1">
            {vendorParties.map(v => {
              const total = postedPurchases.filter(i => i.vendorId === v.id || i.vendorId === v.accountId).reduce((s, i) => s + i.grandTotal, 0)
              if (!total) return null
              return (
                <div key={v.id as string} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-sm font-medium text-slate-800">{v.name}</p>
                    <p className="text-xs text-slate-500">{v.code}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-mono text-violet-600">{fmt(total)}</p>
                    <p className="text-xs text-slate-600">{postedPurchases.filter(i => i.vendorId === v.id || i.vendorId === v.accountId).length} invoices</p>
                  </div>
                </div>
              )
            })}
          </div>
        </Card>
      )}

      {tab === 'inventory' && (
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Inventory Valuation Report</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  {['Product','Unit','Qty','Purchase Price','Sale Price','Stock Value','Potential Revenue'].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wide border-b border-slate-200">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {products.filter(p => p.isActive).map(p => (
                  <tr key={p.id as string} className="border-b border-slate-100 hover:bg-slate-100/25">
                    <td className="px-4 py-3 font-medium text-slate-800">{p.name}</td>
                    <td className="px-4 py-3 text-slate-600">{p.unit}</td>
                    <td className="px-4 py-3 font-mono text-slate-700">{p.stockQty}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{fmt(p.purchasePrice)}</td>
                    <td className="px-4 py-3 font-mono text-slate-600">{fmt(p.salePrice)}</td>
                    <td className="px-4 py-3 font-mono text-sky-600">{fmt(p.stockQty * p.purchasePrice)}</td>
                    <td className="px-4 py-3 font-mono text-emerald-600">{fmt(p.stockQty * p.salePrice)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300">
                  <td colSpan={5} className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                  <td className="px-4 py-3 font-mono font-semibold text-sky-600">{fmt(products.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0))}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-emerald-600">{fmt(products.reduce((s, p) => s + p.stockQty * p.salePrice, 0))}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}

      {tab === 'customer balances' && (
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Customer Balances</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Customer</Th>
                  <Th>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {customerBalances.length === 0 ? <TrEmpty colSpan={3} message="No customer balances" /> :
                  customerBalances.map(c => (
                    <tr key={c.id as string} className="hover:bg-slate-100/25 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{c.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{c.name}</td>
                      <td className="px-4 py-3 font-mono text-sky-600">{fmt(c.balance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'vendor balances' && (
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Vendor Balances</p>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Code</Th>
                  <Th>Vendor</Th>
                  <Th>Balance</Th>
                </tr>
              </thead>
              <tbody>
                {vendorBalances.length === 0 ? <TrEmpty colSpan={3} message="No vendor balances" /> :
                  vendorBalances.map(v => (
                    <tr key={v.id as string} className="hover:bg-slate-100/25 transition-colors">
                      <td className="px-4 py-3 font-mono text-slate-600">{v.code}</td>
                      <td className="px-4 py-3 font-medium text-slate-800">{v.name}</td>
                      <td className="px-4 py-3 font-mono text-violet-600">{fmt(v.balance)}</td>
                    </tr>
                  ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}

      {tab === 'trial balance' && (
        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">Trial Balance</p>
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-xs font-medium ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
              {Math.abs(totalDebit - totalCredit) < 0.01 ? (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                  Balanced
                </>
              ) : (
                <>
                  <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                  Not Balanced (Difference: {fmt(Math.abs(totalDebit - totalCredit))})
                </>
              )}
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>
                  <Th>Account</Th>
                  <Th>Type</Th>
                  <Th>Debit</Th>
                  <Th>Credit</Th>
                </tr>
              </thead>
              <tbody>
                {trialBalance.length === 0 ? <TrEmpty colSpan={4} message="No trial balance data" /> :
                  trialBalance.map(t => (
                    <tr key={t.id as string} className="hover:bg-slate-100/25 transition-colors">
                      <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                      <td className="px-4 py-3 text-slate-600 capitalize">{t.type}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{t.debit > 0 ? fmt(t.debit) : '-'}</td>
                      <td className="px-4 py-3 font-mono text-slate-800">{t.credit > 0 ? fmt(t.credit) : '-'}</td>
                    </tr>
                  ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-slate-300">
                  <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                  <td className="px-4 py-3 font-mono font-semibold text-sky-600">{fmt(totalDebit)}</td>
                  <td className="px-4 py-3 font-mono font-semibold text-violet-600">{fmt(totalCredit)}</td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Card>
      )}
    </div>
  )
}
