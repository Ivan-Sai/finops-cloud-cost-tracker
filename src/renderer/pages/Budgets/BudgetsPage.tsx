import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Typography,
  Button,
  Card,
  Row,
  Col,
  Progress,
  Tag,
  Empty,
  Skeleton,
  Modal,
  message
} from 'antd'
import {
  PlusOutlined,
  EditOutlined,
  DeleteOutlined,
  EyeOutlined
} from '@ant-design/icons'
import { useBudgetsStore } from '../../stores/budgetsStore'
import { useProjectsStore } from '../../stores/projectsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../utils/formatters'
import type { Budget } from '../../types/budget'
import BudgetForm from './BudgetForm'

const { Title, Text } = Typography

function getUtilizationStatus(
  utilization: number,
  warning: number,
  critical: number
): { color: string; status: 'success' | 'normal' | 'active' | 'exception'; label: string } {
  if (utilization >= 1.0) return { color: 'red', status: 'exception', label: 'Exceeded' }
  if (utilization >= critical) return { color: 'orange', status: 'active', label: 'Critical' }
  if (utilization >= warning) return { color: 'gold', status: 'normal', label: 'Warning' }
  return { color: 'green', status: 'success', label: 'On Track' }
}

const periodLabels: Record<string, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  yearly: 'Yearly'
}

export default function BudgetsPage(): JSX.Element {
  const navigate = useNavigate()
  const { budgets, loading, error, fetchBudgets, deleteBudget } = useBudgetsStore()
  const currency = useSettingsStore((s) => s.currency)
  const { fetchProjects, fetchServices } = useProjectsStore()
  const [formOpen, setFormOpen] = useState(false)
  const [editingBudget, setEditingBudget] = useState<Budget | null>(null)

  useEffect(() => {
    fetchBudgets()
    fetchProjects()
    fetchServices()
  }, [])

  const handleCreate = (): void => {
    setEditingBudget(null)
    setFormOpen(true)
  }

  const handleEdit = (budget: Budget): void => {
    setEditingBudget(budget)
    setFormOpen(true)
  }

  const handleDelete = (budget: Budget): void => {
    Modal.confirm({
      title: 'Delete Budget',
      content: `Are you sure you want to delete "${budget.name}"? This action cannot be undone.`,
      okText: 'Delete',
      okType: 'danger',
      cancelText: 'Cancel',
      onOk: async () => {
        await deleteBudget(budget.id)
        message.success('Budget deleted')
      }
    })
  }

  const handleFormClose = (): void => {
    setFormOpen(false)
    setEditingBudget(null)
  }

  if (error) {
    return (
      <div>
        <Title level={3}>Budgets</Title>
        <Card>
          <Text type="danger">{error}</Text>
          <Button onClick={fetchBudgets} style={{ marginLeft: 8 }}>
            Retry
          </Button>
        </Card>
      </div>
    )
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Budgets
        </Title>
        <Button type="primary" icon={<PlusOutlined />} onClick={handleCreate}>
          Create Budget
        </Button>
      </div>

      {loading ? (
        <Row gutter={[16, 16]}>
          {[1, 2, 3, 4].map((i) => (
            <Col xs={24} sm={12} lg={8} xl={6} key={i}>
              <Card>
                <Skeleton active />
              </Card>
            </Col>
          ))}
        </Row>
      ) : budgets.length === 0 ? (
        <Card>
          <Empty description="No budgets yet">
            <Button type="primary" onClick={handleCreate}>
              Create your first budget
            </Button>
          </Empty>
        </Card>
      ) : (
        <Row gutter={[16, 16]}>
          {budgets.map((budget) => {
            const utilization = budget.utilization ?? 0
            const spent = budget.spent ?? 0
            const info = getUtilizationStatus(
              utilization,
              budget.alert_threshold_warning,
              budget.alert_threshold_critical
            )
            return (
              <Col xs={24} sm={12} lg={8} xl={6} key={budget.id}>
                <Card
                  hoverable
                  actions={[
                    <EyeOutlined key="view" onClick={() => navigate(`/budgets/${budget.id}`)} />,
                    <EditOutlined key="edit" onClick={() => handleEdit(budget)} />,
                    <DeleteOutlined key="delete" onClick={() => handleDelete(budget)} />
                  ]}
                >
                  <div style={{ textAlign: 'center', marginBottom: 16 }}>
                    <Progress
                      type="dashboard"
                      percent={Math.round(Math.min(utilization * 100, 100))}
                      status={info.status}
                      size={120}
                    />
                  </div>

                  <Title level={5} style={{ margin: 0, marginBottom: 4 }} ellipsis>
                    {budget.name}
                  </Title>

                  <div style={{ marginBottom: 8 }}>
                    <Tag color={info.color}>{info.label}</Tag>
                    <Tag>{periodLabels[budget.period]}</Tag>
                  </div>

                  <div style={{ marginBottom: 4 }}>
                    <Text type="secondary">Spent: </Text>
                    <Text strong>{formatCurrency(spent, currency)}</Text>
                    <Text type="secondary"> / {formatCurrency(budget.amount, currency)}</Text>
                  </div>

                  {budget.project_name && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Project: {budget.project_name}
                      </Text>
                    </div>
                  )}
                  {budget.service_name && (
                    <div>
                      <Text type="secondary" style={{ fontSize: 12 }}>
                        Service: {budget.service_name}
                      </Text>
                    </div>
                  )}
                </Card>
              </Col>
            )
          })}
        </Row>
      )}

      <BudgetForm
        open={formOpen}
        budget={editingBudget}
        onClose={handleFormClose}
      />
    </div>
  )
}
