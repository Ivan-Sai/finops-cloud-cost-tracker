import { Card, Tag, Progress, Typography, Empty } from 'antd'
import { formatCurrency, formatPercent } from '../../utils/formatters'
import type { Budget } from '../../types/budget'

const { Text } = Typography

interface BudgetAlertsProps {
  budget: Budget
}

export default function BudgetAlerts({ budget }: BudgetAlertsProps): JSX.Element {
  const utilization = budget.utilization ?? 0
  const spent = budget.spent ?? 0

  const thresholds = [
    {
      label: 'Warning',
      value: budget.alert_threshold_warning,
      color: 'gold' as const,
      triggered: utilization >= budget.alert_threshold_warning
    },
    {
      label: 'Critical',
      value: budget.alert_threshold_critical,
      color: 'orange' as const,
      triggered: utilization >= budget.alert_threshold_critical
    },
    {
      label: 'Exceeded',
      value: 1.0,
      color: 'red' as const,
      triggered: utilization >= 1.0
    }
  ]

  return (
    <Card title="Alert Thresholds">
      {thresholds.map((t) => (
        <div key={t.label} style={{ marginBottom: 16 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 }}>
            <Text>{t.label}</Text>
            <div>
              <Tag color={t.triggered ? t.color : 'default'}>
                {formatPercent(t.value)}
              </Tag>
              {t.triggered && (
                <Tag color={t.color}>TRIGGERED</Tag>
              )}
            </div>
          </div>
          <Progress
            percent={t.value * 100}
            showInfo={false}
            size="small"
            strokeColor={t.triggered ? undefined : '#d9d9d9'}
            status={t.triggered ? 'exception' : 'normal'}
          />
        </div>
      ))}

      <Card size="small" style={{ marginTop: 16 }} type="inner" title="Current Status">
        {utilization < budget.alert_threshold_warning ? (
          <Empty
            image={Empty.PRESENTED_IMAGE_SIMPLE}
            description={
              <Text type="success">
                All clear — spending at {formatPercent(utilization)} ({formatCurrency(spent)})
              </Text>
            }
          />
        ) : (
          <div>
            <Text>
              Current spend: <Text strong>{formatCurrency(spent)}</Text> of{' '}
              <Text strong>{formatCurrency(budget.amount)}</Text>
            </Text>
            <br />
            <Text type={utilization >= 1 ? 'danger' : 'warning'}>
              Utilization: {formatPercent(utilization)}
            </Text>
          </div>
        )}
      </Card>
    </Card>
  )
}
