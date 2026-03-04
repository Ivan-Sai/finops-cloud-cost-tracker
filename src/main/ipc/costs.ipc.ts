import { BrowserWindow } from 'electron'
import { getDatabase } from '../database/connection'
import { v4 as uuidv4 } from 'uuid'
import { safeHandle } from './safe-handle'
import { exportToCSV } from '../utils/csv-export'
import { triggerAlertCheck } from '../services/alert.service'

export function registerCostsIPC(): void {
  const db = getDatabase()

  safeHandle('costs:getAll', (_event, filters: Record<string, unknown> = {}) => {
    let query = `
      SELECT c.*, s.name as service_name, s.provider, s.category, p.name as project_name
      FROM costs c
      LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (filters.search) {
      query += ` AND (s.name LIKE ? OR p.name LIKE ? OR c.description LIKE ?)`
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }
    if (filters.service_id) {
      query += ` AND c.service_id = ?`
      params.push(filters.service_id)
    }
    if (filters.project_id) {
      query += ` AND c.project_id = ?`
      params.push(filters.project_id)
    }
    if (filters.date_from) {
      query += ` AND c.date >= ?`
      params.push(filters.date_from)
    }
    if (filters.date_to) {
      query += ` AND c.date <= ?`
      params.push(filters.date_to)
    }

    // Count total
    const countQuery = `SELECT COUNT(*) as total FROM (${query})`
    const { total } = db.prepare(countQuery).get(...params) as { total: number }

    // Sort
    const sortBy = (filters.sort_by as string) || 'date'
    const sortOrder = (filters.sort_order as string) || 'desc'
    const allowedSorts = ['date', 'amount', 'service_name', 'project_name', 'created_at']
    const sortCol = allowedSorts.includes(sortBy) ? sortBy : 'date'
    query += ` ORDER BY ${sortCol} ${sortOrder === 'asc' ? 'ASC' : 'DESC'}`

    // Pagination
    const page = Math.max(1, Number(filters.page) || 1)
    const pageSize = Math.min(100, Math.max(1, Number(filters.page_size) || 20))
    query += ` LIMIT ? OFFSET ?`
    params.push(pageSize, (page - 1) * pageSize)

    const data = db.prepare(query).all(...params)
    return { data, total, page, page_size: pageSize }
  })

  safeHandle('costs:getById', (_event, id: string) => {
    return db
      .prepare(
        `SELECT c.*, s.name as service_name, s.provider, s.category, p.name as project_name
         FROM costs c
         LEFT JOIN services s ON c.service_id = s.id
         LEFT JOIN projects p ON c.project_id = p.id
         WHERE c.id = ?`
      )
      .get(id)
  })

  safeHandle('costs:create', (_event, data: Record<string, unknown>) => {
    const id = uuidv4()
    db.prepare(
      `INSERT INTO costs (id, service_id, project_id, amount, date, description, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    ).run(id, data.service_id, data.project_id, data.amount, data.date, data.description || null, data.tags || null)

    // Audit log
    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'cost.created', 'cost', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(data))

    const result = db.prepare('SELECT * FROM costs WHERE id = ?').get(id)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
    return result
  })

  safeHandle('costs:update', (_event, id: string, data: Record<string, unknown>) => {
    const old = db.prepare('SELECT * FROM costs WHERE id = ?').get(id)
    db.prepare(
      `UPDATE costs SET service_id=?, project_id=?, amount=?, date=?, description=?, tags=? WHERE id=?`
    ).run(data.service_id, data.project_id, data.amount, data.date, data.description || null, data.tags || null, id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'cost.updated', 'cost', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify({ before: old, after: data }))

    const updated = db.prepare('SELECT * FROM costs WHERE id = ?').get(id)
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
    return updated
  })

  safeHandle('costs:delete', (_event, id: string) => {
    const old = db.prepare('SELECT * FROM costs WHERE id = ?').get(id)
    db.prepare('DELETE FROM costs WHERE id = ?').run(id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'cost.deleted', 'cost', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(old))
    const win = BrowserWindow.getAllWindows()[0]
    if (win) triggerAlertCheck(db, win)
  })

  safeHandle('costs:getStats', (_event, _period?: string) => {
    const now = new Date()
    const year = now.getFullYear()
    const month = String(now.getMonth() + 1).padStart(2, '0')
    const mtdStart = `${year}-${month}-01`
    const prevMonth = new Date(year, now.getMonth() - 1, 1)
    const prevStart = `${prevMonth.getFullYear()}-${String(prevMonth.getMonth() + 1).padStart(2, '0')}-01`
    const prevEnd = `${year}-${month}-01`

    const totalMtd = db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM costs WHERE date >= ?')
      .get(mtdStart) as { total: number }

    const totalPrev = db
      .prepare('SELECT COALESCE(SUM(amount), 0) as total FROM costs WHERE date >= ? AND date < ?')
      .get(prevStart, prevEnd) as { total: number }

    const monthlyTrend = db
      .prepare(
        `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
         FROM costs
         WHERE date >= date('now', '-6 months')
         GROUP BY month
         ORDER BY month`
      )
      .all()

    const topServices = db
      .prepare(
        `SELECT c.service_id, s.name as service_name, SUM(c.amount) as total
         FROM costs c
         JOIN services s ON c.service_id = s.id
         WHERE c.date >= ?
         GROUP BY c.service_id
         ORDER BY total DESC
         LIMIT 5`
      )
      .all(mtdStart)

    const dailyCosts = db
      .prepare(
        `SELECT date, SUM(amount) as total
         FROM costs
         WHERE date >= date('now', '-30 days')
         GROUP BY date
         ORDER BY date`
      )
      .all()

    return {
      total_mtd: totalMtd.total,
      total_prev_month: totalPrev.total,
      monthly_trend: monthlyTrend,
      top_services: topServices,
      daily_costs: dailyCosts
    }
  })

  safeHandle('costs:getByService', (_event, serviceId: string) => {
    return db
      .prepare(
        `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
         FROM costs WHERE service_id = ?
         GROUP BY month ORDER BY month`
      )
      .all(serviceId)
  })

  safeHandle('costs:getByProject', (_event, projectId: string) => {
    return db
      .prepare(
        `SELECT strftime('%Y-%m', date) as month, SUM(amount) as total
         FROM costs WHERE project_id = ?
         GROUP BY month ORDER BY month`
      )
      .all(projectId)
  })

  // Export costs to CSV via save dialog
  safeHandle('costs:export', async (_event, filters: Record<string, unknown> = {}) => {
    let query = `
      SELECT c.date, s.name as service, s.provider, s.category, p.name as project,
             c.amount, c.description, c.tags
      FROM costs c
      LEFT JOIN services s ON c.service_id = s.id
      LEFT JOIN projects p ON c.project_id = p.id
      WHERE 1=1
    `
    const params: unknown[] = []

    if (filters.search) {
      query += ` AND (s.name LIKE ? OR p.name LIKE ? OR c.description LIKE ?)`
      const term = `%${filters.search}%`
      params.push(term, term, term)
    }
    if (filters.service_id) {
      query += ` AND c.service_id = ?`
      params.push(filters.service_id)
    }
    if (filters.project_id) {
      query += ` AND c.project_id = ?`
      params.push(filters.project_id)
    }
    if (filters.date_from) {
      query += ` AND c.date >= ?`
      params.push(filters.date_from)
    }
    if (filters.date_to) {
      query += ` AND c.date <= ?`
      params.push(filters.date_to)
    }

    query += ` ORDER BY c.date DESC`
    const rows = db.prepare(query).all(...params) as Record<string, unknown>[]

    const saved = await exportToCSV(rows, `costs-export-${new Date().toISOString().slice(0, 10)}.csv`)

    if (saved) {
      db.prepare(
        `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
         VALUES (?, 'admin', 'costs.exported', 'cost', NULL, ?)`
      ).run(uuidv4(), JSON.stringify({ rows_exported: rows.length, filters }))
    }

    return saved
  })
}
