import { Result, Button, Typography, Table, Space, Tag } from 'antd'
import {
  CheckCircleOutlined,
  WarningOutlined,
  FileTextOutlined
} from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'

const { Text } = Typography

interface ImportResult {
  imported: number
  errors: number
  total: number
  errorDetails?: { row: number; message: string }[]
}

interface ResultStepProps {
  result: ImportResult | null
  loading: boolean
  onReset: () => void
}

export default function ResultStep({ result, loading, onReset }: ResultStepProps): JSX.Element {
  const navigate = useNavigate()

  if (loading || !result) {
    return (
      <Result
        icon={<CheckCircleOutlined spin style={{ color: '#1677ff' }} />}
        title="Importing data..."
        subTitle="Please wait while your data is being processed"
      />
    )
  }

  const hasErrors = result.errors > 0
  const allFailed = result.imported === 0

  const errorColumns = [
    {
      title: 'Row',
      dataIndex: 'row',
      key: 'row',
      width: 80
    },
    {
      title: 'Error',
      dataIndex: 'message',
      key: 'message'
    }
  ]

  return (
    <div>
      <Result
        status={allFailed ? 'error' : hasErrors ? 'warning' : 'success'}
        icon={
          allFailed ? undefined : hasErrors ? (
            <WarningOutlined />
          ) : (
            <CheckCircleOutlined />
          )
        }
        title={
          allFailed
            ? 'Import Failed'
            : hasErrors
              ? 'Import Completed with Warnings'
              : 'Import Successful!'
        }
        subTitle={
          <Space direction="vertical" size={4}>
            <Text>
              Total rows: <Text strong>{result.total}</Text>
            </Text>
            <Text>
              Imported: <Tag color="green">{result.imported}</Tag>
            </Text>
            {hasErrors && (
              <Text>
                Errors: <Tag color="red">{result.errors}</Tag>
              </Text>
            )}
          </Space>
        }
        extra={[
          <Button key="audit" icon={<FileTextOutlined />} onClick={() => navigate('/audit')}>
            View Audit Log
          </Button>,
          <Button key="reset" type="primary" onClick={onReset}>
            Import Another File
          </Button>
        ]}
      />

      {hasErrors && result.errorDetails && result.errorDetails.length > 0 && (
        <div style={{ maxWidth: 700, margin: '0 auto' }}>
          <Text strong style={{ display: 'block', marginBottom: 8 }}>
            Error details (first {result.errorDetails.length}):
          </Text>
          <Table
            dataSource={result.errorDetails}
            columns={errorColumns}
            rowKey="row"
            pagination={false}
            size="small"
          />
        </div>
      )}
    </div>
  )
}
