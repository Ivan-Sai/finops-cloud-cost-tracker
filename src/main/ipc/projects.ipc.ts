import { getDatabase } from '../database/connection'
import { v4 as uuidv4 } from 'uuid'
import { safeHandle } from './safe-handle'

export function registerProjectsIPC(): void {
  const db = getDatabase()

  safeHandle('projects:getAll', () => {
    return db.prepare('SELECT * FROM projects ORDER BY name').all()
  })

  safeHandle('projects:create', (_event, data: Record<string, unknown>) => {
    const id = uuidv4()
    db.prepare(
      `INSERT INTO projects (id, name, description, environment, owner) VALUES (?, ?, ?, ?, ?)`
    ).run(id, data.name, data.description || null, data.environment, data.owner)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'project.created', 'project', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(data))

    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  safeHandle('projects:update', (_event, id: string, data: Record<string, unknown>) => {
    const old = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    db.prepare(
      `UPDATE projects SET name=?, description=?, environment=?, owner=? WHERE id=?`
    ).run(data.name, data.description || null, data.environment, data.owner, id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'project.updated', 'project', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify({ before: old, after: data }))

    return db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
  })

  safeHandle('projects:delete', (_event, id: string) => {
    const refCount = (db.prepare('SELECT COUNT(*) as cnt FROM costs WHERE project_id = ?').get(id) as { cnt: number }).cnt
    if (refCount > 0) {
      throw new Error(`Cannot delete: ${refCount} cost record(s) reference this project`)
    }

    const old = db.prepare('SELECT * FROM projects WHERE id = ?').get(id)
    db.prepare('DELETE FROM projects WHERE id = ?').run(id)

    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details)
       VALUES (?, 'admin', 'project.deleted', 'project', ?, ?)`
    ).run(uuidv4(), id, JSON.stringify(old))
  })
}
