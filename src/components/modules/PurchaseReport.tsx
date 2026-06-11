import React, { useMemo, useState } from 'react'
import { Card, Table, Th, Td, TrEmpty, StatCard, SearchBar, Select } from '@erp/ui'
import { Bar, BarChart, CartesianGrid, Cell, Pie, PieChart, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { getVendorParties } from '../../lib/parties'
import { useStore } from '../../store'

const fmt = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmtD = (d: Date) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })

const PIE_COLORS = ['#38bdf8','#a78bfa','#34d399','#fb923c','#f472b6']
const Tip = ({ active, payload, label }: any) => !active || !payload?.length ? null : (
  <div className="bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs shadow-xl">
    <p className="text-slate-600 mb-1">{label}</p>
    {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtC(p.value)}</p>)}
  </div>
)

export const PurchaseReportModule: React.FC = () => {
  const { purchaseInvoices, vendors, accounts } = useStore()
  const [search, setSearch] = useState('')
  const [statusFilter, setStatusFilter] = useState<'all' | 'draft' | 'posted' | 'paid' | 'cancelled'>('all')
  const vendorParties = useMemo(() => getVendorParties(accounts, vendors), [accounts, vendors])

  const filteredInvoices = useMemo(() => {
    return purchaseInvoices.filter(inv => {
      const matchesSearch = 
        inv.invoiceNo.toLowerCase().includes(search.toLowerCase()) ||
        inv.vendorName.toLowerCase().includes(search.toLowerCase())
      const matchesStatus = statusFilter === 'all' || inv.status === statusFilter
      return matchesSearch && matchesStatus
    })
  }, [purchaseInvoices, search, statusFilter])

  const totalPurchases = filteredInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.grandTotal, 0)
  const totalTax = filteredInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.taxTotal, 0)
  const totalDiscount = filteredInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.discountTotal, 0)
  const outstanding = filteredInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.balance, 0)

  const purchasesByVendor = useMemo(() => {
    const map = new Map<string, number>()
    filteredInvoices.forEach(inv => {
      if (inv.status !== 'cancelled') {
        const current = map.get(inv.vendorName) || 0
        map.set(inv.vendorName, current + inv.grandTotal)
      }
    })
    return Array.from(map.entries()).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value).slice(0, 5)
  }, [filteredInvoices])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Purchases" value={fmtC(totalPurchases)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/></svg>} />
        <StatCard label="Total Tax" value={fmtC(totalTax)} accent="text-violet-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-3.01L12 2z"/></svg>} />
        <StatCard label="Total Discount" value={fmtC(totalDiscount)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <StatCard label="Outstanding" value={fmtC(outstanding)} accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01"/></svg>} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-4">Top Vendors by Purchase Amount</p>
          <ResponsiveContainer width="100%" height={210}>
            <BarChart data={purchasesByVendor} layout="vertical" margin={{ left: 10, right: 20 }}>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis type="number" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtC} />
              <YAxis type="category" dataKey="name" tick={{ fill: '#94a3b8', fontSize: 11 }} tickLine={false} axisLine={false} width={65} />
              <Tooltip content={<Tip />} />
              <Bar dataKey="value" name="Purchases" fill="#38bdf8" radius={[0, 3, 3, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </Card>
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-4">Purchase Type Distribution</p>
          <ResponsiveContainer width="100%" height={210}>
            <PieChart>
              <Pie 
                data={[
                  { name: 'Tax', value: filteredInvoices.filter(i => i.purchaseType === 'tax' && i.status !== 'cancelled').length },
                  { name: 'Non-Tax', value: filteredInvoices.filter(i => i.purchaseType === 'non_tax' && i.status !== 'cancelled').length }
                ].filter(d => d.value > 0)} 
                cx="50%" cy="50%" outerRadius={75} dataKey="value" 
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} 
                labelLine={false} fontSize={10}
              >
                {[{ name: 'Tax', value: 0 }, { name: 'Non-Tax', value: 0 }].map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </Card>
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search purchase invoices…" />
            <Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value as any)} options={[
              { value: 'all', label: 'All Status' },
              { value: 'draft', label: 'Draft' },
              { value: 'posted', label: 'Posted' },
              { value: 'paid', label: 'Paid' },
              { value: 'cancelled', label: 'Cancelled' }
            ]} />
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Invoice No</Th>
              <Th>Date</Th>
              <Th>Vendor</Th>
              <Th>Type</Th>
              <Th>Subtotal</Th>
              <Th>Discount</Th>
              <Th>Tax</Th>
              <Th>Grand Total</Th>
              <Th>Paid</Th>
              <Th>Balance</Th>
              <Th>Status</Th>
            </tr>
          </thead>
          <tbody>
            {filteredInvoices.length === 0 ? (
              <TrEmpty colSpan={11} message="No purchase invoices found" />
            ) : (
              filteredInvoices.map(inv => (
              <tr key={inv.id as string} className="hover:bg-slate-100/25">
                <Td><span className="font-mono text-sky-600 text-xs">{inv.invoiceNo}</span></Td>
                <Td>{fmtD(inv.date)}</Td>
                <Td><span className="font-medium text-slate-800">{inv.vendorName}</span></Td>
                <Td><span className="text-xs uppercase font-medium">{inv.purchaseType === 'tax' ? 'Tax' : 'Non-Tax'}</span></Td>
                <Td><span className="font-mono">{fmt(inv.subtotal)}</span></Td>
                <Td><span className="font-mono text-red-600">{fmt(inv.discountTotal)}</span></Td>
                <Td><span className="font-mono">{fmt(inv.taxTotal)}</span></Td>
                <Td><span className="font-mono font-medium">{fmt(inv.grandTotal)}</span></Td>
                <Td><span className="font-mono text-emerald-600">{fmt(inv.amountPaid)}</span></Td>
                <Td><span className="font-mono text-amber-600">{fmt(inv.balance)}</span></Td>
                <Td><span className="text-xs font-medium uppercase">{inv.status}</span></Td>
              </tr>
            ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
