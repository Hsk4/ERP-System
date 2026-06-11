import type {
  Account, Customer, DeliveryChallan, ID, PurchaseInvoice,
  SaleInvoice, Vendor, Voucher,
} from '@erp/domain'

type Omit3<T> = Omit<T, 'id' | 'createdAt' | 'updatedAt'>

export function buildLinkedCustomer(
  account: Account,
  id: ID,
  now: () => Date,
): Customer {
  return {
    id,
    code: account.code,
    name: account.name,
    phone: account.phone,
    email: account.email,
    address: account.address,
    balance: account.balance,
    creditLimit: account.creditLimit ?? 0,
    isActive: account.isActive,
    accountId: account.id,
    createdAt: now(),
    updatedAt: now(),
  }
}

export function buildLinkedVendor(account: Account, id: ID, now: () => Date): Vendor {
  return {
    id,
    code: account.code,
    name: account.name,
    phone: account.phone,
    email: account.email,
    address: account.address,
    balance: account.balance,
    isActive: account.isActive,
    accountId: account.id,
    createdAt: now(),
    updatedAt: now(),
  }
}

export function syncPartyFromAccount(
  account: Account,
  customers: Customer[],
  vendors: Vendor[],
  now: () => Date,
): { customers: Customer[]; vendors: Vendor[]; linkedPartyId?: ID } {
  if (account.category === 'customer' && account.linkedPartyId) {
    return {
      customers: customers.map(c =>
        c.id === account.linkedPartyId
          ? {
              ...c,
              code: account.code,
              name: account.name,
              phone: account.phone,
              email: account.email,
              address: account.address,
              balance: account.balance,
              creditLimit: account.creditLimit ?? c.creditLimit,
              isActive: account.isActive,
              accountId: account.id,
              updatedAt: now(),
            }
          : c,
      ),
      vendors,
      linkedPartyId: account.linkedPartyId,
    }
  }
  if (account.category === 'vendor' && account.linkedPartyId) {
    return {
      customers,
      vendors: vendors.map(v =>
        v.id === account.linkedPartyId
          ? {
              ...v,
              code: account.code,
              name: account.name,
              phone: account.phone,
              email: account.email,
              address: account.address,
              balance: account.balance,
              isActive: account.isActive,
              accountId: account.id,
              updatedAt: now(),
            }
          : v,
      ),
      linkedPartyId: account.linkedPartyId,
    }
  }
  return { customers, vendors }
}

export function propagateAccountName(
  accountId: ID,
  name: string,
  linkedPartyId: ID | undefined,
  data: {
    saleInvoices: SaleInvoice[]
    purchaseInvoices: PurchaseInvoice[]
    vouchers: Voucher[]
    challans: DeliveryChallan[]
  },
) {
  const matchCustomer = (partyId: ID | undefined) =>
    partyId === accountId || partyId === linkedPartyId

  return {
    saleInvoices: data.saleInvoices.map(i =>
      matchCustomer(i.customerId) ? { ...i, customerName: name } : i,
    ),
    purchaseInvoices: data.purchaseInvoices.map(i =>
      matchCustomer(i.vendorId) ? { ...i, vendorName: name } : i,
    ),
    vouchers: data.vouchers.map(v =>
      matchCustomer(v.partyId) ? { ...v, partyName: name } : v,
    ),
    challans: data.challans.map(c =>
      matchCustomer(c.customerId) ? { ...c, customerName: name } : c,
    ),
  }
}

export type AccountInput = Omit3<Account>
