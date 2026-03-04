import { useEffect } from 'react'
import { HashRouter, Routes, Route } from 'react-router-dom'
import { ConfigProvider, App as AntApp, theme as antdTheme } from 'antd'
import { useThemeStore } from './stores/themeStore'
import { useSettingsStore } from './stores/settingsStore'
import AppLayout from './components/Layout/AppLayout'
import DashboardPage from './pages/Dashboard/DashboardPage'
import CostExplorerPage from './pages/CostExplorer/CostExplorerPage'
import BudgetsPage from './pages/Budgets/BudgetsPage'
import BudgetDetailPage from './pages/Budgets/BudgetDetailPage'
import ComparisonPage from './pages/Comparison/ComparisonPage'
import ImportPage from './pages/Import/ImportPage'
import AuditLogPage from './pages/AuditLog/AuditLogPage'
import SettingsPage from './pages/Settings/SettingsPage'
import ErrorBoundary from './components/ErrorBoundary'

function App(): JSX.Element {
  const { theme, loadTheme } = useThemeStore()
  const { loadSettings } = useSettingsStore()

  useEffect(() => {
    loadTheme()
    loadSettings()
  }, [])

  return (
    <ConfigProvider
      theme={{
        algorithm: theme === 'dark' ? antdTheme.darkAlgorithm : antdTheme.defaultAlgorithm,
        token: {
          colorPrimary: '#1677ff',
          borderRadius: 6
        }
      }}
    >
      <AntApp>
        <ErrorBoundary>
        <HashRouter>
          <Routes>
            <Route element={<AppLayout />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/costs" element={<CostExplorerPage />} />
              <Route path="/budgets" element={<BudgetsPage />} />
              <Route path="/budgets/:id" element={<BudgetDetailPage />} />
              <Route path="/comparison" element={<ComparisonPage />} />
              <Route path="/import" element={<ImportPage />} />
              <Route path="/audit" element={<AuditLogPage />} />
              <Route path="/settings" element={<SettingsPage />} />
            </Route>
          </Routes>
        </HashRouter>
        </ErrorBoundary>
      </AntApp>
    </ConfigProvider>
  )
}

export default App
