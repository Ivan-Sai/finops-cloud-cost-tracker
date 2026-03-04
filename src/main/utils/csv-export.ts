import { dialog } from 'electron'
import { writeFileSync } from 'fs'
import Papa from 'papaparse'

export async function exportToCSV(
  rows: Record<string, unknown>[],
  defaultName: string
): Promise<boolean> {
  const csv = Papa.unparse(rows)

  const result = await dialog.showSaveDialog({
    defaultPath: defaultName,
    filters: [{ name: 'CSV Files', extensions: ['csv'] }]
  })

  if (result.canceled || !result.filePath) return false

  writeFileSync(result.filePath, csv, 'utf-8')
  return true
}
