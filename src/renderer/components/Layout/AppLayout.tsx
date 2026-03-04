import { useState, useEffect } from 'react'
import { Layout, notification } from 'antd'
import { Outlet, useNavigate } from 'react-router-dom'
import Sidebar from './Sidebar'
import Header from './Header'
import { useBudgetsStore } from '../../stores/budgetsStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { useKeyboardShortcuts } from '../../hooks/useKeyboardShortcuts'
import { formatCurrency } from '../../utils/formatters'
import type { BudgetAlert } from '../../types/budget'

const { Content } = Layout

export default function AppLayout(): JSX.Element {
  const [collapsed, setCollapsed] = useState(false)
  const navigate = useNavigate()
  const { fetchAlerts } = useBudgetsStore()

  // Global keyboard shortcuts
  useKeyboardShortcuts()

  useEffect(() => {
    // Listen for navigation commands from main process (tray menu clicks)
    window.api.on('navigate', (route: unknown) => {
      if (typeof route === 'string') {
        navigate(route)
      }
    })

    // Listen for budget alert updates pushed from main process
    window.api.on('budget:alerts-updated', (alerts: unknown) => {
      const alertList = alerts as BudgetAlert[]

      // Update store
      useBudgetsStore.setState({ alerts: alertList })

      // Show in-app notification for critical/exceeded alerts
      for (const alert of alertList) {
        if (alert.level === 'exceeded' || alert.level === 'critical') {
          const key = `budget-alert-${alert.budget_id}-${alert.level}`
          notification.open({
            key,
            type: alert.level === 'exceeded' ? 'error' : 'warning',
            message: `Budget ${alert.level === 'exceeded' ? 'Exceeded' : 'Critical'}: ${alert.budget_name}`,
            description: `${Math.round(alert.utilization * 100)}% used — ${formatCurrency(alert.spent, useSettingsStore.getState().currency)} of ${formatCurrency(alert.limit, useSettingsStore.getState().currency)} limit`,
            duration: 8,
            placement: 'topRight',
            onClick: () => {
              navigate('/budgets')
              notification.destroy(key)
            }
          })
        }
      }
    })

    // Fetch alerts on mount
    fetchAlerts()

    return () => {
      window.api.removeAllListeners('navigate')
      window.api.removeAllListeners('budget:alerts-updated')
    }
  }, [])

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <Sidebar collapsed={collapsed} onCollapse={setCollapsed} />
      <Layout
        style={{
          marginLeft: collapsed ? 80 : 200,
          transition: 'margin-left 0.2s',
          height: '100vh',
          overflow: 'hidden'
        }}
      >
        <Header />
        <Content
          style={{
            margin: 16,
            padding: 24,
            overflow: 'auto',
            flex: 1
          }}
        >
          <Outlet />
        </Content>
      </Layout>
    </Layout>
  )
}
