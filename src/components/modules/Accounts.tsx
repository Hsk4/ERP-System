import type { Account, AccountCategory, AccountType } from '@erp/domain'
import { Badge, Button, Card, Input, Modal, SearchBar, Select, StatCard, Table, Tabs, Td, Th, TrEmpty } from '@erp/ui'
import { clsx } from 'clsx'
import React, { useMemo, useState } from 'react'
import { trialBalanceTotals } from '../../lib/accounting'
import { getCustomerParties, getVendorParties } from '../../lib/parties'
import { useStore } from '../../store'

const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(Math.abs(n))
const fmtD = (d: Date)   => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })
const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(Math.abs(n))

const TYPE_V: Record<string, 'success'|'danger'|'info'|'warning'|'purple'> = {
  asset:'success', liability:'danger', equity:'info', income:'warning', expense:'purple'
}
const ACCOUNT_TYPES: { value: string; label: string }[] = [
  { value: 'asset',     label: 'Asset'     },
  { value: 'liability', label: 'Liability' },
  { value: 'equity',    label: 'Equity'    },
  { value: 'income',    label: 'Income'    },
  { value: 'expense',   label: 'Expense'   },
]
const ACCOUNT_CATEGORIES: { value: AccountCategory; label: string }[] = [
  { value: 'customer', label: 'Customer' },
  { value: 'vendor',   label: 'Vendor'   },
  { value: 'cash',     label: 'Cash'     },
  { value: 'bank',     label: 'Bank'     },
  { value: 'general',  label: 'General'  },
]
const CATEGORY_LEDGER_TYPE: Partial<Record<AccountCategory, AccountType>> = {
  customer: 'asset',
  vendor:   'liability',
  cash:     'asset',
  bank:     'asset',
}
const CATEGORY_V: Record<AccountCategory, 'success'|'danger'|'info'|'warning'|'purple'|'default'> = {
  customer: 'info', vendor: 'purple', cash: 'success', bank: 'warning', general: 'default',
}
const REF_V: Record<string, 'info'|'success'|'purple'|'warning'> = {
  sale_invoice: 'success', purchase_invoice: 'purple', voucher: 'info', manual: 'warning'
}
const REF_L: Record<string, string> = {
  sale_invoice: 'Sale', purchase_invoice: 'Purchase', voucher: 'Voucher', manual: 'Manual'
}

const TABS = [
  { id: 'accounts',      label: 'Chart of Accounts' },
  { id: 'ledger',        label: 'Ledger'             },
  { id: 'receivables',   label: 'Receivables'        },
  { id: 'payables',      label: 'Payables'           },
  { id: 'trial-balance', label: 'Trial Balance'      },
  { id: 'balance-sheet', label: 'Balance Sheet'      },
]

// ─── Account Form ─────────────────────────────────────────────────────────────
const AccountForm: React.FC<{ onClose: () => void; account?: Account }> = ({ onClose, account }) => {
  const { accounts, addAccount, updateAccount } = useStore()
  const [f, setF] = useState({
    code:        account?.code        ?? '',
    name:        account?.name        ?? '',
    category:    account?.category    ?? 'general' as AccountCategory,
    type:        account?.type        ?? 'asset' as AccountType,
    parentId:    account?.parentId    ?? '',
    phone:       account?.phone       ?? '',
    email:       account?.email       ?? '',
    address:     account?.address     ?? '',
    creditLimit: account?.creditLimit ?? 0,
    balance:     account?.balance     ?? '',
    isActive:    account?.isActive    ?? true,
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.type === 'number' ? (e.target.value === '' ? '' : +e.target.value) : e.target.value }))
  const setCategory = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const category = e.target.value as AccountCategory
    const type = CATEGORY_LEDGER_TYPE[category]
    setF(p => ({ ...p, category, ...(type ? { type } : {}) }))
  }

  const parentOptions = [
    { value: '', label: 'None (Top Level)' },
    ...accounts.filter(a => a.id !== account?.id).map(a => ({ value: a.id as string, label: `${a.code} — ${a.name}` })),
  ]

  const save = () => {
    const payload = {
      ...f,
      category: f.category as AccountCategory,
      type: f.type as AccountType,
      parentId: f.parentId ? f.parentId as any : undefined,
      phone: f.phone || undefined,
      email: f.email || undefined,
      address: f.address || undefined,
      creditLimit: f.category === 'customer' ? f.creditLimit : undefined,
      balance: typeof f.balance === 'number' ? f.balance : (f.balance === '' ? 0 : +f.balance),
    }
    if (account) updateAccount(account.id, payload)
    else addAccount(payload)
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Account Code" value={f.code} onChange={set('code')} placeholder="e.g. 1004" />
        <Select label="Account Category" value={f.category} onChange={setCategory} options={ACCOUNT_CATEGORIES} />
      </div>
      <Select label="Ledger Type" value={f.type} onChange={set('type')} options={ACCOUNT_TYPES} />
      <Input label="Account Name" value={f.name} onChange={set('name')} placeholder="e.g. Petty Cash" />
      <Select label="Parent Account (optional)" value={f.parentId as string} onChange={set('parentId')} options={parentOptions} />
      {(f.category === 'customer' || f.category === 'vendor') && (
        <div className="grid grid-cols-2 gap-4">
          <Input label="Phone" value={f.phone} onChange={set('phone')} placeholder="e.g. 0300-1234567" />
          <Input label="Email" value={f.email} onChange={set('email')} placeholder="email@example.com" />
        </div>
      )}
      {(f.category === 'customer' || f.category === 'vendor') && (
        <Input label="Address" value={f.address} onChange={set('address')} placeholder="Business address" />
      )}
      {f.category === 'customer' && (
        <Input label="Credit Limit (Rs)" type="number" value={f.creditLimit} onChange={set('creditLimit')} />
      )}
      <Input label="Opening Balance (Rs)" type="text" inputMode="numeric" value={f.balance} onChange={set('balance')} placeholder="Enter opening balance (optional)" />
      {(f.category === 'customer' || f.category === 'vendor') && (
        <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
          This {f.category} will appear in {f.category === 'customer' ? 'sales invoices, challans, receipts' : 'purchase invoices and payments'} automatically.
        </p>
      )}
      <div className="flex items-center gap-3">
        <label className="flex items-center gap-2 cursor-pointer">
          <input type="checkbox" checked={f.isActive} onChange={e => setF(p => ({ ...p, isActive: e.target.checked }))}
            className="w-4 h-4 rounded border-slate-600 bg-slate-100 text-slate-800 accent-slate-400" />
          <span className="text-sm text-slate-700">Active</span>
        </label>
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost"   onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>{account ? 'Save Changes' : 'Add Account'}</Button>
      </div>
    </div>
  )
}

// ─── Ledger Entry Form ────────────────────────────────────────────────────────
const LedgerEntryForm: React.FC<{ onClose: () => void; preAccountId?: string }> = ({ onClose, preAccountId }) => {
  const { accounts, addLedgerEntry } = useStore()
  const [accountId,       setAccountId]       = useState(preAccountId ?? '')
  const [offsetAccountId, setOffsetAccountId] = useState('')
  const [side,            setSide]            = useState<'debit' | 'credit'>('debit')
  const [date,            setDate]            = useState(new Date().toISOString().slice(0, 10))
  const [description,     setDescription]     = useState('')
  const [refNo,           setRefNo]           = useState('')
  const [amount,          setAmount]          = useState('')

  const account = accounts.find(a => a.id === (accountId as any))
  const amt = parseFloat(amount) || 0
  const accountOptions = accounts.map(a => ({ value: a.id as string, label: `${a.code} — ${a.name}` }))

  const save = () => {
    if (!accountId || !offsetAccountId || amt <= 0) return
    addLedgerEntry({
      accountId: accountId as any,
      accountName: account?.name ?? '',
      date: new Date(date),
      description,
      refType: 'manual',
      refNo: refNo || 'MJE-' + Date.now(),
      debit: side === 'debit' ? amt : 0,
      credit: side === 'credit' ? amt : 0,
      balance: 0,
      offsetAccountId: offsetAccountId as any,
    })
    onClose()
  }

  return (
    <div className="space-y-4">
      <p className="text-xs text-sky-700 bg-sky-50 border border-sky-200 rounded-lg px-3 py-2">
        Every journal posts two sides: debit = credit. Select both accounts and one amount.
      </p>
      <div className="grid grid-cols-2 gap-4">
        <Select label="Primary Account" value={accountId} onChange={e => setAccountId(e.target.value)}
          options={[{ value: '', label: 'Select account…' }, ...accountOptions]} />
        <Select label="Offset Account" value={offsetAccountId} onChange={e => setOffsetAccountId(e.target.value)}
          options={[{ value: '', label: 'Select offset account…' }, ...accountOptions.filter(o => o.value !== accountId)]} />
      </div>
      <div className="grid grid-cols-3 gap-4">
        <Select label="Primary Side" value={side} onChange={e => setSide(e.target.value as 'debit' | 'credit')}
          options={[{ value: 'debit', label: 'Debit' }, { value: 'credit', label: 'Credit' }]} />
        <Input label="Amount (Rs)" type="number" value={amount} onChange={e => setAmount(e.target.value)} placeholder="0.00" />
        <Input label="Date" type="date" value={date} onChange={e => setDate(e.target.value)} />
      </div>
      <Input label="Reference No." value={refNo} onChange={e => setRefNo(e.target.value)} placeholder="e.g. MJE-001" />
      <Input label="Description" value={description} onChange={e => setDescription(e.target.value)} placeholder="Entry description…" />
      {amt > 0 && accountId && offsetAccountId && (
        <div className="bg-slate-100 rounded-lg px-4 py-3 text-xs text-slate-600 space-y-1">
          <p><span className="font-medium text-sky-700">Debit:</span> {side === 'debit' ? account?.name : accounts.find(a => a.id === (offsetAccountId as any))?.name} — {fmt(amt)}</p>
          <p><span className="font-medium text-violet-700">Credit:</span> {side === 'credit' ? account?.name : accounts.find(a => a.id === (offsetAccountId as any))?.name} — {fmt(amt)}</p>
        </div>
      )}
      <div className="flex gap-2 justify-end">
        <Button variant="ghost"   onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save} disabled={!accountId || !offsetAccountId || amt <= 0}>Post Journal</Button>
      </div>
    </div>
  )
}

// ─── Ledger View ──────────────────────────────────────────────────────────────
const LedgerView: React.FC = () => {
  const { accounts, ledgerEntries } = useStore()
  const [accountId,  setAccountId]  = useState(accounts[0]?.id as string ?? '')
  const [showForm,   setShowForm]   = useState(false)

  const account = accounts.find(a => a.id === (accountId as any))
  const entries = useMemo(() =>
    ledgerEntries
      .filter(e => e.accountId === (accountId as any))
      .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()),
    [ledgerEntries, accountId]
  )

  const totalDebit  = entries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = entries.reduce((s, e) => s + e.credit, 0)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <select value={accountId} onChange={e => setAccountId(e.target.value)}
            className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-800 px-3 py-2 focus:outline-none focus:border-slate-500 transition-all min-w-[260px]">
            {accounts.map(a => <option key={a.id as string} value={a.id as string}>{a.code} — {a.name}</option>)}
          </select>
          {account && <Badge variant={TYPE_V[account.type]}>{account.type}</Badge>}
        </div>
        <Button variant="primary" size="sm" onClick={() => setShowForm(true)}>
          <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
          Add Entry
        </Button>
      </div>

      {/* Account summary */}
      {account && (
        <div className="grid grid-cols-3 gap-3">
          <div className="bg-slate-100/60 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Current Balance</p>
            <p className="text-lg font-semibold font-mono text-slate-900">{fmt(account.balance)}</p>
          </div>
          <div className="bg-slate-100/60 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Total Debits</p>
            <p className="text-lg font-semibold font-mono text-sky-600">{fmt(totalDebit)}</p>
          </div>
          <div className="bg-slate-100/60 rounded-lg px-4 py-3">
            <p className="text-[11px] text-slate-500 uppercase tracking-wide mb-1">Total Credits</p>
            <p className="text-lg font-semibold font-mono text-violet-600">{fmt(totalCredit)}</p>
          </div>
        </div>
      )}

      <Table>
        <thead><tr><Th>Date</Th><Th>Description</Th><Th>Ref No.</Th><Th>Type</Th><Th>Debit</Th><Th>Credit</Th><Th>Balance</Th></tr></thead>
        <tbody>
          {entries.length === 0
            ? <TrEmpty colSpan={7} message="No ledger entries for this account" />
            : entries.map(e => (
              <tr key={e.id as string} className="hover:bg-slate-100/25 transition-colors">
                <Td>{fmtD(e.date)}</Td>
                <Td><span className="text-slate-800">{e.description}</span></Td>
                <Td><span className="font-mono text-xs text-slate-600">{e.refNo}</span></Td>
                <Td><Badge variant={REF_V[e.refType]}>{REF_L[e.refType]}</Badge></Td>
                <Td><span className={clsx('font-mono', e.debit  > 0 ? 'text-sky-600'    : 'text-slate-600')}>{e.debit  > 0 ? fmt(e.debit)  : '—'}</span></Td>
                <Td><span className={clsx('font-mono', e.credit > 0 ? 'text-violet-600' : 'text-slate-600')}>{e.credit > 0 ? fmt(e.credit) : '—'}</span></Td>
                <Td><span className="font-mono font-medium text-slate-800">{fmt(e.balance)}</span></Td>
              </tr>
            ))}
        </tbody>
        {entries.length > 0 && (
          <tfoot>
            <tr className="border-t-2 border-slate-300">
              <Td colSpan={4}><span className="font-semibold text-slate-700">Totals</span></Td>
              <Td><span className="font-mono font-semibold text-sky-600">{fmt(totalDebit)}</span></Td>
              <Td><span className="font-mono font-semibold text-violet-600">{fmt(totalCredit)}</span></Td>
              <Td><span className="font-mono font-semibold text-slate-800">{fmt(entries[entries.length - 1]?.balance ?? 0)}</span></Td>
            </tr>
          </tfoot>
        )}
      </Table>

      <Modal open={showForm} onClose={() => setShowForm(false)} title="Add Ledger Entry" size="sm">
        <LedgerEntryForm onClose={() => setShowForm(false)} preAccountId={accountId} />
      </Modal>
    </div>
  )
}

// ─── Trial Balance ────────────────────────────────────────────────────────────
const TrialBalance: React.FC = () => {
  const { accounts, ledgerEntries } = useStore()

  const rows = accounts.filter(a => a.isActive).map(a => {
    const entries = ledgerEntries.filter(e => e.accountId === a.id)
    const totalDebit  = entries.reduce((s, e) => s + e.debit,  0)
    const totalCredit = entries.reduce((s, e) => s + e.credit, 0)
    const isDebitNormal = a.type === 'asset' || a.type === 'expense'
    const net = isDebitNormal ? a.balance : -a.balance
    const netDebit  = net >= 0 ? net : 0
    const netCredit = net < 0 ? Math.abs(net) : 0
    return { account: a, totalDebit, totalCredit, netDebit, netCredit }
  })

  const { totalDebit: grandDebit, totalCredit: grandCredit, balanced } = trialBalanceTotals(accounts, ledgerEntries)

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Trial Balance</h3>
          <p className="text-xs text-slate-500">As of {new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <Badge variant={balanced ? 'success' : 'danger'}>{balanced ? '✓ Balanced' : '✗ Not Balanced'}</Badge>
      </div>
      <Table>
        <thead><tr><Th>Code</Th><Th>Account Name</Th><Th>Type</Th><Th>Debit (Rs)</Th><Th>Credit (Rs)</Th></tr></thead>
        <tbody>
          {rows.filter(r => r.netDebit > 0 || r.netCredit > 0).map(r => (
            <tr key={r.account.id as string} className="hover:bg-slate-100/25 transition-colors">
              <Td><span className="font-mono text-xs text-slate-500">{r.account.code}</span></Td>
              <Td><span className="font-medium text-slate-800">{r.account.name}</span></Td>
              <Td><Badge variant={TYPE_V[r.account.type]}>{r.account.type}</Badge></Td>
              <Td><span className={clsx('font-mono', r.netDebit  > 0 ? 'text-sky-600'    : 'text-slate-600')}>{r.netDebit  > 0 ? fmt(r.netDebit)  : '—'}</span></Td>
              <Td><span className={clsx('font-mono', r.netCredit > 0 ? 'text-violet-600' : 'text-slate-600')}>{r.netCredit > 0 ? fmt(r.netCredit) : '—'}</span></Td>
            </tr>
          ))}
        </tbody>
        <tfoot>
          <tr className="border-t-2 border-slate-300">
            <Td colSpan={3}><span className="font-bold text-slate-800">Grand Total</span></Td>
            <Td><span className="font-mono font-bold text-sky-600">{fmt(grandDebit)}</span></Td>
            <Td><span className="font-mono font-bold text-violet-600">{fmt(grandCredit)}</span></Td>
          </tr>
        </tfoot>
      </Table>
    </div>
  )
}

// ─── Balance Sheet ────────────────────────────────────────────────────────────
const BalanceSheet: React.FC = () => {
  const { accounts } = useStore()

  const byType = (type: string) => accounts.filter(a => a.isActive && a.type === type)
  const assets      = byType('asset')
  const liabilities = byType('liability')
  const equity      = byType('equity')
  const income      = byType('income')
  const expenses    = byType('expense')

  const totalAssets      = assets.reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = liabilities.reduce((s, a) => s + a.balance, 0)
  const totalIncome      = income.reduce((s, a) => s + a.balance, 0)
  const totalExpenses    = expenses.reduce((s, a) => s + a.balance, 0)
  const retainedEarnings = totalIncome - totalExpenses
  const totalEquity      = equity.reduce((s, a) => s + a.balance, 0) + retainedEarnings
  const totalLiabEquity  = totalLiabilities + totalEquity
  const balanced         = Math.abs(totalAssets - totalLiabEquity) < 1

  const Section: React.FC<{ title: string; items: Account[]; total: number; totalLabel: string; accent: string }> = ({ title, items, total, totalLabel, accent }) => (
    <div>
      <div className={clsx('text-xs font-semibold uppercase tracking-wider px-4 py-2.5 border-b border-slate-200', accent)}>{title}</div>
      {items.map(a => (
        <div key={a.id as string} className="flex items-center justify-between px-4 py-2 border-b border-slate-100 hover:bg-slate-100/20 transition-colors">
          <div className="flex items-center gap-2">
            <span className="text-[11px] text-slate-600 font-mono w-10">{a.code}</span>
            <span className="text-sm text-slate-700">{a.name}</span>
          </div>
          <span className="font-mono text-sm text-slate-800">{fmt(a.balance)}</span>
        </div>
      ))}
      <div className="flex items-center justify-between px-4 py-3 bg-slate-100/40">
        <span className="text-sm font-semibold text-slate-700">{totalLabel}</span>
        <span className={clsx('font-mono font-bold text-sm', accent.replace('text-','text-').replace('-500',''))}>{fmt(total)}</span>
      </div>
    </div>
  )

  return (
    <div className="p-5 space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-sm font-semibold text-slate-800">Balance Sheet</h3>
          <p className="text-xs text-slate-500">As of {new Date().toLocaleDateString('en-PK', { year:'numeric', month:'long', day:'numeric' })}</p>
        </div>
        <Badge variant={balanced ? 'success' : 'danger'}>{balanced ? '✓ Balanced' : '✗ Check Entries'}</Badge>
      </div>

      <div className="grid grid-cols-2 gap-4">
        {/* LEFT — Assets */}
        <Card className="overflow-hidden">
          <Section title="Assets" items={assets} total={totalAssets} totalLabel="Total Assets" accent="text-emerald-600" />
        </Card>

        {/* RIGHT — Liabilities + Equity */}
        <Card className="overflow-hidden">
          <Section title="Liabilities" items={liabilities} total={totalLiabilities} totalLabel="Total Liabilities" accent="text-red-600" />
          <div className="mt-1">
            <Section title="Equity" items={equity} total={totalEquity} totalLabel="" accent="text-sky-600" />
            {/* Retained Earnings line */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-100 bg-slate-100/20">
              <span className="text-sm text-slate-600 italic">Retained Earnings (Net Income)</span>
              <span className={clsx('font-mono text-sm', retainedEarnings >= 0 ? 'text-emerald-600' : 'text-red-600')}>
                {retainedEarnings < 0 ? '-' : ''}{fmt(retainedEarnings)}
              </span>
            </div>
            <div className="flex items-center justify-between px-4 py-3 bg-slate-100/40">
              <span className="text-sm font-semibold text-slate-700">Total Equity</span>
              <span className="font-mono font-bold text-sm text-sky-600">{fmt(totalEquity)}</span>
            </div>
          </div>
          <div className="flex items-center justify-between px-4 py-3 bg-slate-700/40 border-t-2 border-slate-300">
            <span className="text-sm font-bold text-slate-800">Total Liabilities + Equity</span>
            <span className="font-mono font-bold text-slate-900">{fmt(totalLiabEquity)}</span>
          </div>
        </Card>
      </div>

      {/* Reconciliation row */}
      <div className={clsx('rounded-xl border px-5 py-3 flex items-center justify-between text-sm', balanced ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-red-500/5 border-red-500/20')}>
        <span className={balanced ? 'text-emerald-600' : 'text-red-600'}>
          {balanced ? '✓ Balance sheet is balanced' : '✗ Difference found — check journal entries'}
        </span>
        <div className="flex gap-6 text-xs font-mono">
          <span className="text-slate-600">Assets: <span className="text-emerald-600">{fmt(totalAssets)}</span></span>
          <span className="text-slate-600">Liab+Equity: <span className="text-sky-600">{fmt(totalLiabEquity)}</span></span>
          {!balanced && <span className="text-red-600">Diff: {fmt(Math.abs(totalAssets - totalLiabEquity))}</span>}
        </div>
      </div>
    </div>
  )
}

// ─── Main Module ─────────────────────────────────────────────────────────────
export const AccountsModule: React.FC = () => {
  const { accounts, customers, vendors, updateAccount } = useStore()
  const [tab,         setTab]         = useState('accounts')
  const [search,      setSearch]      = useState('')
  const [showForm,    setShowForm]    = useState(false)
  const [editAccount, setEditAccount] = useState<Account | undefined>()
  const [showLedger,  setShowLedger]  = useState(false)

  const totalAssets      = accounts.filter(a => a.type === 'asset'    ).reduce((s, a) => s + a.balance, 0)
  const totalLiabilities = accounts.filter(a => a.type === 'liability').reduce((s, a) => s + a.balance, 0)
  const totalIncome      = accounts.filter(a => a.type === 'income'   ).reduce((s, a) => s + a.balance, 0)
  const totalExpenses    = accounts.filter(a => a.type === 'expense'  ).reduce((s, a) => s + a.balance, 0)

  const receivables = getCustomerParties(accounts, customers).filter(c => c.balance > 0)
  const payables    = getVendorParties(accounts, vendors).filter(v => v.balance > 0)

  const filteredAccounts = useMemo(() =>
    accounts.filter(a =>
      a.name.toLowerCase().includes(search.toLowerCase()) ||
      a.code.toLowerCase().includes(search.toLowerCase())
    ), [accounts, search])

  const openNew  = () => { setEditAccount(undefined); setShowForm(true) }
  const openEdit = (a: Account) => { setEditAccount(a); setShowForm(true) }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Assets"      value={fmtC(totalAssets)}      accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/></svg>} />
        <StatCard label="Total Liabilities" value={fmtC(totalLiabilities)} accent="text-red-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard label="Total Income"      value={fmtC(totalIncome)}      accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M22 12h-4l-3 9L9 3l-3 9H2"/></svg>} />
        <StatCard label="Net Income"        value={fmtC(totalIncome - totalExpenses)} accent={totalIncome >= totalExpenses ? 'text-emerald-600' : 'text-red-600'}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M18 20V10M12 20V4M6 20v-6"/></svg>} />
      </div>

      <Card>
        <Tabs tabs={TABS} active={tab} onChange={setTab} />

        {/* ── Chart of Accounts ── */}
        {tab === 'accounts' && (
          <>
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
              <SearchBar value={search} onChange={setSearch} placeholder="Search accounts…" />
              <div className="flex gap-2">
                <Button size="sm" variant="secondary" onClick={() => setShowLedger(true)}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/></svg>
                  Add Ledger Entry
                </Button>
                <Button size="sm" variant="primary" onClick={openNew}>
                  <svg width="13" height="13" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
                  Add Account
                </Button>
              </div>
            </div>
            <Table>
              <thead><tr><Th>Code</Th><Th>Account Name</Th><Th>Category</Th><Th>Ledger Type</Th><Th>Balance</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
              <tbody>
                {filteredAccounts.length === 0
                  ? <TrEmpty colSpan={7} />
                  : filteredAccounts.map(a => (
                    <tr key={a.id as string} className="hover:bg-slate-100/25 transition-colors">
                      <Td><span className="font-mono text-xs text-slate-500">{a.code}</span></Td>
                      <Td><span className="font-medium text-slate-800">{a.name}</span></Td>
                      <Td><Badge variant={CATEGORY_V[a.category ?? 'general']}>{a.category ?? 'general'}</Badge></Td>
                      <Td><Badge variant={TYPE_V[a.type]}>{a.type}</Badge></Td>
                      <Td><span className="font-mono">{fmt(a.balance)}</span></Td>
                      <Td><Badge variant={a.isActive ? 'success' : 'default'}>{a.isActive ? 'Active' : 'Inactive'}</Badge></Td>
                      <Td>
                        <div className="flex gap-1">
                          <Button size="sm" variant="ghost" onClick={() => openEdit(a)}>Edit</Button>
                          <Button size="sm" variant="ghost" onClick={() => updateAccount(a.id, { isActive: !a.isActive })}>
                            {a.isActive ? 'Deactivate' : 'Activate'}
                          </Button>
                        </div>
                      </Td>
                    </tr>
                  ))}
              </tbody>
            </Table>
          </>
        )}

        {/* ── Ledger ── */}
        {tab === 'ledger' && <LedgerView />}

        {/* ── Receivables ── */}
        {tab === 'receivables' && (
          <Table>
            <thead><tr><Th>Customer</Th><Th>Code</Th><Th>Phone</Th><Th>Outstanding Balance</Th><Th>Credit Limit</Th></tr></thead>
            <tbody>
              {receivables.length === 0
                ? <TrEmpty colSpan={5} message="No outstanding receivables" />
                : receivables.map(c => (
                  <tr key={c.id as string} className="hover:bg-slate-100/25 transition-colors">
                    <Td><span className="font-medium text-slate-800">{c.name}</span></Td>
                    <Td><span className="font-mono text-xs text-slate-500">{c.code}</span></Td>
                    <Td className="text-slate-600">{c.phone ?? '—'}</Td>
                    <Td><span className="font-mono text-amber-600 font-medium">{fmt(c.balance)}</span></Td>
                    <Td><span className="font-mono text-slate-500">{fmt(c.creditLimit ?? 0)}</span></Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}

        {/* ── Payables ── */}
        {tab === 'payables' && (
          <Table>
            <thead><tr><Th>Vendor</Th><Th>Code</Th><Th>Phone</Th><Th>Outstanding Balance</Th></tr></thead>
            <tbody>
              {payables.length === 0
                ? <TrEmpty colSpan={4} message="No outstanding payables" />
                : payables.map(v => (
                  <tr key={v.id as string} className="hover:bg-slate-100/25 transition-colors">
                    <Td><span className="font-medium text-slate-800">{v.name}</span></Td>
                    <Td><span className="font-mono text-xs text-slate-500">{v.code}</span></Td>
                    <Td className="text-slate-600">{v.phone ?? '—'}</Td>
                    <Td><span className="font-mono text-red-600 font-medium">{fmt(v.balance)}</span></Td>
                  </tr>
                ))}
            </tbody>
          </Table>
        )}

        {/* ── Trial Balance ── */}
        {tab === 'trial-balance' && <TrialBalance />}

        {/* ── Balance Sheet ── */}
        {tab === 'balance-sheet' && <BalanceSheet />}
      </Card>

      {/* Modals */}
      <Modal open={showForm} onClose={() => setShowForm(false)} title={editAccount ? `Edit — ${editAccount.name}` : 'New Account'} size="sm">
        <AccountForm onClose={() => setShowForm(false)} account={editAccount} />
      </Modal>

      <Modal open={showLedger} onClose={() => setShowLedger(false)} title="Add Ledger Entry" size="sm">
        <LedgerEntryForm onClose={() => setShowLedger(false)} />
      </Modal>
    </div>
  )
}
