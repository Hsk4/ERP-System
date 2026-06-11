import React from 'react'
import { clsx } from 'clsx'

// ─── Card ─────────────────────────────────────────────────────────────────────
export const Card: React.FC<React.HTMLAttributes<HTMLDivElement>> = ({ className, children, ...props }) => (
  <div className={clsx('bg-white border border-slate-200 rounded-xl overflow-hidden shadow-sm', className)} {...props}>
    {children}
  </div>
)

// ─── StatCard ─────────────────────────────────────────────────────────────────
interface StatCardProps {
  label: string
  value: string
  subtext?: string
  accent?: string
  icon?: React.ReactNode
}
export const StatCard: React.FC<StatCardProps> = ({ label, value, subtext, accent = 'text-sky-600', icon }) => (
  <div className="bg-white border border-slate-200 rounded-xl p-4 flex flex-col gap-2 shadow-sm">
    <div className="flex items-center justify-between">
      <span className="text-[11px] font-medium text-slate-500 uppercase tracking-wide">{label}</span>
      {icon && <span className={clsx('opacity-70', accent)}>{icon}</span>}
    </div>
    <p className={clsx('text-xl font-bold font-mono', accent)}>{value}</p>
    {subtext && <p className="text-[11px] text-slate-400">{subtext}</p>}
  </div>
)

// ─── Table ────────────────────────────────────────────────────────────────────
export const Table: React.FC<React.TableHTMLAttributes<HTMLTableElement>> = ({ className, children, ...props }) => (
  <div className="overflow-x-auto">
    <table className={clsx('w-full text-sm', className)} {...props}>{children}</table>
  </div>
)

export const Th: React.FC<React.ThHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <th className={clsx('px-4 py-3 text-left text-[11px] font-medium text-slate-500 uppercase tracking-wider border-b border-slate-200 bg-slate-50', className)} {...props}>
    {children}
  </th>
)

export const Td: React.FC<React.TdHTMLAttributes<HTMLTableCellElement>> = ({ className, children, ...props }) => (
  <td className={clsx('px-4 py-3 text-sm text-slate-600 border-b border-slate-100', className)} {...props}>
    {children}
  </td>
)

export const TrEmpty: React.FC<{ colSpan: number; message?: string }> = ({ colSpan, message = 'No records found' }) => (
  <tr>
    <td colSpan={colSpan} className="px-4 py-12 text-center text-sm text-slate-400">{message}</td>
  </tr>
)

// ─── Badge ────────────────────────────────────────────────────────────────────
const badgeVariants: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  danger:  'bg-red-50 text-red-700 border-red-200',
  warning: 'bg-amber-50 text-amber-700 border-amber-200',
  info:    'bg-sky-50 text-sky-700 border-sky-200',
  purple:  'bg-violet-50 text-violet-700 border-violet-200',
  default: 'bg-slate-50 text-slate-600 border-slate-200',
}

export const Badge: React.FC<{ variant?: string; children: React.ReactNode }> = ({ variant = 'default', children }) => (
  <span className={clsx('inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-medium uppercase tracking-wide border', badgeVariants[variant] || badgeVariants.default)}>
    {children}
  </span>
)

// ─── Button ───────────────────────────────────────────────────────────────────
const btnBase = 'inline-flex items-center justify-center gap-1.5 font-medium rounded-lg transition-all duration-150 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-white disabled:opacity-50 disabled:cursor-not-allowed'
const btnVariants: Record<string, string> = {
  primary:   'bg-sky-600 text-white hover:bg-sky-500 focus:ring-sky-500',
  secondary: 'bg-slate-100 text-slate-700 hover:bg-slate-200 focus:ring-slate-400',
  ghost:     'bg-transparent text-slate-600 hover:text-slate-900 hover:bg-slate-100 focus:ring-slate-400',
  danger:    'bg-red-50 text-red-700 hover:bg-red-100 focus:ring-red-400',
  success:   'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 focus:ring-emerald-400',
}
const btnSizes: Record<string, string> = {
  sm: 'text-xs px-2.5 py-1.5',
  md: 'text-sm px-4 py-2',
  lg: 'text-base px-5 py-2.5',
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: string
  size?: string
}
export const Button: React.FC<ButtonProps> = ({ variant = 'primary', size = 'md', className, children, ...props }) => (
  <button className={clsx(btnBase, btnVariants[variant] || btnVariants.primary, btnSizes[size] || btnSizes.md, className)} {...props}>
    {children}
  </button>
)

// ─── SearchBar ────────────────────────────────────────────────────────────────
export const SearchBar: React.FC<{ value: string; onChange: (v: string) => void; placeholder?: string }> = ({ value, onChange, placeholder = 'Search…' }) => (
  <div className="relative">
    <svg className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <circle cx="11" cy="11" r="8" /><path d="m21 21-4.35-4.35" />
    </svg>
    <input
      type="text" value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder}
      className="bg-white border border-slate-300 rounded-lg text-sm text-slate-800 pl-9 pr-3 py-2 w-56 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-slate-400"
    />
  </div>
)

// ─── Input ────────────────────────────────────────────────────────────────────
interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}
export const Input: React.FC<InputProps> = ({ label, className, ...props }) => (
  <label className="block">
    {label && <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>}
    <input
      className={clsx(
        'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-800 px-3 py-2 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  </label>
)

// ─── Select ───────────────────────────────────────────────────────────────────
interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  label?: string
  options: { value: string; label: string }[]
}
export const Select: React.FC<SelectProps> = ({ label, options, className, ...props }) => (
  <label className="block">
    {label && <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>}
    <select
      className={clsx(
        'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-800 px-3 py-2 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all',
        className
      )}
      {...props}
    >
      {options.map(o => <option key={o.value} value={o.value}>{o.label}</option>)}
    </select>
  </label>
)

// ─── Textarea ─────────────────────────────────────────────────────────────────
interface TextareaProps extends React.TextareaHTMLAttributes<HTMLTextAreaElement> {
  label?: string
}
export const Textarea: React.FC<TextareaProps> = ({ label, className, ...props }) => (
  <label className="block">
    {label && <span className="block text-[11px] font-medium text-slate-500 uppercase tracking-wide mb-1.5">{label}</span>}
    <textarea
      rows={3}
      className={clsx(
        'w-full bg-white border border-slate-300 rounded-lg text-sm text-slate-800 px-3 py-2 focus:outline-none focus:border-sky-400 focus:ring-1 focus:ring-sky-400 transition-all resize-none placeholder:text-slate-400',
        className
      )}
      {...props}
    />
  </label>
)

// ─── Modal ────────────────────────────────────────────────────────────────────
const modalSizes: Record<string, string> = {
  sm: 'max-w-md',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
  xl: 'max-w-4xl',
}

interface ModalProps {
  open: boolean
  onClose: () => void
  title?: string
  size?: string
  children: React.ReactNode
}
export const Modal: React.FC<ModalProps> = ({ open, onClose, title, size = 'md', children }) => {
  if (!open) return null
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={onClose} />
      <div className={clsx('relative bg-white border border-slate-200 rounded-2xl shadow-xl w-full mx-4', modalSizes[size] || modalSizes.md)}>
        {title && (
          <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200">
            <h2 className="text-sm font-semibold text-slate-800">{title}</h2>
            <button onClick={onClose} className="text-slate-400 hover:text-slate-600 transition-colors">
              <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12" /></svg>
            </button>
          </div>
        )}
        <div className="px-6 py-5 max-h-[70vh] overflow-y-auto scrollbar-thin">{children}</div>
      </div>
    </div>
  )
}

// ─── Alert ────────────────────────────────────────────────────────────────────
const alertVariants: Record<string, string> = {
  warning: 'bg-amber-50 border-amber-200 text-amber-800',
  info:    'bg-sky-50 border-sky-200 text-sky-800',
  success: 'bg-emerald-50 border-emerald-200 text-emerald-800',
  danger:  'bg-red-50 border-red-200 text-red-800',
}

export const Alert: React.FC<{ variant?: string; children: React.ReactNode }> = ({ variant = 'info', children }) => (
  <div className={clsx('flex items-center gap-3 px-4 py-3 rounded-xl border text-xs', alertVariants[variant] || alertVariants.info)}>
    <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
      <path d="M10.29 3.86 1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0zM12 9v4M12 17h.01" />
    </svg>
    <div>{children}</div>
  </div>
)

// ─── Tabs ─────────────────────────────────────────────────────────────────────
interface TabItem { id: string; label: string }
interface TabsProps {
  tabs: TabItem[]
  active: string
  onChange: (id: string) => void
}
export const Tabs: React.FC<TabsProps> = ({ tabs, active, onChange }) => (
  <div className="flex border-b border-slate-200">
    {tabs.map(t => (
      <button
        key={t.id}
        onClick={() => onChange(t.id)}
        className={clsx(
          'px-5 py-3 text-xs font-medium transition-all relative',
          active === t.id
            ? 'text-sky-600 after:absolute after:bottom-0 after:left-0 after:right-0 after:h-0.5 after:bg-sky-600'
            : 'text-slate-500 hover:text-slate-700'
        )}
      >
        {t.label}
      </button>
    ))}
  </div>
)
