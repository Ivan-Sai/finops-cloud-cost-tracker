import { Typography } from 'antd'
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  ReferenceLine
} from 'recharts'
import { useThemeStore } from '../../stores/themeStore'
import { formatCurrency, formatMonth, getChartThemeColors, getCurrencySymbol } from '../../utils/formatters'

const { Text } = Typography

interface TrendPoint {
  month: string
  total: number
}

interface Props {
  trend: TrendPoint[]
  budgetAmount: number
  currency: string
}

export default function BudgetTrendChart({ trend, budgetAmount, currency }: Props): JSX.Element {
  const theme = useThemeStore((s) => s.theme)
  const sym = getCurrencySymbol(currency)
  const { textColor, gridColor, tooltipBg } = getChartThemeColors(theme)

  if (trend.length === 0) {
    return <Text type="secondary">No spending data available for this scope.</Text>
  }

  return (
    <ResponsiveContainer width="100%" height={300}>
      <AreaChart data={trend}>
        <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
        <XAxis
          dataKey="month"
          tickFormatter={formatMonth}
          tick={{ fill: textColor, fontSize: 12 }}
          interval={0}
        />
        <YAxis
          tickFormatter={(v) => `${sym}${v}`}
          tick={{ fill: textColor, fontSize: 12 }}
        />
        <Tooltip
          formatter={(value: number) => [formatCurrency(value, currency), 'Spend']}
          labelFormatter={formatMonth}
          contentStyle={{
            backgroundColor: tooltipBg,
            border: `1px solid ${gridColor}`
          }}
        />
        <ReferenceLine
          y={budgetAmount}
          stroke="#ff4d4f"
          strokeDasharray="5 5"
          label={{ value: 'Budget Limit', position: 'right', fill: '#ff4d4f' }}
        />
        <Area
          type="monotone"
          dataKey="total"
          stroke="#1677ff"
          fill="#1677ff"
          fillOpacity={0.15}
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
