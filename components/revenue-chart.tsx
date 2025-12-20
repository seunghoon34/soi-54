'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency, formatShortDate } from '@/lib/date-utils'
import { RevenueDataPoint } from '@/lib/dashboard-data'
import { Sun, Moon, TrendingUp, Truck } from 'lucide-react'

interface RevenueChartProps {
  data: RevenueDataPoint[]
  deliverySalesMap?: Map<string, number>
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    const combinedRevenue = (data.revenue || 0) + (data.deliverySales || 0)
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[220px]">
        <p className="font-semibold text-gray-900 mb-2">{label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Combined Revenue:</span>
            <span className="font-medium text-blue-600">{formatCurrency(combinedRevenue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">In Store:</span>
            <span className="font-medium text-emerald-600">{formatCurrency(data.revenue)}</span>
          </div>
          {data.deliverySales > 0 && (
            <div className="flex justify-between gap-3">
              <span className="text-gray-600 flex items-center gap-1">
                <Truck className="w-3 h-3 text-teal-500" /> Delivery:
              </span>
              <span className="font-medium text-teal-600">{formatCurrency(data.deliverySales)}</span>
            </div>
          )}
          {(data.lunchRevenue !== undefined || data.dinnerRevenue !== undefined) && (
            <>
              <div className="flex justify-between gap-3">
                <span className="text-gray-600 flex items-center gap-1">
                  <Sun className="w-3 h-3 text-orange-500" /> Lunch:
                </span>
                <span className="font-medium text-orange-600">
                  {data.lunchRevenue !== undefined ? formatCurrency(data.lunchRevenue) : '-'}
                </span>
              </div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-600 flex items-center gap-1">
                  <Moon className="w-3 h-3 text-purple-500" /> Dinner:
                </span>
                <span className="font-medium text-purple-600">
                  {data.dinnerRevenue !== undefined ? formatCurrency(data.dinnerRevenue) : '-'}
                </span>
              </div>
            </>
          )}
          <div className="border-t border-gray-200 my-1.5"></div>
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

export function RevenueChart({ data, deliverySalesMap }: RevenueChartProps) {
  const [showCombined, setShowCombined] = useState(true)
  const [showTotal, setShowTotal] = useState(true)
  const [showLunch, setShowLunch] = useState(true)
  const [showDinner, setShowDinner] = useState(true)
  const [showDelivery, setShowDelivery] = useState(true)

  const chartData = data.map((point) => {
    const deliverySales = deliverySalesMap?.get(point.date) || 0
    return {
      date: formatShortDate(point.date),
      revenue: point.revenue,
      deliverySales,
      combinedRevenue: point.revenue + deliverySales,
      lunchRevenue: point.lunchRevenue,
      dinnerRevenue: point.dinnerRevenue,
      orders: point.orders,
      itemsSold: point.itemsSold,
      avgValuePerItem: point.avgValuePerItem,
      topItems: point.topItems,
    }
  })

  // Check if we have any lunch/dinner data
  const hasLunchDinnerData = data.some(d => d.lunchRevenue !== undefined || d.dinnerRevenue !== undefined)
  const hasDeliveryData = deliverySalesMap && deliverySalesMap.size > 0

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Revenue Trend</CardTitle>
        <div className="flex items-center gap-3">
          {/* Combined Total Toggle */}
          {hasDeliveryData && (
            <button
              onClick={() => setShowCombined(!showCombined)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                showCombined
                  ? 'bg-blue-100 text-blue-700 border border-blue-300'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <TrendingUp className="w-3.5 h-3.5" />
              Total
            </button>
          )}
          
          {/* In-Store Toggle */}
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showTotal
                ? 'bg-emerald-100 text-emerald-700 border border-emerald-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            In Store
          </button>
          
          {/* Delivery Toggle */}
          {hasDeliveryData && (
            <button
              onClick={() => setShowDelivery(!showDelivery)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                showDelivery
                  ? 'bg-teal-100 text-teal-700 border border-teal-300'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Truck className="w-3.5 h-3.5" />
              Delivery
            </button>
          )}
          
          {/* Lunch Toggle */}
          {hasLunchDinnerData && (
            <button
              onClick={() => setShowLunch(!showLunch)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                showLunch
                  ? 'bg-orange-100 text-orange-700 border border-orange-300'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Sun className="w-3.5 h-3.5" />
              Lunch
            </button>
          )}
          
          {/* Dinner Toggle */}
          {hasLunchDinnerData && (
            <button
              onClick={() => setShowDinner(!showDinner)}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
                showDinner
                  ? 'bg-purple-100 text-purple-700 border border-purple-300'
                  : 'bg-gray-100 text-gray-400 border border-gray-200'
              }`}
            >
              <Moon className="w-3.5 h-3.5" />
              Dinner
            </button>
          )}
        </div>
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
            
            {/* Combined Total Revenue Line */}
            {showCombined && hasDeliveryData && (
              <Line
                type="monotone"
                dataKey="combinedRevenue"
                stroke="#3b82f6"
                strokeWidth={3}
                dot={{ fill: '#3b82f6', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total"
              />
            )}
            
            {/* In-Store Revenue Line */}
            {showTotal && (
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="#10b981"
                strokeWidth={2}
                dot={{ fill: '#10b981', r: 3 }}
                activeDot={{ r: 5 }}
                name="In Store"
              />
            )}
            
            {/* Delivery Sales Line */}
            {showDelivery && hasDeliveryData && (
              <Line
                type="monotone"
                dataKey="deliverySales"
                stroke="#14b8a6"
                strokeWidth={2}
                dot={{ fill: '#14b8a6', r: 3 }}
                activeDot={{ r: 5 }}
                name="Delivery"
                connectNulls
              />
            )}
            
            {/* Lunch Revenue Line */}
            {showLunch && hasLunchDinnerData && (
              <Line
                type="monotone"
                dataKey="lunchRevenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5 }}
                name="Lunch"
                connectNulls
              />
            )}
            
            {/* Dinner Revenue Line */}
            {showDinner && hasLunchDinnerData && (
              <Line
                type="monotone"
                dataKey="dinnerRevenue"
                stroke="#a855f7"
                strokeWidth={2}
                dot={{ fill: '#a855f7', r: 3 }}
                activeDot={{ r: 5 }}
                name="Dinner"
                connectNulls
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

