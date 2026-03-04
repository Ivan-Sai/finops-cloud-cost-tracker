import { ipcMain } from 'electron'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function safeHandle(channel: string, handler: (...args: any[]) => any): void {
  ipcMain.handle(channel, async (event, ...args) => {
    try {
      return await handler(event, ...args)
    } catch (err) {
      console.error(`[IPC:${channel}] Error:`, err)
      throw new Error(err instanceof Error ? err.message : 'An unexpected error occurred')
    }
  })
}
