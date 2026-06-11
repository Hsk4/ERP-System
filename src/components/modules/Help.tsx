import React, { useState } from 'react'
import { Card, Tabs } from '@erp/ui'
import { clsx } from 'clsx'

type Lang = 'en' | 'ur'

interface Step { title: string; body: string; module: string }
interface Section { id: string; title: string; steps: Step[] }
interface JournalRule { debit: string; credit: string; when: string }

const CONTENT: Record<Lang, {
  intro: string
  flowTitle: string
  sectionsTitle: string
  accountingTitle: string
  accountingIntro: string
  journalRules: JournalRule[]
  consistencyTitle: string
  consistencyPoints: string[]
  sections: Section[]
  accountNote: { title: string; body: string }
  tipsTitle: string
  tips: string[]
}> = {
  en: {
    intro: 'This guide explains how ERP System works end-to-end — setup, daily transactions, double-entry accounting, and reports. Follow the steps in order for predictable results.',
    flowTitle: 'Recommended workflow',
    sectionsTitle: 'Module guide',
    accountingTitle: 'Double-entry accounting (how posting works)',
    accountingIntro: 'Every posted transaction creates a balanced journal: total Debit = total Credit. Draft invoices and draft vouchers do not affect accounts until you click Post.',
    journalRules: [
      { when: 'Sale invoice posted', debit: 'Customer account (Receivable)', credit: 'Sales Revenue (Income)' },
      { when: 'Purchase (Sales Tax) posted', debit: 'Purchases + GST Input', credit: 'Vendor (incl. tax)' },
      { when: 'Purchase (Non Tax) posted', debit: 'Expense / Purchases account', credit: 'Vendor account (Payable)' },
      { when: 'Cash/Bank receipt', debit: 'Cash or Bank account', credit: 'Customer account' },
      { when: 'Cash/Bank payment', debit: 'Vendor account', credit: 'Cash or Bank account' },
      { when: 'Manual journal', debit: 'Account A', credit: 'Account B (same amount)' },
      { when: 'Opening balance', debit: 'Asset account', credit: 'Opening Balance Equity (auto)' },
    ],
    consistencyTitle: 'Data consistency rules',
    consistencyPoints: [
      'Customer and Vendor names come from Accounts — one source, used in invoices, challans, vouchers, and reports.',
      'Posting a sale reduces stock; posting a purchase increases stock.',
      'Account balances, party balances, and ledger entries update together on every post.',
      'Trial Balance must show equal total Debits and Credits after all postings.',
      'Cancel a posted invoice to reverse its journal and restore stock.',
    ],
    accountNote: {
      title: 'Account categories (required setup)',
      body: 'Before transactions, create: (1) Customer accounts; (2) Vendor accounts; (3) Cash & Bank; (4) Income (Sales Revenue); (5) Expense (Purchases/COGS); (6) GST Input asset account for Purchase (Sales Tax). Use Purchases module tabs for tax vs non-tax entries.',
    },
    tipsTitle: 'Quick tips',
    tips: [
      'Save invoices as Draft first, review, then Post.',
      'If Post fails, read the red message — it tells you which account is missing.',
      'Check Trial Balance under Accounts & Ledgers to verify books are balanced.',
      'Use Help anytime — workflow does not change between dev and desktop release.',
    ],
    sections: [
      {
        id: 'setup',
        title: '1. Initial setup',
        steps: [
          { module: 'Settings', title: 'Company & tax', body: 'Set company name, sales tax %, and GST %. These apply to new invoice lines automatically.' },
          { module: 'Accounts & Ledgers', title: 'Chart of accounts', body: 'Create Customer, Vendor, Cash, Bank, Income, and Expense accounts. Enter opening balances — system posts opening journals automatically.' },
          { module: 'Inventory', title: 'Products', body: 'Add products with code, unit, sale/purchase price, and opening stock. Stock updates when invoices are posted.' },
        ],
      },
      {
        id: 'daily',
        title: '2. Daily operations',
        steps: [
          { module: 'Purchases', title: 'Purchase (Sales Tax)', body: 'Tab: Purchase (Sales Tax). Enter vendor bill, GST on lines, expense account. Post: DR Purchases (excl. tax), DR GST Input, CR Vendor. Serial prefix PIT-.' },
          { module: 'Purchases', title: 'Purchase (Non Tax)', body: 'Tab: Purchase (Non Tax). Line discounts, additional discount, carriage. No GST. Post: DR Expense, CR Vendor. Serial prefix PIN-.' },
          { module: 'Sales & Invoicing', title: 'Sale invoices', body: 'Select a Customer account, add lines, save Draft or Post. Posting: DR Customer, CR Sales Revenue, stock decreases.' },
          { module: 'Delivery Challans', title: 'Dispatch', body: 'Link to a posted sale invoice or add items manually. Tracks delivery status only — no extra journal.' },
          { module: 'Cash & Bank', title: 'Receipts & payments', body: 'Create voucher (draft), then Post. Receipt: money in from customer. Payment: money out to vendor. Always pick Cash/Bank + party.' },
        ],
      },
      {
        id: 'review',
        title: '3. Review & reports',
        steps: [
          { module: 'Accounts & Ledgers', title: 'Ledgers & trial balance', body: 'View per-account ledger, receivables, payables, trial balance (debits = credits), and balance sheet.' },
          { module: 'Reports', title: 'Business reports', body: 'Sales by customer, purchases by vendor, profit, and inventory — all driven from posted data.' },
          { module: 'Dashboard', title: 'Overview', body: 'Today\'s sales/purchases, cash & bank, receivables, payables, low-stock alerts.' },
        ],
      },
    ],
  },
  ur: {
    intro: 'Yeh guide batati hai ke ERP System kaise chalta hai — setup se le kar daily transactions, double-entry accounting, aur reports tak. Step-by-step follow karein taake har result predictable ho.',
    flowTitle: 'Recommended workflow',
    sectionsTitle: 'Module guide',
    accountingTitle: 'Double-entry accounting (posting kaise hoti hai)',
    accountingIntro: 'Har posted transaction balanced journal banati hai: total Debit = total Credit. Draft invoices aur draft vouchers tab tak accounts affect nahi karte jab tak Post na karein.',
    journalRules: [
      { when: 'Sale invoice post', debit: 'Customer account (Receivable)', credit: 'Sales Revenue (Income account)' },
      { when: 'Purchase (Sales Tax) post', debit: 'Purchases + GST Input', credit: 'Vendor (incl. tax)' },
      { when: 'Purchase (Non Tax) post', debit: 'Expense / Purchases', credit: 'Vendor account' },
      { when: 'Cash/Bank receipt', debit: 'Cash ya Bank account', credit: 'Customer account' },
      { when: 'Cash/Bank payment', debit: 'Vendor account', credit: 'Cash ya Bank account' },
      { when: 'Manual journal', debit: 'Account A', credit: 'Account B (same amount)' },
      { when: 'Opening balance', debit: 'Asset account', credit: 'Opening Balance Equity (auto)' },
    ],
    consistencyTitle: 'Data consistency rules',
    consistencyPoints: [
      'Customer aur Vendor ke names Accounts se aate hain — ek hi source, invoices, challans, vouchers, reports sab mein same.',
      'Sale post karne par stock kam hota hai; purchase post par stock barhta hai.',
      'Account balance, party balance, aur ledger entries ek saath update hoti hain jab Post karein.',
      'Trial Balance mein total Debits aur Credits equal hone chahiye.',
      'Posted invoice cancel karein to uska journal reverse ho jata hai aur stock wapas adjust hota hai.',
    ],
    accountNote: {
      title: 'Account categories (pehle setup zaroori)',
      body: 'Transactions se pehle banayein: (1) Customer accounts — Sales & Challans mein; (2) Vendor accounts — Purchases mein; (3) Cash & Bank — vouchers ke liye; (4) Income account jaise Sales Revenue code 4001; (5) Expense account jaise COGS code 5001. Account edit karein to naam poori app mein sync ho jata hai.',
    },
    tipsTitle: 'Quick tips',
    tips: [
      'Pehle invoice Draft save karein, check karein, phir Post karein.',
      'Agar Post fail ho to red message parhein — batata hai kaun sa account missing hai.',
      'Accounts & Ledgers → Trial Balance se verify karein ke books balanced hain.',
      'Help page hamesha available hai — desktop release aur dev dono mein same flow.',
    ],
    sections: [
      {
        id: 'setup',
        title: '1. Initial setup',
        steps: [
          { module: 'Settings', title: 'Company & tax', body: 'Company name, sales tax %, aur GST % set karein. Nayi invoice lines par yeh rates auto apply hoti hain.' },
          { module: 'Accounts & Ledgers', title: 'Chart of accounts', body: 'Customer, Vendor, Cash, Bank, Income, aur Expense accounts banayein. Opening balance dalen — system opening journal auto post karta hai.' },
          { module: 'Inventory', title: 'Products', body: 'Products code, unit, sale/purchase price, aur opening stock ke sath add karein. Stock tab update hota hai jab invoice post ho.' },
        ],
      },
      {
        id: 'daily',
        title: '2. Daily operations',
        steps: [
          { module: 'Purchases', title: 'Purchase (Sales Tax)', body: 'Tab: Purchase (Sales Tax). Vendor bill, line GST, expense account. Post: DR Purchases (excl. tax), DR GST Input, CR Vendor. Serial PIT-.' },
          { module: 'Purchases', title: 'Purchase (Non Tax)', body: 'Tab: Purchase (Non Tax). Line discount, additional discount, carriage. No GST. Post: DR Expense, CR Vendor. Serial PIN-.' },
          { module: 'Sales & Invoicing', title: 'Sale invoices', body: 'Customer account select karein, lines add karein, Draft save ya Post. Post par: DR Customer, CR Sales Revenue, stock kum hoga.' },
          { module: 'Delivery Challans', title: 'Dispatch', body: 'Posted sale invoice se link karein ya manual items. Sirf delivery track hoti hai — extra journal nahi.' },
          { module: 'Cash & Bank', title: 'Receipts & payments', body: 'Voucher draft banayein, phir Post. Receipt: customer se paisa aaya. Payment: vendor ko gaya. Cash/Bank + party dono select karein.' },
        ],
      },
      {
        id: 'review',
        title: '3. Review & reports',
        steps: [
          { module: 'Accounts & Ledgers', title: 'Ledgers & trial balance', body: 'Har account ka ledger, receivables, payables, trial balance (debits = credits), aur balance sheet dekhein.' },
          { module: 'Reports', title: 'Business reports', body: 'Sales by customer, purchases by vendor, profit, inventory — sab posted data se.' },
          { module: 'Dashboard', title: 'Overview', body: 'Aaj ki sales/purchases, cash & bank, receivables, payables, low-stock alerts.' },
        ],
      },
    ],
  },
}

const FLOW_STEPS: Record<Lang, string[]> = {
  en: ['Settings', 'Accounts', 'Inventory', 'Purchases', 'Sales', 'Challans', 'Cash & Bank', 'Reports'],
  ur: ['Settings', 'Accounts', 'Inventory', 'Purchases', 'Sales', 'Challans', 'Cash & Bank', 'Reports'],
}

const StepCard: React.FC<{ step: Step; rtl?: boolean }> = ({ step, rtl }) => (
  <div className={clsx('rounded-lg border border-slate-200 bg-slate-50/60 p-4', rtl && 'text-right')} dir={rtl ? 'rtl' : 'ltr'}>
    <div className={clsx('flex items-center gap-2 mb-1.5', rtl && 'flex-row-reverse')}>
      <span className="text-[10px] font-semibold uppercase tracking-wide text-sky-700 bg-sky-50 border border-sky-200 px-2 py-0.5 rounded">{step.module}</span>
    </div>
    <h4 className="text-sm font-semibold text-slate-800">{step.title}</h4>
    <p className="text-xs text-slate-600 mt-1 leading-relaxed">{step.body}</p>
  </div>
)

export const HelpModule: React.FC = () => {
  const [lang, setLang] = useState<Lang>('en')
  const c = CONTENT[lang]
  const rtl = lang === 'ur'

  return (
    <div className="max-w-3xl space-y-5">
      <Card>
        <Tabs
          tabs={[{ id: 'en', label: 'English' }, { id: 'ur', label: 'Urdu / English mix' }]}
          active={lang}
          onChange={id => setLang(id as Lang)}
        />
        <div className={clsx('p-5 space-y-6', rtl && 'text-right')} dir={rtl ? 'rtl' : 'ltr'}>
          <p className="text-sm text-slate-600 leading-relaxed">{c.intro}</p>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-3">{c.flowTitle}</h3>
            <div className={clsx('flex flex-wrap items-center gap-2', rtl && 'flex-row-reverse justify-end')}>
              {FLOW_STEPS[lang].map((label, i) => (
                <React.Fragment key={label}>
                  <span className="text-xs font-medium text-slate-700 bg-white border border-slate-200 rounded-lg px-3 py-1.5 shadow-sm">
                    <span className="text-sky-600 font-mono mr-1">{i + 1}.</span>{label}
                  </span>
                  {i < FLOW_STEPS[lang].length - 1 && (
                    <span className="text-slate-300 text-sm hidden sm:inline">{rtl ? '←' : '→'}</span>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-amber-200 bg-amber-50/80 p-4">
            <h3 className="text-sm font-semibold text-amber-900">{c.accountNote.title}</h3>
            <p className="text-xs text-amber-800 mt-1.5 leading-relaxed">{c.accountNote.body}</p>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">{c.accountingTitle}</h3>
            <p className="text-xs text-slate-600 mb-3 leading-relaxed">{c.accountingIntro}</p>
            <div className="border border-slate-200 rounded-lg overflow-hidden text-xs">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Transaction</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Debit (DR)</th>
                    <th className="px-3 py-2 text-left font-medium text-slate-500">Credit (CR)</th>
                  </tr>
                </thead>
                <tbody>
                  {c.journalRules.map(r => (
                    <tr key={r.when} className="border-b border-slate-100 last:border-0">
                      <td className="px-3 py-2 text-slate-700">{r.when}</td>
                      <td className="px-3 py-2 text-sky-700 font-medium">{r.debit}</td>
                      <td className="px-3 py-2 text-violet-700 font-medium">{r.credit}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-2">{c.consistencyTitle}</h3>
            <ul className={clsx('text-xs text-slate-600 space-y-1.5 list-disc', rtl ? 'pr-4' : 'pl-4')}>
              {c.consistencyPoints.map(p => <li key={p}>{p}</li>)}
            </ul>
          </div>

          <div>
            <h3 className="text-sm font-semibold text-slate-800 mb-4">{c.sectionsTitle}</h3>
            <div className="space-y-6">
              {c.sections.map(section => (
                <div key={section.id}>
                  <h4 className="text-xs font-semibold uppercase tracking-wide text-slate-500 mb-3">{section.title}</h4>
                  <div className="space-y-3">
                    {section.steps.map(step => <StepCard key={step.title} step={step} rtl={rtl} />)}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <h3 className="text-sm font-semibold text-slate-800 mb-2">{c.tipsTitle}</h3>
            <ul className={clsx('text-xs text-slate-600 space-y-1.5 list-disc', rtl ? 'pr-4' : 'pl-4')}>
              {c.tips.map(t => <li key={t}>{t}</li>)}
            </ul>
          </div>
        </div>
      </Card>
    </div>
  )
}
