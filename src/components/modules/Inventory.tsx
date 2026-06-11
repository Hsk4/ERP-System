import type { Product } from '@erp/domain'
import { Badge, Button, Card, Input, Modal, SearchBar, Select, StatCard, Table, Td, Th, TrEmpty } from '@erp/ui'
import React, { useMemo, useState } from 'react'
import { useStore } from '../../store'

const fmt  = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK').format(n)
const fmtC = (n: number) => 'Rs ' + new Intl.NumberFormat('en-PK', { notation: 'compact', maximumFractionDigits: 1 }).format(n)

const UNITS = ['Bag','Tin','Pack','Can','Kg','Ltr','Pcs','Box','Carton'].map(u => ({ value: u, label: u }))

const ProductForm: React.FC<{ onClose: () => void; product?: Product }> = ({ onClose, product }) => {
  const { addProduct, updateProduct } = useStore()
  const [f, setF] = useState({
    code: product?.code ?? '', name: product?.name ?? '', unit: product?.unit ?? 'Bag',
    salePrice: product?.salePrice ?? 0, purchasePrice: product?.purchasePrice ?? 0,
    stockQty: product?.stockQty ?? 0, reorderLevel: product?.reorderLevel ?? 10,
  })
  const set = (k: string) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
    setF(p => ({ ...p, [k]: e.target.type === 'number' ? +e.target.value : e.target.value }))

  const save = () => {
    if (product) updateProduct(product.id, { ...f, isActive: product.isActive })
    else addProduct({ ...f, isActive: true })
    onClose()
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Product Code" value={f.code} onChange={set('code')} placeholder="PRD-001" />
        <Select label="Unit" value={f.unit} onChange={set('unit')} options={UNITS} />
      </div>
      <Input label="Product Name" value={f.name} onChange={set('name')} placeholder="Enter product name…" />
      <div className="grid grid-cols-2 gap-4">
        <Input label="Sale Price (Rs)"     type="number" value={f.salePrice}      onChange={set('salePrice')} />
        <Input label="Purchase Price (Rs)" type="number" value={f.purchasePrice}  onChange={set('purchasePrice')} />
      </div>
      <div className="grid grid-cols-2 gap-4">
        <Input label="Opening Stock" type="number" value={f.stockQty}     onChange={set('stockQty')} />
        <Input label="Reorder Level" type="number" value={f.reorderLevel} onChange={set('reorderLevel')} />
      </div>
      <div className="flex gap-2 justify-end">
        <Button variant="ghost"   onClick={onClose}>Cancel</Button>
        <Button variant="primary" onClick={save}>{product ? 'Save Changes' : 'Add Product'}</Button>
      </div>
    </div>
  )
}

export const InventoryModule: React.FC = () => {
  const { products, updateProduct } = useStore()
  const [search,      setSearch]      = useState('')
  const [filter,      setFilter]      = useState<'all' | 'low' | 'inactive'>('all')
  const [showForm,    setShowForm]    = useState(false)
  const [editProduct, setEditProduct] = useState<Product | undefined>()

  const filtered = useMemo(() =>
    products.filter(p => {
      const m = p.name.toLowerCase().includes(search.toLowerCase()) || p.code.toLowerCase().includes(search.toLowerCase())
      if (filter === 'low')      return m && p.isActive && p.stockQty <= p.reorderLevel
      if (filter === 'inactive') return m && !p.isActive
      return m && p.isActive
    }), [products, search, filter])

  const active     = products.filter(p => p.isActive)
  const lowCount   = active.filter(p => p.stockQty <= p.reorderLevel).length
  const outCount   = active.filter(p => p.stockQty === 0).length
  const stockValue = active.reduce((s, p) => s + p.stockQty * p.purchasePrice, 0)

  const stockStatus = (p: Product) => {
    if (!p.isActive)              return { label: 'Inactive',      v: 'default'  as const }
    if (p.stockQty === 0)         return { label: 'Out of Stock',  v: 'danger'   as const }
    if (p.stockQty <= p.reorderLevel) return { label: 'Low Stock', v: 'warning'  as const }
    return                               { label: 'In Stock',      v: 'success'  as const }
  }

  return (
    <div className="space-y-5">
      <div className="grid grid-cols-4 gap-4">
        <StatCard label="Active Products" value={String(active.length)} accent="text-sky-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M21 16V8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16z"/></svg>} />
        <StatCard label="Stock Value" value={fmtC(stockValue)} subtext={fmt(stockValue)} accent="text-emerald-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>} />
        <StatCard label="Low Stock" value={String(lowCount)} accent="text-amber-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01"/></svg>} />
        <StatCard label="Out of Stock" value={String(outCount)} accent="text-red-600"
          icon={<svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.75" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M4.93 4.93l14.14 14.14"/></svg>} />
      </div>

      <Card>
        <div className="flex items-center justify-between px-5 py-3.5 border-b border-slate-200">
          <div className="flex items-center gap-3">
            <SearchBar value={search} onChange={setSearch} placeholder="Search products…" />
            <select value={filter} onChange={e => setFilter(e.target.value as any)} className="bg-slate-100 border border-slate-300 rounded-lg text-sm text-slate-700 px-3 py-2 focus:outline-none">
              <option value="all">All Active</option>
              <option value="low">Low Stock</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>
          <Button variant="primary" onClick={() => { setEditProduct(undefined); setShowForm(true) }}>
            <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" viewBox="0 0 24 24"><path d="M12 5v14M5 12h14"/></svg>
            Add Product
          </Button>
        </div>
        <Table>
          <thead><tr><Th>Code</Th><Th>Name</Th><Th>Unit</Th><Th>Sale Price</Th><Th>Purchase Price</Th><Th>Stock</Th><Th>Reorder</Th><Th>Status</Th><Th>Actions</Th></tr></thead>
          <tbody>
            {filtered.length === 0
              ? <TrEmpty colSpan={9} />
              : filtered.map(p => {
                const { label, v } = stockStatus(p)
                return (
                  <tr key={p.id as string} className="hover:bg-slate-100/25 transition-colors">
                    <Td><span className="font-mono text-xs text-slate-500">{p.code}</span></Td>
                    <Td><span className="font-medium text-slate-800">{p.name}</span></Td>
                    <Td className="text-slate-600">{p.unit}</Td>
                    <Td><span className="font-mono">{fmt(p.salePrice)}</span></Td>
                    <Td><span className="font-mono text-slate-600">{fmt(p.purchasePrice)}</span></Td>
                    <Td><span className={`font-mono font-medium ${p.stockQty === 0 ? 'text-red-600' : p.stockQty <= p.reorderLevel ? 'text-amber-600' : 'text-emerald-600'}`}>{p.stockQty}</span></Td>
                    <Td><span className="font-mono text-slate-500">{p.reorderLevel}</span></Td>
                    <Td><Badge variant={v}>{label}</Badge></Td>
                    <Td>
                      <div className="flex gap-1">
                        <Button size="sm" variant="ghost" onClick={() => { setEditProduct(p); setShowForm(true) }}>Edit</Button>
                        <Button size="sm" variant="ghost" onClick={() => updateProduct(p.id, { isActive: !p.isActive })}>
                          {p.isActive ? 'Deactivate' : 'Activate'}
                        </Button>
                      </div>
                    </Td>
                  </tr>
                )
              })}
          </tbody>
        </Table>
      </Card>

      <Modal open={showForm} onClose={() => setShowForm(false)} title={editProduct ? 'Edit Product' : 'New Product'} size="md">
        <ProductForm onClose={() => setShowForm(false)} product={editProduct} />
      </Modal>
    </div>
  )
}
