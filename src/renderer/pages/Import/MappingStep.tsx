import { useEffect, useState } from 'react'
import { Select, Table, Tag, Typography, Alert, Spin } from 'antd'
import { CheckCircleOutlined, WarningOutlined } from '@ant-design/icons'

const { Text } = Typography

// Required target fields for cost import
const TARGET_FIELDS = [
  { key: 'service_id', label: 'Service ID', required: true },
  { key: 'project_id', label: 'Project ID', required: true },
  { key: 'amount', label: 'Amount', required: true },
  { key: 'date', label: 'Date', required: true },
  { key: 'description', label: 'Description', required: false },
  { key: 'tags', label: 'Tags', required: false }
]

// Auto-mapping: try to match CSV headers to target fields
function autoMap(headers: string[]): Record<string, string> {
  const mapping: Record<string, string> = {}
  const lowerHeaders = headers.map((h) => h.toLowerCase().replace(/[^a-z0-9]/g, '_'))

  for (const field of TARGET_FIELDS) {
    const idx = lowerHeaders.findIndex(
      (h) =>
        h === field.key ||
        h === field.key.replace('_', '') ||
        h.includes(field.key.split('_')[0])
    )
    if (idx !== -1) {
      mapping[field.key] = headers[idx]
    }
  }
  return mapping
}

interface MappingStepProps {
  csvHeaders: string[]
  mapping: Record<string, string>
  onMappingChange: (mapping: Record<string, string>) => void
}

export default function MappingStep({
  csvHeaders,
  mapping,
  onMappingChange
}: MappingStepProps): JSX.Element {
  const [initialized, setInitialized] = useState(false)

  useEffect(() => {
    if (!initialized && csvHeaders.length > 0 && Object.keys(mapping).length === 0) {
      const auto = autoMap(csvHeaders)
      onMappingChange(auto)
      setInitialized(true)
    }
  }, [csvHeaders, initialized])

  const handleChange = (targetKey: string, csvColumn: string | undefined): void => {
    const next = { ...mapping }
    if (csvColumn) {
      next[targetKey] = csvColumn
    } else {
      delete next[targetKey]
    }
    onMappingChange(next)
  }

  const requiredMapped = TARGET_FIELDS.filter((f) => f.required).every(
    (f) => mapping[f.key]
  )

  const headerOptions = csvHeaders.map((h) => ({ label: h, value: h }))

  const columns = [
    {
      title: 'Target Field',
      dataIndex: 'label',
      key: 'label',
      width: 180,
      render: (label: string, record: (typeof TARGET_FIELDS)[0]) => (
        <span>
          {label} {record.required && <Tag color="red">Required</Tag>}
        </span>
      )
    },
    {
      title: 'CSV Column',
      dataIndex: 'key',
      key: 'mapping',
      render: (_: unknown, record: (typeof TARGET_FIELDS)[0]) => (
        <Select
          placeholder="Select CSV column"
          allowClear
          style={{ width: 250 }}
          value={mapping[record.key]}
          onChange={(v) => handleChange(record.key, v)}
          options={headerOptions}
        />
      )
    },
    {
      title: 'Status',
      key: 'status',
      width: 100,
      render: (_: unknown, record: (typeof TARGET_FIELDS)[0]) =>
        mapping[record.key] ? (
          <CheckCircleOutlined style={{ color: '#52c41a', fontSize: 18 }} />
        ) : record.required ? (
          <WarningOutlined style={{ color: '#faad14', fontSize: 18 }} />
        ) : (
          <Text type="secondary">—</Text>
        )
    }
  ]

  if (csvHeaders.length === 0) {
    return <Spin tip="Loading CSV headers..." />
  }

  return (
    <div>
      <Alert
        type={requiredMapped ? 'success' : 'warning'}
        showIcon
        message={
          requiredMapped
            ? 'All required fields are mapped'
            : 'Please map all required fields before proceeding'
        }
        style={{ marginBottom: 16 }}
      />

      <Text type="secondary" style={{ display: 'block', marginBottom: 12 }}>
        CSV columns found: {csvHeaders.join(', ')}
      </Text>

      <Table
        dataSource={TARGET_FIELDS}
        columns={columns}
        rowKey="key"
        pagination={false}
        size="middle"
      />
    </div>
  )
}
