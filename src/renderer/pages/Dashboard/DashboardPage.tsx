import { useEffect } from 'react'
import { Col, Row, Typography } from 'antd'
import { useCostsStore } from '../../stores/costsStore'
import { useBudgetsStore } from '../../stores/budgetsStore'
import KPICards from './KPICards'
import SpendTrendChart from './SpendTrendChart'
import TopServicesChart from './TopServicesChart'
import BudgetDeviationCard from './BudgetDeviationCard'

const { Title } = Typography

export default function DashboardPage(): JSX.Element {
  const { stats, fetchStats, loading: costsLoading } = useCostsStore()
  const { alerts, fetchAlerts, loading: budgetsLoading } = useBudgetsStore()

  useEffect(() => {
    fetchStats()
    fetchAlerts()
  }, [])

  const loading = costsLoading || budgetsLoading

  return (
    <div>
      <div style={{ marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Dashboard
        </Title>
      </div>

      <KPICards stats={stats} alerts={alerts} loading={loading} />

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={14}>
          <SpendTrendChart data={stats?.monthly_trend ?? []} loading={loading} />
        </Col>
        <Col xs={24} lg={10}>
          <TopServicesChart data={stats?.top_services ?? []} loading={loading} />
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24}>
          <BudgetDeviationCard alerts={alerts} loading={loading} />
        </Col>
      </Row>
    </div>
  )
}
