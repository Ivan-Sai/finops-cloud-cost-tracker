import { Notification, BrowserWindow } from 'electron'

export interface BudgetAlertData {
  budget_id: string
  budget_name: string
  level: 'warning' | 'critical' | 'exceeded'
  utilization: number
  spent: number
  limit: number
}

const notifiedAlerts = new Set<string>()

export function resetNotifiedAlerts(): void {
  notifiedAlerts.clear()
}

export function sendBudgetAlertNotification(alert: BudgetAlertData): void {
  const key = `${alert.budget_id}:${alert.level}`
  if (notifiedAlerts.has(key)) return
  notifiedAlerts.add(key)

  const levelLabel =
    alert.level === 'exceeded'
      ? 'EXCEEDED'
      : alert.level === 'critical'
        ? 'Critical'
        : 'Warning'

  const pct = Math.round(alert.utilization * 100)

  const notification = new Notification({
    title: `Budget ${levelLabel}: ${alert.budget_name}`,
    body: `${pct}% used — $${alert.spent.toFixed(2)} of $${alert.limit.toFixed(2)} limit`,
    urgency: alert.level === 'exceeded' ? 'critical' : 'normal'
  })

  notification.on('click', () => {
    const win = BrowserWindow.getAllWindows()[0]
    if (win) {
      win.show()
      win.focus()
      win.webContents.send('navigate', '/budgets')
    }
  })

  notification.show()
}

export function sendAlertsBatch(alerts: BudgetAlertData[]): void {
  for (const alert of alerts) {
    if (alert.level === 'exceeded' || alert.level === 'critical') {
      sendBudgetAlertNotification(alert)
    }
  }
}
