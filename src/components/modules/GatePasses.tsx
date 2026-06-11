import type { GatePass, GatePassType, InvoiceLine } from '@erp/domain'
import { makeId } from '@erp/domain'
import { Button, Card, Input, Modal, SearchBar, Select, Table, Tabs, Td, Textarea, Th, TrEmpty } from '@erp/ui'
import React, { useMemo, useState } from 'react'
import { getCustomerParties, getVendorParties } from '../../lib/parties'
import { useStore } from '../../store'

const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })

const GP_TABS = [
  { id: 'inwards', label: 'Inwards Gate Pass' },
  { id: 'outwards', label: 'Outwards Gate Pass' },
]

const genNo = (gates: GatePass[], type: GatePassType) => {
  const prefix = type === 'inwards' ? 'IGP' : 'OGP'
  const same = gates.filter(g => g.type === type)
  const max = same.reduce((m, g) => Math.max(m, parseInt(g.gpNo.split('-').pop() ?? '0')), 0)
  return `${prefix}-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`
}

const GatePassForm: React.FC<{ type: GatePassType; onClose: () => void; gatePass?: GatePass }> = ({ type, onClose, gatePass }) => {
  const { accounts, customers, vendors, products, gatePasses, addGatePass, updateGatePass } = useStore()
  const customerParties = useMemo(() => getCustomerParties(accounts, customers), [accounts, customers])
  const vendorParties = useMemo(() => getVendorParties(accounts, vendors), [accounts, vendors])

  const allParties = useMemo(() => [...customerParties, ...vendorParties], [customerParties, vendorParties])
  const [partyId, setPartyId] = useState(gatePass?.partyId ?? '')
  const [date, setDate] = useState(gatePass ? new Date(gatePass.date).toISOString().slice(0, 10) : new Date().toISOString().slice(0, 10))
  const [remarks, setRemarks] = useState(gatePass?.remarks ?? '')
  const [lines, setLines] = useState<InvoiceLine[]>(gatePass?.lines ?? [])

  const addLine = () => setLines(ls => [...ls, { id: makeId(Math.random().toString(36).slice(2)), productId: makeId(''), productName: '', productCode: '', qty: 1, unitPrice: 0, discountPct: 0, taxPct: 0, total: 0 }])

  const setLine = (idx: number, patch: Partial<InvoiceLine>) => setLines(ls => ls.map((l, i) => {
    if (i !== idx) return l
    const m = { ...l, ...patch }
    if (patch.productId) {
      const p = products.find(p => p.id === patch.productId)
      if (p) { m.productName = p.name; m.productCode = p.code; m.unitPrice = p.salePrice }
    }
    const gross = m.qty * m.unitPrice
    const disc = gross * (m.discountPct / 100)
    m.total = gross - disc
    return m
  }))

  const save = () => {
    const party = allParties.find(p => p.id === (partyId as any))
    const payload: any = {
      gpNo: gatePass?.gpNo ?? genNo(gatePasses, type),
      type,
      date: new Date(date),
      partyId: partyId || undefined,
      partyName: party?.name || undefined,
      lines,
      remarks: remarks || undefined,
    }
    if (gatePass) updateGatePass(gatePass.id, payload)
    else addGatePass(payload)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Party" value={partyId as string} onChange={e => setPartyId(e.target.value as any)}
          options={[{ value: '', label: allParties.length ? 'Select party...' : 'Add party first' }, ...allParties.map(p => ({ value: p.id as string, label: `${p.code} — ${p.name}` }))]} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
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
                {['Product','Qty','Unit','Unit Price','Total',''].map(h => <th key={h} className="px-2 py-2 text-left text-slate-500 font-medium last:w-8">{h}</th>)}
              </tr>
            </thead>
            <tbody>
              {lines.length === 0 && <tr><td colSpan={6} className="px-3 py-6 text-center text-slate-600">No lines — click Add Line</td></tr>}
              {lines.map((l, idx) => (
                <tr key={l.id} className="border-b border-slate-100 last:border-0">
                  <td className="px-2 py-1.5">
                    <select value={l.productId as string} onChange={e => setLine(idx, { productId: e.target.value as any })}
                      className="w-full min-w-[120px] bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-slate-800">
                      <option value="">Select...</option>
                      {products.map(p => <option key={p.id as string} value={p.id as string}>{p.code} — {p.name}</option>)}
                    </select>
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={l.qty} min={0} onChange={e => setLine(idx, { qty: +e.target.value })}
                      className="w-14 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                  </td>
                  <td className="px-2 py-1.5 text-slate-600">
                    {products.find(p => p.id === l.productId)?.unit}
                  </td>
                  <td className="px-2 py-1.5">
                    <input type="number" value={l.unitPrice} min={0} onChange={e => setLine(idx, { unitPrice: +e.target.value })}
                      className="w-20 bg-slate-100 border border-slate-300 rounded px-2 py-1 text-xs text-right" />
                  </td>
                  <td className="px-2 py-1.5 text-right font-mono text-slate-800">{fmt(l.total)}</td>
                  <td className="px-2">
                    <button onClick={() => setLines(ls => ls.filter((_, i) => i !== idx))} className="text-slate-500 hover:text-red-600">
                      <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <Textarea label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />

      <div className="flex gap-2 justify-end">
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save Gate Pass</Button>
      </div>
    </div>
  )
}

export const GatePassesModule: React.FC = () => {
  const { accounts, customers, vendors, gatePasses, deleteGatePass } = useStore()
  const [tab, setTab] = useState<GatePassType>('inwards')
  const [search, setSearch] = useState('')
  const [showForm, setShowForm] = useState(false)
  const [editGatePass, setEditGatePass] = useState<GatePass | undefined>()

  const tabGPs = useMemo(() => gatePasses.filter(gp => gp.type === tab), [gatePasses, tab])
  const filtered = useMemo(() => tabGPs.filter(gp =>
    gp.gpNo.toLowerCase().includes(search.toLowerCase()) ||
    (gp.partyName && gp.partyName.toLowerCase().includes(search.toLowerCase()))
  ), [tabGPs, search])

  const openNew = () => { setEditGatePass(undefined); setShowForm(true) }
  const openEdit = (gp: GatePass) => { setEditGatePass(gp); setShowForm(true) }
  const formType = editGatePass?.type ?? tab

  return (
    <div className="space-y-5">
      <Card>
        <Tabs tabs={GP_TABS} active={tab} onChange={id => setTab(id as GatePassType)} />
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder={`Search ${tab} gate passes...`} />
          <Button variant="primary" onClick={openNew}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New {tab === 'inwards' ? 'Inwards' : 'Outwards'} Gate Pass
          </Button>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>GP No</Th>
              <Th>Date</Th>
              <Th>Party</Th>
              <Th>Items</Th>
              <Th>Remarks</Th>
              <Th>Actions</Th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? <TrEmpty colSpan={6} message={`No ${tab} gate passes yet`} /> :
              filtered.map(gp => (
                <tr key={gp.id as string} className="hover:bg-slate-100/25 transition-colors">
                  <Td><span className="font-mono text-sky-600 text-xs">{gp.gpNo}</span></Td>
                  <Td>{fmtD(gp.date)}</Td>
                  <Td><span className="font-medium text-slate-800">{gp.partyName || '-'}</span></Td>
                  <Td><span className="font-mono">{gp.lines.reduce((s: number, l: InvoiceLine) => s + l.qty, 0)}</span></Td>
                  <Td><span className="text-slate-600">{gp.remarks || '-'}</span></Td>
                  <Td>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => openEdit(gp)}>Edit</Button>
                      <Button size="sm" variant="danger" onClick={() => deleteGatePass(gp.id)}>Delete</Button>
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
        title={editGatePass ? `Edit — ${editGatePass.gpNo}` : formType === 'inwards' ? 'Inwards Gate Pass' : 'Outwards Gate Pass'}
        size="xl"
      >
        <GatePassForm type={formType} onClose={() => setShowForm(false)} gatePass={editGatePass} />
      </Modal>
    </div>
  )
}
