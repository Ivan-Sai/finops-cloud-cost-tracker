export interface CostRecord {
  id: string
  service_id: string
  project_id: string
  amount: number
  date: string
  description: string | null
  tags: string | null
  created_at: string
  // Joined fields
  service_name?: string
  project_name?: string
  provider?: string
  category?: string
}

export interface CostFilters {
  search?: string
  service_id?: string
  project_id?: string
  date_from?: string
  date_to?: string
  sort_by?: string
  sort_order?: 'asc' | 'desc'
  page?: number
  page_size?: number
}

export interface CostStats {
  total_mtd: number
  total_prev_month: number
  monthly_trend: { month: string; total: number }[]
  top_services: { service_id: string; service_name: string; total: number }[]
  daily_costs: { date: string; total: number }[]
}

export interface CostsPaginatedResult {
  data: CostRecord[]
  total: number
  page: number
  page_size: number
}
