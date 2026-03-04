import { BrowserWindow } from 'electron'
import { getDatabase } from '../database/connection'
import { v4 as uuidv4 } from 'uuid'
import { computeBudgetSpent, checkAllBudgetAlerts, triggerAlertCheck } from '../services/alert.service'
import { safeHandle } from './safe-handle'

export function registerBudgetsIPC(): void {
  const db = getDatabase()

  safeHandle('budgets:getAll', () => {
    const budgets = db
      .prepare(
        `SELECT b.*, p.name as project_name, s.name as service_name
         FROM budgets b
         LEFT JOIN projects p ON b.project_id = p.id
         LEFT JOIN services s ON b.service_id = s.id`
      )
      .all() as Record<string, unknown>[]

    return budgets.map((b) => {
      const { spent, utilization } = computeBudgetSpent(db, b as never)
      return { ...b, spent, utilization }
    })
  })

  safeHandle('budgets:getById', (_event, id: string) => {
    const budget = db
      .prepare(
        `SELECT b.*, p.name as project_name, s.name as service_name
         FROM budgets b
         LEFT JOIN projects p ON b.project_id = p.id
         LEFT JOIN services s ON b.service_id = s.id
         WHERE b.id = ?`
      )
      .get(id) as Record<string, unknown> | undefined

    if (!budget) return null

    const { spent, utilization } = computeBudgetSpent(db, budget as never)
    return { ...budget, spent, utilization }
  })

  safeHandle('budgets:create', (_event, data: Record<string, unknown>) => {
    const id = uuidv4()
    db.prepare(
      `INSERT INTO budgets (id, name, project_id, service_id, amount, period, alert_threshold_warning, alert_threshold_critical)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      data.name,
      data.project_id || null,
      data.service_id || null,
      data.amount,
      data.period,
      data.alert_threshold_warning ?? 0.8,
      data.alert_threshold_critical ?? 0.95
    )

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'budget.created', 'budget', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(data))

    const created = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
    return created
  })

  safeHandle('budgets:update', (_event, id: string, data: Record<string, unknown>) => {
    const old = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id)
    db.prepare(
      `UPDATE budgets SET name=?, project_id=?, service_id=?, amount=?, period=?,
       alert_threshold_warning=?, alert_threshold_critical=? WHERE id=?`
    ).run(
      data.name,
      data.project_id || null,
      data.service_id || null,
      data.amount,
      data.period,
      data.alert_threshold_warning ?? 0.8,
      data.alert_threshold_critical ?? 0.95,
      id
    )

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'budget.updated', 'budget', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify({ before: old, after: data }))

    const updated = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
    return updated
  })

  safeHandle('budgets:delete', (_event, id: string) => {
    const old = db.prepare('SELECT * FROM budgets WHERE id = ?').get(id)
    db.prepare('DELETE FROM budgets WHERE id = ?').run(id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'budget.deleted', 'budget', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(old))
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
  })

  safeHandle('budgets:checkAlerts', () => {
    return checkAllBudgetAlerts(db)
  })
}
