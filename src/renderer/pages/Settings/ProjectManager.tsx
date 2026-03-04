import { useEffect, useState } from 'react'
import { Card, Table, Button, Modal, Form, Input, Select, Space, message } from 'antd'
import { PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons'
import { useForm, Controller } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useProjectsStore } from '../../stores/projectsStore'
import type { Project } from '../../types/project'
import type { ColumnsType } from 'antd/es/table'

const projectSchema = z.object({
  name: z.string().min(1, 'Name is required').max(100),
  description: z.string().optional(),
  environment: z.enum(['production', 'staging', 'development']),
  owner: z.string().min(1, 'Owner is required').max(100)
})

type ProjectFormValues = z.infer<typeof projectSchema>

export default function ProjectManager(): JSX.Element {
  const { projects, fetchProjects, createProject, updateProject, deleteProject } = useProjectsStore()
  const [modalOpen, setModalOpen] = useState(false)
  const [editing, setEditing] = useState<Project | null>(null)

  const { control, handleSubmit, reset, formState: { errors, isSubmitting } } = useForm<ProjectFormValues>({
    resolver: zodResolver(projectSchema),
    defaultValues: { name: '', description: '', environment: 'production', owner: '' }
  })

  useEffect(() => {
    fetchProjects()
  }, [])

  const openAdd = (): void => {
    setEditing(null)
    reset({ name: '', description: '', environment: 'production', owner: '' })
    setModalOpen(true)
  }

  const openEdit = (proj: Project): void => {
    setEditing(proj)
    reset({ name: proj.name, description: proj.description || '', environment: proj.environment, owner: proj.owner })
    setModalOpen(true)
  }

  const onSubmit = async (values: ProjectFormValues): Promise<void> => {
    try {
      if (editing) {
        await updateProject(editing.id, values)
        message.success('Project updated')
      } else {
        await createProject(values)
        message.success('Project created')
      }
      setModalOpen(false)
    } catch {
      message.error('Failed to save project')
    }
  }

  const handleDelete = (proj: Project): void => {
    Modal.confirm({
      title: `Delete project "${proj.name}"?`,
      content: 'This will fail if any cost records reference this project.',
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        try {
          await deleteProject(proj.id)
          message.success('Project deleted')
        } catch (err) {
          message.error((err as Error).message)
        }
      }
    })
  }

  const columns: ColumnsType<Project> = [
    { title: 'Name', dataIndex: 'name', key: 'name' },
    { title: 'Environment', dataIndex: 'environment', key: 'environment', width: 120 },
    { title: 'Owner', dataIndex: 'owner', key: 'owner', width: 150 },
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
      title="Projects"
      extra={<Button type="primary" size="small" icon={<PlusOutlined />} onClick={openAdd}>Add Project</Button>}
      style={{ marginTop: 16 }}
    >
      <Table dataSource={projects} columns={columns} rowKey="id" size="small" pagination={false} />

      <Modal
        title={editing ? 'Edit Project' : 'Add Project'}
        open={modalOpen}
        onOk={handleSubmit(onSubmit)}
        onCancel={() => setModalOpen(false)}
        okText={editing ? 'Save' : 'Create'}
        confirmLoading={isSubmitting}
        destroyOnClose
      >
        <Form layout="vertical" style={{ marginTop: 16 }}>
          <Form.Item label="Name" required validateStatus={errors.name ? 'error' : undefined} help={errors.name?.message}>
            <Controller name="name" control={control} render={({ field }) => <Input {...field} placeholder="e.g. Production App" />} />
          </Form.Item>
          <Form.Item label="Description" validateStatus={errors.description ? 'error' : undefined} help={errors.description?.message}>
            <Controller name="description" control={control} render={({ field }) => <Input {...field} placeholder="Optional description" />} />
          </Form.Item>
          <Form.Item label="Environment" required validateStatus={errors.environment ? 'error' : undefined} help={errors.environment?.message}>
            <Controller name="environment" control={control} render={({ field }) => (
              <Select {...field} options={[
                { label: 'Production', value: 'production' },
                { label: 'Staging', value: 'staging' },
                { label: 'Development', value: 'development' }
              ]} />
            )} />
          </Form.Item>
          <Form.Item label="Owner" required validateStatus={errors.owner ? 'error' : undefined} help={errors.owner?.message}>
            <Controller name="owner" control={control} render={({ field }) => <Input {...field} placeholder="e.g. DevOps Team" />} />
          </Form.Item>
        </Form>
      </Modal>
    </Card>
  )
}
