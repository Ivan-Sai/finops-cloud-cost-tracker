import { dialog, BrowserWindow } from 'electron'
import { getDatabase } from '../database/connection'
import { v4 as uuidv4 } from 'uuid'
import { readFileSync } from 'fs'
import Papa from 'papaparse'
import { safeHandle } from './safe-handle'
import { triggerAlertCheck } from '../services/alert.service'

export function registerImportIPC(): void {
  const db = getDatabase()

  safeHandle('import:selectFile', async () => {
    const result = await dialog.showOpenDialog({
      properties: ['openFile'],
      filters: [{ name: 'CSV Files', extensions: ['csv'] }]
    })
    if (result.canceled || result.filePaths.length === 0) return null
    return result.filePaths[0]
  })

  safeHandle('import:parseCSV', (_event, filePath: string) => {
    const content = readFileSync(filePath, 'utf-8')
    const parsed = Papa.parse(content, {
      header: true,
      skipEmptyLines: true,
      dynamicTyping: true
    })

    return {
      headers: parsed.meta.fields || [],
      rows: parsed.data as Record<string, unknown>[],
      errors: parsed.errors.map((e) => ({
        row: e.row,
        message: e.message
      }))
    }
  })

  safeHandle('import:execute', (_event, rows: Record<string, unknown>[]) => {
    let imported = 0
    let errors = 0
    const errorDetails: { row: number; message: string }[] = []

    const insertCost = db.prepare(
      `INSERT INTO costs (id, service_id, project_id, amount, date, description, tags)
       VALUES (?, ?, ?, ?, ?, ?, ?)`
    )

    const serviceById = db.prepare('SELECT id FROM services WHERE id = ?')
    const serviceByName = db.prepare('SELECT id FROM services WHERE name = ? COLLATE NOCASE')
    const projectById = db.prepare('SELECT id FROM projects WHERE id = ?')
    const projectByName = db.prepare('SELECT id FROM projects WHERE name = ? COLLATE NOCASE')
    const insertService = db.prepare(`INSERT INTO services (id, name, provider, category) VALUES (?, ?, 'Custom', 'Other')`)
    const insertProject = db.prepare(`INSERT INTO projects (id, name, environment, owner) VALUES (?, ?, 'production', 'Imported')`)

    // Cache of auto-created entities to reuse within the same import
    const serviceCache = new Map<string, string>()
    const projectCache = new Map<string, string>()

    const transaction = db.transaction(() => {
      for (let i = 0; i < rows.length; i++) {
        const row = rows[i]
        try {
          if (!row.service_id || !row.project_id || !row.amount || !row.date) {
            throw new Error('Missing required fields: service_id, project_id, amount, date')
          }

          // Resolve service: try by ID first, then by name, then auto-create
          const svcVal = String(row.service_id)
          let resolvedServiceId = serviceCache.get(svcVal)
          if (!resolvedServiceId) {
            const svc = serviceById.get(svcVal) || serviceByName.get(svcVal)
            if (svc) {
              resolvedServiceId = (svc as { id: string }).id
            } else {
              resolvedServiceId = uuidv4()
              insertService.run(resolvedServiceId, svcVal)
              db.prepare(`INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details) VALUES (?, 'admin', 'service.created', 'service', ?, ?)`)
                .run(uuidv4(), resolvedServiceId, JSON.stringify({ name: svcVal, provider: 'Custom', category: 'Other', auto_created: true }))
            }
            serviceCache.set(svcVal, resolvedServiceId)
          }
          row.service_id = resolvedServiceId

          // Resolve project: try by ID first, then by name, then auto-create
          const prjVal = String(row.project_id)
          let resolvedProjectId = projectCache.get(prjVal)
          if (!resolvedProjectId) {
            const prj = projectById.get(prjVal) || projectByName.get(prjVal)
            if (prj) {
              resolvedProjectId = (prj as { id: string }).id
            } else {
              resolvedProjectId = uuidv4()
              insertProject.run(resolvedProjectId, prjVal)
              db.prepare(`INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details) VALUES (?, 'admin', 'project.created', 'project', ?, ?)`)
                .run(uuidv4(), resolvedProjectId, JSON.stringify({ name: prjVal, environment: 'production', owner: 'Imported', auto_created: true }))
            }
            projectCache.set(prjVal, resolvedProjectId)
          }
          row.project_id = resolvedProjectId

          const amount = Number(row.amount)
          if (isNaN(amount) || amount < 0) {
            throw new Error(`Invalid amount: ${row.amount}`)
          }

          if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date))) {
            throw new Error(`Invalid date format: ${row.date} (expected YYYY-MM-DD)`)
          }

          insertCost.run(
            uuidv4(),
            row.service_id,
            row.project_id,
            amount,
            row.date,
            row.description || null,
            row.tags || null
          )
          imported++
        } catch (err) {
          errors++
          errorDetails.push({ row: i + 1, message: (err as Error).message })
        }
      }
    })

    transaction()

    const outcome = imported > 0 ? 'success' : 'failure'
    db.prepare(
      `INSERT INTO audit_log (id, actor, action, resource_type, resource_id, details, outcome)
       VALUES (?, 'admin', 'csv.imported', 'cost', NULL, ?, ?)`
    ).run(
      uuidv4(),
      JSON.stringify({ imported, errors, total: rows.length, errorDetails: errorDetails.slice(0, 20) }),
      outcome
    )

    if (imported > 0) {
      const win = BrowserWindow.getAllWindows()[0]
      if (win) triggerAlertCheck(db, win)
    }

    return { imported, errors, total: rows.length, errorDetails: errorDetails.slice(0, 50) }
  })

  safeHandle('import:getMappingOptions', () => {
    const services = db.prepare('SELECT id, name, provider FROM services').all()
    const projects = db.prepare('SELECT id, name, environment FROM projects').all()
    return { services, projects }
  })
}
