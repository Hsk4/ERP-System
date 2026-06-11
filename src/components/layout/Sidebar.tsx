import React from 'react'
import { clsx } from 'clsx'
import { useStore, selectLowStock } from '../../store'

interface NavItem { id: string; label: string; icon: React.ReactNode; badge?: number }

const Ico = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24" strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
)

const NAV: NavItem[] = [
  { id: 'dashboard', label: 'Dashboard', icon: <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /> },
  { id: 'sales', label: 'Sales & Invoicing', icon: <Ico d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" d2="M14 2v6h6M16 13H8M16 17H8M10 9H8" /> },
  { id: 'purchases', label: 'Purchases', icon: <Ico d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4zM3 6h18M16 10a4 4 0 0 1-8 0" /> },
  { id: 'cash', label: 'Cash & Bank', icon: <Ico d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" /> },
  { id: 'inventory', label: 'Inventory', icon: <Ico d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z" /> },
  { id: 'gatepasses', label: 'Gate Passes', icon: <Ico d="M4 4h16v16H4zM8 12h8M12 8v8" /> },
  { id: 'challans', label: 'Delivery Challans', icon: <Ico d="M1 3h15v13H1zM16 8l4 4-4 4" /> },
  { id: 'accounts', label: 'Accounts & Ledgers', icon: <Ico d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2zM22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z" /> },
  { id: 'ledgers', label: 'Ledgers', icon: <Ico d="M9 19v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6M3 19h18" /> },
  { id: 'vendorbalances', label: 'Vendor Balances', icon: <Ico d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2" /> },
  { id: 'purchasereport', label: 'Purchase Report', icon: <Ico d="M9 19v-6a2 2 0 0 1 2-2h2a2 2 0 0 1 2 2v6M3 19h18" /> },
  { id: 'trialbalance', label: 'Trial Balance', icon: <Ico d="M18 20V10M12 20V4M6 20v-6" /> },
  { id: 'reports', label: 'Reports', icon: <Ico d="M18 20V10M12 20V4M6 20v-6" /> },
  { id: 'help', label: 'Help', icon: <Ico d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3M12 17h.01" /> },
]

export const Sidebar: React.FC = () => {
  const activeModule  = useStore(s => s.activeModule)
  const setActiveModule = useStore(s => s.setActiveModule)
  const companyName   = useStore(s => s.settings.companyName)
  const lowStock      = useStore(selectLowStock)

  return (
    <aside className="w-[220px] h-screen flex flex-col flex-shrink-0 select-none border-r" style={{ background: 'var(--erp-surface)', borderColor: 'var(--erp-border)' }}>
      {/* Logo */}
      <div className="px-5 py-[18px] border-b border-slate-200 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-sky-600 flex items-center justify-center flex-shrink-0">
          <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
            <rect x="1" y="1" width="6" height="6" rx="1.5" fill="#ffffff"/>
            <rect x="9" y="1" width="6" height="6" rx="1.5" fill="#ffffff" opacity=".7"/>
            <rect x="1" y="9" width="6" height="6" rx="1.5" fill="#ffffff" opacity=".7"/>
            <rect x="9" y="9" width="6" height="6" rx="1.5" fill="#ffffff"/>
          </svg>
        </div>
        <div>
          <p className="text-[13px] font-semibold text-slate-900 leading-tight">ERP System</p>
          <p className="text-[11px] text-slate-500 truncate">{companyName}</p>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-2 px-2 overflow-y-auto scrollbar-thin space-y-0.5">
        {NAV.map(item => {
          const badge = item.id === 'inventory' ? (lowStock.length || undefined) : undefined
          const active = activeModule === item.id
          return (
            <button key={item.id} onClick={() => setActiveModule(item.id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all duration-100 group',
                active ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
              )}>
              <span className={clsx('flex-shrink-0', active ? 'text-sky-600' : 'text-slate-400 group-hover:text-slate-600')}>
                {item.icon}
              </span>
              <span className="flex-1 text-left truncate">{item.label}</span>
              {badge && (
                <span className="flex-shrink-0 bg-amber-50 text-amber-700 text-[10px] px-1.5 py-0.5 rounded border border-amber-200 font-mono">
                  {badge}
                </span>
              )}
            </button>
          )
        })}
      </nav>

      {/* Bottom */}
      <div className="px-2 py-2 border-t border-slate-200">
        <button onClick={() => setActiveModule('settings')}
          className={clsx('w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-[12.5px] font-medium transition-all',
            activeModule === 'settings' ? 'bg-sky-50 text-sky-700' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
          )}>
          <Ico d="M12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6zM19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2h-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2h.09a1.65 1.65 0 0 0 1.51 1 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z" />
          Settings
        </button>
      </div>

      {/* User */}
      <div className="px-4 py-3 border-t border-slate-200 flex items-center gap-2.5">
        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-[10px] font-semibold text-slate-600 flex-shrink-0">A</div>
        <div className="min-w-0">
          <p className="text-[11px] font-medium text-slate-700 truncate">Administrator</p>
          <p className="text-[10px] text-slate-400 truncate">admin@company.pk</p>
        </div>
      </div>
    </aside>
  )
}
