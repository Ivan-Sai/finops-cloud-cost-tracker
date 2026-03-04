import { useEffect } from 'react'
import { Modal, Form, Input, InputNumber, Select, Slider, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useBudgetsStore } from '../../stores/budgetsStore'
import { useProjectsStore } from '../../stores/projectsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { getCurrencySymbol } from '../../utils/formatters'
import type { Budget } from '../../types/budget'

const budgetSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  project_id: z.string().nullable(),
  service_id: z.string().nullable(),
  amount: z.number().positive('Amount must be greater than 0'),
  period: z.enum(['monthly', 'quarterly', 'yearly']),
  alert_threshold_warning: z.number().min(0).max(1),
  alert_threshold_critical: z.number().min(0).max(1)
}).refine((data) => data.alert_threshold_critical > data.alert_threshold_warning, {
  message: 'Critical threshold must be greater than warning threshold',
  path: ['alert_threshold_critical']
})

type BudgetFormValues = z.infer<typeof budgetSchema>

interface BudgetFormProps {
  open: boolean
  budget: Budget | null
  onClose: () => void
}

export default function BudgetForm({ open, budget, onClose }: BudgetFormProps): JSX.Element {
  const { createBudget, updateBudget } = useBudgetsStore()
  const { projects, services } = useProjectsStore()
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const isEditing = !!budget

  const {
    control,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting }
  } = useForm<BudgetFormValues>({
    resolver: zodResolver(budgetSchema),
    defaultValues: {
      name: '',
      project_id: null,
      service_id: null,
      amount: 1000,
      period: 'monthly',
      alert_threshold_warning: 0.8,
      alert_threshold_critical: 0.95
    }
  })

  useEffect(() => {
    if (open) {
      if (budget) {
        reset({
          name: budget.name,
          project_id: budget.project_id,
          service_id: budget.service_id,
          amount: budget.amount,
          period: budget.period,
          alert_threshold_warning: budget.alert_threshold_warning,
          alert_threshold_critical: budget.alert_threshold_critical
        })
      } else {
        reset({
          name: '',
          project_id: null,
          service_id: null,
          amount: 1000,
          period: 'monthly',
          alert_threshold_warning: 0.8,
          alert_threshold_critical: 0.95
        })
      }
    }
  }, [open, budget, reset])

  const onSubmit = async (values: BudgetFormValues): Promise<void> => {
    try {
      if (isEditing) {
        await updateBudget(budget.id, values)
        message.success('Budget updated')
      } else {
        await createBudget(values)
        message.success('Budget created')
      }
      onClose()
    } catch {
      message.error('Failed to save budget')
    }
  }

  return (
    <Modal
      title={isEditing ? 'Edit Budget' : 'Create Budget'}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onClose}
      okText={isEditing ? 'Save' : 'Create'}
      confirmLoading={isSubmitting}
      destroyOnClose
      width={520}
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item
          label="Budget Name"
          required
          validateStatus={errors.name ? 'error' : undefined}
          help={errors.name?.message}
        >
          <Controller
            name="name"
            control={control}
            render={({ field }) => (
              <Input {...field} placeholder="e.g. Production Q1 2026" />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Project"
          validateStatus={errors.project_id ? 'error' : undefined}
          help={errors.project_id?.message}
        >
          <Controller
            name="project_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="All projects"
                allowClear
                options={projects.map((p) => ({ label: p.name, value: p.id }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Service"
          validateStatus={errors.service_id ? 'error' : undefined}
          help={errors.service_id?.message}
        >
          <Controller
            name="service_id"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                placeholder="All services"
                allowClear
                options={services.map((s) => ({ label: `${s.name} (${s.provider})`, value: s.id }))}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label={`Budget Amount (${currency})`}
          required
          validateStatus={errors.amount ? 'error' : undefined}
          help={errors.amount?.message}
        >
          <Controller
            name="amount"
            control={control}
            render={({ field }) => (
              <InputNumber
                {...field}
                min={1}
                step={100}
                prefix={sym}
                style={{ width: '100%' }}
                placeholder="1000"
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Period"
          required
          validateStatus={errors.period ? 'error' : undefined}
          help={errors.period?.message}
        >
          <Controller
            name="period"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { label: 'Monthly', value: 'monthly' },
                  { label: 'Quarterly', value: 'quarterly' },
                  { label: 'Yearly', value: 'yearly' }
                ]}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Warning Threshold"
          validateStatus={errors.alert_threshold_warning ? 'error' : undefined}
          help={errors.alert_threshold_warning?.message}
        >
          <Controller
            name="alert_threshold_warning"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0.5}
                max={1}
                step={0.05}
                marks={{ 0.5: '50%', 0.8: '80%', 1: '100%' }}
                tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(0)}%` }}
              />
            )}
          />
        </Form.Item>

        <Form.Item
          label="Critical Threshold"
          validateStatus={errors.alert_threshold_critical ? 'error' : undefined}
          help={errors.alert_threshold_critical?.message}
        >
          <Controller
            name="alert_threshold_critical"
            control={control}
            render={({ field }) => (
              <Slider
                {...field}
                min={0.5}
                max={1}
                step={0.05}
                marks={{ 0.5: '50%', 0.95: '95%', 1: '100%' }}
                tooltip={{ formatter: (v) => `${((v ?? 0) * 100).toFixed(0)}%` }}
              />
            )}
          />
        </Form.Item>
      </Form>
    </Modal>
  )
}
