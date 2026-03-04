import { create } from 'zustand'
import type { Budget, BudgetAlert, BudgetFormData } from '../types/budget'

interface BudgetsState {
  budgets: Budget[]
  alerts: BudgetAlert[]
  loading: boolean
  error: string | null

  fetchBudgets: () => Promise<void>
  fetchAlerts: () => Promise<void>
  createBudget: (data: BudgetFormData) => Promise<void>
  updateBudget: (id: string, data: BudgetFormData) => Promise<void>
  deleteBudget: (id: string) => Promise<void>
}

export const useBudgetsStore = create<BudgetsState>((set, get) => ({
  budgets: [],
  alerts: [],
  loading: false,
  error: null,

  fetchBudgets: async () => {
    set({ loading: true, error: null })
    try {
      const budgets = (await window.api.invoke('budgets:getAll')) as Budget[]
      set({ budgets, loading: false })
    } catch (err) {
      set({ error: (err as Error).message, loading: false })
    }
  },

  fetchAlerts: async () => {
    try {
      const alerts = (await window.api.invoke('budgets:checkAlerts')) as BudgetAlert[]
      set({ alerts })
    } catch (err) {
      set({ error: (err as Error).message })
    }
  },

  createBudget: async (data) => {
    await window.api.invoke('budgets:create', data)
    get().fetchBudgets()
    get().fetchAlerts()
  },

  updateBudget: async (id, data) => {
    await window.api.invoke('budgets:update', id, data)
    get().fetchBudgets()
    get().fetchAlerts()
  },

  deleteBudget: async (id) => {
    await window.api.invoke('budgets:delete', id)
    get().fetchBudgets()
    get().fetchAlerts()
  }
}))
