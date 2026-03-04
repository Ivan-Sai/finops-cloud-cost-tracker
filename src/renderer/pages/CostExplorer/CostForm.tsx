import { useEffect } from 'react'
import { Modal, Form, InputNumber, Select, Input, message } from 'antd'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import dayjs from 'dayjs'
import { DatePicker } from 'antd'
import { useProjectsStore } from '../../stores/projectsStore'
import { useCostsStore } from '../../stores/costsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { getCurrencySymbol } from '../../utils/formatters'
import type { CostRecord } from '../../types/cost'

const costSchema = z.object({
  service_id: z.string().min(1, 'Service is required'),
  project_id: z.string().min(1, 'Project is required'),
  amount: z.number().positive('Amount must be greater than 0'),
  date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  description: z.string().optional(),
  tags: z.array(z.string()).optional()
})

type CostFormValues = z.infer<typeof costSchema>

interface CostFormProps {
  open: boolean
  cost: CostRecord | null
  onClose: () => void
}

export default function CostForm({ open, cost, onClose }: CostFormProps): JSX.Element {
  const { services, projects } = useProjectsStore()
  const { createCost, updateCost } = useCostsStore()
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const isEditing = !!cost

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<CostFormValues>({
    resolver: zodResolver(costSchema),
    defaultValues: {
      service_id: '',
      project_id: '',
      amount: 0,
      date: dayjs().format('YYYY-MM-DD'),
      description: '',
      tags: []
    }
  })

  useEffect(() => {
    if (open) {
      if (cost) {
        reset({
          service_id: cost.service_id,
          project_id: cost.project_id,
          amount: cost.amount,
          date: cost.date,
          description: cost.description || '',
          tags: cost.tags ? (() => { try { return JSON.parse(cost.tags!) } catch { return [] } })() : []
        })
      } else {
        reset({
          service_id: '',
          project_id: '',
          amount: 0,
          date: dayjs().format('YYYY-MM-DD'),
          description: '',
          tags: []
        })
      }
    }
  }, [open, cost, reset])

  const onSubmit = async (values: CostFormValues): Promise<void> => {
    try {
      const payload = {
        ...values,
        tags: values.tags && values.tags.length > 0 ? JSON.stringify(values.tags) : null
      }
      if (isEditing) {
        await updateCost(cost.id, payload)
        message.success('Cost record updated')
      } else {
        await createCost(payload)
        message.success('Cost record created')
      }
      onClose()
    } catch {
      message.error('Failed to save cost record')
    }
  }

  return (
    <Modal
      title={isEditing ? 'Edit Cost Record' : 'Add Cost Record'}
      open={open}
      onOk={handleSubmit(onSubmit)}
      onCancel={onClose}
      okText={isEditing ? 'Save' : 'Create'}
      confirmLoading={isSubmitting}
      destroyOnClose
      width={480}
    >
      <Form layout="vertical" style={{ marginTop: 16 }}>
        <Form.Item label="Service" required validateStatus={errors.service_id ? 'error' : undefined} help={errors.service_id?.message}>
          <Controller name="service_id" control={control} render={({ field }) => (
            <Select
              {...field}
              placeholder="Select service"
              options={services.map((s) => ({ label: `${s.name} (${s.provider})`, value: s.id }))}
              showSearch
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          )} />
        </Form.Item>

        <Form.Item label="Project" required validateStatus={errors.project_id ? 'error' : undefined} help={errors.project_id?.message}>
          <Controller name="project_id" control={control} render={({ field }) => (
            <Select
              {...field}
              placeholder="Select project"
              options={projects.map((p) => ({ label: p.name, value: p.id }))}
              showSearch
              filterOption={(input, option) => String(option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
            />
          )} />
        </Form.Item>

        <Form.Item label={`Amount (${currency})`} required validateStatus={errors.amount ? 'error' : undefined} help={errors.amount?.message}>
          <Controller name="amount" control={control} render={({ field }) => (
            <InputNumber {...field} min={0.01} step={1} prefix={sym} style={{ width: '100%' }} placeholder="0.00" />
          )} />
        </Form.Item>

        <Form.Item label="Date" required validateStatus={errors.date ? 'error' : undefined} help={errors.date?.message}>
          <Controller name="date" control={control} render={({ field }) => (
            <DatePicker
              value={field.value ? dayjs(field.value) : null}
              onChange={(d) => field.onChange(d ? d.format('YYYY-MM-DD') : '')}
              style={{ width: '100%' }}
              format="YYYY-MM-DD"
            />
          )} />
        </Form.Item>

        <Form.Item label="Description">
          <Controller name="description" control={control} render={({ field }) => (
            <Input {...field} placeholder="Optional description" />
          )} />
        </Form.Item>

        <Form.Item label="Tags">
          <Controller name="tags" control={control} render={({ field }) => (
            <Select
              {...field}
              mode="tags"
              placeholder="Add tags (press Enter)"
              style={{ width: '100%' }}
              tokenSeparators={[',']}
            />
          )} />
        </Form.Item>
      </Form>
    </Modal>
  )
}
