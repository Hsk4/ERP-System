import React, { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, Badge, Button, SearchBar, Modal, Input, Select, Textarea, StatCard } from '@erp/ui'
import type { VoucherType } from '@erp/domain'
import { getCustomerParties, getVendorParties, getVoucherAccounts, resolveCustomerName, resolveVendorName } from '../../lib/parties'
import { clsx } from 'clsx'

const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)
const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })

const TYPE_LABELS: Record<VoucherType, string> = { cash_receipt: 'Cash Receipt', cash_payment: 'Cash Payment', bank_receipt: 'Bank Receipt', bank_payment: 'Bank Payment' }
const TYPE_VARIANT = { cash_receipt: 'success', cash_payment: 'danger', bank_receipt: 'info', bank_payment: 'purple' } as const
const TYPE_PREFIX  = { cash_receipt: 'CR', cash_payment: 'CP', bank_receipt: 'BR', bank_payment: 'BP' }

const QA_CARDS: { type: VoucherType; color: string; bg: string }[] = [
  { type: 'cash_receipt',  color: 'text-emerald-600', bg: 'bg-emerald-50' },
  { type: 'cash_payment',  color: 'text-red-600',     bg: 'bg-red-50'     },
  { type: 'bank_receipt',  color: 'text-sky-600',     bg: 'bg-sky-500/10'     },
  { type: 'bank_payment',  color: 'text-violet-600',  bg: 'bg-violet-500/10'  },
]

const VoucherForm: React.FC<{ onClose: () => void; defaultType: VoucherType }> = ({ onClose, defaultType }) => {
  const { vouchers, accounts, customers, vendors, addVoucher } = useStore()
  const [type,      setType]      = useState<VoucherType>(defaultType)
  const [date,      setDate]      = useState(new Date().toISOString().slice(0, 10))
  const [accountId, setAccountId] = useState('')
  const [partyType, setPartyType] = useState<'customer' | 'vendor'>('customer')
  const [partyId,   setPartyId]   = useState('')
  const voucherAccounts = useMemo(() => getVoucherAccounts(accounts, type), [accounts, type])
  const customerParties = useMemo(() => getCustomerParties(accounts, customers), [accounts, customers])
  const vendorParties   = useMemo(() => getVendorParties(accounts, vendors), [accounts, vendors])
  const [amount,    setAmount]    = useState('')
  const [reference, setReference] = useState('')
  const [remarks,   setRemarks]   = useState('')

  const parties  = partyType === 'customer' ? customerParties : vendorParties
  const account  = accounts.find(a => a.id === (accountId as any))
  const isReceipt = type === 'cash_receipt' || type === 'bank_receipt'

  const genNo = () => {
    const same = vouchers.filter(v => v.type === type)
    const max  = same.reduce((m, v) => Math.max(m, parseInt(v.voucherNo.split('-').pop() ?? '0')), 0)
    return `${TYPE_PREFIX[type]}-${new Date().getFullYear()}-${String(max + 1).padStart(3, '0')}`
  }

  const save = () => {
    const party = parties.find(p => p.id === partyId)
    addVoucher({ voucherNo: genNo(), type, date: new Date(date), accountId: accountId as any, accountName: account?.name ?? '', partyId: partyId ? partyId as any : undefined, partyName: party?.name, amount: parseFloat(amount) || 0, reference: reference || undefined, remarks: remarks || undefined, isPosted: false })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Select label="Voucher Type" value={type} onChange={e => setType(e.target.value as VoucherType)}
          options={Object.entries(TYPE_LABELS).map(([v, l]) => ({ value: v, label: l }))} />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <Select label="Account" value={accountId} onChange={e => setAccountId(e.target.value)}
        options={[{ value: '', label: voucherAccounts.length ? 'Select account…' : `Add a ${type.startsWith('cash_') ? 'Cash' : 'Bank'} account first` }, ...voucherAccounts.map(a => ({ value: a.id as string, label: `${a.code} — ${a.name}` }))]} />
      {account && <div className="bg-slate-100 rounded-lg px-3 py-2 text-xs text-slate-600">Balance: <span className="text-slate-700 font-mono">{fmt(account.balance)}</span></div>}
      <div className="grid grid-cols-3 gap-4">
        <Select label="Party Type" value={partyType} onChange={e => { setPartyType(e.target.value as 'customer' | 'vendor'); setPartyId('') }}
          options={[{ value: 'customer', label: 'Customer' }, { value: 'vendor', label: 'Vendor' }]} />
        <div className="col-span-2">
          <Select label={isReceipt ? 'Received From' : 'Paid To'} value={partyId} onChange={e => setPartyId(e.target.value)}
            options={[{ value: '', label: parties.length ? 'Select party…' : `Add a ${partyType} account first` }, ...parties.map(p => ({ value: p.id as string, label: `${p.code} — ${p.name}` }))]} />
        </div>
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Amount (Rs)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        <Input label="Reference / Invoice No." value={reference} onChange={e => setReference(e.target.value)} placeholder="e.g. SI-2026-001" />
      </div>
      <Textarea label="Remarks" value={remarks} onChange={e => setRemarks(e.target.value)} />
      <p className="text-xs text-slate-600 bg-slate-50 border border-slate-200 rounded-lg px-3 py-2">
        <strong>On Post:</strong> {isReceipt ? 'DR Cash/Bank, CR Customer' : 'DR Vendor, CR Cash/Bank'} — balanced double-entry. Save creates draft only.
      </p>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost"   onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>Save Voucher</Button>
      </div>
    </div>
  )
}

export const CashBankModule: React.FC = () => {
  const { vouchers, accounts, customers, vendors, postVoucher } = useStore()
  const [search,   setSearch]   = useState('')
  const [typeF,    setTypeF]    = useState('all')
  const [showForm, setShowForm] = useState(false)
  const [defType,  setDefType]  = useState<VoucherType>('cash_receipt')

  const filtered = useMemo(() =>
    vouchers.filter(v =>
      (v.voucherNo.toLowerCase().includes(search.toLowerCase()) || (v.partyName ?? '').toLowerCase().includes(search.toLowerCase())) &&
      (typeF === 'all' || v.type === typeF)
    ), [vouchers, search, typeF])

  const cashBal = accounts.filter(a => a.isActive && a.category === 'cash').reduce((s, a) => s + a.balance, 0)
    || accounts.filter(a => a.name.toLowerCase().includes('cash')).reduce((s, a) => s + a.balance, 0)
  const bankBal = accounts.filter(a => a.isActive && a.category === 'bank').reduce((s, a) => s + a.balance, 0)
    || accounts.filter(a => a.type === 'asset' && !a.name.toLowerCase().includes('cash')).reduce((s, a) => s + a.balance, 0)
  const receipts = vouchers.filter(v => v.type.includes('receipt')).reduce((s, v) => s + v.amount, 0)
  const payments = vouchers.filter(v => v.type.includes('payment')).reduce((s, v) => s + v.amount, 0)

  const open = (t: VoucherType) => { setDefType(t); setShowForm(true) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Cash Balance"   value={fmtC(cashBal)} subtext={fmt(cashBal)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><rect x="2" y="6" width="20" height="12" rx="2"/><circle cx="12" cy="12" r="2"/></svg>} />
        <StatCard label="Bank Balance"   value={fmtC(bankBal)} subtext={fmt(bankBal)} accent="text-blue-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} />
        <StatCard label="Total Receipts" value={fmtC(receipts)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 5v14M19 12l-7 7-7-7"/></svg>} />
        <StatCard label="Total Payments" value={fmtC(payments)} accent="text-red-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 19V5M5 12l7-7 7 7"/></svg>} />
      </div>

      {/* Quick action cards */}
      <div className="grid grid-cols-4 gap-3">
        {QA_CARDS.map(({ type, color, bg }) => (
          <button key={type} onClick={() => open(type)}
            className="flex flex-col items-center gap-2 p-4 bg-white border border-slate-200 rounded-xl hover:bg-slate-100 hover:border-slate-300 transition-all group">
            <span className={clsx('w-9 h-9 rounded-lg flex items-center justify-center', bg, color)}>
              <svg width="18" height="18" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                <path d={type.includes('receipt') ? 'M12 5v14M5 12l7 7 7-7' : 'M12 19V5M5 12l7-7 7 7'} />
              </svg>
            </span>
            <span className="text-xs font-medium text-slate-500 group-hover:text-slate-700 transition-colors">{TYPE_LABELS[type]}</span>
          </button>
        ))}
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search vouchers…" />
            <select value={typeF} onChange={e => setTypeF(e.target.value)} className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none">
              <option value="all">All Types</option>
              {Object.entries(TYPE_LABELS).map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
          </div>
          <Button variant="primary" onClick={() => open('cash_receipt')}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            New Voucher
          </Button>
        </div>
        <Table>
          <thead><tr><Th>Voucher No.</Th><Th>Date</Th><Th>Type</Th><Th>Account</Th><Th>Party</Th><Th>Amount</Th><Th>Reference</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <TrEmpty colSpan={9} />
              : filtered.map(v => (
                <tr key={v.id as string} className="hover:bg-slate-100/25 transition-colors">
                  <Td><span className="font-mono text-xs text-slate-700">{v.voucherNo}</span></Td>
                  <Td>{fmtD(v.date)}</Td>
                  <Td><Badge variant={TYPE_VARIANT[v.type]}>{TYPE_LABELS[v.type]}</Badge></Td>
                  <Td className="text-slate-500 text-xs">{v.accountName}</Td>
                  <Td><span className="font-medium text-slate-800">
                    {v.partyId
                      ? (resolveCustomerName(v.partyId, accounts, customers, '')
                        || resolveVendorName(v.partyId, accounts, vendors, v.partyName ?? ''))
                      : (v.partyName ?? '—')}
                  </span></Td>
                  <Td><span className={clsx('font-mono font-medium', v.type.includes('receipt') ? 'text-emerald-600' : 'text-red-600')}>{fmt(v.amount)}</span></Td>
                  <Td className="font-mono text-xs text-slate-500">{v.reference ?? '—'}</Td>
                  <Td><Badge variant={v.isPosted ? 'success' : 'warning'}>{v.isPosted ? 'Posted' : 'Draft'}</Badge></Td>
                  <Td>{!v.isPosted && <Button size="sm" variant="success" onClick={() => postVoucher(v.id)}>Post</Button>}</Td>
                </tr>
              ))}
          </tbody>
        </Table>
      </Card>
      <Modal open={showForm} onClose={() => setShowForm(false)} title="New Voucher" size="md">
        <VoucherForm onClose={() => setShowForm(false)} defaultType={defType} />
      </Modal>
    </div>
  )
}
