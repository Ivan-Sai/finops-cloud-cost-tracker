import Database from 'better-sqlite3'
import { v4 as uuidv4 } from 'uuid'

export function seedDatabase(db: Database.Database): void {
  const count = db.prepare('SELECT COUNT(*) as cnt FROM services').get() as { cnt: number }
  if (count.cnt > 0) return // Already seeded

  const services = [
    { id: uuidv4(), name: 'EC2', provider: 'AWS', category: 'Compute' },
    { id: uuidv4(), name: 'S3', provider: 'AWS', category: 'Storage' },
    { id: uuidv4(), name: 'RDS', provider: 'AWS', category: 'Database' },
    { id: uuidv4(), name: 'Lambda', provider: 'AWS', category: 'Compute' },
    { id: uuidv4(), name: 'CloudFront', provider: 'AWS', category: 'Network' },
    { id: uuidv4(), name: 'EKS', provider: 'AWS', category: 'Compute' }
  ]

  const projects = [
    {
      id: uuidv4(),
      name: 'Production API',
      description: 'Main production API services',
      environment: 'production',
      owner: 'Platform Team'
    },
    {
      id: uuidv4(),
      name: 'Staging Environment',
      description: 'Pre-production testing environment',
      environment: 'staging',
      owner: 'DevOps Team'
    },
    {
      id: uuidv4(),
      name: 'ML Pipeline',
      description: 'Machine learning training and inference',
      environment: 'production',
      owner: 'Data Science Team'
    },
    {
      id: uuidv4(),
      name: 'Internal Tools',
      description: 'Internal dashboards and utilities',
      environment: 'development',
      owner: 'Engineering Team'
    }
  ]

  // Insert services
  const insertService = db.prepare(
    'INSERT INTO services (id, name, provider, category) VALUES (?, ?, ?, ?)'
  )
  for (const s of services) {
    insertService.run(s.id, s.name, s.provider, s.category)
  }

  // Insert projects
  const insertProject = db.prepare(
    'INSERT INTO projects (id, name, description, environment, owner) VALUES (?, ?, ?, ?, ?)'
  )
  for (const p of projects) {
    insertProject.run(p.id, p.name, p.description, p.environment, p.owner)
  }

  // Generate ~200 cost records over the last 12 months
  const insertCost = db.prepare(
    'INSERT INTO costs (id, service_id, project_id, amount, date, description, tags) VALUES (?, ?, ?, ?, ?, ?, ?)'
  )

  const now = new Date()
  const baseCosts: Record<string, number> = {
    EC2: 1200,
    S3: 350,
    RDS: 800,
    Lambda: 150,
    CloudFront: 200,
    EKS: 950
  }

  const descriptions = [
    'Monthly compute usage',
    'Data transfer costs',
    'Storage allocation',
    'API request processing',
    'Database operations',
    'CDN distribution',
    'Container orchestration',
    'Serverless invocations'
  ]

  const tagSets = [
    '["api","backend"]',
    '["frontend","cdn"]',
    '["database","storage"]',
    '["ml","training"]',
    '["monitoring","ops"]',
    '["infrastructure"]'
  ]

  const insertMany = db.transaction(() => {
    for (let monthOffset = 11; monthOffset >= 0; monthOffset--) {
      const date = new Date(now.getFullYear(), now.getMonth() - monthOffset, 1)
      const yearMonth = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`

      for (const service of services) {
        // 1-2 records per service per month, assigned to random projects
        const recordCount = 1 + Math.floor(Math.random() * 2)
        for (let r = 0; r < recordCount; r++) {
          const project = projects[Math.floor(Math.random() * projects.length)]
          const baseCost = baseCosts[service.name] || 500
          // Add some variance and a slight upward trend
          const trendMultiplier = 1 + (11 - monthOffset) * 0.02
          const variance = 0.7 + Math.random() * 0.6
          const amount = Math.round(baseCost * trendMultiplier * variance * 100) / 100

          const day = 1 + Math.floor(Math.random() * 28)
          const costDate = `${yearMonth}-${String(day).padStart(2, '0')}`

          insertCost.run(
            uuidv4(),
            service.id,
            project.id,
            amount,
            costDate,
            descriptions[Math.floor(Math.random() * descriptions.length)],
            tagSets[Math.floor(Math.random() * tagSets.length)]
          )
        }
      }
    }
  })

  insertMany()

  // Create 4 budgets
  const insertBudget = db.prepare(
    `INSERT INTO budgets (id, name, project_id, service_id, amount, period, alert_threshold_warning, alert_threshold_critical)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

  insertBudget.run(uuidv4(), 'Production Q1 2026', projects[0].id, null, 15000, 'monthly', 0.8, 0.95)
  insertBudget.run(uuidv4(), 'Staging Monthly', projects[1].id, null, 5000, 'monthly', 0.75, 0.9)
  insertBudget.run(uuidv4(), 'ML Compute Budget', projects[2].id, services[0].id, 8000, 'monthly', 0.8, 0.95)
  insertBudget.run(uuidv4(), 'Internal Tools Quarterly', projects[3].id, null, 3000, 'quarterly', 0.85, 0.95)

  // Generate ~50 audit log entries
  const insertAudit = db.prepare(
    `INSERT INTO audit_log (id, timestamp, actor, action, resource_type, resource_id, details, outcome)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  )

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

  const auditTransaction = db.transaction(() => {
    for (let i = 0; i < 50; i++) {
      const daysAgo = Math.floor(Math.random() * 30)
      const ts = new Date(now.getTime() - daysAgo * 86400000)
      const timestamp = ts.toISOString().replace('T', ' ').slice(0, 19)
      const actor = actors[Math.floor(Math.random() * actors.length)]
      const act = actions[Math.floor(Math.random() * actions.length)]

      insertAudit.run(
        uuidv4(),
        timestamp,
        actor,
        act.action,
        act.resource_type,
        uuidv4(),
        JSON.stringify({ note: `Auto-generated audit entry #${i + 1}` }),
        Math.random() > 0.05 ? 'success' : 'failure'
      )
    }
  })

  auditTransaction()
}
