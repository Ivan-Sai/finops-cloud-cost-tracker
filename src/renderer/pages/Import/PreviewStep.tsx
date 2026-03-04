import { useMemo } from 'react'
import { Table, Tag, Alert, Typography, Space } from 'antd'
import { useSettingsStore } from '../../stores/settingsStore'
import { getCurrencySymbol } from '../../utils/formatters'

const { Text } = Typography

interface PreviewStepProps {
  rows: Record<string, unknown>[]
  mapping: Record<string, string>
}

export default function PreviewStep({ rows, mapping }: PreviewStepProps): JSX.Element {
  const sym = getCurrencySymbol(useSettingsStore((s) => s.currency))
  // Apply mapping: transform CSV rows into target rows
  const mappedRows = useMemo(() => {
    return rows.slice(0, 10).map((row, idx) => {
      const mapped: Record<string, unknown> = { _index: idx + 1 }
      for (const [targetKey, csvColumn] of Object.entries(mapping)) {
        mapped[targetKey] = row[csvColumn] ?? null
      }
      return mapped
    })
  }, [rows, mapping])

  // Validate each row
  const validationResults = useMemo(() => {
    return mappedRows.map((row) => {
      const issues: string[] = []
      if (!row.service_id) issues.push('Missing service_id')
      if (!row.project_id) issues.push('Missing project_id')
      if (!row.amount && row.amount !== 0) issues.push('Missing amount')
      else if (isNaN(Number(row.amount)) || Number(row.amount) < 0) issues.push('Invalid amount')
      if (!row.date) issues.push('Missing date')
      else if (!/^\d{4}-\d{2}-\d{2}$/.test(String(row.date))) issues.push('Invalid date format')
      return issues
    })
  }, [mappedRows])

  const totalErrors = validationResults.filter((v) => v.length > 0).length

  const columns = [
    {
      title: '#',
      dataIndex: '_index',
      key: '_index',
      width: 50
    },
    {
      title: 'Service ID',
      dataIndex: 'service_id',
      key: 'service_id',
      ellipsis: true,
      render: (v: unknown) => (v ? String(v) : <Text type="danger">—</Text>)
    },
    {
      title: 'Project ID',
      dataIndex: 'project_id',
      key: 'project_id',
      ellipsis: true,
      render: (v: unknown) => (v ? String(v) : <Text type="danger">—</Text>)
    },
    {
      title: 'Amount',
      dataIndex: 'amount',
      key: 'amount',
      width: 120,
      render: (v: unknown) => {
        const num = Number(v)
        if (v === null || v === undefined) return <Text type="danger">—</Text>
        if (isNaN(num) || num < 0) return <Tag color="red">{String(v)}</Tag>
        return `${sym}${num.toFixed(2)}`
      }
    },
    {
      title: 'Date',
      dataIndex: 'date',
      key: 'date',
      width: 130,
      render: (v: unknown) => {
        if (!v) return <Text type="danger">—</Text>
        if (!/^\d{4}-\d{2}-\d{2}$/.test(String(v))) return <Tag color="red">{String(v)}</Tag>
        return String(v)
      }
    },
    {
      title: 'Description',
      dataIndex: 'description',
      key: 'description',
      ellipsis: true,
      render: (v: unknown) => (v ? String(v) : <Text type="secondary">—</Text>)
    },
    {
      title: 'Validation',
      key: 'validation',
      width: 180,
      render: (_: unknown, __: unknown, index: number) => {
        const issues = validationResults[index]
        if (!issues || issues.length === 0) return <Tag color="green">OK</Tag>
        return (
          <Space direction="vertical" size={2}>
            {issues.map((issue, i) => (
              <Tag color="red" key={i}>
                {issue}
              </Tag>
            ))}
          </Space>
        )
      }
    }
  ]

  return (
    <div>
      {totalErrors > 0 ? (
        <Alert
          type="warning"
          showIcon
          message={`${totalErrors} of ${mappedRows.length} preview rows have validation issues`}
          description="Rows with errors will be skipped during import. You can go back to fix the column mapping."
          style={{ marginBottom: 16 }}
        />
      ) : (
        <Alert
          type="success"
          showIcon
          message={`All ${mappedRows.length} preview rows look valid`}
          style={{ marginBottom: 16 }}
        />
      )}

      <Text type="secondary" style={{ display: 'block', marginBottom: 8 }}>
        Showing first {mappedRows.length} of {rows.length} total rows
      </Text>

      <Table
        dataSource={mappedRows}
        columns={columns}
        rowKey="_index"
        pagination={false}
        size="small"
        scroll={{ x: 800 }}
      />
    </div>
  )
}
