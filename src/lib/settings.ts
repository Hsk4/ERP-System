export type ThemeId = 'light' | 'blue' | 'dark'

export interface AppSettings {
  companyName: string
  salesTaxRate: number
  gstRate: number
  theme: ThemeId
}

export const DEFAULT_SETTINGS: AppSettings = {
  companyName: 'My Company',
  salesTaxRate: 0,
  gstRate: 17,
  theme: 'light',
}

const STORAGE_KEY = 'erp-settings'

export function loadSettings(): AppSettings {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return { ...DEFAULT_SETTINGS }
    return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) }
  } catch {
    return { ...DEFAULT_SETTINGS }
  }
}

export function saveSettings(settings: AppSettings): void {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings))
}

export function applyTheme(theme: ThemeId): void {
  document.documentElement.dataset.theme = theme
}
