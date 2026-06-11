import React, { useMemo } from 'react'
import { useStore } from '../../store'
import { Card, Th, TrEmpty } from '@erp/ui'

const fmt = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)

export const TrialBalanceModule: React.FC = () => {
  const { accounts, ledgerEntries } = useStore()

  const trialBalance = useMemo(() => {
    const balances = new Map<string, { account: any; debit: number; credit: number }>()
    accounts.filter(a => a.isActive).forEach(acc => {
      balances.set(acc.id, { account: acc, debit: 0, credit: 0 })
    })
    ledgerEntries.forEach(entry => {
      const existing = balances.get(entry.accountId)
      if (existing) {
        existing.debit += entry.debit
        existing.credit += entry.credit
      }
    })
    return Array.from(balances.values()).map(item => ({
      id: item.account.id,
      name: item.account.name,
      type: item.account.type,
      debit: item.debit,
      credit: item.credit,
    }))
  }, [accounts, ledgerEntries])

  const totalDebit = trialBalance.reduce((s, t) => s + t.debit, 0)
  const totalCredit = trialBalance.reduce((s, t) => s + t.credit, 0)

  return (
    <div className="space-y-4">
      <Card className="p-5">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-semibold text-slate-900">Trial Balance</h2>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium ${Math.abs(totalDebit - totalCredit) < 0.01 ? 'bg-emerald-100 text-emerald-700' : 'bg-red-100 text-red-700'}`}>
            {Math.abs(totalDebit - totalCredit) < 0.01 ? (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 13l4 4L19 7"/></svg>
                Balanced
              </>
            ) : (
              <>
                <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M12 8v4M12 16h.01"/></svg>
                Not Balanced (Difference: {fmt(Math.abs(totalDebit - totalCredit))})
              </>
            )}
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr>
                <Th>Account</Th>
                <Th>Type</Th>
                <Th className="text-right">Debit</Th>
                <Th className="text-right">Credit</Th>
              </tr>
            </thead>
            <tbody>
              {trialBalance.length === 0 ? <TrEmpty colSpan={4} message="No trial balance data" /> :
                trialBalance.map(t => (
                  <tr key={t.id as string} className="hover:bg-slate-50 transition-colors">
                    <td className="px-4 py-3 font-medium text-slate-800">{t.name}</td>
                    <td className="px-4 py-3 text-slate-600 capitalize">{t.type}</td>
                    <td className="px-4 py-3 font-mono text-slate-800 text-right">{t.debit > 0 ? fmt(t.debit) : '-'}</td>
                    <td className="px-4 py-3 font-mono text-slate-800 text-right">{t.credit > 0 ? fmt(t.credit) : '-'}</td>
                  </tr>
                ))}
            </tbody>
            <tfoot>
              <tr className="border-t-2 border-slate-300">
                <td colSpan={2} className="px-4 py-3 text-sm font-semibold text-slate-700">Total</td>
                <td className="px-4 py-3 font-mono font-semibold text-sky-600 text-right">{fmt(totalDebit)}</td>
                <td className="px-4 py-3 font-mono font-semibold text-violet-600 text-right">{fmt(totalCredit)}</td>
              </tr>
            </tfoot>
          </table>
        </div>
      </Card>
    </div>
  )
}
