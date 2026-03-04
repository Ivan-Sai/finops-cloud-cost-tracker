import { useEffect, useState } from 'react'
import { Card, Typography } from 'antd'
import { CloseOutlined } from '@ant-design/icons'
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer
} from 'recharts'
import type { CostRecord } from '../../types/cost'
import { useThemeStore } from '../../stores/themeStore'
import { useSettingsStore } from '../../stores/settingsStore'
import { formatMonth, formatCurrency, fillMissingMonths, getChartThemeColors, getCurrencySymbol } from '../../utils/formatters'

const { Text } = Typography

interface CostChartProps {
  record: CostRecord
  onClose: () => void
}

interface ServiceTrend {
  month: string
  total: number
}

export default function CostChart({ record, onClose }: CostChartProps): JSX.Element {
  const [data, setData] = useState<ServiceTrend[]>([])
  const [loading, setLoading] = useState(true)
  const theme = useThemeStore((s) => s.theme)
  const currency = useSettingsStore((s) => s.currency)
  const sym = getCurrencySymbol(currency)
  const { textColor, gridColor, tooltipBg } = getChartThemeColors(theme)

  useEffect(() => {
    setLoading(true)
    window.api
      .invoke('costs:getByService', record.service_id)
      .then((result) => {
        setData(fillMissingMonths(result as ServiceTrend[]))
      })
      .finally(() => setLoading(false))
  }, [record.service_id])

  return (
    <Card
      title={
        <span>
          Cost trend: <Text strong>{record.service_name}</Text>
        </span>
      }
      extra={<CloseOutlined onClick={onClose} style={{ cursor: 'pointer' }} />}
      loading={loading}
      style={{ marginBottom: 16 }}
    >
      <ResponsiveContainer width="100%" height={250}>
        <LineChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
          <CartesianGrid strokeDasharray="3 3" stroke={gridColor} />
          <XAxis
            dataKey="month"
            tickFormatter={formatMonth}
            tick={{ fill: textColor, fontSize: 12 }}
            interval={0}
          />
          <YAxis
            tickFormatter={(v) => `${sym}${v.toFixed(0)}`}
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
          <Line
            type="monotone"
            dataKey="total"
            stroke="#1677ff"
            strokeWidth={2}
            dot={{ r: 4 }}
            activeDot={{ r: 6 }}
          />
        </LineChart>
      </ResponsiveContainer>
    </Card>
  )
}
