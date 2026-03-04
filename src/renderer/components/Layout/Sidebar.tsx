import { Layout, Menu } from 'antd'
import {
  DashboardOutlined,
  DollarOutlined,
  FundOutlined,
  SwapOutlined,
  ImportOutlined,
  AuditOutlined,
  SettingOutlined
} from '@ant-design/icons'
import { useNavigate, useLocation } from 'react-router-dom'

const { Sider } = Layout

interface SidebarProps {
  collapsed: boolean
  onCollapse: (collapsed: boolean) => void
}

const menuItems = [
  { key: '/', icon: <DashboardOutlined />, label: 'Dashboard' },
  { key: '/costs', icon: <DollarOutlined />, label: 'Cost Explorer' },
  { key: '/budgets', icon: <FundOutlined />, label: 'Budgets' },
  { key: '/comparison', icon: <SwapOutlined />, label: 'Comparison' },
  { key: '/import', icon: <ImportOutlined />, label: 'Import CSV' },
  { key: '/audit', icon: <AuditOutlined />, label: 'Audit Log' },
  { key: '/settings', icon: <SettingOutlined />, label: 'Settings' }
]

export default function Sidebar({ collapsed, onCollapse }: SidebarProps): JSX.Element {
  const navigate = useNavigate()
  const location = useLocation()

  const selectedKey = location.pathname === '/' ? '/' : '/' + location.pathname.split('/')[1]

  return (
    <Sider
      collapsible
      collapsed={collapsed}
      onCollapse={onCollapse}
      style={{ height: '100vh', position: 'fixed', left: 0, top: 0, bottom: 0, zIndex: 100 }}
    >
      <div
        style={{
          height: 48,
          margin: 12,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: '#fff',
          fontWeight: 700,
          fontSize: collapsed ? 16 : 18,
          whiteSpace: 'nowrap',
          overflow: 'hidden'
        }}
      >
        {collapsed ? 'FO' : 'FinOps Tracker'}
      </div>
      <Menu
        theme="dark"
        mode="inline"
        selectedKeys={[selectedKey]}
        items={menuItems}
        onClick={({ key }) => navigate(key)}
      />
    </Sider>
  )
}
