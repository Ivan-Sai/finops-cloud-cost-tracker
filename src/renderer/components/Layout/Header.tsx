import { Layout, Switch, Space, Typography, Breadcrumb, Badge, Popover, List, Tag, Empty } from 'antd'
import { BulbOutlined, BulbFilled, BellOutlined } from '@ant-design/icons'
import { useLocation } from 'react-router-dom'
import { useThemeStore } from '../../stores/themeStore'
import { useBudgetsStore } from '../../stores/budgetsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency } from '../../utils/formatters'

const { Header: AntHeader } = Layout
const { Text } = Typography

const routeNames: Record<string, string> = {
  '/': 'Dashboard',
  '/costs': 'Cost Explorer',
  '/budgets': 'Budgets',
  '/comparison': 'Comparison',
  '/import': 'Import CSV',
  '/audit': 'Audit Log',
  '/settings': 'Settings'
}

const levelColors: Record<string, string> = {
  exceeded: 'red',
  critical: 'orange',
  warning: 'gold'
}

export default function Header(): JSX.Element {
  const { theme, toggleTheme } = useThemeStore()
  const { alerts } = useBudgetsStore()
  const currency = useSettingsStore((s) => s.currency)
  const location = useLocation()

  const pathKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]
  const pageName = routeNames[pathKey] || 'Page'

  const alertContent = (
    <div style={{ width: 300, maxHeight: 300, overflow: 'auto' }}>
      {alerts.length === 0 ? (
        <Empty description="No budget alerts" image={Empty.PRESENTED_IMAGE_SIMPLE} />
      ) : (
        <List
          size="small"
          dataSource={alerts}
          renderItem={(alert) => (
            <List.Item>
              <List.Item.Meta
                title={
                  <Space>
                    <Tag color={levelColors[alert.level]}>{alert.level.toUpperCase()}</Tag>
                    <Text strong style={{ fontSize: 13 }}>{alert.budget_name}</Text>
                  </Space>
                }
                description={`${Math.round(alert.utilization * 100)}% used — ${formatCurrency(alert.spent, currency)} / ${formatCurrency(alert.limit, currency)}`}
              />
            </List.Item>
          )}
        />
      )}
    </div>
  )

  return (
    <AntHeader
      style={{
        padding: '0 24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        background: theme === 'dark' ? '#141414' : '#fff',
        borderBottom: `1px solid ${theme === 'dark' ? '#303030' : '#f0f0f0'}`
      }}
    >
      <Breadcrumb
        items={[
          { title: 'FinOps' },
          { title: pageName }
        ]}
      />
      <Space size="middle">
        <Popover content={alertContent} title="Budget Alerts" trigger="click" placement="bottomRight">
          <Badge count={alerts.length} size="small" offset={[-2, 2]}>
            <BellOutlined style={{ fontSize: 18, cursor: 'pointer' }} />
          </Badge>
        </Popover>
        <Text type="secondary" style={{ fontSize: 12 }}>
          {theme === 'dark' ? 'Dark' : 'Light'}
        </Text>
        <Switch
          checked={theme === 'dark'}
          onChange={toggleTheme}
          checkedChildren={<BulbFilled />}
          unCheckedChildren={<BulbOutlined />}
        />
      </Space>
    </AntHeader>
  )
}
