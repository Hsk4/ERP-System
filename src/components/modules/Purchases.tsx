import React, { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, Badge, Button, SearchBar, Modal, Input, Select, Textarea, StatCard, Tabs } from '@erp/ui'
import type { PurchaseInvoice, PurchaseType, InvoiceLine } from '@erp/domain'
import { makeId } from '@erp/domain'
import { getVendorParties, resolveVendorName } from '../../lib/parties'
import { findExpenseAccount, findGstInputAccount } from '../../lib/accounting'
import { clsx } from 'clsx'

const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
const statusV = { draft: 'warning', posted: 'info', paid: 'success', cancelled: 'danger' } as const

const PURCHASE_TABS = [
  { id: 'tax', label: 'Purchase (Sales Tax)' },
  { id: 'non_tax', label: 'Purchase (Non Tax)' },
]

const genNo = (invoices: PurchaseInvoice[], type: PurchaseType) => {
  const prefix = type === 'tax' ? 'PIT' : 'PIN'
  const same = invoices.filter(i => (i.purchaseType ?? 'tax') === type)
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

const PurchaseForm: React.FC<{ purchaseType: PurchaseType; onClose: () => void; invoice?: PurchaseInvoice }> = ({ purchaseType, onClose, invoice }) => {
  const { accounts, vendors, products, purchaseInvoices, addPurchaseInvoice, updatePurchaseInvoice, postPurchaseInvoice, settings } = useStore()
  const vendorParties = useMemo(() => getVendorParties(accounts, vendors), [accounts, vendors])
  const expenseAccounts = useMemo(() => accounts.filter(a => a.isActive && a.type === 'expense'), [accounts])
  const defaultExpense = invoice?.expenseAccountId ?? findExpenseAccount(accounts)?.id ?? ''
  const defaultTax = settings.salesTaxRate + settings.gstRate
  const isTax = purchaseType === 'tax'

  const [vendorId, setVendorId] = useState(invoice?.vendorId ?? '')
  const [date, setDate] = useState(invoice ? new Date(invoice.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [vendorInvoiceNo, setVendorInvoiceNo] = useState(invoice?.vendorInvoiceNo ?? '')
  const [vendorInvoiceDate, setVendorInvoiceDate] = useState(invoice?.vendorInvoiceDate ? new Date(invoice.vendorInvoiceDate).toISOString().slice(0, 10) : '')
  const [purchaseOrderNo, setPurchaseOrderNo] = useState(invoice?.purchaseOrderNo ?? '')
  const [purchaseOrderDate, setPurchaseOrderDate] = useState(invoice?.purchaseOrderDate ? new Date(invoice.purchaseOrderDate).toISOString().slice(0, 10) : '')
  const [termsOfPayment, setTermsOfPayment] = useState(invoice?.termsOfPayment ?? 'credit')
  const [expenseAccountId, setExpenseAccountId] = useState(defaultExpense as string)
  const [remarks, setRemarks] = useState(invoice?.remarks ?? '')
  const [carriageFreight, setCarriageFreight] = useState(String(invoice?.carriageFreight ?? 0))
  const [additionalDiscount, setAdditionalDiscount] = useState(String(invoice?.additionalDiscount ?? 0))
  const [amountPaid, setAmountPaid] = useState(String(invoice?.amountPaid ?? 0))
  const [lines, setLines] = useState<InvoiceLine[]>(invoice?.lines ?? [])

  const vendor = vendorParties.find(v => v.id === (vendorId as any))
  const expenseAcc = accounts.find(a => a.id === (expenseAccountId as any))
  const gstAcc = findGstInputAccount(accounts)

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
        if (p) { m.productName = p.name; m.productCode = p.code; m.unitPrice = p.purchasePrice }
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
    const payload: Omit<PurchaseInvoice, 'id' | 'createdAt' | 'updatedAt'> = {
      invoiceNo: invoice?.invoiceNo ?? genNo(purchaseInvoices, purchaseType),
      purchaseType,
      date: new Date(date),
      vendorId: vendorId as any,
      vendorName: vendor?.name ?? '',
      vendorInvoiceNo: vendorInvoiceNo || undefined,
      vendorInvoiceDate: vendorInvoiceDate ? new Date(vendorInvoiceDate) : undefined,
      purchaseOrderNo: purchaseOrderNo || undefined,
      purchaseOrderDate: purchaseOrderDate ? new Date(purchaseOrderDate) : undefined,
      termsOfPayment: termsOfPayment || undefined,
      expenseAccountId: expenseAccountId ? expenseAccountId as any : undefined,
      expenseAccountName: expenseAcc?.name,
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
      updatePurchaseInvoice(invoice.id, payload)
      if (status === 'posted') postPurchaseInvoice(invoice.id)
    } else {
      const rec = addPurchaseInvoice(payload)
      if (status === 'posted') postPurchaseInvoice(rec.id)
    }
    onClose()
  }

  const postHint = isTax
    ? `DR ${expenseAcc?.name ?? 'Purchases'} (excl. tax), DR ${gstAcc?.name ?? 'GST Input'}, CR Vendor — incl. tax total.`
    : `DR ${expenseAcc?.name ?? 'Purchases'}, CR Vendor — no tax. Stock increases on Post.`

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Vendor" value={vendorId as string} onChange={e => setVendorId(e.target.value as any)}
          options={[{ value: '', label: vendorParties.length ? 'Select vendor…' : 'Add Vendor account first' }, ...vendorParties.map(v => ({ value: v.id as string, label: `${v.code} — ${v.name}` }))]} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      {vendor && (
        <div className="bg-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600 flex justify-between">
          <span>{vendor.phone ?? '—'} · {vendor.email ?? ''}</span>
          <span>Balance: <span className="font-mono text-slate-800">{fmt(vendor.balance)}</span></span>
        </div>
      )}
      <div className="grid grid-cols-2 gap-4">
        <Input label="Vendor Invoice No." value={vendorInvoiceNo} onChange={e => setVendorInvoiceNo(e.target.value)} placeholder="Supplier bill #" />
        <Input label="Vendor Invoice Date" type="date" value={vendorInvoiceDate} onChange={e => setVendorInvoiceDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Purchase Order No." value={purchaseOrderNo} onChange={e => setPurchaseOrderNo(e.target.value)} />
        <Input label="PO Date" type="date" value={purchaseOrderDate} onChange={e => setPurchaseOrderDate(e.target.value)} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Terms of Payment" value={termsOfPayment} onChange={e => setTermsOfPayment(e.target.value)} placeholder="e.g. credit, cash" />
        <Select label="Expense Account" value={expenseAccountId as string} onChange={e => setExpenseAccountId(e.target.value)}
          options={[{ value: '', label: 'Select expense account…' }, ...expenseAccounts.map(a => ({ value: a.id as string, label: `${a.code} — ${a.name}` }))]} />
      </div>

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

export const PurchasesModule: React.FC = () => {
  const { accounts, vendors, purchaseInvoices, postPurchaseInvoice, cancelPurchaseInvoice } = useStore()
  const [tab, setTab] = useState<PurchaseType>('tax')
  const [search, setSearch] = useState('')
  const [statusF, setStatusF] = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [editInvoice, setEditInvoice] = useState<PurchaseInvoice | undefined>()

  const tabInvoices = useMemo(() =>
    purchaseInvoices.filter(i => (i.purchaseType ?? 'tax') === tab),
    [purchaseInvoices, tab],
  )

  const filtered = useMemo(() =>
    tabInvoices.filter(i =>
      (i.invoiceNo.toLowerCase().includes(search.toLowerCase()) || i.vendorName.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === 'all' || i.status === statusF)
    ), [tabInvoices, search, statusF])

  const totalPurchases = tabInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.grandTotal, 0)
  const outstanding = tabInvoices.filter(i => i.status !== 'cancelled').reduce((s, i) => s + i.balance, 0)

  const openNew = () => { setEditInvoice(undefined); setShowForm(true) }
  const openEdit = (inv: PurchaseInvoice) => { setEditInvoice(inv); setShowForm(true) }

  const formType = editInvoice?.purchaseType ?? tab

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Invoices" value={String(tabInvoices.filter(i => i.status !== 'cancelled').length)} accent="text-violet-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z"/></svg>} />
        <StatCard label="Total Purchases" value={fmtC(totalPurchases)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard label="Outstanding Payables" value={fmtC(outstanding)} accent="text-red-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} />
      </div>

      <Card>
        <Tabs tabs={PURCHASE_TABS} active={tab} onChange={id => setTab(id as PurchaseType)} />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search serial # or vendor…" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)} className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none">
              {['all', 'draft', 'posted', 'paid', 'cancelled'].map(s => <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>)}
            </select>
          </div>
          <Button variant="primary" onClick={openNew}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New {tab === 'tax' ? 'Purchase (Tax)' : 'Purchase (Non Tax)'}
          </Button>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Serial No.</Th><Th>Date</Th><Th>Vendor</Th><Th>Type</Th><Th>Net Total</Th><Th>Paid</Th><Th>Balance</Th><Th>Status</Th><Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0
              ? <TrEmpty colSpan={9} message={`No ${tab === 'tax' ? 'sales tax' : 'non tax'} purchases yet`} />
              : filtered.map(inv => (
                <tr key={inv.id as string} className="hover:bg-slate-100/25 transition-colors">
                  <Td><span className="font-mono text-violet-600 text-xs">{inv.invoiceNo}</span></Td>
                  <Td>{fmtD(inv.date)}</Td>
                  <Td><span className="font-medium text-slate-800">{resolveVendorName(inv.vendorId, accounts, vendors, inv.vendorName)}</span></Td>
                  <Td><Badge variant={(inv.purchaseType ?? 'tax') === 'tax' ? 'info' : 'default'}>{(inv.purchaseType ?? 'tax') === 'tax' ? 'Sales Tax' : 'Non Tax'}</Badge></Td>
                  <Td><span className="font-mono">{fmt(inv.grandTotal)}</span></Td>
                  <Td><span className="font-mono text-emerald-600">{fmt(inv.amountPaid)}</span></Td>
                  <Td><span className={clsx('font-mono', inv.balance > 0 ? 'text-amber-600' : 'text-slate-600')}>{fmt(inv.balance)}</span></Td>
                  <Td><Badge variant={statusV[inv.status]}>{inv.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      {inv.status === 'draft' && <>
                        <Button size="sm" variant="ghost" onClick={() => openEdit(inv)}>Edit</Button>
                        <Button size="sm" variant="success" onClick={() => postPurchaseInvoice(inv.id)}>Post</Button>
                      </>}
                      {inv.status === 'posted' && <Button size="sm" variant="danger" onClick={() => cancelPurchaseInvoice(inv.id)}>Cancel</Button>}
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
        title={editInvoice ? `Edit — ${editInvoice.invoiceNo}` : formType === 'tax' ? 'Purchase (Sales Tax)' : 'Purchase (Non Tax)'}
        size="xl"
      >
        <PurchaseForm purchaseType={formType} onClose={() => setShowForm(false)} invoice={editInvoice} />
      </Modal>
    </div>
  )
}
