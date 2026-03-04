import { useState } from 'react'
import { Upload, Button, Typography, Space, Alert } from 'antd'
import { InboxOutlined, FolderOpenOutlined } from '@ant-design/icons'

const { Dragger } = Upload
const { Text } = Typography

interface UploadStepProps {
  onFileSelected: (filePath: string, fileName: string) => void
  filePath: string | null
  fileName: string | null
}

export default function UploadStep({ onFileSelected, filePath, fileName }: UploadStepProps): JSX.Element {
  const [loading, setLoading] = useState(false)

  const handleElectronDialog = async (): Promise<void> => {
    setLoading(true)
    try {
      const path = (await window.api.invoke('import:selectFile')) as string | null
      if (path) {
        const name = path.split(/[\\/]/).pop() || 'file.csv'
        onFileSelected(path, name)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ maxWidth: 600, margin: '0 auto' }}>
      <Dragger
        accept=".csv"
        showUploadList={false}
        beforeUpload={(file) => {
          // Electron gives us the path via the File object
          const electronFile = file as unknown as { path?: string }
          if (electronFile.path) {
            onFileSelected(electronFile.path, file.name)
          }
          return false // prevent default upload
        }}
        style={{ padding: '20px 0' }}
      >
        <p className="ant-upload-drag-icon">
          <InboxOutlined />
        </p>
        <p className="ant-upload-text">Click or drag a CSV file to this area</p>
        <p className="ant-upload-hint">
          Supports single CSV file with cost data. Expected columns: service_id, project_id, amount, date
        </p>
      </Dragger>

      <div style={{ textAlign: 'center', margin: '16px 0' }}>
        <Text type="secondary">— or —</Text>
      </div>

      <div style={{ textAlign: 'center' }}>
        <Button
          icon={<FolderOpenOutlined />}
          size="large"
          onClick={handleElectronDialog}
          loading={loading}
        >
          Browse Files...
        </Button>
      </div>

      {filePath && (
        <Alert
          type="success"
          showIcon
          style={{ marginTop: 24 }}
          message={
            <Space>
              <Text strong>Selected:</Text>
              <Text>{fileName}</Text>
            </Space>
          }
          description={<Text type="secondary" copyable>{filePath}</Text>}
        />
      )}
    </div>
  )
}
