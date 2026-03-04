import { Typography, Card, Form, Select, Switch, Divider, Space, App } from 'antd'
import { BulbOutlined, BulbFilled, DollarOutlined, InfoCircleOutlined } from '@ant-design/icons'
import { useThemeStore } from '../../stores/themeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import ServiceManager from './ServiceManager'
import ProjectManager from './ProjectManager'

const { Title, Text, Paragraph } = Typography

const currencyOptions = [
  { label: 'USD ($)', value: 'USD' },
  { label: 'EUR (€)', value: 'EUR' },
  { label: 'GBP (£)', value: 'GBP' },
  { label: 'UAH (₴)', value: 'UAH' }
]

export default function SettingsPage(): JSX.Element {
  const { theme, setTheme } = useThemeStore()
  const { currency, setCurrency } = useSettingsStore()
  const { message } = App.useApp()

  const handleThemeChange = (checked: boolean): void => {
    setTheme(checked ? 'dark' : 'light')
    message.success('Theme updated')
  }

  const handleCurrencyChange = (val: string): void => {
    setCurrency(val)
    message.success('Currency updated')
  }

  return (
    <div style={{ maxWidth: 720 }}>
      <Title level={3} style={{ marginBottom: 24 }}>
        Settings
      </Title>

      <Card>
        <Form layout="vertical">
          <Form.Item label={<Space><BulbOutlined /> Theme</Space>}>
            <Space>
              <Switch
                checked={theme === 'dark'}
                onChange={handleThemeChange}
                checkedChildren={<BulbFilled />}
                unCheckedChildren={<BulbOutlined />}
              />
              <Text type="secondary">{theme === 'dark' ? 'Dark mode' : 'Light mode'}</Text>
            </Space>
          </Form.Item>

          <Divider />

          <Form.Item label={<Space><DollarOutlined /> Display currency</Space>}>
            <Select
              value={currency}
              onChange={handleCurrencyChange}
              options={currencyOptions}
              style={{ width: 200 }}
            />
          </Form.Item>

          <Divider />

          <Form.Item label={<Space><InfoCircleOutlined /> About</Space>}>
            <Space direction="vertical" size={4}>
              <Text strong>FinOps Cloud Cost Tracker</Text>
              <Text type="secondary">Version 1.0.0</Text>
              <Text type="secondary">Electron desktop application for cloud cost tracking, budgets, and deviations.</Text>
              <Text type="secondary">Built with Electron + React + TypeScript + Ant Design</Text>
            </Space>
          </Form.Item>
        </Form>
      </Card>

      <Card title="Keyboard Shortcuts" style={{ marginTop: 16 }}>
        <Space direction="vertical" size={8} style={{ width: '100%' }}>
          {[
            ['Ctrl + D', 'Go to Dashboard'],
            ['Ctrl + E', 'Go to Cost Explorer'],
            ['Ctrl + N', 'Create new budget'],
            ['Ctrl + I', 'Go to Import'],
            ['Ctrl + F', 'Focus search (on Cost Explorer)'],
            ['Escape', 'Close modals / dialogs']
          ].map(([key, desc]) => (
            <div key={key} style={{ display: 'flex', justifyContent: 'space-between' }}>
              <Text code>{key}</Text>
              <Text type="secondary">{desc}</Text>
            </div>
          ))}
        </Space>
      </Card>

      <ServiceManager />

      <ProjectManager />
    </div>
  )
}
