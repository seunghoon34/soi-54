'use client'

import { useState } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'
import { formatCurrency } from '@/lib/date-utils'
import { format } from 'date-fns'
import { EwhaRevenueDataPoint } from '@/lib/ewha-dashboard-data'
import { Store, Truck, TrendingUp } from 'lucide-react'

interface EwhaRevenueChartProps {
  data: EwhaRevenueDataPoint[]
}

interface CustomTooltipProps {
  active?: boolean
  payload?: any[]
  label?: string
}

interface CustomXAxisTickProps {
  x?: number
  y?: number
  payload?: { value: string; index: number }
  chartData?: Array<{ date: string; dayOfWeek: string }>
}

function CustomXAxisTick({ x, y, payload, chartData }: CustomXAxisTickProps) {
  if (!payload || !chartData) return null
  
  const dataPoint = chartData[payload.index]
  if (!dataPoint) return null
  
  return (
    <g transform={`translate(${x},${y})`}>
      <text
        x={0}
        y={0}
        dy={12}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={11}
      >
        {dataPoint.date}
      </text>
      <text
        x={0}
        y={0}
        dy={24}
        textAnchor="middle"
        fill="hsl(var(--muted-foreground))"
        fontSize={9}
        opacity={0.6}
      >
        {dataPoint.dayOfWeek}
      </text>
    </g>
  )
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (active && payload && payload.length) {
    const data = payload[0].payload
    return (
      <div className="bg-white border border-gray-200 rounded-lg shadow-lg p-3 min-w-[200px]">
        <p className="font-semibold text-gray-900 mb-2">{data.fullLabel || label}</p>
        <div className="space-y-1 text-sm">
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Total Revenue:</span>
            <span className="font-medium text-gray-900">{formatCurrency(data.totalRevenue)}</span>
          </div>
          <div className="border-t border-gray-200 my-1.5"></div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 flex items-center gap-1">
              <Store className="w-3 h-3 text-blue-500" /> In-Store:
            </span>
            <span className="font-medium text-blue-600">{formatCurrency(data.instoreRevenue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600 flex items-center gap-1">
              <Truck className="w-3 h-3 text-emerald-500" /> Delivery:
            </span>
            <span className="font-medium text-emerald-600">{formatCurrency(data.totalDeliveryRevenue)}</span>
          </div>
          <div className="border-t border-gray-200 my-1.5"></div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Coupang:</span>
            <span className="font-medium text-orange-600">{formatCurrency(data.coupangRevenue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Baemin:</span>
            <span className="font-medium text-cyan-600">{formatCurrency(data.baeminRevenue)}</span>
          </div>
          <div className="flex justify-between gap-3">
            <span className="text-gray-600">Panda:</span>
            <span className="font-medium text-pink-600">{formatCurrency(data.pandaRevenue)}</span>
          </div>
          {data.instoreOrderCount > 0 && (
            <>
              <div className="border-t border-gray-200 my-1.5"></div>
              <div className="flex justify-between gap-3">
                <span className="text-gray-600">Orders:</span>
                <span className="font-medium">{data.instoreOrderCount}</span>
              </div>
            </>
          )}
        </div>
      </div>
    )
  }
  return null
}

export function EwhaRevenueChart({ data }: EwhaRevenueChartProps) {
  const [showTotal, setShowTotal] = useState(true)
  const [showInstore, setShowInstore] = useState(true)
  const [showCoupang, setShowCoupang] = useState(true)
  const [showBaemin, setShowBaemin] = useState(true)
  const [showPanda, setShowPanda] = useState(true)

  const chartData = data.map((point) => {
    const dateObj = new Date(point.date)
    return {
      date: format(dateObj, 'MMM d'),
      dayOfWeek: format(dateObj, 'EEE'), // Mon, Tue, Wed...
      fullLabel: format(dateObj, 'EEE, MMM d'), // For tooltip
      totalRevenue: point.totalRevenue,
      instoreRevenue: point.instoreRevenue,
      coupangRevenue: point.coupangRevenue,
      baeminRevenue: point.baeminRevenue,
      pandaRevenue: point.pandaRevenue,
      totalDeliveryRevenue: point.totalDeliveryRevenue,
      instoreOrderCount: point.instoreOrderCount,
    }
  })

  return (
    <Card className="col-span-full">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle>Revenue Trend</CardTitle>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Total Toggle */}
          <button
            onClick={() => setShowTotal(!showTotal)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showTotal
                ? 'bg-gray-800 text-white border border-gray-700'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <TrendingUp className="w-3.5 h-3.5" />
            Total
          </button>
          
          {/* In-Store Toggle */}
          <button
            onClick={() => setShowInstore(!showInstore)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showInstore
                ? 'bg-blue-100 text-blue-700 border border-blue-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            <Store className="w-3.5 h-3.5" />
            In-Store
          </button>
          
          {/* Coupang Toggle */}
          <button
            onClick={() => setShowCoupang(!showCoupang)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showCoupang
                ? 'bg-orange-100 text-orange-700 border border-orange-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            Coupang
          </button>
          
          {/* Baemin Toggle */}
          <button
            onClick={() => setShowBaemin(!showBaemin)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showBaemin
                ? 'bg-cyan-100 text-cyan-700 border border-cyan-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            Baemin
          </button>
          
          {/* Panda Toggle */}
          <button
            onClick={() => setShowPanda(!showPanda)}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-md text-xs font-medium transition-all ${
              showPanda
                ? 'bg-pink-100 text-pink-700 border border-pink-300'
                : 'bg-gray-100 text-gray-400 border border-gray-200'
            }`}
          >
            Panda
          </button>
        </div>
      </CardHeader>
      <CardContent>
        <ResponsiveContainer width="100%" height={350}>
          <LineChart data={chartData} margin={{ bottom: 10 }}>
            <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
            <XAxis
              dataKey="date"
              tick={<CustomXAxisTick chartData={chartData} />}
              height={45}
            />
            <YAxis
              className="text-xs"
              tick={{ fill: 'hsl(var(--muted-foreground))' }}
              tickFormatter={(value) => `₩${(value / 1000).toFixed(0)}K`}
            />
            <Tooltip content={<CustomTooltip />} />
            
            {/* Total Revenue Line */}
            {showTotal && (
              <Line
                type="monotone"
                dataKey="totalRevenue"
                stroke="#1f2937"
                strokeWidth={3}
                dot={{ fill: '#1f2937', r: 4 }}
                activeDot={{ r: 6 }}
                name="Total"
              />
            )}
            
            {/* In-Store Revenue Line */}
            {showInstore && (
              <Line
                type="monotone"
                dataKey="instoreRevenue"
                stroke="#3b82f6"
                strokeWidth={2}
                dot={{ fill: '#3b82f6', r: 3 }}
                activeDot={{ r: 5 }}
                name="In-Store"
              />
            )}
            
            {/* Coupang Revenue Line */}
            {showCoupang && (
              <Line
                type="monotone"
                dataKey="coupangRevenue"
                stroke="#f97316"
                strokeWidth={2}
                dot={{ fill: '#f97316', r: 3 }}
                activeDot={{ r: 5 }}
                name="Coupang"
              />
            )}
            
            {/* Baemin Revenue Line */}
            {showBaemin && (
              <Line
                type="monotone"
                dataKey="baeminRevenue"
                stroke="#06b6d4"
                strokeWidth={2}
                dot={{ fill: '#06b6d4', r: 3 }}
                activeDot={{ r: 5 }}
                name="Baemin"
              />
            )}
            
            {/* Panda Revenue Line */}
            {showPanda && (
              <Line
                type="monotone"
                dataKey="pandaRevenue"
                stroke="#ec4899"
                strokeWidth={2}
                dot={{ fill: '#ec4899', r: 3 }}
                activeDot={{ r: 5 }}
                name="Panda"
              />
            )}
          </LineChart>
        </ResponsiveContainer>
      </CardContent>
    </Card>
  )
}

