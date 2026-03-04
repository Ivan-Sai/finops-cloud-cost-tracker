import { getDatabase } from '../database/connection'
import { safeHandle } from './safe-handle'
import { exportToCSV } from '../utils/csv-export'

function buildAuditQuery(filters: Record<string, unknown>): { query: string; params: unknown[] } {
  let query = 'SELECT * FROM audit_log WHERE 1=1'
  const params: unknown[] = []

  if (filters.date_from) {
    query += ' AND timestamp >= ?'
    params.push(filters.date_from)
  }
  if (filters.date_to) {
    query += ' AND timestamp <= ?'
    params.push(filters.date_to)
  }
  if (filters.actor) {
    query += ' AND actor = ?'
    params.push(filters.actor)
  }
  if (filters.action) {
    query += ' AND action = ?'
    params.push(filters.action)
  }
  if (filters.resource_type) {
    query += ' AND resource_type = ?'
    params.push(filters.resource_type)
  }

  query += ' ORDER BY timestamp DESC'
  return { query, params }
}

export function registerAuditIPC(): void {
  const db = getDatabase()

  safeHandle('audit:getAll', (_event, filters: Record<string, unknown> = {}) => {
    const { query, params } = buildAuditQuery(filters)
    return db.prepare(query).all(...params)
  })

  safeHandle('audit:getFilterOptions', () => {
    const actors = db.prepare('SELECT DISTINCT actor FROM audit_log ORDER BY actor').all() as { actor: string }[]
    const actions = db.prepare('SELECT DISTINCT action FROM audit_log ORDER BY action').all() as { action: string }[]
    const resourceTypes = db.prepare('SELECT DISTINCT resource_type FROM audit_log ORDER BY resource_type').all() as { resource_type: string }[]

    return {
      actors: actors.map((r) => r.actor),
      actions: actions.map((r) => r.action),
      resourceTypes: resourceTypes.map((r) => r.resource_type)
    }
  })

  safeHandle('audit:export', async (_event, filters: Record<string, unknown> = {}) => {
    const { query, params } = buildAuditQuery(filters)
    const rows = db.prepare(query).all(...params) as Record<string, unknown>[]
    return exportToCSV(rows, `audit-log-${new Date().toISOString().slice(0, 10)}.csv`)
  })
}
