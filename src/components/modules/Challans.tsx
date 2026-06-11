import React, { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, Badge, Button, SearchBar, Modal, Input, Select, StatCard } from '@erp/ui'
import type { DeliveryChallan, ChallanStatus, InvoiceLine } from '@erp/domain'
import { makeId } from '@erp/domain'
import { getCustomerParties, resolveCustomerName } from '../../lib/parties'

const fmtD = (d: Date) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
const statusV: Record<ChallanStatus, 'warning'|'success'|'danger'> = { pending:'warning', delivered:'success', cancelled:'danger' }

const ChallanForm: React.FC<{ onClose: () => void }> = ({ onClose }) => {
  const { accounts, customers, products, saleInvoices, challans, addChallan } = useStore()
  const customerParties = useMemo(() => getCustomerParties(accounts, customers), [accounts, customers])
  const [customerId, setCustomerId] = useState('')
  const [invoiceId,  setInvoiceId]  = useState('')
  const [date,       setDate]       = useState(new Date().toISOString().slice(0, 10))
  const [lines,      setLines]      = useState<InvoiceLine[]>([])

  const customerInvoices = saleInvoices.filter(i => i.customerId === (customerId as any) && i.status === 'posted')
  const max = challans.reduce((m, c) => Math.max(m, parseInt(c.challanNo.split('-').pop() ?? '0')), 0)
  const challanNo = `DC-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`

  const loadInvoice = (id: string) => {
    setInvoiceId(id)
    const inv = saleInvoices.find(i => i.id === (id as any))
    if (inv) setLines(inv.lines)
  }

  const addLine = () => setLines(ls => [...ls, { id: makeId(Math.random().toString(36).slice(2)), productId: makeId(''), productName: '', productCode: '', qty: 1, unitPrice: 0, discountPct: 0, taxPct: 0, total: 0 }])

  const setLine = (idx: number, patch: Partial<InvoiceLine>) =>
    setLines(ls => ls.map((l, i) => {
      if (i !== idx) return l
      const m = { ...l, ...patch }
      if (patch.productId) { const p = products.find(p => p.id === patch.productId); if (p) { m.productName = p.name; m.productCode = p.code } }
      return m
    }))

  const save = () => {
    const customer = customerParties.find(c => c.id === (customerId as any))
    const inv = saleInvoices.find(i => i.id === (invoiceId as any))
    addChallan({ challanNo, date: new Date(date), customerId: customerId as any, customerName: customer?.name ?? '', invoiceId: invoiceId ? invoiceId as any : undefined, invoiceNo: inv?.invoiceNo ?? '', lines, status: 'pending' })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-slate-100 rounded-lg px-3 py-2.5 text-xs text-slate-600 flex items-center">
          Challan No: <span className="text-slate-800 font-mono ml-1">{challanNo}</span>
        </div>
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <Select label="Customer" value={customerId} onChange={e => { setCustomerId(e.target.value); setInvoiceId(''); setLines([]) }}
        options={[{ value: '', label: customerParties.length ? 'Select customer…' : 'Add a Customer account first' }, ...customerParties.map(c => ({ value: c.id as string, label: `${c.code} — ${c.name}` }))]} />
      {customerId && (
        <Select label="Link to Invoice (optional)" value={invoiceId} onChange={e => loadInvoice(e.target.value)}
          options={[{ value: '', label: 'No invoice linked' }, ...customerInvoices.map(i => ({ value: i.id as string, label: i.invoiceNo }))]} />
      )}
      <div>
        <div className="flex items-center justify-between mb-2">
          <p className="text-[11px] font-medium text-slate-600 uppercase tracking-wide">Items</p>
          <Button size="sm" variant="ghost" onClick={addLine}>
            <svg width="12" height="12" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add
          </Button>
        </div>
        <div className="border border-slate-200 rounded-lg overflow-hidden">
          <table className="w-full text-xs">
            <thead><tr className="border-b border-slate-200 bg-slate-100/30">
              <th className="px-3 py-2 text-left text-slate-500 font-medium">Product</th>
              <th className="px-3 py-2 text-right text-slate-500 font-medium w-20">Qty</th>
              <th className="w-8" />
            </tr></thead>
            <tbody>
              {lines.length === 0
                ? <tr><td colSpan={3} className="px-3 py-5 text-center text-slate-600">No items — link an invoice or add manually</td></tr>
                : lines.map((l, idx) => (
                  <tr key={l.id} className="border-b border-slate-100 last:border-0">
                    <td className="px-2 py-1.5">
                      {l.productName
                        ? <span className="text-slate-700">{l.productName}</span>
                        : <select value={l.productId as string} onChange={e => setLine(idx, { productId: e.target.value as any })}
                            className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 focus:outline-none">
                            <option value="">Select…</option>
                            {products.map(p => <option key={p.id as string} value={p.id as string}>{p.name}</option>)}
                          </select>
                      }
                    </td>
                    <td className="px-2 py-1.5">
                      <input type="number" value={l.qty} min={1} onChange={e => setLine(idx, { qty: +e.target.value })}
                        className="w-full bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800 text-right focus:outline-none" />
                    </td>
                    <td className="px-2 py-1.5">
                      <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))} className="text-slate-600 hover:text-red-600 transition-colors">
                        <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                      </button>
                    </td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost"   onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>Create Challan</Button>
      </div>
    </div>
  )
}

export const ChallansModule: React.FC = () => {
  const { accounts, customers, challans, markChallanDelivered, cancelChallan } = useStore()
  const [search,      setSearch]      = useState('')
  const [statusF,     setStatusF]     = useState('all')
  const [showForm,    setShowForm]    = useState(false)

  const filtered = useMemo(() =>
    challans.filter(c =>
      (c.challanNo.toLowerCase().includes(search.toLowerCase()) || c.customerName.toLowerCase().includes(search.toLowerCase())) &&
      (statusF === 'all' || c.status === statusF)
    ), [challans, search, statusF])

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Total Challans" value={String(challans.length)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/></svg>} />
        <StatCard label="Pending"   value={String(challans.filter(c => c.status === 'pending').length)}   accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4l3 3"/></svg>} />
        <StatCard label="Delivered" value={String(challans.filter(c => c.status === 'delivered').length)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 11.08V12a10 10 0 1 1-5.93-9.14"/><polyline points="22 4 12 14.01 9 11.01"/></svg>} />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search challans…" />
            <select value={statusF} onChange={e => setStatusF(e.target.value)}
              className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none">
              {['all','pending','delivered','cancelled'].map(s => (
                <option key={s} value={s}>{s === 'all' ? 'All Status' : s.charAt(0).toUpperCase() + s.slice(1)}</option>
              ))}
            </select>
          </div>
          <Button variant="primary" onClick={() => setShowForm(true)}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New Challan
          </Button>
        </div>
        <Table>
          <thead><tr><Th>Challan No.</Th><Th>Date</Th><Th>Customer</Th><Th>Invoice Ref</Th><Th>Items</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <TrEmpty colSpan={7} />
              : filtered.map(c => (
                <tr key={c.id as string} className="hover:bg-slate-100/25 transition-colors">
                  <Td><span className="font-mono text-xs text-slate-700">{c.challanNo}</span></Td>
                  <Td>{fmtD(c.date)}</Td>
                  <Td><span className="font-medium text-slate-800">{resolveCustomerName(c.customerId, accounts, customers, c.customerName)}</span></Td>
                  <Td><span className="font-mono text-xs text-sky-600">{c.invoiceNo ?? '—'}</span></Td>
                  <Td><span className="text-slate-600">{c.lines.length} item{c.lines.length !== 1 ? 's' : ''}</span></Td>
                  <Td><Badge variant={statusV[c.status]}>{c.status}</Badge></Td>
                  <Td>
                    <div className="flex gap-1">
                      {c.status === 'pending' && <>
                        <Button size="sm" variant="success" onClick={() => markChallanDelivered(c.id)}>Mark Delivered</Button>
                        <Button size="sm" variant="danger"  onClick={() => cancelChallan(c.id)}>Cancel</Button>
                      </>}
                    </div>
                  </Td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Delivery Challan" size="lg">
        <ChallanForm onClose={() => setShowForm(false)} />
      </Modal>
    </div>
  )
}
