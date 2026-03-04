import { useState, useCallback } from 'react'
import { Typography, Steps, Button, Space, Card, Modal, message } from 'antd'
import {
  UploadOutlined,
  SwapOutlined,
  EyeOutlined,
  CheckCircleOutlined
} from '@ant-design/icons'
import UploadStep from './UploadStep'
import MappingStep from './MappingStep'
import PreviewStep from './PreviewStep'
import ResultStep from './ResultStep'

const { Title } = Typography

interface ParsedCSV {
  headers: string[]
  rows: Record<string, unknown>[]
  errors: { row: number; message: string }[]
}

interface ImportResult {
  imported: number
  errors: number
  total: number
  errorDetails?: { row: number; message: string }[]
}

const STEPS = [
  { title: 'Upload', icon: <UploadOutlined /> },
  { title: 'Mapping', icon: <SwapOutlined /> },
  { title: 'Preview', icon: <EyeOutlined /> },
  { title: 'Result', icon: <CheckCircleOutlined /> }
]

export default function ImportPage(): JSX.Element {
  const [current, setCurrent] = useState(0)
  const [filePath, setFilePath] = useState<string | null>(null)
  const [fileName, setFileName] = useState<string | null>(null)
  const [parsedCSV, setParsedCSV] = useState<ParsedCSV | null>(null)
  const [mapping, setMapping] = useState<Record<string, string>>({})
  const [importResult, setImportResult] = useState<ImportResult | null>(null)
  const [importing, setImporting] = useState(false)
  const [parsing, setParsing] = useState(false)

  const handleFileSelected = useCallback(async (path: string, name: string) => {
    setFilePath(path)
    setFileName(name)
    setParsing(true)
    try {
      const result = (await window.api.invoke('import:parseCSV', path)) as ParsedCSV
      setParsedCSV(result)
      setMapping({})
    } catch (err) {
      message.error('Failed to parse CSV: ' + (err as Error).message)
    } finally {
      setParsing(false)
    }
  }, [])

  const handleImport = useCallback(async () => {
    if (!parsedCSV) return

    // Apply mapping to transform rows
    const mappedRows = parsedCSV.rows.map((row) => {
      const mapped: Record<string, unknown> = {}
      for (const [targetKey, csvColumn] of Object.entries(mapping)) {
        mapped[targetKey] = row[csvColumn] ?? null
      }
      return mapped
    })

    // Confirm dialog before import
    Modal.confirm({
      title: 'Confirm Import',
      content: `You are about to import ${mappedRows.length} cost records. This action will be logged in the audit log.`,
      okText: 'Import',
      cancelText: 'Cancel',
      onOk: async () => {
        setImporting(true)
        setCurrent(3)
        try {
          const result = (await window.api.invoke('import:execute', mappedRows)) as ImportResult
          setImportResult(result)
          if (result.imported > 0) {
            message.success(`Successfully imported ${result.imported} records`)
          }
        } catch (err) {
          message.error('Import failed: ' + (err as Error).message)
        } finally {
          setImporting(false)
        }
      }
    })
  }, [parsedCSV, mapping])

  const handleReset = useCallback(() => {
    setCurrent(0)
    setFilePath(null)
    setFileName(null)
    setParsedCSV(null)
    setMapping({})
    setImportResult(null)
  }, [])

  const canGoNext = (): boolean => {
    switch (current) {
      case 0:
        return !!parsedCSV && !parsing
      case 1: {
        const requiredFields = ['service_id', 'project_id', 'amount', 'date']
        return requiredFields.every((f) => mapping[f])
      }
      case 2:
        return true
      default:
        return false
    }
  }

  const handleNext = (): void => {
    if (current === 2) {
      handleImport()
    } else {
      setCurrent(current + 1)
    }
  }

  return (
    <div>
      <Title level={3} style={{ marginBottom: 24 }}>
        Import CSV
      </Title>

      <Steps current={current} items={STEPS} style={{ marginBottom: 32 }} />

      <Card>
        {current === 0 && (
          <UploadStep
            onFileSelected={handleFileSelected}
            filePath={filePath}
            fileName={fileName}
          />
        )}
        {current === 1 && parsedCSV && (
          <MappingStep
            csvHeaders={parsedCSV.headers}
            mapping={mapping}
            onMappingChange={setMapping}
          />
        )}
        {current === 2 && parsedCSV && (
          <PreviewStep rows={parsedCSV.rows} mapping={mapping} />
        )}
        {current === 3 && (
          <ResultStep result={importResult} loading={importing} onReset={handleReset} />
        )}
      </Card>

      {current < 3 && (
        <div style={{ marginTop: 24, textAlign: 'right' }}>
          <Space>
            {current > 0 && (
              <Button onClick={() => setCurrent(current - 1)}>Back</Button>
            )}
            <Button
              type="primary"
              onClick={handleNext}
              disabled={!canGoNext()}
              loading={current === 2 && importing}
            >
              {current === 2 ? 'Import' : 'Next'}
            </Button>
          </Space>
        </div>
      )}
    </div>
  )
}
