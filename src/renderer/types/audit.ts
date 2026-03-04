export interface AuditEntry {
  id: string
  timestamp: string
  actor: string
  action: string
  resource_type: string
  resource_id: string | null
  details: string | null
  outcome: 'success' | 'failure'
}

export interface AuditFilters {
  date_from?: string
  date_to?: string
  actor?: string
  action?: string
  resource_type?: string
}
