import React, { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, Badge, Button, SearchBar, Modal, Input, Select, Textarea, StatCard, Tabs } from '@erp/ui'
import type { SaleInvoice, InvoiceLine, SaleType } from '@erp/domain'
import { makeId } from '@erp/domain'
import { getCustomerParties, resolveCustomerName } from '../../lib/parties'
import { findIncomeAccount, findGstOutputAccount } from '../../lib/accounting'
import { clsx } from 'clsx'

const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
const statusV = { draft: 'warning', posted: 'info', paid: 'success', cancelled: 'danger' } as const

const SALE_TABS = [
  { id: 'tax', label: 'Sale (Sales Tax)' },
  { id: 'non_tax', label: 'Sale (Non Tax)' },
]

const genNo = (invoices: SaleInvoice[], type: SaleType) => {
  const prefix = type === 'tax' ? 'SIT' : 'SIN'
  const same = invoices.filter(i => (i.saleType ?? 'tax') === type)
  const max = same.reduce((m, i) => Math.max(m, parseInt(i.invoiceNo.split('-').pop() ?? '0')), 0)
  return `${prefix}-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`
}

const calcTaxLine = (l: InvoiceLine): InvoiceLine => {
  const excl = l.qty * l.unitPrice * (1 - l.discountPct / 100)
  const tax = excl * (l.taxPct / 100)
  return { ...l, total: excl + tax }
}

const calcNonTaxLine = (l: InvoiceLine): InvoiceLine => {
  const gross = l.qty * l.unitPrice
  const disc = gross * (l.discountPct / 100)
  return { ...l, total: gross - disc }
}

const InvoiceForm: React.FC<{ saleType: SaleType; onClose: () => void; invoice?: SaleInvoice }> = ({ saleType, onClose, invoice }) => {
  const { accounts, customers, products, saleInvoices, addSaleInvoice, updateSaleInvoice, postSaleInvoice, settings } = useStore()
  const customerParties = useMemo(() => getCustomerParties(accounts, customers), [accounts, customers])
  const revenueAcc = findIncomeAccount(accounts)
  const defaultTax = settings.salesTaxRate + settings.gstRate
  const isTax = saleType === 'tax'

  const [customerId, setCustomerId] = useState(invoice?.customerId ?? '')
  const [date, setDate] = useState(invoice ? new Date(invoice.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [carriageFreight, setCarriageFreight] = useState(String(invoice?.carriageFreight ?? 0))
  const [additionalDiscount, setAdditionalDiscount] = useState(String(invoice?.additionalDiscount ?? 0))
  const [amountPaid, setAmountPaid] = useState(String(invoice?.amountPaid ?? 0))
  const [remarks, setRemarks] = useState(invoice?.remarks ?? '')
  const [lines, setLines] = useState<InvoiceLine[]>(invoice?.lines ?? [])

  const customer = customerParties.find(c => c.id === (customerId as any))
  const gstAcc = findGstOutputAccount(accounts)

  const addLine = () => setLines(ls => [...ls, isTax
    ? calcTaxLine({ id: makeId(Math.random().toString(36).slice(2)), productId: makeId(''), productName: '', productCode: '', qty: 1, unitPrice: 0, discountPct: 0, taxPct: defaultTax, total: 0 })
    : calcNonTaxLine({ id: makeId(Math.random().toString(36).slice(2)), productId: makeId(''), productName: '', productCode: '', qty: 1, unitPrice: 0, discountPct: 0, taxPct: 0, total: 0 }),
  ])

  const setLine = (idx: number, patch: Partial<InvoiceLine>) =>
    setLines(ls => ls.map((l, i) => {
      if (i !== idx) return l
      const m = { ...l, ...patch }
      if (patch.productId) {
        const p = products.find(p => p.id === patch.productId)
        if (p) { m.productName = p.name; m.productCode = p.code; m.unitPrice = p.salePrice }
      }
      return isTax ? calcTaxLine(m) : calcNonTaxLine(m)
    }))

  const subtotal = lines.reduce((s, l) => s + l.qty * l.unitPrice, 0)
  const discountTotal = lines.reduce((s, l) => s + l.qty * l.unitPrice * l.discountPct / 100, 0)
  const taxTotal = isTax
    ? lines.reduce((s, l) => {
        const excl = l.qty * l.unitPrice * (1 - l.discountPct / 100)
        return s + excl * (l.taxPct / 100)
      }, 0)
    : 0
  const lineNet = lines.reduce((s, l) => s + l.total, 0)
  const addDisc = parseFloat(additionalDiscount) || 0
  const freight = parseFloat(carriageFreight) || 0
  const paid = parseFloat(amountPaid) || 0
  const grandTotal = isTax
    ? subtotal - discountTotal + taxTotal + freight
    : lineNet - addDisc + freight
  const balance = grandTotal - paid

  const save = (status: 'draft' | 'posted') => {
    const payload: Omit<SaleInvoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNo: invoice?.invoiceNo ?? genNo(saleInvoices, saleType),
      saleType,
      date: new Date(date),
      customerId: customerId as any,
      customerName: customer?.name ?? '',
      lines,
      subtotal,
      discountTotal: isTax ? discountTotal : lines.reduce((s, l) => s + l.qty * l.unitPrice * l.discountPct / 100, 0),
      taxTotal,
      additionalDiscount: isTax ? undefined : addDisc,
      carriageFreight: freight || undefined,
      grandTotal,
      amountPaid: paid,
      balance,
      status: 'draft',
      remarks: remarks || undefined,
    }
    if (invoice) {
      updateSaleInvoice(invoice.id, payload)
      if (status === 'posted') postSaleInvoice(invoice.id)
    } else {
      const rec = addSaleInvoice(payload)
      if (status === 'posted') postSaleInvoice(rec.id)
    }
    onClose()
  }

  const postHint = isTax
    ? `DR Customer account, CR ${revenueAcc?.name ?? 'Sales Revenue'} (excl. tax), CR ${gstAcc?.name ?? 'GST Output'} — stock decreases.`
    : `DR Customer account, CR ${revenueAcc?.name ?? 'Sales Revenue'} — stock decreases.`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Customer" value={customerId as string} onChange={e => setCustomerId(e.target.value as any)}
          options={[{ value: '', label: customerParties.length ? 'Select customer…' : 'Add Customer account first' }, ...customerParties.map(c => ({ value: c.id as string, label: `${c.code} — ${c.name}` }))]} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      {customer && (
        <div className="bg-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 flex justify-between">
          <span>{customer.phone ?? '—'} · {customer.email ?? ''}</span>
          <span>Balance: <span className="font-mono text-slate-800">{fmt(customer.balance)}</span></span>
        </div>
      )}

      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">Line Items</p>
          <Button size="sm" variant="ghost" onClick={addLine}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Line
          </Button>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-x-auto">
          <table className="w-full text-xs min-w-[640px]">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-100/30">
                {isTax
                  ? ['Product', 'Qty', 'Rate', 'Disc%', 'Excl. Tax', 'GST%', 'GST Amt', 'Incl. Tax', ''].map(h => (
                    <th key={h} className="px-2 py-2 text-left text-slate-500 font-medium last:w-8">{h}</th>
                  ))
                  : ['Product', 'Qty', 'Rate', 'Disc%', 'Gross', 'Discount', 'Net', ''].map(h => (
                    <th key={h} className="px-2 py-2 text-left text-slate-500 font-medium last:w-8">{h}</th>
                  ))}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0
                ? <tr><td colSpan={isTax ? 9 : 8} className="px-3 py-6 text-center text-slate-600">No lines — click Add Line</td></tr>
                : lines.map((l, idx) => {
                    const excl = l.qty * l.unitPrice * (1 - l.discountPct / 100)
                    const gross = l.qty * l.unitPrice
                    const disc = gross * (l.discountPct / 100)
                    const gstAmt = excl * (l.taxPct / 100)
                    return (
                      <tr key={l.id} className="border-b border-slate-100 last:border-0">
                        <td className="px-2 py-1.5">
                          <select value={l.productId as string} onChange={e => setLine(idx, { productId: e.target.value as any })}
                            className="w-full min-w-[120px] bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800">
                            <option value="">Select…</option>
                            {products.map(p => <option key={p.id as string} value={p.id as string}>{p.code} — {p.name}</option>)}
                          </select>
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.qty} min={0} onChange={e => setLine(idx, { qty: +e.target.value })}
                            className="w-14 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.unitPrice} min={0} onChange={e => setLine(idx, { unitPrice: +e.target.value })}
                            className="w-20 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                        </td>
                        <td className="px-2 py-1.5">
                          <input type="number" value={l.discountPct} min={0} onChange={e => setLine(idx, { discountPct: +e.target.value })}
                            className="w-14 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                        </td>
                        {isTax ? (
                          <>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-600">{fmt(excl)}</td>
                            <td className="px-2 py-1.5">
                              <input type="number" value={l.taxPct} min={0} onChange={e => setLine(idx, { taxPct: +e.target.value })}
                                className="w-14 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                            </td>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-600">{fmt(gstAmt)}</td>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-800">{fmt(l.total)}</td>
                          </>
                        ) : (
                          <>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-600">{fmt(gross)}</td>
                            <td className="px-2 py-1.5 text-right font-mono text-red-600">-{fmt(disc)}</td>
                            <td className="px-2 py-1.5 text-right font-mono text-slate-800">{fmt(l.total)}</td>
                          </>
                        )}
                        <td className="px-2">
                          <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-600">
                            <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                          </button>
                        </td>
                      </tr>
                    )
                  })}
            </tbody>
          </table>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-100 rounded-lg p-4 space-y-2 text-xs">
          {isTax ? (
            <>
              <div className="flex justify-between text-slate-600"><span>Subtotal</span><span className="font-mono">{fmt(subtotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Discount</span><span className="font-mono text-red-600">-{fmt(discountTotal)}</span></div>
              <div className="flex justify-between text-slate-600"><span>GST Total</span><span className="font-mono">{fmt(taxTotal)}</span></div>
            </>
          ) : (
            <>
              <div className="flex justify-between text-slate-600"><span>Line Net Total</span><span className="font-mono">{fmt(lineNet)}</span></div>
              <div className="flex justify-between text-slate-600"><span>Additional Discount</span><span className="font-mono text-red-600">-{fmt(addDisc)}</span></div>
            </>
          )}
          <div className="flex justify-between text-slate-600"><span>Carriage & Freight</span><span className="font-mono">{fmt(freight)}</span></div>
          <div className="flex justify-between text-slate-900 font-semibold text-sm border-t border-slate-300 pt-2">
            <span>Net Total</span><span className="font-mono">{fmt(grandTotal)}</span>
          </div>
        </div>
        <div className="space-y-3">
          <Input label="Carriage & Freight (Rs)" type="number" value={carriageFreight} onChange={e => setCarriageFreight(e.target.value)} />
          {!isTax && <Input label="Additional Discount (Rs)" type="number" value={additionalDiscount} onChange={e => setAdditionalDiscount(e.target.value)} />}
          <Input label="Amount Paid (Rs)" type="number" value={amountPaid} onChange={e => setAmountPaid(e.target.value)} />
          <div className="bg-sky-50 border border-sky-200 rounded-lg px-3 py-2 text-xs">
            <span className="text-slate-600">Balance: </span>
            <span className="font-mono font-semibold text-sky-800">{fmt(balance)}</span>
          </div>
        </div>
      </div>

      <Textarea label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <strong>On Post:</strong> {postHint}
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="secondary" onClick={() => save('draft')}>Save Draft</Button>
        <Button variant="primary" onClick={() => save('posted')}>Post</Button>
      </div>
    </div>
  )
}

export const SalesModule: React.FC = () => {
  const { accounts, customers, saleInvoices, postSaleInvoice, cancelSaleInvoice } = useStore()
  const [tab, setTab] = useState<SaleType>('tax')
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<SaleInvoice | undefined>()

  const tabInvoices = useMemo(() =>
    saleInvoices.filter(i => (i.saleType ?? 'tax') === tab),
    [saleInvoices, tab],
  )

  const filtered = useMemo(() =>
    tabInvoices.filter(i =>
      (i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.customerName.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === 'all' || i.status === statusF)
    ), [tabInvoices, search, statusF])

  const totalSales = tabInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.grandTotal, 0)
  const outstanding = tabInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.balance, 0)

  const openNew = () => { setEditInvoice(undefined); setShowForm(true) }
  const openEdit = (inv: SaleInvoice) => { setEditInvoice(inv); setShowForm(true) }

  const formType = editInvoice?.saleType ?? tab

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Invoices" value={String(tabInvoices.filter(i => i.status !== 'cancelled').length)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>} />
        <StatCard label="Total Sales" value={fmtC(totalSales)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard label="Outstanding Receivables" value={fmtC(outstanding)} accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} />
      </div>

      <Card>
        <Tabs tabs={SALE_TABS} active={tab} onChange={id => setTab(id as SaleType)} />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search invoice # or customer…" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)} className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none">
              {['all', 'draft', 'posted', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <Button variant="primary" onClick={openNew}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New {tab === 'tax' ? 'Sale (Tax)' : 'Sale (Non Tax)'}
          </Button>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Invoice No.</Th><Th>Date</Th><Th>Customer</Th><Th>Type</Th><Th>Net Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <TrEmpty colSpan={9} message={`No ${tab === 'tax' ? 'sales tax' : 'non tax'} sales yet`} />
              : filtered.map(inv => (
                <tr key={inv.id as string} className="hover:bg-slate-100/25 transition-colors">
                  <Td><span className="font-mono text-sky-600 text-xs">{inv.invoiceNo}</span></Td>
                  <Td>{fmtD(inv.date)}</Td>
                  <Td><span className="font-medium text-slate-800">{resolveCustomerName(inv.customerId, accounts, customers, inv.customerName)}</span></Td>
                  <Td><Badge variant={(inv.saleType ?? 'tax') === 'tax' ? 'info' : 'default'}>{(inv.saleType ?? 'tax') === 'tax' ? 'Sales Tax' : 'Non Tax'}</Badge></Td>
                  <Td><span className="font-mono">{fmt(inv.grandTotal)}</span></Td>
                  <Td><span className="font-mono text-emerald-600">{fmt(inv.amountPaid)}</span></Td>
                  <Td><span className={clsx('font-mono', inv.balance > 0 ? 'text-amber-600' : 'text-slate-600')}>{fmt(inv.balance)}</span></Td>
                  <Td><Badge variant={statusV[inv.status]}>{inv.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      {inv.status === 'draft' && <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}>Edit</Button>
                        <Button size="sm" variant="success" onClick={() => postSaleInvoice(inv.id)}>Post</Button>
                      </>}
                      {inv.status === 'posted' && <Button size="sm" variant="danger" onClick={() => cancelSaleInvoice(inv.id)}>Cancel</Button>}
                    </div>
                  </Td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card>

      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editInvoice ? `Edit — ${editInvoice.invoiceNo}` : formType === 'tax' ? 'Sale (Sales Tax)' : 'Sale (Non Tax)'}
        size="xl"
      >
        <InvoiceForm saleType={formType} onClose={() => setShowForm(false)} invoice={editInvoice} />
      </Modal>
    </div>
  )
}
