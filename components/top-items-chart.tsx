'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/date-utils'
import { TopItem } from '@/lib/dashboard-data'

interface TopItemsChartProps {
  data: TopItem[]
}

export function TopItemsChart({ data }: TopItemsChartProps) {
  const chartData = data.slice(0, 8).map((item) => ({
    name: item.name.length > 15 ? item.name.substring(0, 15) + '...' : item.name,
    fullName: item.name,
    quantity: item.quantity,
    revenue: item.revenue,
  }))

  return (
    <Card>
      <CardHeader>
        <CardTitle>Top Selling Items</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <BarChart data={chartData} layout="vertical">
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              type="number"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
            />
            <YAxis
              type="category"
              dataKey="name"
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              width={120}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'hsl(var(--background))',
                border: '1px solid hsl(var(--border))',
                borderRadius: '6px',
              }}
              formatter={(value: any, name: string, props: any) => {
                if (name === 'quantity') return [value, 'Quantity']
                return [formatCurrency(value), 'Revenue']
              }}
              labelFormatter={(label: string, payload: any) => {
                return payload[0]?.payload?.fullName || label
              }}
            />
            <Bar dataKey="quantity" fill="#3b82f6" radius={[0, 4, 4, 0]} />
          </BarChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

