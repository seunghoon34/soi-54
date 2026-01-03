'use client'

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend } from 'recharts'
import { formatCurrency } from '@/lib/date-utils'

interface EwhaDeliveryChartProps {
  coupangRevenue: number
  baeminRevenue: number
  pandaRevenue: number
}

const COLORS = ['#f97316', '#06b6d4', '#ec4899']

export function EwhaDeliveryChart({ coupangRevenue, baeminRevenue, pandaRevenue }: EwhaDeliveryChartProps) {
  const total = coupangRevenue + baeminRevenue + pandaRevenue
  
  const data = [
    { name: 'Coupang', value: coupangRevenue, color: '#f97316' },
    { name: 'Baemin', value: baeminRevenue, color: '#06b6d4' },
    { name: 'Panda', value: pandaRevenue, color: '#ec4899' },
  ].filter(item => item.value > 0)

  if (total === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Delivery Breakdown</CardTitle>
        </CardHeader>
        <CardContent className="flex items-center justify-center h-[250px] text-gray-400">
          No delivery data
        </CardContent>
      </Card>
    )
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-base">Delivery Breakdown</CardTitle>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie
              data={data}
              cx="50%"
              cy="50%"
              innerRadius={50}
              outerRadius={80}
              paddingAngle={2}
              dataKey="value"
              label={({ name, percent }) => `${name} ${((percent ?? 0) * 100).toFixed(0)}%`}
              labelLine={false}
            >
              {data.map((entry, index) => (
                <Cell key={`cell-${index}`} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip
              formatter={(value: number) => formatCurrency(value)}
              contentStyle={{ borderRadius: '8px', border: '1px solid #e5e7eb' }}
            />
          </PieChart>
        </ResponsiveContainer>
        
        {/* Legend with values */}
        <div className="flex justify-center gap-6 mt-2">
          {data.map((item) => (
            <div key={item.name} className="text-center">
              <div className="flex items-center gap-1.5 justify-center">
                <div 
                  className="w-3 h-3 rounded-full" 
                  style={{ backgroundColor: item.color }}
                />
                <span className="text-sm font-medium">{item.name}</span>
              </div>
              <div className="text-xs text-gray-500">{formatCurrency(item.value)}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  )
}

