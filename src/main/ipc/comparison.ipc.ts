import { getDatabase } from '../database/connection'
import { safeHandle } from './safe-handle'

export function registerComparisonIPC(): void {
  const db = getDatabase()

  safeHandle(
    'comparison:getData',
    (_event, period1: string, period2: string) => {
      // period format: "2026-01"
      const getData = (period: string) => {
        return db
          .prepare(
            `SELECT s.name as service_name, s.id as service_id, COALESCE(SUM(c.amount), 0) as total
             FROM services s
             LEFT JOIN costs c ON c.service_id = s.id AND strftime('%Y-%m', c.date) = ?
             GROUP BY s.id
             ORDER BY s.name`
          )
          .all(period)
      }

      const data1 = getData(period1) as { service_name: string; service_id: string; total: number }[]
      const data2 = getData(period2) as { service_name: string; service_id: string; total: number }[]

      const comparison = data1.map((d1) => {
        const d2 = data2.find((d) => d.service_id === d1.service_id)
        const total2 = d2?.total || 0
        return {
          service_name: d1.service_name,
          service_id: d1.service_id,
          period1_total: d1.total,
          period2_total: total2,
          delta: total2 - d1.total,
          delta_pct: d1.total > 0 ? ((total2 - d1.total) / d1.total) * 100 : 0
        }
      })

      return { period1, period2, comparison }
    }
  )
}
