import { Card, List, Tag, Progress, Typography, Empty } from 'antd'
import type { BudgetAlert } from '../../types/budget'
import { formatCurrency, formatPercent } from '../../utils/formatters'

const { Text } = Typography

interface BudgetDeviationCardProps {
  alerts: BudgetAlert[]
  loading: boolean
}

const levelConfig: Record<string, { color: string; progressStatus: 'exception' | 'active' | 'normal' }> = {
  exceeded: { color: 'red', progressStatus: 'exception' },
  critical: { color: 'orange', progressStatus: 'active' },
  warning: { color: 'gold', progressStatus: 'normal' }
}

export default function BudgetDeviationCard({
  alerts,
  loading
}: BudgetDeviationCardProps): JSX.Element {
  return (
    <Card title="Budget Alerts" loading={loading}>
      {alerts.length === 0 ? (
        <Empty description="All budgets within limits" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          dataSource={alerts}
          renderItem={(alert) => {
            const config = levelConfig[alert.level] || levelConfig.warning
            return (
              <List.Item>
                <div style={{ width: '100%' }}>
                  <div
                    style={{
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: 4
                    }}
                  >
                    <Text strong>{alert.budget_name}</Text>
                    <Tag color={config.color}>{alert.level.toUpperCase()}</Tag>
                  </div>
                  <Progress
                    percent={Math.min(alert.utilization * 100, 100)}
                    status={config.progressStatus}
                    size="small"
                  />
                  <Text type="secondary" style={{ fontSize: 12 }}>
                    {formatCurrency(alert.spent)} / {formatCurrency(alert.limit)} (
                    {formatPercent(alert.utilization)})
                  </Text>
                </div>
              </List.Item>
            )
          }}
        />
      )}
    </Card>
  )
}
