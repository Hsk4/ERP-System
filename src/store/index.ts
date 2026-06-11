import type {
    Account,
    Customer,
    DeliveryChallan,
    GatePass,
    ID,
    LedgerEntry,
    Product,
    PurchaseInvoice,
    SaleInvoice,
    Vendor,
    Voucher,
    VoucherType
} from '@erp/domain'
import { makeId } from '@erp/domain'
import {
    mockAccounts,
    mockChallans,
    mockCustomers,
    mockLedgerEntries,
    mockProducts,
    mockPurchaseInvoices,
    mockSaleInvoices,
    mockVendors,
    mockVouchers,
} from '@erp/mock-seed'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import {
    buildLinkedCustomer, buildLinkedVendor, propagateAccountName, syncPartyFromAccount,
} from '../lib/account-sync'
import {
    postJournal, postOpeningBalance, postPurchaseInvoiceTx, postSaleInvoiceTx,
    postVoucherTx, reversePurchaseInvoiceTx, reverseSaleInvoiceTx, type AccountingState,
} from '../lib/accounting'
import { applyTheme, DEFAULT_SETTINGS, loadSettings, saveSettings, type AppSettings } from '../lib/settings'

// Release builds always start empty: production aliases @erp/mock-seed → empty.ts
const USE_MOCK = import.meta.env.PROD
  ? false
  : import.meta.env.VITE_USE_MOCK === 'true'

const genId = (): ID => makeId(Math.random().toString(36).slice(2, 10))
const now = () => new Date()

type Omit3<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

const mockData = {
  customers:        mockCustomers,
  vendors:          mockVendors,
  products:         mockProducts,
  saleInvoices:     mockSaleInvoices,
  purchaseInvoices: mockPurchaseInvoices,
  vouchers:         mockVouchers,
  challans:         mockChallans,
  gatePasses:       [] as GatePass[],
  accounts:         mockAccounts,
  ledgerEntries:    mockLedgerEntries,
  notes:            "Welcome to your ERP system!\n\n- Add notes here\n- Use this space to jot down quick reminders\n",
}

const emptyData = {
  customers:        [] as Customer[],
  vendors:          [] as Vendor[],
  products:         [] as Product[],
  saleInvoices:     [] as SaleInvoice[],
  purchaseInvoices: [] as PurchaseInvoice[],
  vouchers:         [] as Voucher[],
  challans:         [] as DeliveryChallan[],
  gatePasses:       [] as GatePass[],
  accounts:         [] as Account[],
  ledgerEntries:    [] as LedgerEntry[],
  notes:            "",
}

interface AppState {
  customers:        Customer[]
  vendors:          Vendor[]
  products:         Product[]
  saleInvoices:     SaleInvoice[]
  purchaseInvoices: PurchaseInvoice[]
  vouchers:         Voucher[]
  challans:         DeliveryChallan[]
  gatePasses:       GatePass[]
  accounts:         Account[]
  ledgerEntries:    LedgerEntry[]
  settings:         AppSettings
  activeModule: string
  systemMessage: { text: string; variant: 'success' | 'danger' | 'warning' | 'info' } | null
  clearSystemMessage: () => void
  notes: string
  updateNotes: (newNotes: string) => void
  addCustomer:    (d: Omit3<Customer>)  => Customer
  updateCustomer: (id: ID, d: Partial<Customer>) => void
  deleteCustomer: (id: ID) => void
  addVendor:    (d: Omit3<Vendor>)  => Vendor
  updateVendor: (id: ID, d: Partial<Vendor>) => void
  deleteVendor: (id: ID) => void
  addProduct:    (d: Omit3<Product>)  => Product
  updateProduct: (id: ID, d: Partial<Product>) => void
  deleteProduct: (id: ID) => void
  addSaleInvoice:    (d: Omit3<SaleInvoice>)  => SaleInvoice
  updateSaleInvoice: (id: ID, d: Partial<SaleInvoice>) => void
  postSaleInvoice:   (id: ID) => void
  cancelSaleInvoice: (id: ID) => void
  addPurchaseInvoice:    (d: Omit3<PurchaseInvoice>)  => PurchaseInvoice
  updatePurchaseInvoice: (id: ID, d: Partial<PurchaseInvoice>) => void
  postPurchaseInvoice:   (id: ID) => void
  cancelPurchaseInvoice: (id: ID) => void
  addVoucher:  (d: Omit3<Voucher>) => Voucher
  postVoucher: (id: ID) => void
  addChallan:          (d: Omit3<DeliveryChallan>) => DeliveryChallan
  markChallanDelivered:(id: ID) => void
  cancelChallan:        (id: ID) => void
  addGatePass:         (d: Omit3<GatePass>) => GatePass
  updateGatePass:      (id: ID, d: Partial<GatePass>) => void
  deleteGatePass:      (id: ID) => void
  addAccount:    (d: Omit3<Account>) => Account
  updateAccount: (id: ID, d: Partial<Account>) => void
  addLedgerEntry: (d: Omit3<LedgerEntry> & { offsetAccountId?: ID }) => LedgerEntry | null
  updateSettings: (s: AppSettings) => void
  setActiveModule: (m: string) => void
}

const initialSettings = loadSettings()
applyTheme(initialSettings.theme)

export const useStore = create<AppState>()(
  persist(
    (set) => ({
      ...(USE_MOCK ? mockData : emptyData),
      settings: initialSettings,
      activeModule: 'dashboard',
      systemMessage: null,
      clearSystemMessage: () => set({ systemMessage: null }),

      addCustomer: (data) => {
        const rec: Customer = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ customers: [rec, ...s.customers] }))
        return rec
      },
      updateCustomer: (id, data) => set(s => ({ customers: s.customers.map(c => c.id === id ? { ...c, ...data, updatedAt: now() } : c) })),
      deleteCustomer: (id) => set(s => ({ customers: s.customers.filter(c => c.id !== id) })),

      addVendor: (data) => {
        const rec: Vendor = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ vendors: [rec, ...s.vendors] }))
        return rec
      },
      updateVendor: (id, data) => set(s => ({ vendors: s.vendors.map(v => v.id === id ? { ...v, ...data, updatedAt: now() } : v) })),
      deleteVendor: (id) => set(s => ({ vendors: s.vendors.filter(v => v.id !== id) })),

      addProduct: (data) => {
        const rec: Product = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ products: [rec, ...s.products] }))
        return rec
      },
      updateProduct: (id, data) => set(s => ({ products: s.products.map(p => p.id === id ? { ...p, ...data, updatedAt: now() } : p) })),
      deleteProduct: (id) => set(s => ({ products: s.products.filter(p => p.id !== id) })),

      addSaleInvoice: (data) => {
        const rec: SaleInvoice = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ saleInvoices: [rec, ...s.saleInvoices] }))
        return rec
      },
      updateSaleInvoice: (id, data) => set(s => ({ saleInvoices: s.saleInvoices.map(i => i.id === id ? { ...i, ...data, updatedAt: now() } : i) })),
      postSaleInvoice: (id) => set(s => {
        const invoice = s.saleInvoices.find(i => i.id === id)
        if (!invoice) return s
        const acctState: AccountingState = { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products }
        const result = postSaleInvoiceTx(acctState, invoice, genId, now)
        if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
        return {
          ...s,
          accounts: result.accounts,
          ledgerEntries: [...s.ledgerEntries, ...result.entries],
          customers: result.customers,
          vendors: result.vendors,
          products: result.products,
          saleInvoices: s.saleInvoices.map(i => i.id === id ? { ...i, status: 'posted', updatedAt: now() } : i),
          systemMessage: { text: `Invoice ${invoice.invoiceNo} posted. Double-entry journal created.`, variant: 'success' },
        }
      }),
      cancelSaleInvoice: (id) => set(s => {
        const invoice = s.saleInvoices.find(i => i.id === id)
        if (!invoice) return s
        const acctState: AccountingState = { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products }
        const result = reverseSaleInvoiceTx(acctState, invoice, genId, now)
        if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
        return {
          ...s,
          accounts: result.accounts,
          ledgerEntries: [...s.ledgerEntries, ...result.entries],
          customers: result.customers,
          vendors: result.vendors,
          products: result.products,
          saleInvoices: s.saleInvoices.map(i => i.id === id ? { ...i, status: 'cancelled', updatedAt: now() } : i),
          systemMessage: { text: `Invoice ${invoice.invoiceNo} cancelled and reversed.`, variant: 'warning' },
        }
      }),

      addPurchaseInvoice: (data) => {
        const rec: PurchaseInvoice = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ purchaseInvoices: [rec, ...s.purchaseInvoices] }))
        return rec
      },
      updatePurchaseInvoice: (id, data) => set(s => ({ purchaseInvoices: s.purchaseInvoices.map(i => i.id === id ? { ...i, ...data, updatedAt: now() } : i) })),
      postPurchaseInvoice: (id) => set(s => {
        const invoice = s.purchaseInvoices.find(i => i.id === id)
        if (!invoice) return s
        const acctState: AccountingState = { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products }
        const result = postPurchaseInvoiceTx(acctState, invoice, genId, now)
        if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
        return {
          ...s,
          accounts: result.accounts,
          ledgerEntries: [...s.ledgerEntries, ...result.entries],
          customers: result.customers,
          vendors: result.vendors,
          products: result.products,
          purchaseInvoices: s.purchaseInvoices.map(i => i.id === id ? { ...i, status: 'posted', updatedAt: now() } : i),
          systemMessage: { text: `Purchase ${invoice.invoiceNo} posted. Stock and ledger updated.`, variant: 'success' },
        }
      }),
      cancelPurchaseInvoice: (id) => set(s => {
        const invoice = s.purchaseInvoices.find(i => i.id === id)
        if (!invoice) return s
        const acctState: AccountingState = { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products }
        const result = reversePurchaseInvoiceTx(acctState, invoice, genId, now)
        if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
        return {
          ...s,
          accounts: result.accounts,
          ledgerEntries: [...s.ledgerEntries, ...result.entries],
          customers: result.customers,
          vendors: result.vendors,
          products: result.products,
          purchaseInvoices: s.purchaseInvoices.map(i => i.id === id ? { ...i, status: 'cancelled', updatedAt: now() } : i),
          systemMessage: { text: `Purchase ${invoice.invoiceNo} cancelled and reversed.`, variant: 'warning' },
        }
      }),

      addVoucher: (data) => {
        const rec: Voucher = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ vouchers: [rec, ...s.vouchers] }))
        return rec
      },
      postVoucher: (id) => set(s => {
        const voucher = s.vouchers.find(v => v.id === id)
        if (!voucher) return s
        const acctState: AccountingState = { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products }
        const result = postVoucherTx(acctState, voucher, genId, now)
        if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
        return {
          ...s,
          accounts: result.accounts,
          ledgerEntries: [...s.ledgerEntries, ...result.entries],
          customers: result.customers,
          vendors: result.vendors,
          vouchers: s.vouchers.map(v => v.id === id ? { ...v, isPosted: true, updatedAt: now() } : v),
          systemMessage: { text: `Voucher ${voucher.voucherNo} posted to ledger.`, variant: 'success' },
        }
      }),

      addChallan: (data) => {
        const rec: DeliveryChallan = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ challans: [rec, ...s.challans] }))
        return rec
      },
      markChallanDelivered: (id) => set(s => ({ challans: s.challans.map(c => c.id === id ? { ...c, status: 'delivered', updatedAt: now() } : c) })),
      cancelChallan:        (id) => set(s => ({ challans: s.challans.map(c => c.id === id ? { ...c, status: 'cancelled', updatedAt: now() } : c) })),
      addGatePass: (data) => {
        const rec: GatePass = { ...data, id: genId(), createdAt: now(), updatedAt: now() }
        set(s => ({ gatePasses: [rec, ...s.gatePasses] }))
        return rec
      },
      updateGatePass: (id, data) => set(s => ({ gatePasses: s.gatePasses.map(gp => gp.id === id ? { ...gp, ...data, updatedAt: now() } : gp) })),
      deleteGatePass: (id) => set(s => ({ gatePasses: s.gatePasses.filter(gp => gp.id !== id) })),

      addAccount: (data) => {
        const id = genId()
        const openingBal = data.balance ?? 0
        let linkedPartyId = data.linkedPartyId
        let rec: Account = { ...data, category: data.category ?? 'general', balance: openingBal, id, linkedPartyId, createdAt: now(), updatedAt: now() }
        set(s => {
          let customers = s.customers
          let vendors = s.vendors
          if (rec.category === 'customer') {
            const partyId = genId()
            linkedPartyId = partyId
            rec.linkedPartyId = partyId
            customers = [buildLinkedCustomer({ ...rec, balance: openingBal }, partyId, now), ...customers]
          } else if (rec.category === 'vendor') {
            const partyId = genId()
            linkedPartyId = partyId
            rec.linkedPartyId = partyId
            vendors = [buildLinkedVendor({ ...rec, balance: openingBal }, partyId, now), ...vendors]
          }
          let accounts = [rec, ...s.accounts]
          let ledgerEntries = s.ledgerEntries
          if (openingBal > 0) {
            const result = postOpeningBalance(
              { accounts, ledgerEntries, customers, vendors, products: s.products },
              rec,
              genId,
              now,
            )
            if (result.ok) {
              accounts = result.accounts
              ledgerEntries = [...ledgerEntries, ...result.entries]
              customers = result.customers
              vendors = result.vendors
            }
          } else if (rec.category === 'customer' || rec.category === 'vendor') {
            const synced = accounts.map(a => a.id === rec.id ? { ...a, balance: openingBal } : a)
            accounts = synced
          }
          return { accounts, customers, vendors, ledgerEntries }
        })
        return { ...rec, balance: openingBal, linkedPartyId }
      },
      updateAccount: (id, data) => set(s => {
        const prev = s.accounts.find(a => a.id === id)
        if (!prev) return s
        const updated: Account = { ...prev, ...data, updatedAt: now() }
        let { customers, vendors } = syncPartyFromAccount(updated, s.customers, s.vendors, now)
        let next = { ...s, accounts: s.accounts.map(a => a.id === id ? updated : a), customers, vendors }
        if (data.name && data.name !== prev.name) {
          const propagated = propagateAccountName(id, updated.name, updated.linkedPartyId, s)
          next = { ...next, ...propagated }
        }
        return next
      }),

      addLedgerEntry: (data: Omit3<LedgerEntry> & { offsetAccountId?: ID }) => {
        const { offsetAccountId, debit, credit, ...rest } = data
        const amount = Math.max(debit, credit)
        if (!offsetAccountId || amount <= 0) {
          set({ systemMessage: { text: 'Journal entry requires debit account, credit account, and amount.', variant: 'danger' } })
          return null as unknown as LedgerEntry
        }
        const debitId = debit > 0 ? rest.accountId : offsetAccountId
        const creditId = credit > 0 ? rest.accountId : offsetAccountId
        set(s => {
          const result = postJournal(
            { accounts: s.accounts, ledgerEntries: s.ledgerEntries, customers: s.customers, vendors: s.vendors, products: s.products },
            debitId,
            creditId,
            amount,
            { date: rest.date, description: rest.description, refType: rest.refType, refNo: rest.refNo },
            genId,
            now,
          )
          if (!result.ok) return { ...s, systemMessage: { text: result.error, variant: 'danger' } }
          return {
            ...s,
            accounts: result.accounts,
            ledgerEntries: [...s.ledgerEntries, ...result.entries],
            customers: result.customers,
            vendors: result.vendors,
            systemMessage: { text: 'Double-entry journal posted (debit = credit).', variant: 'success' },
          }
        })
        return null as unknown as LedgerEntry
      },

      updateSettings: (settings) => {
        saveSettings(settings)
        applyTheme(settings.theme)
        set({ settings })
      },

      updateNotes: (newNotes) => set({ notes: newNotes }),

      setActiveModule: (m) => set({ activeModule: m }),
    }),
    {
      name: 'erp-app-data',
      skipHydration: USE_MOCK,
      partialize: (s) => ({
        customers: s.customers,
        vendors: s.vendors,
        products: s.products,
        saleInvoices: s.saleInvoices,
        purchaseInvoices: s.purchaseInvoices,
        vouchers: s.vouchers,
        challans: s.challans,
        gatePasses: s.gatePasses,
        accounts: s.accounts,
        ledgerEntries: s.ledgerEntries,
        settings: s.settings,
        notes: s.notes,
      }),
      merge: (persisted, current) => {
        const p = persisted as Partial<AppState> | undefined
        if (!p) return current
        return {
          ...current,
          ...p,
          purchaseInvoices: (p.purchaseInvoices ?? current.purchaseInvoices).map(i => ({
            ...i,
            purchaseType: i.purchaseType ?? 'tax',
          })),
          saleInvoices: (p.saleInvoices ?? current.saleInvoices).map(i => ({
            ...i,
            saleType: i.saleType ?? 'tax',
          })),
          gatePasses: p.gatePasses ?? current.gatePasses,
          notes: p.notes ?? current.notes,
          settings: { ...DEFAULT_SETTINGS, ...p.settings },
        }
      },
    },
  ),
)

export const selectLowStock   = (s: AppState) => s.products.filter(p => p.isActive && p.stockQty <= p.reorderLevel)
export const selectDraftSales = (s: AppState) => s.saleInvoices.filter(i => i.status === 'draft')

export type { VoucherType }

