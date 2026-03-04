import { Card } from 'antd'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import { useThemeStore } from '../../stores/themeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatMonth, formatCurrency, fillMissingMonths, getChartThemeColors, getCurrencySymbol } from '../../utils/formatters'

interface SpendTrendChartProps {
  data: { month: string; total: number }[]
  loading: boolean
}

export default function SpendTrendChart({ data, loading }: SpendTrendChartProps): JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const { textColor, gridColor, tooltipBg } = getChartThemeColors(theme)
  const chartData = fillMissingMonths(data)

  return (
    <Card title="Spend Trend (6 months)" loading={loading}>
      <ResponsiveContainer width="100%" height={300}>
        <AreaChart data={chartData} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="spendGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#1677ff" stopOpacity={0.3} />
              <stop offset="95%" stopColor="#1677ff" stopOpacity={0} />
            </linearGradient>
          </defs>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: textColor, fontSize: 12 }}
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${sym}${(v / 1000).toFixed(0)}k`}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number) => [formatCurrency(value, currency), 'Total Spend']}
            labelFormatter={formatMonth}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${gridColor}`
            }}
          />
          <Area
            type="monotone"
            dataKey="total"
            stroke="#1677ff"
            fillOpacity={1}
            fill="url(#spendGradient)"
            strokeWidth={2}
          />
        </AreaChart>
      </ResponsiveContainer>
    </Card>
  )
}
