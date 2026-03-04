import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProjectsStore } from '../../stores/projectsStore'
import type { Service } from '../../types/service'
import type { ColumnsType } from 'antd/es/table'

const serviceSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  provider: z.enum(['AWS', 'Azure', 'GCP', 'Custom']),
  category: z.enum(['Compute', 'Storage', 'Database', 'Network', 'Other'])
})

type ServiceFormValues = z.infer<typeof serviceSchema>

export default function ServiceManager(): JSX.Element {
  const { services, fetchServices, createService, updateService, deleteService } = useProjectsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Service | null>(null)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ServiceFormValues>({
    resolver: zodResolver(serviceSchema),
    defaultValues: { name: '', provider: 'AWS', category: 'Compute' }
  })

  useEffect(() => {
    fetchServices()
  }, [])

  const openAdd = (): void => {
    setEditing(null)
    reset({ name: '', provider: 'AWS', category: 'Compute' })
    setModalOpen(true)
  }

  const openEdit = (svc: Service): void => {
    setEditing(svc)
    reset({ name: svc.name, provider: svc.provider as ServiceFormValues['provider'], category: svc.category as ServiceFormValues['category'] })
    setModalOpen(true)
  }

  const onSubmit = async (values: ServiceFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateService(editing.id, values)
        message.success('Service updated')
      } else {
        await createService(values)
        message.success('Service created')
      }
      setModalOpen(false)
    } catch {
      message.error('Failed to save service')
    }
  }

  const handleDelete = (svc: Service): void => {
    Modal.confirm({
      title: `Delete service "${svc.name}"?`,
      content: 'This will fail if any cost records reference this service.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteService(svc.id)
          message.success('Service deleted')
        } catch (err) {
          message.error((err as Error).message)
        }
      }
    })
  }

  const columns: ColumnsType<Service> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Provider', dataIndex: 'provider', key: 'provider', width: 100 },
    { title: 'Category', dataIndex: 'category', key: 'category', width: 120 },
    {
      title: 'Actions',
      key: 'actions',
      width: 100,
      render: (_, record) => (
        <Space>
          <Button size="small" icon={<EditOutlined />} onClick={() => openEdit(record)} />
          <Button size="small" danger icon={<DeleteOutlined />} onClick={() => handleDelete(record)} />
        </Space>
      )
    }
  ]

  return (
    <Card
      title="Services"
      extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAdd}>Add Service</Button>}
      style={{ marginTop: 16 }}
    >
      <Table dataSource={services} columns={columns} rowKey="id" size="small" pagination={false} />

      <Modal
        title={editing ? 'Edit Service' : 'Add Service'}
        open={modalOpen}
        onOk={handleSubmit(onSubmit)}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Save' : 'Create'}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g. EC2" />} />
          </Form.Item>
          <Form.Item label="Provider" required validateStatus={errors.provider ? 'error' : undefined} help={errors.provider?.message}>
            <Controller name="provider" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'AWS', value: 'AWS' },
                { label: 'Azure', value: 'Azure' },
                { label: 'GCP', value: 'GCP' },
                { label: 'Custom', value: 'Custom' }
              ]} />
            )} />
          </Form.Item>
          <Form.Item label="Category" required validateStatus={errors.category ? 'error' : undefined} help={errors.category?.message}>
            <Controller name="category" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Compute', value: 'Compute' },
                { label: 'Storage', value: 'Storage' },
                { label: 'Database', value: 'Database' },
                { label: 'Network', value: 'Network' },
                { label: 'Other', value: 'Other' }
              ]} />
            )} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
