import { create } from 'zustand'

interface SettingsState {
  currency: string
  loadSettings: () => Promise<void>
  setCurrency: (currency: string) => void
}

export const useSettingsStore = create<SettingsState>((set) => ({
  currency: 'USD',

  loadSettings: async () => {
    const s = (await window.api.invoke('settings:get')) as { currency: string }
    if (s) {
      set({ currency: s.currency || 'USD' })
    }
  },

  setCurrency: (currency) => {
    set({ currency })
    window.api.invoke('settings:set', 'currency', currency)
  }
}))
