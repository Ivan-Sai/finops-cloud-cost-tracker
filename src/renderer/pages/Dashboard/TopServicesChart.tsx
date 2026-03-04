import { Card } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell
} from 'recharts'
import { useThemeStore } from '../../stores/themeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, getChartThemeColors, getCurrencySymbol } from '../../utils/formatters'

interface TopServicesChartProps {
  data: { service_id: string; service_name: string; total: number }[]
  loading: boolean
}

const COLORS = ['#1677ff', '#52c41a', '#faad14', '#ff4d4f', '#722ed1']

export default function TopServicesChart({ data, loading }: TopServicesChartProps): JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const { textColor, gridColor, tooltipBg } = getChartThemeColors(theme)

  const chartData = data.map((item, i) => ({
    ...item,
    fill: COLORS[i % COLORS.length]
  }))

  return (
    <Card title="Top 5 Services (MTD)" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis dataKey="service_name" tick={{ fill: textColor, fontSize: 12 }} />
          <YAxis
            tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, currency), 'Spend']}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${gridColor}`
            }}
          />
          <Bar dataKey="total" radius={[4, 4, 0, 0]}>
            {chartData.map((entry, index) => (
              <Cell key={index} fill={entry.fill} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
