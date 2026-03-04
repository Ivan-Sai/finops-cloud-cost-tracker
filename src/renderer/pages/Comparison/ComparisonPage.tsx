import { useState } from 'react'
import { Typography, Card, DatePicker, Row, Col, Table, Tag, Button, Empty, Spin } from 'antd'
import { SwapOutlined, ArrowUpOutlined, ArrowDownOutlined, MinusOutlined } from '@ant-design/icons'
import type { ColumnsType } from 'antd/es/table'
import dayjs from 'dayjs'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, formatMonth } from '../../utils/formatters'
import ComparisonChart from './ComparisonChart'

const { Title, Text } = Typography

interface ComparisonRow {
  service_name: string
  service_id: string
  period1_total: number
  period2_total: number
  delta: number
  delta_pct: number
}

interface ComparisonData {
  period1: string
  period2: string
  comparison: ComparisonRow[]
}

export default function ComparisonPage(): JSX.Element {
  const [period1, setPeriod1] = useState<string>(dayjs().subtract(1, 'month').format('YYYY-MM'))
  const [period2, setPeriod2] = useState<string>(dayjs().format('YYYY-MM'))
  const [data, setData] = useState<ComparisonData | null>(null)
  const [loading, setLoading] = useState(false)
  const currency = useSettingsStore((s) => s.currency)

  const handleCompare = async (): Promise<void> => {
    setLoading(true)
    try {
      const result = (await window.api.invoke(
        'comparison:getData',
        period1,
        period2
      )) as ComparisonData
      setData(result)
    } catch {
      setData(null)
    }
    setLoading(false)
  }

  const columns: ColumnsType<ComparisonRow> = [
    {
      title: 'Service',
      dataIndex: 'service_name',
      key: 'service_name',
      sorter: (a, b) => a.service_name.localeCompare(b.service_name)
    },
    {
      title: formatMonth(period1),
      dataIndex: 'period1_total',
      key: 'period1_total',
      render: (v: number) => formatCurrency(v, currency),
      sorter: (a, b) => a.period1_total - b.period1_total,
      align: 'right'
    },
    {
      title: formatMonth(period2),
      dataIndex: 'period2_total',
      key: 'period2_total',
      render: (v: number) => formatCurrency(v, currency),
      sorter: (a, b) => a.period2_total - b.period2_total,
      align: 'right'
    },
    {
      title: 'Change ($)',
      dataIndex: 'delta',
      key: 'delta',
      render: (v: number) => (
        <Text type={v > 0 ? 'danger' : v < 0 ? 'success' : undefined}>
          {v > 0 ? '+' : ''}{formatCurrency(v, currency)}
        </Text>
      ),
      sorter: (a, b) => a.delta - b.delta,
      align: 'right'
    },
    {
      title: 'Change (%)',
      key: 'delta_pct',
      render: (_: unknown, record: ComparisonRow) => {
        const pct = record.delta_pct
        if (Math.abs(pct) < 0.1) {
          return <Tag icon={<MinusOutlined />}>0%</Tag>
        }
        return pct > 0 ? (
          <Tag icon={<ArrowUpOutlined />} color="red">
            +{pct.toFixed(1)}%
          </Tag>
        ) : (
          <Tag icon={<ArrowDownOutlined />} color="green">
            {pct.toFixed(1)}%
          </Tag>
        )
      },
      sorter: (a, b) => a.delta_pct - b.delta_pct,
      align: 'center'
    }
  ]

  const totals = data?.comparison.reduce(
    (acc, row) => ({
      p1: acc.p1 + row.period1_total,
      p2: acc.p2 + row.period2_total
    }),
    { p1: 0, p2: 0 }
  )

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Month-to-Month Comparison
      </Title>

      <Card style={{ marginBottom: 16 }}>
        <Row gutter={16} align="middle">
          <Col>
            <Text strong>Period 1:</Text>
            <DatePicker
              picker="month"
              value={dayjs(period1 + '-01')}
              onChange={(d) => d && setPeriod1(d.format('YYYY-MM'))}
              style={{ marginLeft: 8 }}
              allowClear={false}
            />
          </Col>
          <Col>
            <SwapOutlined style={{ fontSize: 20 }} />
          </Col>
          <Col>
            <Text strong>Period 2:</Text>
            <DatePicker
              picker="month"
              value={dayjs(period2 + '-01')}
              onChange={(d) => d && setPeriod2(d.format('YYYY-MM'))}
              style={{ marginLeft: 8 }}
              allowClear={false}
            />
          </Col>
          <Col>
            <Button type="primary" onClick={handleCompare} loading={loading}>
              Compare
            </Button>
          </Col>
        </Row>
      </Card>

      {loading ? (
        <Card>
          <div style={{ textAlign: 'center', padding: 48 }}>
            <Spin size="large" />
          </div>
        </Card>
      ) : !data ? (
        <Card>
          <Empty description="Select two periods and click Compare to see the results" />
        </Card>
      ) : (
        <>
          {totals && (
            <Row gutter={[16, 16]} style={{ marginBottom: 16 }}>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Text type="secondary">{formatMonth(period1)} Total</Text>
                  <Title level={4} style={{ margin: 0 }}>{formatCurrency(totals.p1, currency)}</Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Text type="secondary">{formatMonth(period2)} Total</Text>
                  <Title level={4} style={{ margin: 0 }}>{formatCurrency(totals.p2, currency)}</Title>
                </Card>
              </Col>
              <Col xs={24} sm={8}>
                <Card size="small">
                  <Text type="secondary">Overall Change</Text>
                  <Title
                    level={4}
                    style={{ margin: 0 }}
                    type={totals.p2 - totals.p1 > 0 ? 'danger' : 'success'}
                  >
                    {totals.p2 - totals.p1 > 0 ? '+' : ''}
                    {formatCurrency(totals.p2 - totals.p1, currency)}
                  </Title>
                </Card>
              </Col>
            </Row>
          )}

          <Row gutter={[16, 16]}>
            <Col xs={24} lg={12}>
              <ComparisonChart
                data={data.comparison}
                period1Label={formatMonth(period1)}
                period2Label={formatMonth(period2)}
              />
            </Col>
            <Col xs={24} lg={12}>
              <Card title="Detailed Breakdown">
                <Table<ComparisonRow>
                  columns={columns}
                  dataSource={data.comparison}
                  rowKey="service_id"
                  pagination={false}
                  size="small"
                  summary={() => {
                    if (!totals) return null
                    const totalDelta = totals.p2 - totals.p1
                    const totalDeltaPct = totals.p1 > 0 ? (totalDelta / totals.p1) * 100 : 0
                    return (
                      <Table.Summary.Row>
                        <Table.Summary.Cell index={0}>
                          <Text strong>Total</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={1} align="right">
                          <Text strong>{formatCurrency(totals.p1, currency)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={2} align="right">
                          <Text strong>{formatCurrency(totals.p2, currency)}</Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={3} align="right">
                          <Text strong type={totalDelta > 0 ? 'danger' : 'success'}>
                            {totalDelta > 0 ? '+' : ''}{formatCurrency(totalDelta, currency)}
                          </Text>
                        </Table.Summary.Cell>
                        <Table.Summary.Cell index={4} align="center">
                          <Text strong type={totalDelta > 0 ? 'danger' : 'success'}>
                            {totalDelta > 0 ? '+' : ''}{totalDeltaPct.toFixed(1)}%
                          </Text>
                        </Table.Summary.Cell>
                      </Table.Summary.Row>
                    )
                  }}
                />
              </Card>
            </Col>
          </Row>
        </>
      )}
    </div>
  )
}
