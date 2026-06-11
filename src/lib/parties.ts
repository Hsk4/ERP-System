import type { Account, AccountCategory, Customer, ID, Vendor } from '@erp/domain'

export interface PartyOption {
  id: ID
  name: string
  code: string
  balance: number
  phone?: string
  email?: string
  creditLimit?: number
  accountId?: ID
}

export const accountsByCategory = (accounts: Account[], category: AccountCategory) =>
  accounts.filter(a => a.category === category && a.isActive)

export const accountToParty = (a: Account): PartyOption => ({
  id: a.id,
  name: a.name,
  code: a.code,
  balance: a.balance,
  phone: a.phone,
  email: a.email,
  creditLimit: a.creditLimit,
  accountId: a.id,
})

export const customerToParty = (c: Customer): PartyOption => ({
  id: c.id,
  name: c.name,
  code: c.code,
  balance: c.balance,
  phone: c.phone,
  email: c.email,
  creditLimit: c.creditLimit,
  accountId: c.accountId,
})

export const vendorToParty = (v: Vendor): PartyOption => ({
  id: v.id,
  name: v.name,
  code: v.code,
  balance: v.balance,
  phone: v.phone,
  email: v.email,
  accountId: v.accountId,
})

/** Customer dropdown: customer-category accounts + legacy customers not already linked */
export function getCustomerParties(accounts: Account[], customers: Customer[]): PartyOption[] {
  const fromAccounts = accountsByCategory(accounts, 'customer').map(accountToParty)
  const linkedIds = new Set<string>(fromAccounts.map(p => p.id as string))
  const linkedPartyIds = new Set<string>(
    accounts.filter(a => a.category === 'customer' && a.linkedPartyId).map(a => a.linkedPartyId as string),
  )
  const legacy = customers
    .filter(c => c.isActive && !linkedIds.has(c.id as string) && !linkedPartyIds.has(c.id as string) && !c.accountId)
    .map(customerToParty)
  return [...fromAccounts, ...legacy]
}

/** Vendor dropdown: vendor-category accounts + legacy vendors not already linked */
export function getVendorParties(accounts: Account[], vendors: Vendor[]): PartyOption[] {
  const fromAccounts = accountsByCategory(accounts, 'vendor').map(accountToParty)
  const linkedIds = new Set<string>(fromAccounts.map(p => p.id as string))
  const linkedPartyIds = new Set<string>(
    accounts.filter(a => a.category === 'vendor' && a.linkedPartyId).map(a => a.linkedPartyId as string),
  )
  const legacy = vendors
    .filter(v => v.isActive && !linkedIds.has(v.id as string) && !linkedPartyIds.has(v.id as string) && !v.accountId)
    .map(vendorToParty)
  return [...fromAccounts, ...legacy]
}

export function resolveCustomerName(
  id: ID | undefined,
  accounts: Account[],
  customers: Customer[],
  fallback = '',
): string {
  if (!id) return fallback
  const acc = accounts.find(a => a.id === id)
  if (acc) return acc.name
  const cust = customers.find(c => c.id === id || c.accountId === id)
  if (cust) return cust.name
  const byLink = accounts.find(a => a.linkedPartyId === id)
  return byLink?.name ?? fallback
}

export function resolveVendorName(
  id: ID | undefined,
  accounts: Account[],
  vendors: Vendor[],
  fallback = '',
): string {
  if (!id) return fallback
  const acc = accounts.find(a => a.id === id)
  if (acc) return acc.name
  const vend = vendors.find(v => v.id === id || v.accountId === id)
  if (vend) return vend.name
  const byLink = accounts.find(a => a.linkedPartyId === id)
  return byLink?.name ?? fallback
}

export function getCashAccounts(accounts: Account[]) {
  return accounts.filter(a => a.isActive && a.category === 'cash')
}

export function getBankAccounts(accounts: Account[]) {
  return accounts.filter(a => a.isActive && a.category === 'bank')
}

export function getVoucherAccounts(accounts: Account[], type: string) {
  const isCash = type.startsWith('cash_')
  const pool = isCash ? getCashAccounts(accounts) : getBankAccounts(accounts)
  if (pool.length > 0) return pool
  return accounts.filter(a => a.isActive && a.type === 'asset' && (isCash ? /cash/i.test(a.name) : !/cash/i.test(a.name)))
}
