// ─── API Client ───────────────────────────────────────────────────────────────
// When running in Tauri, all requests go to http://127.0.0.1:3001
// In browser dev mode without API, the Zustand mock store is used instead.

const BASE = (import.meta as any).env?.VITE_API_URL ?? 'http://127.0.0.1:3001'

class ApiClient {
  private token: string | null = null

  setToken(t: string | null) { this.token = t }

  private async request<T>(
    method: string,
    path: string,
    body?: unknown,
    params?: Record<string, string | number | undefined>,
  ): Promise<T> {
    const url = new URL(`${BASE}${path}`)
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        if (v !== undefined) url.searchParams.set(k, String(v))
      })
    }

    const res = await fetch(url.toString(), {
      method,
      headers: {
        'Content-Type': 'application/json',
        ...(this.token ? { Authorization: `Bearer ${this.token}` } : {}),
      },
      body: body ? JSON.stringify(body) : undefined,
    })

    const json = await res.json()
    if (!res.ok) throw new Error(json.error ?? `HTTP ${res.status}`)
    return json as T
  }

  get  = <T>(path: string, params?: Record<string, string | number | undefined>) => this.request<T>('GET',    path, undefined, params)
  post = <T>(path: string, body?: unknown)  => this.request<T>('POST',   path, body)
  put  = <T>(path: string, body?: unknown)  => this.request<T>('PUT',    path, body)
  del  = <T>(path: string)                  => this.request<T>('DELETE', path)
}

export const api = new ApiClient()

// ─── Auth ─────────────────────────────────────────────────────────────────────
export const authApi = {
  login:   (email: string, password: string) => api.post<any>('/api/auth/login', { email, password }),
  refresh: (refreshToken: string)             => api.post<any>('/api/auth/refresh', { refreshToken }),
  logout:  (refreshToken: string)             => api.post<any>('/api/auth/logout', { refreshToken }),
  me:      ()                                 => api.get<any>('/api/auth/me'),
}

// ─── Customers ────────────────────────────────────────────────────────────────
export const customersApi = {
  list:   (params?: any) => api.get<any>('/api/customers', params),
  get:    (id: string)   => api.get<any>(`/api/customers/${id}`),
  create: (data: any)    => api.post<any>('/api/customers', data),
  update: (id: string, data: any) => api.put<any>(`/api/customers/${id}`, data),
  delete: (id: string)   => api.del<any>(`/api/customers/${id}`),
  ledger: (id: string)   => api.get<any>(`/api/customers/${id}/ledger`),
}

// ─── Vendors ──────────────────────────────────────────────────────────────────
export const vendorsApi = {
  list:   (params?: any) => api.get<any>('/api/vendors', params),
  get:    (id: string)   => api.get<any>(`/api/vendors/${id}`),
  create: (data: any)    => api.post<any>('/api/vendors', data),
  update: (id: string, data: any) => api.put<any>(`/api/vendors/${id}`, data),
  delete: (id: string)   => api.del<any>(`/api/vendors/${id}`),
}

// ─── Products ────────────────────────────────────────────────────────────────
export const productsApi = {
  list:     (params?: any) => api.get<any>('/api/products', params),
  lowStock: ()             => api.get<any>('/api/products/low-stock'),
  get:      (id: string)   => api.get<any>(`/api/products/${id}`),
  create:   (data: any)    => api.post<any>('/api/products', data),
  update:   (id: string, data: any) => api.put<any>(`/api/products/${id}`, data),
  delete:   (id: string)   => api.del<any>(`/api/products/${id}`),
}

// ─── Sale Invoices ────────────────────────────────────────────────────────────
export const salesApi = {
  list:   (params?: any) => api.get<any>('/api/sale-invoices', params),
  get:    (id: string)   => api.get<any>(`/api/sale-invoices/${id}`),
  create: (data: any)    => api.post<any>('/api/sale-invoices', data),
  update: (id: string, data: any) => api.put<any>(`/api/sale-invoices/${id}`, data),
  post:   (id: string)   => api.post<any>(`/api/sale-invoices/${id}/post`),
  cancel: (id: string)   => api.post<any>(`/api/sale-invoices/${id}/cancel`),
}

// ─── Purchase Invoices ────────────────────────────────────────────────────────
export const purchasesApi = {
  list:   (params?: any) => api.get<any>('/api/purchase-invoices', params),
  get:    (id: string)   => api.get<any>(`/api/purchase-invoices/${id}`),
  create: (data: any)    => api.post<any>('/api/purchase-invoices', data),
  update: (id: string, data: any) => api.put<any>(`/api/purchase-invoices/${id}`, data),
  post:   (id: string)   => api.post<any>(`/api/purchase-invoices/${id}/post`),
  cancel: (id: string)   => api.post<any>(`/api/purchase-invoices/${id}/cancel`),
}

// ─── Vouchers ────────────────────────────────────────────────────────────────
export const vouchersApi = {
  list:   (params?: any) => api.get<any>('/api/vouchers', params),
  create: (data: any)    => api.post<any>('/api/vouchers', data),
  post:   (id: string)   => api.post<any>(`/api/vouchers/${id}/post`),
}

// ─── Challans ────────────────────────────────────────────────────────────────
export const challansApi = {
  list:    (params?: any) => api.get<any>('/api/challans', params),
  create:  (data: any)    => api.post<any>('/api/challans', data),
  deliver: (id: string)   => api.post<any>(`/api/challans/${id}/deliver`),
  cancel:  (id: string)   => api.post<any>(`/api/challans/${id}/cancel`),
}

// ─── Accounts ────────────────────────────────────────────────────────────────
export const accountsApi = {
  list:         ()              => api.get<any>('/api/accounts'),
  trialBalance: ()              => api.get<any>('/api/accounts/trial-balance'),
  get:          (id: string)    => api.get<any>(`/api/accounts/${id}`),
  ledger:       (id: string)    => api.get<any>(`/api/accounts/${id}/ledger`),
  create:       (data: any)     => api.post<any>('/api/accounts', data),
  update:       (id: string, data: any) => api.put<any>(`/api/accounts/${id}`, data),
  addEntry:     (id: string, data: any) => api.post<any>(`/api/accounts/${id}/ledger-entry`, data),
}

// ─── Reports ─────────────────────────────────────────────────────────────────
export const reportsApi = {
  dashboard:         ()           => api.get<any>('/api/reports/dashboard'),
  receivablesAging:  ()           => api.get<any>('/api/reports/receivables-aging'),
  inventoryValuation:()           => api.get<any>('/api/reports/inventory-valuation'),
}
