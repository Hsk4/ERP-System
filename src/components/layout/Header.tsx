import React from 'react'
import { useStore, selectLowStock, selectDraftSales } from '../../store'

const META: Record<string, { title: string; sub: string }> = {
  dashboard:  { title: 'Dashboard',          sub: 'Business overview & key metrics'              },
  sales:      { title: 'Sales & Invoicing',  sub: 'Manage sale invoices and customer billing'    },
  purchases:  { title: 'Purchases',           sub: 'Purchase (Sales Tax) and Purchase (Non Tax)'  },
  cash:       { title: 'Cash & Bank',         sub: 'Receipts, payments and vouchers'             },
  inventory:  { title: 'Inventory',           sub: 'Products, stock levels and reorder alerts'   },
  challans:   { title: 'Delivery Challans',   sub: 'Track goods dispatches and deliveries'       },
  accounts:   { title: 'Accounts & Ledgers',  sub: 'Chart of accounts and party ledgers'         },
  reports:    { title: 'Reports',             sub: 'Financial and operational reports'            },
  help:       { title: 'Help',                sub: 'System guide in English and Urdu'              },
  settings:   { title: 'Settings',            sub: 'System configuration and preferences'        },
}

export const Header: React.FC = () => {
  const activeModule = useStore(s => s.activeModule)
  const lowStock     = useStore(selectLowStock)
  const drafts       = useStore(selectDraftSales)
  const { title, sub } = META[activeModule] ?? { title: activeModule, sub: '' }
  const today = new Date().toLocaleDateString('en-PK', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })

  const alerts = lowStock.length + drafts.length

  return (
    <header className="h-14 bg-white border-b border-slate-200 flex items-center justify-between px-6 flex-shrink-0">
      <div>
        <h1 className="text-[14px] font-semibold text-slate-900 leading-tight">{title}</h1>
        <p className="text-[11px] text-slate-500">{sub}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[11px] text-slate-400 font-mono hidden lg:block">{today}</span>
        <button className="relative p-2 text-slate-500 hover:text-slate-700 hover:bg-slate-100 rounded-lg transition-all">
          <svg width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0"/>
          </svg>
          {alerts > 0 && (
            <span className="absolute top-1 right-1 w-4 h-4 bg-amber-500 text-white text-[9px] font-bold rounded-full flex items-center justify-center">
              {alerts}
            </span>
          )}
        </button>
      </div>
    </header>
  )
}
