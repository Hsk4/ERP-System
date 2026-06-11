import type {
    Account, AccountType, Customer, ID, LedgerEntry, LedgerRefType,
    Product, PurchaseInvoice, SaleInvoice, Vendor, Voucher,
} from '@erp/domain'

type Omit3<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export interface AccountingState {
  accounts: Account[]
  ledgerEntries: LedgerEntry[]
  customers: Customer[]
  vendors: Vendor[]
  products: Product[]
}

export type PostingResult =
  | { ok: true; entries: LedgerEntry[]; accounts: Account[]; customers: Customer[]; vendors: Vendor[]; products: Product[] }
  | { ok: false; error: string }

const isDebitNormal = (type: AccountType) => type === 'asset' || type === 'expense'

export function balanceDelta(type: AccountType, debit: number, credit: number): number {
  return isDebitNormal(type) ? debit - credit : credit - debit
}

export function applyAccountDelta(account: Account, debit: number, credit: number): Account {
  return { ...account, balance: account.balance + balanceDelta(account.type, debit, credit) }
}

function lastEntryBalance(entries: LedgerEntry[], accountId: ID, opening: number): number {
  const sorted = entries
    .filter(e => e.accountId === accountId)
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
  return sorted.length ? sorted[sorted.length - 1].balance : opening
}

function makeEntry(
  account: Account,
  entries: LedgerEntry[],
  patch: Omit3<LedgerEntry>,
  genId: () => ID,
  now: () => Date,
): LedgerEntry {
  const opening = account.balance
  const prev = lastEntryBalance(entries, account.id, opening)
  const delta = balanceDelta(account.type, patch.debit, patch.credit)
  return {
    ...patch,
    id: genId(),
    accountId: account.id,
    accountName: account.name,
    balance: prev + delta,
    createdAt: now(),
    updatedAt: now(),
  }
}

/** Post a balanced journal: one debit account, one credit account, same amount */
export function postJournal(
  state: AccountingState,
  debitAccountId: ID,
  creditAccountId: ID,
  amount: number,
  meta: { date: Date; description: string; refType: LedgerRefType; refNo: string },
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (amount <= 0) return { ok: false, error: 'Amount must be greater than zero.' }
  if (debitAccountId === creditAccountId) return { ok: false, error: 'Debit and credit accounts must be different.' }

  const debitAcc = state.accounts.find(a => a.id === debitAccountId)
  const creditAcc = state.accounts.find(a => a.id === creditAccountId)
  if (!debitAcc) return { ok: false, error: 'Debit account not found.' }
  if (!creditAcc) return { ok: false, error: 'Credit account not found.' }

  const entries = [...state.ledgerEntries]
  const e1 = makeEntry(debitAcc, entries, {
    accountId: debitAcc.id,
    accountName: debitAcc.name,
    date: meta.date,
    description: meta.description,
    refType: meta.refType,
    refNo: meta.refNo,
    debit: amount,
    credit: 0,
    balance: 0,
  }, genId, now)
  entries.push(e1)

  const e2 = makeEntry(creditAcc, entries, {
    accountId: creditAcc.id,
    accountName: creditAcc.name,
    date: meta.date,
    description: meta.description,
    refType: meta.refType,
    refNo: meta.refNo,
    debit: 0,
    credit: amount,
    balance: 0,
  }, genId, now)
  entries.push(e2)

  let accounts = state.accounts.map(a => {
    if (a.id === debitAcc.id) return applyAccountDelta(a, amount, 0)
    if (a.id === creditAcc.id) return applyAccountDelta(a, 0, amount)
    return a
  })

  const { customers, vendors } = syncPartiesFromAccounts(accounts, state.customers, state.vendors, now)
  return { ok: true, entries: [e1, e2], accounts, customers, vendors, products: state.products }
}

export function findIncomeAccount(accounts: Account[]): Account | undefined {
  return accounts.find(a => a.isActive && a.type === 'income')
    ?? accounts.find(a => a.isActive && /^4/.test(a.code))
}

export function findExpenseAccount(accounts: Account[]): Account | undefined {
  return accounts.find(a => a.isActive && a.type === 'expense')
    ?? accounts.find(a => a.isActive && /^5/.test(a.code))
}

export function findGstInputAccount(accounts: Account[]): Account | undefined {
  return accounts.find(a => a.isActive && /gst|sales tax|input tax|tax input/i.test(a.name))
    ?? accounts.find(a => a.isActive && a.type === 'asset' && /^11/.test(a.code))
}

export function resolveExpenseAccount(invoice: PurchaseInvoice, accounts: Account[]): Account | undefined {
  if (invoice.expenseAccountId) {
    const picked = accounts.find(a => a.id === invoice.expenseAccountId)
    if (picked) return picked
  }
  return findExpenseAccount(accounts)
}

/** Post multi-line journal (debits must equal credits) */
export function postCompoundJournal(
  state: AccountingState,
  lines: { accountId: ID; debit: number; credit: number }[],
  meta: { date: Date; description: string; refType: LedgerRefType; refNo: string },
  genId: () => ID,
  now: () => Date,
): PostingResult {
  const totalDr = lines.reduce((s, l) => s + l.debit, 0)
  const totalCr = lines.reduce((s, l) => s + l.credit, 0)
  if (Math.abs(totalDr - totalCr) > 0.01) {
    return { ok: false, error: `Journal not balanced (DR ${totalDr} ≠ CR ${totalCr}).` }
  }
  if (totalDr <= 0) return { ok: false, error: 'Journal amount must be greater than zero.' }

  let accounts = [...state.accounts]
  let entries = [...state.ledgerEntries]
  const newEntries: LedgerEntry[] = []

  for (const line of lines) {
    if (line.debit <= 0 && line.credit <= 0) continue
    const acc = accounts.find(a => a.id === line.accountId)
    if (!acc) return { ok: false, error: 'One or more accounts not found in journal.' }
    const entry = makeEntry(acc, entries, {
      accountId: acc.id,
      accountName: acc.name,
      date: meta.date,
      description: meta.description,
      refType: meta.refType,
      refNo: meta.refNo,
      debit: line.debit,
      credit: line.credit,
      balance: 0,
    }, genId, now)
    entries.push(entry)
    newEntries.push(entry)
    accounts = accounts.map(a => a.id === acc.id ? applyAccountDelta(a, line.debit, line.credit) : a)
  }

  const { customers, vendors } = syncPartiesFromAccounts(accounts, state.customers, state.vendors, now)
  return { ok: true, entries: newEntries, accounts, customers, vendors, products: state.products }
}

export function findEquityAccount(accounts: Account[]): Account | undefined {
  return accounts.find(a => a.isActive && a.type === 'equity')
    ?? accounts.find(a => a.isActive && /opening|equity|capital/i.test(a.name))
}

export function resolveCustomerAccount(
  partyId: ID,
  accounts: Account[],
  customers: Customer[],
): Account | undefined {
  const direct = accounts.find(a => a.id === partyId && a.category === 'customer')
  if (direct) return direct
  const cust = customers.find(c => c.id === partyId)
  if (cust?.accountId) return accounts.find(a => a.id === cust.accountId)
  if (cust) {
    return accounts.find(a => a.linkedPartyId === cust.id && a.category === 'customer')
  }
  return undefined
}

export function resolveVendorAccount(
  partyId: ID,
  accounts: Account[],
  vendors: Vendor[],
): Account | undefined {
  const direct = accounts.find(a => a.id === partyId && a.category === 'vendor')
  if (direct) return direct
  const vend = vendors.find(v => v.id === partyId)
  if (vend?.accountId) return accounts.find(a => a.id === vend.accountId)
  if (vend) {
    return accounts.find(a => a.linkedPartyId === vend.id && a.category === 'vendor')
  }
  return undefined
}

export function syncPartiesFromAccounts(
  accounts: Account[],
  customers: Customer[],
  vendors: Vendor[],
  now: () => Date,
): { customers: Customer[]; vendors: Vendor[] } {
  const nextCustomers = customers.map(c => {
    const acc = c.accountId
      ? accounts.find(a => a.id === c.accountId)
      : accounts.find(a => a.linkedPartyId === c.id && a.category === 'customer')
    if (!acc) return c
    return { ...c, name: acc.name, code: acc.code, balance: acc.balance, phone: acc.phone, email: acc.email, address: acc.address, creditLimit: acc.creditLimit ?? c.creditLimit, isActive: acc.isActive, updatedAt: now() }
  })
  const nextVendors = vendors.map(v => {
    const acc = v.accountId
      ? accounts.find(a => a.id === v.accountId)
      : accounts.find(a => a.linkedPartyId === v.id && a.category === 'vendor')
    if (!acc) return v
    return { ...v, name: acc.name, code: acc.code, balance: acc.balance, phone: acc.phone, email: acc.email, address: acc.address, isActive: acc.isActive, updatedAt: now() }
  })
  return { customers: nextCustomers, vendors: nextVendors }
}

function adjustStock(products: Product[], lines: { productId: ID; qty: number }[], direction: 1 | -1, now: () => Date): Product[] {
  return products.map(p => {
    const line = lines.find(l => l.productId === p.id)
    if (!line) return p
    return { ...p, stockQty: Math.max(0, p.stockQty + direction * line.qty), updatedAt: now() }
  })
}

export function findGstOutputAccount(accounts: Account[]): Account | undefined {
  return accounts.find(a => a.isActive && /gst|sales tax|output tax|tax output/i.test(a.name))
    ?? accounts.find(a => a.isActive && a.type === 'liability' && /^21/.test(a.code))
}

export function postSaleInvoiceTx(
  state: AccountingState,
  invoice: SaleInvoice,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (invoice.status !== 'draft') return { ok: false, error: 'Only draft invoices can be posted.' }

  const customerAcc = resolveCustomerAccount(invoice.customerId, state.accounts, state.customers)
  const revenueAcc = findIncomeAccount(state.accounts)
  if (!customerAcc) return { ok: false, error: 'Customer account missing. Add a Customer-category account in Accounts & Ledgers.' }
  if (!revenueAcc) return { ok: false, error: 'Sales Revenue account missing. Add an Income account (e.g. code 4001).' }
  if (invoice.grandTotal <= 0) return { ok: false, error: 'Invoice total must be greater than zero.' }

  const meta = {
    date: new Date(invoice.date),
    description: `Sale Invoice ${invoice.invoiceNo} — ${invoice.customerName}`,
    refType: 'sale_invoice' as LedgerRefType,
    refNo: invoice.invoiceNo,
  }

  const saleType = invoice.saleType ?? 'tax'
  let journal: PostingResult

  if (saleType === 'tax' && invoice.taxTotal > 0) {
    const gstAcc = findGstOutputAccount(state.accounts)
    if (!gstAcc) {
      return { ok: false, error: 'GST Output account missing. Add a liability account named "GST Output" for sales tax.' }
    }
    const revenueAmount = invoice.grandTotal - invoice.taxTotal
    journal = postCompoundJournal(state, [
      { accountId: customerAcc.id, debit: invoice.grandTotal, credit: 0 },
      { accountId: revenueAcc.id, debit: 0, credit: revenueAmount },
      { accountId: gstAcc.id, debit: 0, credit: invoice.taxTotal },
    ], meta, genId, now)
  } else {
    journal = postJournal(state, customerAcc.id, revenueAcc.id, invoice.grandTotal, meta, genId, now)
  }
  if (!journal.ok) return journal

  const products = adjustStock(journal.products, invoice.lines, -1, now)
  return { ...journal, products }
}

export function postPurchaseInvoiceTx(
  state: AccountingState,
  invoice: PurchaseInvoice,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (invoice.status !== 'draft') return { ok: false, error: 'Only draft invoices can be posted.' }

  const vendorAcc = resolveVendorAccount(invoice.vendorId, state.accounts, state.vendors)
  const expenseAcc = resolveExpenseAccount(invoice, state.accounts)
  if (!vendorAcc) return { ok: false, error: 'Vendor account missing. Add a Vendor-category account in Accounts & Ledgers.' }
  if (!expenseAcc) return { ok: false, error: 'Expense/Purchases account missing. Add an Expense account (e.g. code 5001).' }
  if (invoice.grandTotal <= 0) return { ok: false, error: 'Invoice total must be greater than zero.' }

  const meta = {
    date: new Date(invoice.date),
    description: `Purchase ${invoice.invoiceNo} — ${invoice.vendorName}`,
    refType: 'purchase_invoice' as LedgerRefType,
    refNo: invoice.invoiceNo,
  }

  const purchaseType = invoice.purchaseType ?? 'tax'
  let journal: PostingResult

  if (purchaseType === 'tax' && invoice.taxTotal > 0) {
    const gstAcc = findGstInputAccount(state.accounts)
    if (!gstAcc) {
      return { ok: false, error: 'GST Input account missing. Add an asset account named "GST Input" for purchase tax.' }
    }
    const expenseAmount = invoice.grandTotal - invoice.taxTotal
    journal = postCompoundJournal(state, [
      { accountId: expenseAcc.id, debit: expenseAmount, credit: 0 },
      { accountId: gstAcc.id, debit: invoice.taxTotal, credit: 0 },
      { accountId: vendorAcc.id, debit: 0, credit: invoice.grandTotal },
    ], meta, genId, now)
  } else {
    journal = postJournal(state, expenseAcc.id, vendorAcc.id, invoice.grandTotal, meta, genId, now)
  }
  if (!journal.ok) return journal

  const products = adjustStock(journal.products, invoice.lines, 1, now)
  return { ...journal, products }
}

export function postVoucherTx(
  state: AccountingState,
  voucher: Voucher,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (voucher.isPosted) return { ok: false, error: 'Voucher is already posted.' }
  if (voucher.amount <= 0) return { ok: false, error: 'Voucher amount must be greater than zero.' }

  const cashBank = state.accounts.find(a => a.id === voucher.accountId)
  if (!cashBank) return { ok: false, error: 'Cash/Bank account not found.' }

  const isReceipt = voucher.type === 'cash_receipt' || voucher.type === 'bank_receipt'

  if (isReceipt) {
    if (!voucher.partyId) return { ok: false, error: 'Select a customer for this receipt.' }
    const customerAcc = resolveCustomerAccount(voucher.partyId, state.accounts, state.customers)
    if (!customerAcc) return { ok: false, error: 'Customer account not found for this receipt.' }
    return postJournal(state, cashBank.id, customerAcc.id, voucher.amount, {
      date: new Date(voucher.date),
      description: `Receipt ${voucher.voucherNo} — ${voucher.partyName ?? customerAcc.name}`,
      refType: 'voucher',
      refNo: voucher.voucherNo,
    }, genId, now)
  }

  if (!voucher.partyId) return { ok: false, error: 'Select a vendor for this payment.' }
  const vendorAcc = resolveVendorAccount(voucher.partyId, state.accounts, state.vendors)
  if (!vendorAcc) return { ok: false, error: 'Vendor account not found for this payment.' }
  return postJournal(state, vendorAcc.id, cashBank.id, voucher.amount, {
    date: new Date(voucher.date),
    description: `Payment ${voucher.voucherNo} — ${voucher.partyName ?? vendorAcc.name}`,
    refType: 'voucher',
    refNo: voucher.voucherNo,
  }, genId, now)
}

export function reverseSaleInvoiceTx(
  state: AccountingState,
  invoice: SaleInvoice,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (invoice.status !== 'posted') return { ok: false, error: 'Only posted invoices can be cancelled.' }
  const customerAcc = resolveCustomerAccount(invoice.customerId, state.accounts, state.customers)
  const revenueAcc = findIncomeAccount(state.accounts)
  if (!customerAcc || !revenueAcc) return { ok: false, error: 'Cannot reverse: linked accounts missing.' }

  const meta = {
    date: now(),
    description: `Reversal — ${invoice.invoiceNo}`,
    refType: 'sale_invoice' as LedgerRefType,
    refNo: `${invoice.invoiceNo}-REV`,
  }

  const saleType = invoice.saleType ?? 'tax'
  let journal: PostingResult

  if (saleType === 'tax' && invoice.taxTotal > 0) {
    const gstAcc = findGstOutputAccount(state.accounts)
    if (!gstAcc) return { ok: false, error: 'Cannot reverse: GST Output account missing.' }
    const revenueAmount = invoice.grandTotal - invoice.taxTotal
    journal = postCompoundJournal(state, [
      { accountId: revenueAcc.id, debit: revenueAmount, credit: 0 },
      { accountId: gstAcc.id, debit: invoice.taxTotal, credit: 0 },
      { accountId: customerAcc.id, debit: 0, credit: invoice.grandTotal },
    ], meta, genId, now)
  } else {
    journal = postJournal(state, revenueAcc.id, customerAcc.id, invoice.grandTotal, meta, genId, now)
  }
  if (!journal.ok) return journal
  const products = adjustStock(journal.products, invoice.lines, 1, now)
  return { ...journal, products }
}

export function reversePurchaseInvoiceTx(
  state: AccountingState,
  invoice: PurchaseInvoice,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (invoice.status !== 'posted') return { ok: false, error: 'Only posted invoices can be cancelled.' }
  const vendorAcc = resolveVendorAccount(invoice.vendorId, state.accounts, state.vendors)
  const expenseAcc = resolveExpenseAccount(invoice, state.accounts)
  if (!vendorAcc || !expenseAcc) return { ok: false, error: 'Cannot reverse: linked accounts missing.' }

  const meta = {
    date: now(),
    description: `Reversal — ${invoice.invoiceNo}`,
    refType: 'purchase_invoice' as LedgerRefType,
    refNo: `${invoice.invoiceNo}-REV`,
  }

  const purchaseType = invoice.purchaseType ?? 'tax'
  let journal: PostingResult

  if (purchaseType === 'tax' && invoice.taxTotal > 0) {
    const gstAcc = findGstInputAccount(state.accounts)
    if (!gstAcc) return { ok: false, error: 'Cannot reverse: GST Input account missing.' }
    const expenseAmount = invoice.grandTotal - invoice.taxTotal
    journal = postCompoundJournal(state, [
      { accountId: vendorAcc.id, debit: invoice.grandTotal, credit: 0 },
      { accountId: expenseAcc.id, debit: 0, credit: expenseAmount },
      { accountId: gstAcc.id, debit: 0, credit: invoice.taxTotal },
    ], meta, genId, now)
  } else {
    journal = postJournal(state, vendorAcc.id, expenseAcc.id, invoice.grandTotal, meta, genId, now)
  }
  if (!journal.ok) return journal
  const products = adjustStock(journal.products, invoice.lines, -1, now)
  return { ...journal, products }
}

export function postOpeningBalance(
  state: AccountingState,
  account: Account,
  genId: () => ID,
  now: () => Date,
): PostingResult {
  if (account.balance <= 0) return { ok: true, entries: [], accounts: state.accounts, customers: state.customers, vendors: state.vendors, products: state.products }

  let equity = findEquityAccount(state.accounts)
  let accounts = state.accounts
  if (!equity) {
    equity = {
      id: genId(),
      code: '3001',
      name: 'Opening Balance Equity',
      type: 'equity',
      category: 'general',
      balance: 0,
      isActive: true,
      createdAt: now(),
      updatedAt: now(),
    }
    accounts = [equity, ...accounts]
  }

  const refNo = `OB-${account.code}`
  if (isDebitNormal(account.type)) {
    return postJournal({ ...state, accounts }, account.id, equity.id, account.balance, {
      date: now(),
      description: `Opening balance — ${account.name}`,
      refType: 'manual',
      refNo,
    }, genId, now)
  }
  return postJournal({ ...state, accounts }, equity.id, account.id, account.balance, {
    date: now(),
    description: `Opening balance — ${account.name}`,
    refType: 'manual',
    refNo,
  }, genId, now)
}

export function trialBalanceTotals(accounts: Account[], ledgerEntries: LedgerEntry[]) {
  let totalDebit = 0
  let totalCredit = 0
  for (const a of accounts.filter(x => x.isActive)) {
    const entries = ledgerEntries.filter(e => e.accountId === a.id)
    totalDebit += entries.reduce((s, e) => s + e.debit, 0)
    totalCredit += entries.reduce((s, e) => s + e.credit, 0)
  }
  return { totalDebit, totalCredit, balanced: Math.abs(totalDebit - totalCredit) < 0.01 }
}
