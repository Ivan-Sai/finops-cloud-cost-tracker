import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Typography,
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Button,
  Descriptions,
  Skeleton,
  message,
  Modal
} from 'antd'
import { ArrowLeftOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useBudgetsStore } from '../../stores/budgetsStore'
import { useProjectsStore } from '../../stores/projectsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, formatPercent, fillMissingMonths } from '../../utils/formatters'
import type { Budget } from '../../types/budget'
import BudgetForm from './BudgetForm'
import BudgetAlerts from './BudgetAlerts'
import BudgetTrendChart from './BudgetTrendChart'

const { Title, Text } = Typography

interface TrendPoint {
  month: string
  total: number
}

export default function BudgetDetailPage(): JSX.Element {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { deleteBudget } = useBudgetsStore()
  const { fetchProjects, fetchServices } = useProjectsStore()

  const currency = useSettingsStore((s) => s.currency)

  const [budget, setBudget] = useState<Budget | null>(null)
  const [trend, setTrend] = useState<TrendPoint[]>([])
  const [loading, setLoading] = useState(true)
  const [formOpen, setFormOpen] = useState(false)

  const fetchBudget = async (): Promise<void> => {
    setLoading(true)
    try {
      const data = (await window.api.invoke('budgets:getById', id)) as Budget | null
      setBudget(data)

      if (data) {
        let trendData: TrendPoint[] = []
        if (data.project_id) {
          trendData = (await window.api.invoke(
            'costs:getByProject',
            data.project_id
          )) as TrendPoint[]
        } else if (data.service_id) {
          trendData = (await window.api.invoke(
            'costs:getByService',
            data.service_id
          )) as TrendPoint[]
        }
        setTrend(fillMissingMonths(trendData))
      }
    } catch {
      message.error('Failed to load budget')
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchBudget()
    fetchProjects()
    fetchServices()
  }, [id])

  const handleDelete = (): void => {
    if (!budget) return
    Modal.confirm({
      title: 'Delete Budget',
      content: `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await deleteBudget(budget.id)
        message.success('Budget deleted')
        navigate('/budgets')
      }
    })
  }

  const handleFormClose = (): void => {
    setFormOpen(false)
    fetchBudget()
  }

  if (loading) {
    return (
      <div>
        <Skeleton active paragraph={{ rows: 8 }} />
      </div>
    )
  }

  if (!budget) {
    return (
      <div>
        <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/budgets')}>
          Back to Budgets
        </Button>
        <Card style={{ marginTop: 16 }}>
          <Text type="danger">Budget not found</Text>
        </Card>
      </div>
    )
  }

  const utilization = budget.utilization ?? 0
  const spent = budget.spent ?? 0
  const getStatus = (): 'success' | 'normal' | 'active' | 'exception' => {
    if (utilization >= 1.0) return 'exception'
    if (utilization >= budget.alert_threshold_critical) return 'active'
    if (utilization >= budget.alert_threshold_warning) return 'normal'
    return 'success'
  }

  const periodLabels: Record<string, string> = {
    monthly: 'Monthly',
    quarterly: 'Quarterly',
    yearly: 'Yearly'
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
          <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/budgets')} />
          <Title level={3} style={{ margin: 0 }}>
            {budget.name}
          </Title>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button icon={<EditOutlined />} onClick={() => setFormOpen(true)}>
            Edit
          </Button>
          <Button danger icon={<DeleteOutlined />} onClick={handleDelete}>
            Delete
          </Button>
        </div>
      </div>

      <Row gutter={[16, 16]}>
        <Col xs={24} md={8}>
          <Card>
            <div style={{ textAlign: 'center' }}>
              <Progress
                type="dashboard"
                percent={Math.round(Math.min(utilization * 100, 100))}
                status={getStatus()}
                size={180}
                format={() => (
                  <div>
                    <div style={{ fontSize: 24, fontWeight: 600 }}>{formatPercent(utilization)}</div>
                    <div style={{ fontSize: 12, color: '#888' }}>utilized</div>
                  </div>
                )}
              />
              <div style={{ marginTop: 16 }}>
                <Text strong style={{ fontSize: 18 }}>{formatCurrency(spent, currency)}</Text>
                <Text type="secondary"> / {formatCurrency(budget.amount, currency)}</Text>
              </div>
            </div>
          </Card>
        </Col>

        <Col xs={24} md={16}>
          <Card title="Budget Details">
            <Descriptions column={{ xs: 1, sm: 2 }} size="small">
              <Descriptions.Item label="Period">
                <Tag>{periodLabels[budget.period]}</Tag>
              </Descriptions.Item>
              <Descriptions.Item label="Limit">
                {formatCurrency(budget.amount, currency)}
              </Descriptions.Item>
              <Descriptions.Item label="Spent MTD">
                {formatCurrency(spent, currency)}
              </Descriptions.Item>
              <Descriptions.Item label="Remaining">
                <Text type={budget.amount - spent < 0 ? 'danger' : undefined}>
                  {formatCurrency(Math.max(0, budget.amount - spent), currency)}
                </Text>
              </Descriptions.Item>
              <Descriptions.Item label="Project">
                {budget.project_name || 'All projects'}
              </Descriptions.Item>
              <Descriptions.Item label="Service">
                {budget.service_name || 'All services'}
              </Descriptions.Item>
            </Descriptions>
          </Card>
        </Col>
      </Row>

      <Row gutter={[16, 16]} style={{ marginTop: 16 }}>
        <Col xs={24} lg={16}>
          <Card title="Spending Trend">
            <BudgetTrendChart trend={trend} budgetAmount={budget.amount} currency={currency} />
          </Card>
        </Col>

        <Col xs={24} lg={8}>
          <BudgetAlerts budget={budget} />
        </Col>
      </Row>

      <BudgetForm open={formOpen} budget={budget} onClose={handleFormClose} />
    </div>
  )
}
