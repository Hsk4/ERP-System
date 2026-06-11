import React, { useMemo, useState } from 'react'
import { useStore } from '../../store'
import { Card, Table, Th, Td, TrEmpty, StatCard, SearchBar } from '@erp/ui'
import { getVendorParties } from '../../lib/parties'

const fmt = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

export const VendorBalancesModule: React.FC = () => {
  const { accounts, vendors } = useStore()
  const [search, setSearch] = useState('')

  const vendorParties = useMemo(() => getVendorParties(accounts, vendors), [accounts, vendors])

  const filteredParties = useMemo(() => {
    return vendorParties.filter(p => 
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p.code.toLowerCase().includes(search.toLowerCase())
    )
  }, [vendorParties, search])

  const totalOutstanding = filteredParties.reduce((s, p) => s + p.balance, 0)
  const withBalance = filteredParties.filter(p => p.balance > 0)
  const zeroBalance = filteredParties.filter(p => p.balance === 0)

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Total Vendors" value={String(filteredParties.length)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 00-3-3.87"/><path d="M16 3.13a4 4 0 010 7.75"/></svg>} />
        <StatCard label="Total Outstanding" value={fmtC(totalOutstanding)} accent="text-violet-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
        <StatCard label="With Balance" value={String(withBalance.length)} accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/></svg>} />
        <StatCard label="Paid in Full" value={String(zeroBalance.length)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>} />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <SearchBar value={search} onChange={setSearch} placeholder="Search vendors…" />
        </div>
        <Table>
          <thead>
            <tr>
              <Th>Code</Th>
              <Th>Vendor Name</Th>
              <Th>Phone</Th>
              <Th>Email</Th>
              <Th>Credit Limit</Th>
              <Th>Balance</Th>
            </tr>
          </thead>
          <tbody>
            {filteredParties.length === 0 ? (
              <TrEmpty colSpan={6} message="No vendors found" />
            ) : (
              filteredParties.map(party => (
                <tr key={party.id as string} className="hover:bg-slate-100/25">
                  <Td><span className="font-mono text-slate-600">{party.code}</span></Td>
                  <Td><span className="font-medium text-slate-800">{party.name}</span></Td>
                  <Td><span className="text-slate-600">{party.phone || '—'}</span></Td>
                  <Td><span className="text-slate-600">{party.email || '—'}</span></Td>
                  <Td><span className="font-mono">{party.creditLimit ? fmt(party.creditLimit) : '—'}</span></Td>
                  <Td>
                    <span className={`font-mono font-medium ${party.balance > 0 ? 'text-amber-600' : 'text-emerald-600'}`}>
                      {fmt(party.balance)}
                    </span>
                  </Td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Card>
    </div>
  )
}
