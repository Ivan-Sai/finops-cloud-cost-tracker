import Database from 'better-sqlite3'
import { join } from 'path'
import { mkdirSync } from 'fs'

let db: Database.Database | null = null

export function getDatabase(): Database.Database {
  if (!db) {
    // __dirname = out/main → go up 2 levels to project root
    const dataDir = join(__dirname, '..', '..', 'data')
    mkdirSync(dataDir, { recursive: true })
    const dbPath = join(dataDir, 'finops-tracker.db')
    db = new Database(dbPath)
    db.pragma('journal_mode = WAL')
    db.pragma('foreign_keys = ON')
  }
  return db
}

export function closeDatabase(): void {
  if (db) {
    db.close()
    db = null
  }
}
