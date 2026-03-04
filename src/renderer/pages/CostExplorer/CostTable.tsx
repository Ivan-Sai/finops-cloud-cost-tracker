import { Table, Tag, Typography, Button, Space } from 'antd'
import { EditOutlined, DeleteOutlined } from '@ant-design/icons'
import type { ColumnsType, TablePaginationConfig } from 'antd/es/table'
import type { SorterResult } from 'antd/es/table/interface'
import type { CostRecord } from '../../types/cost'
import { useCostsStore } from '../../stores/costsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, formatDate } from '../../utils/formatters'

const { Text } = Typography

interface CostTableProps {
  onRowClick: (record: CostRecord) => void
  onEdit: (record: CostRecord) => void
  onDelete: (record: CostRecord) => void
  loading?: boolean
}

export default function CostTable({ onRowClick, onEdit, onDelete }: CostTableProps): JSX.Element {
  const { costs, total, page, pageSize, loading, setFilters, filters } = useCostsStore()
  const currency = useSettingsStore((s) => s.currency)

  const columns: ColumnsType<CostRecord> = [
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      sorter: true,
      sortOrder: filters.sort_by === 'date' ? (filters.sort_order === 'asc' ? 'ascend' : 'descend') : null,
      render: (date: string) => formatDate(date),
      width: 140
    },
    {
      title: 'Service',
      dataIndex: 'service_name',
      key: 'service_name',
      sorter: true,
      sortOrder: filters.sort_by === 'service_name' ? (filters.sort_order === 'asc' ? 'ascend' : 'descend') : null,
      render: (name: string, record: CostRecord) => (
        <div>
          <Text strong>{name}</Text>
          <br />
          <Text type="secondary" style={{ fontSize: 12 }}>
            {record.provider} / {record.category}
          </Text>
        </div>
      ),
      width: 180
    },
    {
      title: 'Project',
      dataIndex: 'project_name',
      key: 'project_name',
      sorter: true,
      sortOrder: filters.sort_by === 'project_name' ? (filters.sort_order === 'asc' ? 'ascend' : 'descend') : null,
      width: 180
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      sorter: true,
      sortOrder: filters.sort_by === 'amount' ? (filters.sort_order === 'asc' ? 'ascend' : 'descend') : null,
      render: (amount: number) => (
        <Text strong>{formatCurrency(amount, currency)}</Text>
      ),
      width: 120,
      align: 'right'
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (desc: string | null) => desc || <Text type="secondary">—</Text>
    },
    {
      title: 'Tags',
      dataIndex: 'tags',
      key: 'tags',
      width: 200,
      render: (tags: string | null) => {
        if (!tags) return <Text type="secondary">—</Text>
        try {
          const parsed = JSON.parse(tags) as string[]
          return (
            <>
              {parsed.map((tag) => (
                <Tag key={tag}>{tag}</Tag>
              ))}
            </>
          )
        } catch {
          return <Text type="secondary">—</Text>
        }
      }
    },
    {
      title: 'Actions',
      key: 'actions',
      width: 90,
      render: (_, record) => (
        <Space>
          <Button
            size="small"
            icon={<EditOutlined />}
            onClick={(e) => { e.stopPropagation(); onEdit(record) }}
          />
          <Button
            size="small"
            danger
            icon={<DeleteOutlined />}
            onClick={(e) => { e.stopPropagation(); onDelete(record) }}
          />
        </Space>
      )
    }
  ]

  const handleTableChange = (
    pagination: TablePaginationConfig,
    _filters: Record<string, unknown>,
    sorter: SorterResult<CostRecord> | SorterResult<CostRecord>[]
  ): void => {
    const s = Array.isArray(sorter) ? sorter[0] : sorter
    setFilters({
      page: pagination.current,
      page_size: pagination.pageSize,
      sort_by: s.order ? (s.columnKey as string) : undefined,
      sort_order: s.order === 'ascend' ? 'asc' : s.order === 'descend' ? 'desc' : undefined
    })
  }

  return (
    <Table<CostRecord>
      dataSource={costs}
      columns={columns}
      rowKey="id"
      loading={loading}
      pagination={{
        current: page,
        pageSize: pageSize,
        total: total,
        showSizeChanger: true,
        showTotal: (t, range) => `${range[0]}-${range[1]} of ${t} records`,
        pageSizeOptions: ['10', '20', '50', '100']
      }}
      onChange={handleTableChange}
      onRow={(record) => ({
        onClick: () => onRowClick(record),
        style: { cursor: 'pointer' }
      })}
      size="middle"
      scroll={{ x: 1000 }}
    />
  )
}
