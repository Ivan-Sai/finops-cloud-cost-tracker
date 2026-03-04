import { create } from 'zustand'
import type { AuditEntry, AuditFilters } from '../types/audit'

interface AuditState {
  entries: AuditEntry[]
  filters: AuditFilters
  loading: boolean
  error: string | null

  fetchEntries: (filters?: AuditFilters) => Promise<void>
  setFilters: (filters: Partial<AuditFilters>) => void
}

export const useAuditStore = create<AuditState>((set, get) => ({
  entries: [],
  filters: {},
  loading: false,
  error: null,

  fetchEntries: async (filters?: AuditFilters) => {
    set({ loading: true, error: null })
    try {
      const f = filters || get().filters
      const entries = (await window.api.invoke('audit:getAll', f)) as AuditEntry[]
      set({ entries, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  setFilters: (filters) => {
    const merged = { ...get().filters, ...filters }
    set({ filters: merged })
    get().fetchEntries(merged)
  }
}))
