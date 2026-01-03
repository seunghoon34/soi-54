'use client'

import { useState, useEffect } from 'react'
import { DateRangeFilter } from '@/components/date-range-filter'
import { MetricCard } from '@/components/metric-card'
import { EwhaRevenueChart } from '@/components/ewha-revenue-chart'
import { EwhaDeliveryChart } from '@/components/ewha-delivery-chart'
import { EwhaSalesInput } from '@/components/ewha-sales-input'
import { Button } from '@/components/ui/button'
import { DateRange, CustomDateRange, getDateRange } from '@/lib/date-utils'
import {
  fetchEwhaDashboardMetrics,
  fetchEwhaRevenueData,
  EwhaDashboardMetrics,
  EwhaRevenueDataPoint,
} from '@/lib/ewha-dashboard-data'
import { DollarSign, Store, Truck, Package, TrendingUp, Plus } from 'lucide-react'
import { subDays } from 'date-fns'
import { LocationSelector } from '@/components/location-selector'

export default function EwhaDashboardPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d')
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isInputOpen, setIsInputOpen] = useState(false)
  const [metrics, setMetrics] = useState<EwhaDashboardMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<EwhaRevenueDataPoint[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [selectedRange, customRange])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getDateRange(selectedRange, customRange)
      
      // Calculate previous period dates
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousEndDate = subDays(startDate, 1)
      const previousStartDate = subDays(previousEndDate, daysDiff - 1)

      // Fetch all data in parallel
      const [metricsData, revenue] = await Promise.all([
        fetchEwhaDashboardMetrics(startDate, endDate, previousStartDate, previousEndDate),
        fetchEwhaRevenueData(startDate, endDate),
      ])

      setMetrics(metricsData)
      setRevenueData(revenue)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  // Calculate change percentages
  const totalRevenueChange = metrics
    ? metrics.previousTotalRevenue > 0
      ? ((metrics.totalRevenue - metrics.previousTotalRevenue) / metrics.previousTotalRevenue) * 100
      : 0
    : 0

  const instoreRevenueChange = metrics
    ? metrics.previousInstoreRevenue > 0
      ? ((metrics.instoreRevenue - metrics.previousInstoreRevenue) / metrics.previousInstoreRevenue) * 100
      : 0
    : 0

  const deliveryRevenueChange = metrics
    ? metrics.previousTotalDeliveryRevenue > 0
      ? ((metrics.totalDeliveryRevenue - metrics.previousTotalDeliveryRevenue) / metrics.previousTotalDeliveryRevenue) * 100
      : 0
    : 0

  const orderCountChange = metrics
    ? metrics.previousInstoreOrderCount > 0
      ? ((metrics.instoreOrderCount - metrics.previousInstoreOrderCount) / metrics.previousInstoreOrderCount) * 100
      : 0
    : 0

  const avgDailyRevenue = metrics?.avgDailyRevenue || 0
  const previousAvgDailyRevenue = metrics && metrics.previousDaysWithData > 0
    ? metrics.previousTotalRevenue / metrics.previousDaysWithData
    : 0
  const avgDailyChange = previousAvgDailyRevenue > 0
    ? ((avgDailyRevenue - previousAvgDailyRevenue) / previousAvgDailyRevenue) * 100
    : 0

  // Calculate ratios
  const instorePercent = metrics && metrics.totalRevenue > 0
    ? Math.round((metrics.instoreRevenue / metrics.totalRevenue) * 100)
    : 0
  const deliveryPercent = metrics && metrics.totalRevenue > 0
    ? Math.round((metrics.totalDeliveryRevenue / metrics.totalRevenue) * 100)
    : 0

  // Average delivery revenue
  const avgDeliveryRevenue = metrics && metrics.daysWithData > 0
    ? metrics.totalDeliveryRevenue / metrics.daysWithData
    : 0
  const previousAvgDeliveryRevenue = metrics && metrics.previousDaysWithData > 0
    ? metrics.previousTotalDeliveryRevenue / metrics.previousDaysWithData
    : 0
  const avgDeliveryChange = previousAvgDeliveryRevenue > 0
    ? ((avgDeliveryRevenue - previousAvgDeliveryRevenue) / previousAvgDeliveryRevenue) * 100
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="mb-1">
              <LocationSelector />
            </div>
            <p className="text-muted-foreground">이화여대점 sales and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter 
              selected={selectedRange} 
              customRange={customRange}
              onSelect={(range, custom) => {
                setSelectedRange(range)
                setCustomRange(custom)
              }} 
            />
            <Button
              onClick={() => setIsInputOpen(true)}
              className="bg-gradient-to-r from-pink-500 to-rose-500 hover:from-pink-600 hover:to-rose-600"
            >
              <Plus className="w-4 h-4 mr-2" />
              Add Sales
            </Button>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-800 px-4 py-3 rounded-lg">
            <p className="font-medium">Error loading dashboard</p>
            <p className="text-sm mt-1">{error}</p>
            <button
              onClick={loadDashboardData}
              className="mt-2 text-sm underline hover:no-underline"
            >
              Try again
            </button>
          </div>
        )}

        {loading ? (
          <div className="flex items-center justify-center h-96">
            <div className="text-center">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-pink-500 mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : !error && (
          <>
            {/* Primary Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={metrics?.totalRevenue || 0}
                format="currency"
                change={metrics?.previousTotalRevenue ? totalRevenueChange : undefined}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="In-Store Revenue"
                value={metrics?.instoreRevenue || 0}
                format="currency"
                change={metrics?.previousInstoreRevenue ? instoreRevenueChange : undefined}
                icon={<Store className="h-4 w-4 text-blue-500" />}
              />
              <MetricCard
                title="Delivery Revenue"
                value={metrics?.totalDeliveryRevenue || 0}
                format="currency"
                change={metrics?.previousTotalDeliveryRevenue ? deliveryRevenueChange : undefined}
                icon={<Truck className="h-4 w-4 text-emerald-500" />}
              />
              <MetricCard
                title="Order Count"
                value={metrics?.instoreOrderCount || 0}
                format="number"
                change={metrics?.previousInstoreOrderCount ? orderCountChange : undefined}
                icon={<Package className="h-4 w-4" />}
              />
            </div>

            {/* Secondary Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Avg Daily Revenue"
                value={Math.round(avgDailyRevenue)}
                format="currency"
                change={metrics?.previousDaysWithData ? avgDailyChange : undefined}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <MetricCard
                title="Coupang"
                value={metrics?.coupangRevenue || 0}
                format="currency"
                icon={<Truck className="h-4 w-4 text-orange-500" />}
              />
              <MetricCard
                title="Baemin"
                value={metrics?.baeminRevenue || 0}
                format="currency"
                icon={<Truck className="h-4 w-4 text-cyan-500" />}
              />
              <MetricCard
                title="Panda"
                value={metrics?.pandaRevenue || 0}
                format="currency"
                icon={<Truck className="h-4 w-4 text-pink-500" />}
              />
            </div>

            {/* Ratio Cards */}
            <div className="grid gap-4 md:grid-cols-2">
              <MetricCard
                title="In-Store : Delivery"
                value={metrics?.totalRevenue ? `${instorePercent}% : ${deliveryPercent}%` : 'N/A'}
                format="text"
                icon={<Store className="h-4 w-4 text-blue-500" />}
              />
              <MetricCard
                title="Avg Delivery Revenue"
                value={Math.round(avgDeliveryRevenue)}
                format="currency"
                change={metrics?.previousDaysWithData ? avgDeliveryChange : undefined}
                icon={<Truck className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            {/* Revenue Chart */}
            <EwhaRevenueChart data={revenueData} />

            {/* Delivery Breakdown */}
            <div className="grid gap-4 md:grid-cols-2">
              <EwhaDeliveryChart
                coupangRevenue={metrics?.coupangRevenue || 0}
                baeminRevenue={metrics?.baeminRevenue || 0}
                pandaRevenue={metrics?.pandaRevenue || 0}
              />
            </div>
          </>
        )}
      </div>

      {/* Sales Input Modal */}
      <EwhaSalesInput
        isOpen={isInputOpen}
        onClose={() => setIsInputOpen(false)}
        onSuccess={() => {
          loadDashboardData()
        }}
      />
    </div>
  )
}

