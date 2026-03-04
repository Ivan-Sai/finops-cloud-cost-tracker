import { create } from 'zustand'
import type { CostRecord, CostFilters, CostStats, CostsPaginatedResult } from '../types/cost'

interface CostsState {
  costs: CostRecord[]
  total: number
  page: number
  pageSize: number
  filters: CostFilters
  stats: CostStats | null
  loading: boolean
  error: string | null

  fetchCosts: (filters?: CostFilters) => Promise<void>
  fetchStats: () => Promise<void>
  setFilters: (filters: Partial<CostFilters>) => void
  createCost: (data: Partial<CostRecord>) => Promise<void>
  updateCost: (id: string, data: Partial<CostRecord>) => Promise<void>
  deleteCost: (id: string) => Promise<void>
}

export const useCostsStore = create<CostsState>((set, get) => ({
  costs: [],
  total: 0,
  page: 1,
  pageSize: 20,
  filters: {},
  stats: null,
  loading: false,
  error: null,

  fetchCosts: async (filters?: CostFilters) => {
    set({ loading: true, error: null })
    try {
      const f = filters || get().filters
      const result = (await window.api.invoke('costs:getAll', f)) as CostsPaginatedResult
      set({
        costs: result.data,
        total: result.total,
        page: result.page,
        pageSize: result.page_size,
        loading: false
      })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchStats: async () => {
    try {
      const stats = (await window.api.invoke('costs:getStats')) as CostStats
      set({ stats })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  setFilters: (filters) => {
    const merged = { ...get().filters, ...filters }
    set({ filters: merged })
    get().fetchCosts(merged)
  },

  createCost: async (data) => {
    await window.api.invoke('costs:create', data)
    get().fetchCosts()
    get().fetchStats()
  },

  updateCost: async (id, data) => {
    await window.api.invoke('costs:update', id, data)
    get().fetchCosts()
    get().fetchStats()
  },

  deleteCost: async (id) => {
    await window.api.invoke('costs:delete', id)
    get().fetchCosts()
    get().fetchStats()
  }
}))
