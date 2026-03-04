export interface Project {
  id: string
  name: string
  description: string | null
  environment: 'production' | 'staging' | 'development'
  owner: string
  created_at: string
}
