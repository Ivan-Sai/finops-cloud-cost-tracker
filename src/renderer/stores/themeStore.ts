import { create } from 'zustand'

interface ThemeState {
  theme: 'light' | 'dark'
  setTheme: (theme: 'light' | 'dark') => void
  toggleTheme: () => void
  loadTheme: () => Promise<void>
}

export const useThemeStore = create<ThemeState>((set, get) => ({
  theme: 'light',

  setTheme: (theme) => {
    set({ theme })
    window.api.invoke('settings:set', 'theme', theme)
  },

  toggleTheme: () => {
    const next = get().theme === 'light' ? 'dark' : 'light'
    get().setTheme(next)
  },

  loadTheme: async () => {
    const settings = (await window.api.invoke('settings:get')) as { theme: 'light' | 'dark' }
    if (settings?.theme) {
      set({ theme: settings.theme })
    }
  }
}))
