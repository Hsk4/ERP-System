import React, { useState, useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, Button, SearchBar, Select, StatCard } from '@erp/ui'
import type { Account } from '@erp/domain'

const fmt = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtD = (d: Date) => new Date(d).toLocaleDateString('en-PK', { year: 'numeric', month: 'short', day: 'numeric' })

export const LedgersModule: React.FC = () => {
  const { accounts, ledgerEntries } = useStore()
  const [selectedAccountId, setSelectedAccountId] = useState('all')
  const [search, setSearch] = useState('')

  const filteredEntries = useMemo(() => {
    return ledgerEntries.filter(entry => {
      const matchesAccount = selectedAccountId === 'all' || entry.accountId === selectedAccountId
      const matchesSearch = !search || 
        entry.description.toLowerCase().includes(search.toLowerCase()) || 
        entry.refNo.toLowerCase().includes(search.toLowerCase())
      return matchesAccount && matchesSearch
    }).sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
  }, [ledgerEntries, selectedAccountId, search])

  const totalDebit = filteredEntries.reduce((s, e) => s + e.debit, 0)
  const totalCredit = filteredEntries.reduce((s, e) => s + e.credit, 0)
  const closingBalance = totalDebit - totalCredit

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Debit" value={fmt(totalDebit)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M19 14l-7 7m0 0l-7-7m7 7V3"/></svg>} />
        <StatCard label="Total Credit" value={fmt(totalCredit)} accent="text-violet-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M5 10l7-7m0 0l7 7m-7-7v18"/></svg>} />
        <StatCard label="Closing Balance" value={fmt(Math.abs(closingBalance))} 
          subtext={closingBalance >= 0 ? 'Debit Balance' : 'Credit Balance'} 
          accent={closingBalance >= 0 ? 'text-emerald-600' : 'text-red-600'}
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <StatCard label="Entries" value={String(filteredEntries.length)} accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/></svg>} />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search ledger entries…" />
            <Select 
              value={selectedAccountId} 
              onChange={(e) => setSelectedAccountId(e.target.value)}
              options={[
                { value: 'all', label: 'All Accounts' },
                ...accounts.filter(a => a.isActive).map(a => ({ value: a.id, label: `${a.code} — ${a.name}` }))
              ]}
            />
          </div>
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Date</Th>
              <Th>Ref Type</Th>
              <Th>Ref No</Th>
              <Th>Account</Th>
              <Th>Description</Th>
              <Th>Debit</Th>
              <Th>Credit</Th>
              <Th>Balance</Th>
            </tr>
          </thead>
          <tbody>
            {filteredEntries.length === 0 ? (
              <TrEmpty colSpan={8} message="No ledger entries found" />
            ) : (
              filteredEntries.map((entry, i) => (
                <tr key={entry.id as string} className="hover:bg-slate-100/25">
                  <Td>{fmtD(entry.date)}</Td>
                  <Td><span className="text-xs font-medium text-slate-600 uppercase">{entry.refType}</span></Td>
                  <Td><span className="font-mono text-xs">{entry.refNo}</span></Td>
                  <Td><span className="font-medium text-slate-800">{entry.accountName}</span></Td>
                  <Td><span className="text-slate-600">{entry.description}</span></Td>
                  <Td>{entry.debit > 0 ? <span className="font-mono text-sky-700">{fmt(entry.debit)}</span> : <span className="text-slate-400">—</span>}</Td>
                  <Td>{entry.credit > 0 ? <span className="font-mono text-violet-700">{fmt(entry.credit)}</span> : <span className="text-slate-400">—</span>}</Td>
                  <Td><span className="font-mono font-medium">{fmt(entry.balance)}</span></Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
