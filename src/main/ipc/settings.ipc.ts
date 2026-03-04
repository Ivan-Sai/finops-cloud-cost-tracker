import Store from 'electron-store'
import { safeHandle } from './safe-handle'

const store = new Store({
  defaults: {
    theme: 'light',
    autoRefreshInterval: 30,
    currency: 'USD'
  }
})

export function registerSettingsIPC(): void {
  safeHandle('settings:get', () => {
    return {
      theme: store.get('theme'),
      autoRefreshInterval: store.get('autoRefreshInterval'),
      currency: store.get('currency')
    }
  })

  safeHandle('settings:set', (_event, key: string, value: unknown) => {
    store.set(key, value)
    return { [key]: value }
  })
}
