import { useEffect } from 'react'
import { Input, Select, DatePicker, Space, Button } from 'antd'
import { SearchOutlined, ClearOutlined } from '@ant-design/icons'
import dayjs from 'dayjs'
import { useCostsStore } from '../../stores/costsStore'
import { useProjectsStore } from '../../stores/projectsStore'

const { RangePicker } = DatePicker

export default function CostFilters(): JSX.Element {
  const { filters, setFilters } = useCostsStore()
  const { projects, services, fetchProjects, fetchServices } = useProjectsStore()

  useEffect(() => {
    fetchProjects()
    fetchServices()
  }, [])

  const handleSearch = (value: string): void => {
    setFilters({ search: value || undefined, page: 1 })
  }

  const handleServiceChange = (value: string | undefined): void => {
    setFilters({ service_id: value, page: 1 })
  }

  const handleProjectChange = (value: string | undefined): void => {
    setFilters({ project_id: value, page: 1 })
  }

  const handleDateChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ): void => {
    setFilters({
      date_from: dates?.[0]?.format('YYYY-MM-DD') ?? undefined,
      date_to: dates?.[1]?.format('YYYY-MM-DD') ?? undefined,
      page: 1
    })
  }

  const handleClear = (): void => {
    setFilters({
      search: undefined,
      service_id: undefined,
      project_id: undefined,
      date_from: undefined,
      date_to: undefined,
      page: 1
    })
  }

  const hasFilters = filters.search || filters.service_id || filters.project_id || filters.date_from

  return (
    <Space wrap size="middle" style={{ marginBottom: 16, width: '100%' }}>
      <Input.Search
        className="cost-search-input"
        placeholder="Search services, projects..."
        allowClear
        onSearch={handleSearch}
        style={{ width: 240 }}
        prefix={<SearchOutlined />}
        defaultValue={filters.search}
      />
      <Select
        placeholder="Service"
        allowClear
        style={{ width: 160 }}
        value={filters.service_id}
        onChange={handleServiceChange}
        options={services.map((s) => ({ label: s.name, value: s.id }))}
      />
      <Select
        placeholder="Project"
        allowClear
        style={{ width: 180 }}
        value={filters.project_id}
        onChange={handleProjectChange}
        options={projects.map((p) => ({ label: p.name, value: p.id }))}
      />
      <RangePicker
        value={
          filters.date_from && filters.date_to
            ? [dayjs(filters.date_from), dayjs(filters.date_to)]
            : null
        }
        onChange={handleDateChange}
      />
      {hasFilters && (
        <Button icon={<ClearOutlined />} onClick={handleClear}>
          Clear
        </Button>
      )}
    </Space>
  )
}
