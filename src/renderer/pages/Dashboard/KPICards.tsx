import { Card, Col, Row, Statistic } from 'antd'
import {
  DollarOutlined,
  ArrowUpOutlined,
  ArrowDownOutlined,
  WarningOutlined,
  CalendarOutlined
} from '@ant-design/icons'
import type { CostStats } from '../../types/cost'
import type { BudgetAlert } from '../../types/budget'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, formatChangePercent } from '../../utils/formatters'

interface KPICardsProps {
  stats: CostStats | null
  alerts: BudgetAlert[]
  loading: boolean
}

export default function KPICards({ stats, alerts, loading }: KPICardsProps): JSX.Element {
  const currency = useSettingsStore((s) => s.currency)
  const totalMtd = stats?.total_mtd ?? 0
  const totalPrev = stats?.total_prev_month ?? 0
  const change = formatChangePercent(totalMtd, totalPrev)
  const isUp = change > 0

  return (
    <Row gutter={[16, 16]}>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Spend MTD"
            value={totalMtd}
            precision={2}
            prefix={<DollarOutlined />}
            formatter={() => formatCurrency(totalMtd, currency)}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Previous Month"
            value={totalPrev}
            precision={2}
            prefix={<CalendarOutlined />}
            formatter={() => formatCurrency(totalPrev, currency)}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Month-over-Month"
            value={Math.abs(change)}
            precision={1}
            prefix={isUp ? <ArrowUpOutlined /> : <ArrowDownOutlined />}
            suffix="%"
            valueStyle={{ color: isUp ? '#cf1322' : '#3f8600' }}
            loading={loading}
          />
        </Card>
      </Col>
      <Col xs={24} sm={12} lg={6}>
        <Card>
          <Statistic
            title="Budget Alerts"
            value={alerts.length}
            prefix={<WarningOutlined />}
            valueStyle={{ color: alerts.length > 0 ? '#faad14' : '#3f8600' }}
            loading={loading}
          />
        </Card>
      </Col>
    </Row>
  )
}
