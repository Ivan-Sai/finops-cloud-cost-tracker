import { Drawer, Descriptions, Tag, Typography } from 'antd'
import dayjs from 'dayjs'
import type { AuditEntry } from '../../types/audit'
import { ACTION_COLORS, OUTCOME_COLORS } from './constants'

const { Text } = Typography

interface Props {
  entry: AuditEntry | null
  open: boolean
  onClose: () => void
}

function parseDetails(details: string | null): Record<string, unknown> | null {
  if (!details) return null
  try {
    return JSON.parse(details)
  } catch {
    return null
  }
}

export default function AuditDetailDrawer({ entry, open, onClose }: Props): JSX.Element {
  return (
    <Drawer title="Event Details" open={open} onClose={onClose} width={600}>
      {entry && (
        <Descriptions column={1} bordered size="small">
          <Descriptions.Item label="ID">
            <Text copyable>{entry.id}</Text>
          </Descriptions.Item>
          <Descriptions.Item label="Timestamp">
            {dayjs(entry.timestamp).format('YYYY-MM-DD HH:mm:ss')}
          </Descriptions.Item>
          <Descriptions.Item label="Actor">
            <Tag>{entry.actor}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Action">
            <Tag color={ACTION_COLORS[entry.action] || 'default'}>
              {entry.action}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Resource Type">
            <Tag>{entry.resource_type}</Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Resource ID">
            {entry.resource_id ? (
              <Text copyable>{entry.resource_id}</Text>
            ) : (
              <Text type="secondary">—</Text>
            )}
          </Descriptions.Item>
          <Descriptions.Item label="Outcome">
            <Tag color={OUTCOME_COLORS[entry.outcome] || 'default'}>
              {entry.outcome}
            </Tag>
          </Descriptions.Item>
          <Descriptions.Item label="Details">
            {entry.details ? (
              <pre
                style={{
                  margin: 0,
                  fontSize: 12,
                  maxHeight: 400,
                  overflow: 'auto',
                  background: 'rgba(0,0,0,0.04)',
                  padding: 8,
                  borderRadius: 4,
                  whiteSpace: 'pre-wrap',
                  wordBreak: 'break-all'
                }}
              >
                {JSON.stringify(parseDetails(entry.details), null, 2)}
              </pre>
            ) : (
              <Text type="secondary">No details</Text>
            )}
          </Descriptions.Item>
        </Descriptions>
      )}
    </Drawer>
  )
}
