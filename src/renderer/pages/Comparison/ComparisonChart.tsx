import { Card } from 'antd'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts'
import { useThemeStore } from '../../stores/themeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatCurrency, getChartThemeColors, getCurrencySymbol } from '../../utils/formatters'

interface ComparisonRow {
  service_name: string
  service_id: string
  period1_total: number
  period2_total: number
  delta: number
  delta_pct: number
}

interface ComparisonChartProps {
  data: ComparisonRow[]
  period1Label: string
  period2Label: string
}

export default function ComparisonChart({
  data,
  period1Label,
  period2Label
}: ComparisonChartProps): JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const { textColor, gridColor, tooltipBg } = getChartThemeColors(theme)

  return (
    <Card title="Comparison Chart">
      <ResponsiveContainer width="100%" height={350}>
        <BarChart data={data} barGap={4} barCategoryGap="20%">
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="service_name"
            tick={{ fill: textColor, fontSize: 12 }}
            interval={0}
            angle={-20}
            textAnchor="end"
            height={60}
          />
          <YAxis
            tickFormatter={(v) => `${sym}${v}`}
            tick={{ fill: textColor, fontSize: 12 }}
          />
          <Tooltip
            formatter={(value: number, name: string) => [formatCurrency(value, currency), name]}
            contentStyle={{
              backgroundColor: tooltipBg,
              border: `1px solid ${gridColor}`
            }}
          />
          <Legend />
          <Bar
            dataKey="period1_total"
            name={period1Label}
            fill="#1677ff"
            radius={[4, 4, 0, 0]}
          />
          <Bar
            dataKey="period2_total"
            name={period2Label}
            fill="#52c41a"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  )
}
