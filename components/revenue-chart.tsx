'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatShortDate } from '@/lib/date-utils'
import { RevenueDataPoint } from '@/lib/dashboard-data'

interface RevenueChartProps {
  data: RevenueDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[220px]">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Revenue:</span>
            <span className="font-medium text-emerald-600">{formatCurrency(data.revenue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Items Sold:</span>
            <span className="font-medium">{data.itemsSold}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Avg per Item:</span>
            <span className="font-medium text-blue-600">{formatCurrency(data.avgValuePerItem)}</span>
          </div>
          {data.topItems && data.topItems.length > 0 && (
            <>
              <div className="border-t border-gray-200 my-1.5"></div>
              <div className="pt-0.5">
                <div className="text-gray-600 text-xs mb-1.5">Top Items:</div>
                <div className="space-y-1">
                  {data.topItems.map((item: { name: string; count: number }, index: number) => (
                    <div key={index} className="flex justify-between items-center gap-2">
                      <span className="text-xs font-medium text-purple-600 truncate">{item.name}</span>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{item.count}x</span>
                    </div>
                  ))}
                </div>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function RevenueChart({ data }: RevenueChartProps) {
  const chartData = data.map((point) => ({
    date: formatShortDate(point.date),
    revenue: point.revenue,
    orders: point.orders,
    itemsSold: point.itemsSold,
    avgValuePerItem: point.avgValuePerItem,
    topItems: point.topItems,
  }))

  return (
    <Card className="col-span-full">
      <CardHeader>
        <CardTitle>Revenue Trend</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            <Line
              type="monotone"
              dataKey="revenue"
              stroke="#10b981"
              strokeWidth={3}
              dot={{ fill: '#10b981', r: 4 }}
              activeDot={{ r: 6 }}
            />
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

