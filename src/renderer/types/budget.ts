export interface Budget {
  id: string
  name: string
  project_id: string | null
  service_id: string | null
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  alert_threshold_warning: number
  alert_threshold_critical: number
  created_at: string
  // Joined fields
  project_name?: string
  service_name?: string
  // Computed
  spent?: number
  utilization?: number
}

export interface BudgetAlert {
  budget_id: string
  budget_name: string
  level: 'warning' | 'critical' | 'exceeded'
  utilization: number
  spent: number
  limit: number
}

export interface BudgetFormData {
  name: string
  project_id: string | null
  service_id: string | null
  amount: number
  period: 'monthly' | 'quarterly' | 'yearly'
  alert_threshold_warning: number
  alert_threshold_critical: number
}
