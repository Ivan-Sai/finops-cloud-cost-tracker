import type Database from 'better-sqlite3'
import type { BrowserWindow } from 'electron'
import type { BudgetAlertData } from './notification.service'
import { sendAlertsBatch } from './notification.service'
import { updateTrayAlerts } from './tray.service'

interface BudgetRow {
  id: string
  name: string
  amount: number
  project_id: string | null
  service_id: string | null
  alert_threshold_warning: number
  alert_threshold_critical: number
  [key: string]: unknown
}

interface SpentResult {
  spent: number
  utilization: number
}

export function computeBudgetSpent(db: Database.Database, budget: BudgetRow): SpentResult {
  const now = new Date()
  const year = now.getFullYear()
  const month = String(now.getMonth() + 1).padStart(2, '0')
  const mtdStart = `${year}-${month}-01`

  let query = `SELECT COALESCE(SUM(c.amount), 0) as spent FROM costs c WHERE c.date >= ?`
  const params: unknown[] = [mtdStart]

  if (budget.project_id) {
    query += ' AND c.project_id = ?'
    params.push(budget.project_id)
  }
  if (budget.service_id) {
    query += ' AND c.service_id = ?'
    params.push(budget.service_id)
  }

  const { spent } = db.prepare(query).get(...params) as { spent: number }
  const utilization = budget.amount > 0 ? spent / budget.amount : 0

  return { spent, utilization }
}

export function checkAllBudgetAlerts(db: Database.Database): BudgetAlertData[] {
  const budgets = db.prepare('SELECT * FROM budgets').all() as BudgetRow[]
  const alerts: BudgetAlertData[] = []

  for (const b of budgets) {
    const { spent, utilization } = computeBudgetSpent(db, b)

    let level: BudgetAlertData['level'] | null = null
    if (utilization >= 1.0) {
      level = 'exceeded'
    } else if (utilization >= b.alert_threshold_critical) {
      level = 'critical'
    } else if (utilization >= b.alert_threshold_warning) {
      level = 'warning'
    }

    if (level) {
      alerts.push({
        budget_id: b.id,
        budget_name: b.name,
        level,
        utilization,
        spent,
        limit: b.amount
      })
    }
  }

  return alerts
}

export function triggerAlertCheck(db: Database.Database, mainWindow: BrowserWindow): void {
  try {
    const alerts = checkAllBudgetAlerts(db)
    sendAlertsBatch(alerts)
    updateTrayAlerts(alerts, mainWindow)
    mainWindow.webContents.send('budget:alerts-updated', alerts)
  } catch (err) {
    console.error('Error checking budget alerts:', err)
  }
}
