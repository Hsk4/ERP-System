import React, { useState } from 'react'
import { Card, Button, Input } from '@erp/ui'
import { clsx } from 'clsx'
import { useStore } from '../../store'
import type { ThemeId } from '../../lib/settings'

const THEMES: { id: ThemeId; label: string; preview: string }[] = [
  { id: 'light', label: 'White', preview: 'bg-white border-slate-200' },
  { id: 'blue', label: 'Blue', preview: 'bg-sky-100 border-sky-300' },
  { id: 'dark', label: 'Black', preview: 'bg-slate-900 border-slate-700' },
]

export const SettingsModule: React.FC = () => {
  const settings = useStore(s => s.settings)
  const updateSettings = useStore(s => s.updateSettings)
  const [draft, setDraft] = useState(settings)
  const [saved, setSaved] = useState(false)

  const save = () => {
    updateSettings(draft)
    setSaved(true)
    setTimeout(() => setSaved(false), 2000)
  }

  return (
    <div className="max-w-2xl space-y-5">
      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Company</h2>
          <p className="text-xs text-slate-500 mt-0.5">Shown in the sidebar and documents.</p>
        </div>
        <Input
          label="Company name"
          value={draft.companyName}
          onChange={e => setDraft(d => ({ ...d, companyName: e.target.value }))}
        />
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Tax rates</h2>
          <p className="text-xs text-slate-500 mt-0.5">Default percentages applied to new invoice lines.</p>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <Input
            label="Sales tax (%)"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={draft.salesTaxRate}
            onChange={e => setDraft(d => ({ ...d, salesTaxRate: parseFloat(e.target.value) || 0 }))}
          />
          <Input
            label="GST (%)"
            type="number"
            min={0}
            max={100}
            step={0.1}
            value={draft.gstRate}
            onChange={e => setDraft(d => ({ ...d, gstRate: parseFloat(e.target.value) || 0 }))}
          />
        </div>
      </Card>

      <Card className="p-5 space-y-4">
        <div>
          <h2 className="text-sm font-semibold text-slate-800">Appearance</h2>
          <p className="text-xs text-slate-500 mt-0.5">White is the default. Switch to blue or black anytime.</p>
        </div>
        <div className="grid grid-cols-3 gap-3">
          {THEMES.map(t => (
            <button
              key={t.id}
              type="button"
              onClick={() => setDraft(d => ({ ...d, theme: t.id }))}
              className={clsx(
                'rounded-xl border-2 p-3 text-left transition-all',
                draft.theme === t.id ? 'border-sky-500 ring-2 ring-sky-200' : 'border-transparent hover:border-slate-200',
              )}
            >
              <div className={clsx('h-10 rounded-lg border mb-2', t.preview)} />
              <span className="text-xs font-medium text-slate-700">{t.label}</span>
            </button>
          ))}
        </div>
      </Card>

      <div className="flex items-center gap-3">
        <Button onClick={save}>Save settings</Button>
        {saved && <span className="text-xs text-emerald-600">Saved</span>}
      </div>
    </div>
  )
}
