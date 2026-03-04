// Ensure Electron runs as app, not as Node
delete process.env.ELECTRON_RUN_AS_NODE

const { app } = require('electron')
const Database = require('better-sqlite3')
const { v4: uuidv4 } = require('uuid')
const path = require('path')
const fs = require('fs')

// Disable GPU and window creation — we only need DB access
app.disableHardwareAcceleration()

app.whenReady().then(() => {
  const dataDir = path.join(__dirname, '..', 'data')
  fs.mkdirSync(dataDir, { recursive: true })
  const dbPath = path.join(dataDir, 'finops-tracker.db')
  console.log(`Database path: ${dbPath}`)

  const db = new Database(dbPath)
  db.pragma('journal_mode = WAL')
  db.pragma('foreign_keys = ON')

  // Run migrations
  db.exec(`
    CREATE TABLE IF NOT EXISTS services (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      provider TEXT NOT NULL,
      category TEXT NOT NULL,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      environment TEXT NOT NULL DEFAULT 'production',
      owner TEXT,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS costs (
      id TEXT PRIMARY KEY,
      service_id TEXT NOT NULL REFERENCES services(id),
      project_id TEXT NOT NULL REFERENCES projects(id),
      amount REAL NOT NULL,
      date TEXT NOT NULL,
      description TEXT,
      tags TEXT DEFAULT '[]',
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS budgets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      project_id TEXT REFERENCES projects(id),
      service_id TEXT REFERENCES services(id),
      amount REAL NOT NULL,
      period TEXT NOT NULL DEFAULT 'monthly',
      alert_threshold_warning REAL DEFAULT 0.8,
      alert_threshold_critical REAL DEFAULT 0.95,
      created_at TEXT DEFAULT (datetime('now'))
    );
    CREATE TABLE IF NOT EXISTS audit_log (
      id TEXT PRIMARY KEY,
      timestamp TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      details TEXT,
      outcome TEXT NOT NULL DEFAULT 'success'
    );
    CREATE INDEX IF NOT EXISTS idx_costs_date ON costs(date);
    CREATE INDEX IF NOT EXISTS idx_costs_service ON costs(service_id);
    CREATE INDEX IF NOT EXISTS idx_costs_project ON costs(project_id);
    CREATE INDEX IF NOT EXISTS idx_budgets_project ON budgets(project_id);
    CREATE INDEX IF NOT EXISTS idx_audit_timestamp ON audit_log(timestamp);
  `)

  // Clear existing data for re-seed
  const count = db.prepare('SELECT COUNT(*) as cnt FROM services').get()
  if (count.cnt > 0) {
    console.log('Clearing existing data...')
    db.exec('DELETE FROM audit_log')
    db.exec('DELETE FROM costs')
    db.exec('DELETE FROM budgets')
    db.exec('DELETE FROM projects')
    db.exec('DELETE FROM services')
  }

  console.log('Seeding...')

  const services = [
    { id: uuidv4(), name: 'EC2', provider: 'AWS', category: 'Compute' },
    { id: uuidv4(), name: 'S3', provider: 'AWS', category: 'Storage' },
    { id: uuidv4(), name: 'RDS', provider: 'AWS', category: 'Database' },
    { id: uuidv4(), name: 'Lambda', provider: 'AWS', category: 'Compute' },
    { id: uuidv4(), name: 'CloudFront', provider: 'AWS', category: 'Network' },
    { id: uuidv4(), name: 'EKS', provider: 'AWS', category: 'Compute' }
  ]

  const projects = [
    { id: uuidv4(), name: 'Production API', description: 'Main production API services', environment: 'production', owner: 'Platform Team' },
    { id: uuidv4(), name: 'Staging Environment', description: 'Pre-production testing environment', environment: 'staging', owner: 'DevOps Team' },
    { id: uuidv4(), name: 'ML Pipeline', description: 'Machine learning training and inference', environment: 'production', owner: 'Data Science Team' },
    { id: uuidv4(), name: 'Internal Tools', description: 'Internal dashboards and utilities', environment: 'development', owner: 'Engineering Team' }
  ]

  const insertService = db.prepare('INSERT INTO services (id, name, provider, category) VALUES (?, ?, ?, ?)')
  for (const s of services) {
    insertService.run(s.id, s.name, s.provider, s.category)
  }

  const insertProject = db.prepare('INSERT INTO projects (id, name, description, environment, owner) VALUES (?, ?, ?, ?, ?)')
  for (const p of projects) {
    insertProject.run(p.id, p.name, p.description, p.environment, p.owner)
  }

  // ~200 cost records over 12 months
  const insertCost = db.prepare('INSERT INTO costs (id, service_id, project_id, amount, date, description, tags) VALUES (?, ?, ?, ?, ?, ?, ?)')
  const now = new Date()
  const baseCosts = { EC2: 1200, S3: 350, RDS: 800, Lambda: 150, CloudFront: 200, EKS: 950 }
  const descriptions = ['Monthly compute usage', 'Data transfer costs', 'Storage allocation', 'API request processing', 'Database operations', 'CDN distribution', 'Container orchestration', 'Serverless invocations']
  const tagSets = ['["api","backend"]', '["frontend","cdn"]', '["database","storage"]', '["ml","training"]', '["monitoring","ops"]', '["infrastructure"]']

  const insertCosts = db.transaction(() => {
    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
      for (const service of services) {
        const recordCount = 1 + Math.floor(Math.random() * 2)
        for (let r = 0; r < recordCount; r++) {
          const project = projects[Math.floor(Math.random() * projects.length)]
          const baseCost = baseCosts[service.name] || 500
          const trendMultiplier = 1 + (11 - monthOffset) * 0.02
          const variance = 0.7 + Math.random() * 0.6
          const amount = Math.round(baseCost * trendMultiplier * variance * 100) / 100
          const day = 1 + Math.floor(Math.random() * 28)
          const costDate = `${yearMonth}-${String(day).padStart(2, '0')}`
          insertCost.run(uuidv4(), service.id, project.id, amount, costDate, descriptions[Math.floor(Math.random() * descriptions.length)], tagSets[Math.floor(Math.random() * tagSets.length)])
        }
      }
    }
  })
  insertCosts()

  // 4 budgets
  const insertBudget = db.prepare('INSERT INTO budgets (id, name, project_id, service_id, amount, period, alert_threshold_warning, alert_threshold_critical) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  insertBudget.run(uuidv4(), 'Production Q1 2026', projects[0].id, null, 15000, 'monthly', 0.8, 0.95)
  insertBudget.run(uuidv4(), 'Staging Monthly', projects[1].id, null, 5000, 'monthly', 0.75, 0.9)
  insertBudget.run(uuidv4(), 'ML Compute Budget', projects[2].id, services[0].id, 8000, 'monthly', 0.8, 0.95)
  insertBudget.run(uuidv4(), 'Internal Tools Quarterly', projects[3].id, null, 3000, 'quarterly', 0.85, 0.95)

  // ~50 audit log entries
  const insertAudit = db.prepare('INSERT INTO audit_log (id, timestamp, actor, action, resource_type, resource_id, details, outcome) VALUES (?, ?, ?, ?, ?, ?, ?, ?)')
  const actors = ['admin', 'system', 'john.doe', 'jane.smith']
  const actions = [
    { action: 'cost.created', resource_type: 'cost' },
    { action: 'cost.updated', resource_type: 'cost' },
    { action: 'cost.deleted', resource_type: 'cost' },
    { action: 'budget.created', resource_type: 'budget' },
    { action: 'budget.updated', resource_type: 'budget' },
    { action: 'csv.imported', resource_type: 'cost' },
    { action: 'settings.updated', resource_type: 'settings' },
    { action: 'budget.alert_triggered', resource_type: 'budget' }
  ]

  const insertAudits = db.transaction(() => {
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const ts = new Date(now.getTime() - daysAgo * 86400000)
      const timestamp = ts.toISOString().replace('T', ' ').slice(0, 19)
      const actor = actors[Math.floor(Math.random() * actors.length)]
      const act = actions[Math.floor(Math.random() * actions.length)]
      insertAudit.run(uuidv4(), timestamp, actor, act.action, act.resource_type, uuidv4(), JSON.stringify({ note: `Auto-generated audit entry #${i + 1}` }), Math.random() > 0.05 ? 'success' : 'failure')
    }
  })
  insertAudits()

  db.close()
  console.log('Done! Seeded: 6 services, 4 projects, ~200 costs, 4 budgets, 50 audit entries.')
  app.quit()
})
