import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ArrowUp, ArrowDown, Minus } from 'lucide-react'
import { formatCurrency } from '@/lib/date-utils'

interface MetricCardProps {
  title: string
  value: string | number
  change?: number
  format?: 'currency' | 'number' | 'text'
  icon?: React.ReactNode
  subtitle?: string
}

export function MetricCard({ title, value, change, format = 'number', icon, subtitle }: MetricCardProps) {
  const formattedValue =
    format === 'currency' && typeof value === 'number'
      ? formatCurrency(value)
      : format === 'number' && typeof value === 'number'
        ? value.toLocaleString()
        : value

  const changeIcon =
    change !== undefined ? (
      change > 0 ? (
        <ArrowUp className="h-3 w-3" />
      ) : change < 0 ? (
        <ArrowDown className="h-3 w-3" />
      ) : (
        <Minus className="h-3 w-3" />
      )
    ) : null

  const changeColor =
    change !== undefined
      ? change > 0
        ? 'text-green-600 bg-green-50'
        : change < 0
          ? 'text-red-600 bg-red-50'
          : 'text-gray-600 bg-gray-50'
      : ''

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        {icon && <div className="text-muted-foreground">{icon}</div>}
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">{formattedValue}</div>
        {subtitle && (
          <div className="mt-1 text-xs text-muted-foreground">{subtitle}</div>
        )}
        {change !== undefined && (
          <div className="mt-2 flex items-center gap-1">
            <Badge variant="secondary" className={`${changeColor} flex items-center gap-1`}>
              {changeIcon}
              <span className="text-xs font-medium">
                {Math.abs(change).toFixed(1)}%
              </span>
            </Badge>
            <span className="text-xs text-muted-foreground">vs previous period</span>
          </div>
        )}
      </CardContent>
    </Card>
  )
}


