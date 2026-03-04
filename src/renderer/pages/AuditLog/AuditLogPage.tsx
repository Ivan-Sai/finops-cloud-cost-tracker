import { useEffect, useState } from 'react'
import {
  Typography,
  Table,
  Tag,
  Space,
  Select,
  DatePicker,
  Button,
  message
} from 'antd'
import {
  DownloadOutlined,
  ClearOutlined,
  InfoCircleOutlined
} from '@ant-design/icons'
import dayjs from 'dayjs'
import { useAuditStore } from '../../stores/auditStore'
import type { AuditEntry } from '../../types/audit'
import { ACTION_COLORS, OUTCOME_COLORS } from './constants'
import AuditDetailDrawer from './AuditDetailDrawer'

const { Title, Text } = Typography
const { RangePicker } = DatePicker

export default function AuditLogPage(): JSX.Element {
  const { entries, filters, loading, fetchEntries, setFilters } = useAuditStore()
  const [selectedEntry, setSelectedEntry] = useState<AuditEntry | null>(null)
  const [filterOptions, setFilterOptions] = useState<{
    actors: string[]
    actions: string[]
    resourceTypes: string[]
  }>({ actors: [], actions: [], resourceTypes: [] })
  const [exporting, setExporting] = useState(false)

  useEffect(() => {
    fetchEntries()
    loadFilterOptions()
  }, [])

  const loadFilterOptions = async (): Promise<void> => {
    try {
      const options = (await window.api.invoke('audit:getFilterOptions')) as {
        actors: string[]
        actions: string[]
        resourceTypes: string[]
      }
      setFilterOptions(options)
    } catch {
      // filter options are optional
    }
  }

  const handleDateChange = (
    dates: [dayjs.Dayjs | null, dayjs.Dayjs | null] | null
  ): void => {
    setFilters({
      date_from: dates?.[0]?.format('YYYY-MM-DD') ?? undefined,
      date_to: dates?.[1]?.format('YYYY-MM-DD') ?? undefined
    })
  }

  const handleClear = (): void => {
    setFilters({
      date_from: undefined,
      date_to: undefined,
      actor: undefined,
      action: undefined,
      resource_type: undefined
    })
  }

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    try {
      const saved = await window.api.invoke('audit:export', filters)
      if (saved) {
        message.success('Audit log exported successfully')
      }
    } catch (err) {
      message.error('Export failed: ' + (err as Error).message)
    } finally {
      setExporting(false)
    }
  }

  const hasFilters =
    filters.date_from || filters.actor || filters.action || filters.resource_type

  const columns = [
    {
      title: 'Timestamp',
      dataIndex: 'timestamp',
      key: 'timestamp',
      width: 180,
      render: (v: string) => dayjs(v).format('YYYY-MM-DD HH:mm:ss')
    },
    {
      title: 'Actor',
      dataIndex: 'actor',
      key: 'actor',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Action',
      dataIndex: 'action',
      key: 'action',
      width: 160,
      render: (v: string) => <Tag color={ACTION_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: 'Resource',
      dataIndex: 'resource_type',
      key: 'resource_type',
      width: 100,
      render: (v: string) => <Tag>{v}</Tag>
    },
    {
      title: 'Resource ID',
      dataIndex: 'resource_id',
      key: 'resource_id',
      width: 140,
      ellipsis: true,
      render: (v: string | null) =>
        v ? (
          <Text copyable style={{ fontSize: 12 }}>
            {v.slice(0, 8)}...
          </Text>
        ) : (
          <Text type="secondary">—</Text>
        )
    },
    {
      title: 'Outcome',
      dataIndex: 'outcome',
      key: 'outcome',
      width: 90,
      render: (v: string) => <Tag color={OUTCOME_COLORS[v] || 'default'}>{v}</Tag>
    },
    {
      title: '',
      key: 'actions',
      width: 50,
      render: (_: unknown, record: AuditEntry) => (
        <Button
          type="text"
          icon={<InfoCircleOutlined />}
          onClick={() => setSelectedEntry(record)}
        />
      )
    }
  ]

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Audit Log
        </Title>
        <Button
          icon={<DownloadOutlined />}
          onClick={handleExport}
          loading={exporting}
        >
          Export CSV
        </Button>
      </div>

      <Space wrap size="middle" style={{ marginBottom: 16, width: '100%' }}>
        <RangePicker
          value={
            filters.date_from && filters.date_to
              ? [dayjs(filters.date_from), dayjs(filters.date_to)]
              : null
          }
          onChange={handleDateChange}
        />
        <Select
          placeholder="Actor"
          allowClear
          style={{ width: 130 }}
          value={filters.actor}
          onChange={(v) => setFilters({ actor: v })}
          options={filterOptions.actors.map((a) => ({ label: a, value: a }))}
        />
        <Select
          placeholder="Action"
          allowClear
          style={{ width: 180 }}
          value={filters.action}
          onChange={(v) => setFilters({ action: v })}
          options={filterOptions.actions.map((a) => ({ label: a, value: a }))}
        />
        <Select
          placeholder="Resource type"
          allowClear
          style={{ width: 150 }}
          value={filters.resource_type}
          onChange={(v) => setFilters({ resource_type: v })}
          options={filterOptions.resourceTypes.map((r) => ({ label: r, value: r }))}
        />
        {hasFilters && (
          <Button icon={<ClearOutlined />} onClick={handleClear}>
            Clear
          </Button>
        )}
      </Space>

      <Table
        dataSource={entries}
        columns={columns}
        rowKey="id"
        loading={loading}
        pagination={{ pageSize: 20, showSizeChanger: true, showTotal: (total) => `${total} events` }}
        size="middle"
      />

      <AuditDetailDrawer
        entry={selectedEntry}
        open={!!selectedEntry}
        onClose={() => setSelectedEntry(null)}
      />
    </div>
  )
}
