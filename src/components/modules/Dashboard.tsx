import { Alert, Badge, Card, StatCard, Textarea } from '@erp/ui'
import { clsx } from 'clsx'
import React from 'react'
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from 'recharts'
import { computeDashboardStats } from '../../lib/dashboard'
import { selectDraftSales, selectLowStock, useStore } from '../../store'

const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { month: 'short', day: 'numeric' })

const ChartTip = ({ active, payload, label }: any) => {
  if (!active || !payload?.length) return null
  return (
    <div className="bg-white border border-slate-200 rounded-lg px-3 py-2 text-xs shadow-lg">
      <p className="text-slate-500 mb-1">{label}</p>
      {payload.map((p: any) => <p key={p.name} style={{ color: p.color }}>{p.name}: {fmtC(p.value)}</p>)}
    </div>
  )
}

const TxRow = ({ type, description, amount, date, status }: { type: string; description: string; amount: number; date: Date; status: string }) => {
  const isCredit = type === 'sale' || type === 'receipt'
  const bgColor  = isCredit ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'
  return (
    <div className="flex items-center gap-3 py-2 border-b border-slate-100 last:border-0">
      <span className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0', bgColor)}>
        <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24">
          <path d={isCredit ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'} />
        </svg>
      </span>
      <div className="flex-1 min-w-0">
        <p className="text-xs text-slate-700 truncate">{description}</p>
        <p className="text-[11px] text-slate-600">{fmtD(date)}</p>
      </div>
      <div className="text-right flex-shrink-0">
        <p className={clsx('text-xs font-mono font-medium', isCredit ? 'text-emerald-600' : 'text-red-600')}>
          {isCredit ? '+' : '-'}{fmtC(amount)}
        </p>
        <Badge variant={status === 'paid' || status === 'posted' ? 'success' : 'warning'}>{status}</Badge>
      </div>
    </div>
  )
}

export const DashboardModule: React.FC = () => {
  const state = useStore()
  const lowStock = useStore(selectLowStock)
  const drafts   = useStore(selectDraftSales)
  const s = computeDashboardStats(state)
  const notes = useStore((s) => s.notes)
  const updateNotes = useStore((s) => s.updateNotes)

  return (
    <div className="space-y-5">
      {(lowStock.length > 0 || drafts.length > 0) && (
        <Alert variant="warning">
          {lowStock.length > 0 && <span>{lowStock.length} products below reorder level. </span>}
          {drafts.length  > 0 && <span>{drafts.length} draft invoice{drafts.length > 1 ? 's' : ''} pending posting.</span>}
        </Alert>
      )}

      {/* KPI row 1 */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Today's Sales"     value={fmtC(s.todaySales)}     subtext={fmt(s.todaySales)}
          accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
        <StatCard label="Today's Purchases" value={fmtC(s.todayPurchases)} subtext={fmt(s.todayPurchases)}
          accent="text-violet-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>} />
        <StatCard label="Cash Balance"      value={fmtC(s.cashBalance)}    subtext={fmt(s.cashBalance)}
          accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>} />
        <StatCard label="Bank Balance"      value={fmtC(s.bankBalance)}    subtext={fmt(s.bankBalance)}
          accent="text-blue-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} />
      </div>

      {/* KPI row 2 */}
      <div className="grid grid-cols-2 gap-4">
        <StatCard label="Receivables" value={fmtC(s.receivables)} subtext="Outstanding from customers"
          accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>} />
        <StatCard label="Payables" value={fmtC(s.payables)} subtext="Outstanding to vendors"
          accent="text-red-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87M16 3.13a4 4 0 0 1 0 7.75"/></svg>} />
      </div>

      {/* Charts + recent */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="col-span-2 p-5">
          <p className="text-sm font-medium text-slate-700 mb-4">Sales vs Purchases — Last 10 Days</p>
          <ResponsiveContainer width="100%" height={190}>
            <AreaChart data={s.salesTrend} margin={{ top: 0, right: 0, left: -14, bottom: 0 }}>
              <defs>
                <linearGradient id="gS" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#38bdf8" stopOpacity={.15}/><stop offset="95%" stopColor="#38bdf8" stopOpacity={0}/></linearGradient>
                <linearGradient id="gP" x1="0" y1="0" x2="0" y2="1"><stop offset="5%" stopColor="#a78bfa" stopOpacity={.15}/><stop offset="95%" stopColor="#a78bfa" stopOpacity={0}/></linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
              <XAxis dataKey="date" tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} />
              <YAxis tick={{ fill: '#94a3b8', fontSize: 10 }} tickLine={false} axisLine={false} tickFormatter={fmtC} />
              <Tooltip content={<ChartTip />} />
              <Area type="monotone" dataKey="sales"     name="Sales"     stroke="#38bdf8" strokeWidth={2} fill="url(#gS)" />
              <Area type="monotone" dataKey="purchases" name="Purchases" stroke="#a78bfa" strokeWidth={2} fill="url(#gP)" />
            </AreaChart>
          </ResponsiveContainer>
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-4">Top Products</p>
          {s.topProducts.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No sales data yet</p>
          ) : (
            <div className="space-y-3">
              {s.topProducts.map((p, i) => {
                const max = s.topProducts[0]?.revenue || 1
                return (
                  <div key={i}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-[11px] text-slate-600 truncate flex-1 mr-2">{p.name}</span>
                      <span className="text-[11px] text-slate-500 font-mono flex-shrink-0">{fmtC(p.revenue)}</span>
                    </div>
                    <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                      <div className="h-full bg-sky-500/50 rounded-full" style={{ width: `${(p.revenue / max) * 100}%` }} />
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </Card>
      </div>

      {/* Recent + low stock + notes */}
      <div className="grid grid-cols-3 gap-4">
        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">Recent Transactions</p>
          {s.recentTransactions.length === 0 ? (
            <p className="text-xs text-slate-500 text-center py-8">No transactions yet</p>
          ) : (
            s.recentTransactions.slice(0, 7).map(tx => (
              <TxRow key={tx.id} {...tx} />
            ))
          )}
        </Card>

        <Card className="p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-medium text-slate-700">Low Stock Alerts</p>
            <Badge variant="warning">{lowStock.length} items</Badge>
          </div>
          {lowStock.length === 0 ? (
            <p className="text-xs text-slate-600 text-center py-8">All items adequately stocked</p>
          ) : (
            <div className="space-y-0">
              {lowStock.map(p => (
                <div key={p.id} className="flex items-center justify-between py-2.5 border-b border-slate-100 last:border-0">
                  <div>
                    <p className="text-xs font-medium text-slate-700">{p.name}</p>
                    <p className="text-[11px] text-slate-600">{p.code} · {p.unit}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs font-mono text-red-600 font-medium">{p.stockQty} left</p>
                    <p className="text-[11px] text-slate-600">min {p.reorderLevel}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        <Card className="p-5">
          <p className="text-sm font-medium text-slate-700 mb-3">My Notes</p>
          <Textarea
            value={notes}
            onChange={(e) => updateNotes(e.target.value)}
            placeholder="Add your notes here..."
            className="min-h-[200px]"
          />
        </Card>
      </div>
    </div>
  )
}
