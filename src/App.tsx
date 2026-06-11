import { Alert } from '@erp/ui'
import React from 'react'
import { Header } from './components/layout/Header'
import { Sidebar } from './components/layout/Sidebar'
import { AccountsModule } from './components/modules/Accounts'
import { CashBankModule } from './components/modules/CashBank'
import { ChallansModule } from './components/modules/Challans'
import { DashboardModule } from './components/modules/Dashboard'
import { GatePassesModule } from './components/modules/GatePasses'
import { HelpModule } from './components/modules/Help'
import { InventoryModule } from './components/modules/Inventory'
import { LedgersModule } from './components/modules/Ledgers'
import { PurchaseReportModule } from './components/modules/PurchaseReport'
import { PurchasesModule } from './components/modules/Purchases'
import { ReportsModule } from './components/modules/Reports'
import { SalesModule } from './components/modules/Sales'
import { SettingsModule } from './components/modules/Settings'
import { TrialBalanceModule } from './components/modules/TrialBalance'
import { VendorBalancesModule } from './components/modules/VendorBalances'
import { useStore } from './store'

const modules: Record<string, React.FC> = {
  dashboard: DashboardModule,
  sales: SalesModule,
  purchases: PurchasesModule,
  cash: CashBankModule,
  inventory: InventoryModule,
  gatepasses: GatePassesModule,
  challans: ChallansModule,
  accounts: AccountsModule,
  ledgers: LedgersModule,
  vendorbalances: VendorBalancesModule,
  purchasereport: PurchaseReportModule,
  trialbalance: TrialBalanceModule,
  reports: ReportsModule,
  help: HelpModule,
  settings: SettingsModule,
}

export default function App() {
  const { activeModule, systemMessage, clearSystemMessage } = useStore()
  const Module = modules[activeModule] ?? DashboardModule

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: 'var(--erp-bg)', color: 'var(--erp-text)' }}>
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header />
        {systemMessage && (
          <div className="px-6 pt-4">
            <Alert variant={systemMessage.variant}>
              <div className="flex items-center justify-between gap-4 w-full">
                <span>{systemMessage.text}</span>
                <button type="button" onClick={clearSystemMessage} className="text-slate-500 hover:text-slate-800 shrink-0">Dismiss</button>
              </div>
            </Alert>
          </div>
        )}
        <main className="flex-1 overflow-y-auto p-6">
          <Module />
        </main>
      </div>
    </div>
  )
}
