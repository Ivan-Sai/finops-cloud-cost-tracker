import { getDatabase } from '../database/connection'
import { v4 as uuidv4 } from 'uuid'
import { safeHandle } from './safe-handle'

export function registerServicesIPC(): void {
  const db = getDatabase()

  safeHandle('services:getAll', () => {
    return db.prepare('SELECT * FROM services ORDER BY name').all()
  })

  safeHandle('services:create', (_event, data: Record<string, unknown>) => {
    const id = uuidv4()
    db.prepare(
      `INSERT INTO services (id, name, provider, category) VALUES (?, ?, ?, ?)`
    ).run(id, data.name, data.provider, data.category)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'service.created', 'service', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(data))

    return db.prepare('SELECT * FROM services WHERE id = ?').get(id)
  })

  safeHandle('services:update', (_event, id: string, data: Record<string, unknown>) => {
    const old = db.prepare('SELECT * FROM services WHERE id = ?').get(id)
    db.prepare(
      `UPDATE services SET name=?, provider=?, category=? WHERE id=?`
    ).run(data.name, data.provider, data.category, id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'service.updated', 'service', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify({ before: old, after: data }))

    return db.prepare('SELECT * FROM services WHERE id = ?').get(id)
  })

  safeHandle('services:delete', (_event, id: string) => {
    const refCount = (db.prepare('SELECT COUNT(*) as cnt FROM costs WHERE service_id = ?').get(id) as { cnt: number }).cnt
    if (refCount > 0) {
      throw new Error(`Cannot delete: ${refCount} cost record(s) reference this service`)
    }

    const old = db.prepare('SELECT * FROM services WHERE id = ?').get(id)
    db.prepare('DELETE FROM services WHERE id = ?').run(id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'service.deleted', 'service', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(old))
  })
}
