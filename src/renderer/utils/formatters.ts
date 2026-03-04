import dayjs from 'dayjs'

const currencySymbols: Record<string, string> = {
  USD: '$',
  EUR: '€',
  GBP: '£',
  UAH: '₴'
}

const currencyLocales: Record<string, string> = {
  USD: 'en-US',
  EUR: 'de-DE',
  GBP: 'en-GB',
  UAH: 'uk-UA'
}

export function getCurrencySymbol(currency: string): string {
  return currencySymbols[currency] || '$'
}

export function formatCurrency(amount: number, currency = 'USD'): string {
  return new Intl.NumberFormat(currencyLocales[currency] || 'en-US', {
    style: 'currency',
    currency,
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  }).format(amount)
}

export function formatCompactCurrency(amount: number, currency = 'USD'): string {
  const sym = getCurrencySymbol(currency)
  if (amount >= 1000) {
    return `${sym}${(amount / 1000).toFixed(1)}k`
  }
  return formatCurrency(amount, currency)
}

export function formatDate(date: string): string {
  return dayjs(date).format('MMM DD, YYYY')
}

export function formatMonth(month: string): string {
  return dayjs(month + '-01').format('MMM YYYY')
}

export function formatPercent(value: number): string {
  return `${(value * 100).toFixed(1)}%`
}

export function formatChangePercent(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0
  return ((current - previous) / previous) * 100
}

/**
 * Fill missing months in a monthly trend dataset so every month
 * between the first and last data point is present (with total=0 for gaps).
 */
export function fillMissingMonths(
  data: { month: string; total: number }[]
): { month: string; total: number }[] {
  if (data.length < 2) return data
  const result: { month: string; total: number }[] = []
  const map = new Map(data.map((d) => [d.month, d.total]))

  let current = dayjs(data[0].month + '-01')
  const end = dayjs(data[data.length - 1].month + '-01')

  while (current.isBefore(end) || current.isSame(end, 'month')) {
    const key = current.format('YYYY-MM')
    result.push({ month: key, total: map.get(key) ?? 0 })
    current = current.add(1, 'month')
  }
  return result
}

/**
 * Returns Recharts-compatible theme colors based on light/dark mode.
 */
export function getChartThemeColors(theme: 'light' | 'dark'): {
  textColor: string
  gridColor: string
  tooltipBg: string
} {
  return theme === 'dark'
    ? { textColor: '#ffffffa6', gridColor: '#303030', tooltipBg: '#1f1f1f' }
    : { textColor: '#000000a6', gridColor: '#f0f0f0', tooltipBg: '#fff' }
}
