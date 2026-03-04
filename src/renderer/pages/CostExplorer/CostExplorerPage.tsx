import { useEffect, useState } from 'react'
import { Typography, Button, Space, message, Modal } from 'antd'
import { DownloadOutlined, PlusOutlined } from '@ant-design/icons'
import { useCostsStore } from '../../stores/costsStore'
import { useProjectsStore } from '../../stores/projectsStore'
import type { CostRecord } from '../../types/cost'
import CostFilters from './CostFilters'
import CostTable from './CostTable'
import CostChart from './CostChart'
import CostForm from './CostForm'

const { Title } = Typography

export default function CostExplorerPage(): JSX.Element {
  const { fetchCosts, filters, loading } = useCostsStore()
  const { fetchServices, fetchProjects } = useProjectsStore()
  const [selectedRecord, setSelectedRecord] = useState<CostRecord | null>(null)
  const [exporting, setExporting] = useState(false)
  const [formOpen, setFormOpen] = useState(false)
  const [editingCost, setEditingCost] = useState<CostRecord | null>(null)

  useEffect(() => {
    fetchCosts()
    fetchServices()
    fetchProjects()
  }, [])

  const handleExport = async (): Promise<void> => {
    setExporting(true)
    try {
      const result = await window.api.invoke('costs:export', filters)
      if (result) {
        message.success('Costs exported successfully')
      }
    } catch {
      message.error('Export failed')
    } finally {
      setExporting(false)
    }
  }

  const handleAddCost = (): void => {
    setEditingCost(null)
    setFormOpen(true)
  }

  const handleEditCost = (record: CostRecord): void => {
    setEditingCost(record)
    setFormOpen(true)
  }

  const handleDeleteCost = (record: CostRecord): void => {
    Modal.confirm({
      title: 'Delete cost record?',
      content: `This will permanently delete the cost record of $${record.amount} for ${record.service_name}.`,
      okText: 'Delete',
      okType: 'danger',
      onOk: async () => {
        await window.api.invoke('costs:delete', record.id)
        message.success('Cost record deleted')
        fetchCosts()
      }
    })
  }

  const handleFormClose = (): void => {
    setFormOpen(false)
    setEditingCost(null)
    fetchCosts()
  }

  return (
    <div>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <Title level={3} style={{ margin: 0 }}>
          Cost Explorer
        </Title>
        <Space>
          <Button icon={<PlusOutlined />} type="primary" onClick={handleAddCost}>
            Add Cost
          </Button>
          <Button
            icon={<DownloadOutlined />}
            onClick={handleExport}
            loading={exporting}
          >
            Export CSV
          </Button>
        </Space>
      </div>

      <CostFilters />

      {selectedRecord && (
        <CostChart record={selectedRecord} onClose={() => setSelectedRecord(null)} />
      )}

      <CostTable
        onRowClick={setSelectedRecord}
        onEdit={handleEditCost}
        onDelete={handleDeleteCost}
        loading={loading}
      />

      <CostForm open={formOpen} cost={editingCost} onClose={handleFormClose} />
    </div>
  )
}
