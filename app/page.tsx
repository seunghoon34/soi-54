'use client'

import { useState, useEffect } from 'react'
import { DateRangeFilter } from '@/components/date-range-filter'
import { MetricCard } from '@/components/metric-card'
import { RevenueChart } from '@/components/revenue-chart'
import { TopItemsChart } from '@/components/top-items-chart'
import { CategoryChart } from '@/components/category-chart'
import { RecentOrdersTable } from '@/components/recent-orders-table'
import { AIChat } from '@/components/ai-chat'
import { ReceiptUpload } from '@/components/receipt-upload'
import { TransactionHistoryUpload } from '@/components/transaction-history-upload'
import { Button } from '@/components/ui/button'
import { DateRange, getDateRange } from '@/lib/date-utils'
import {
  fetchDashboardMetrics,
  fetchRevenueData,
  fetchTopItems,
  fetchCategoryData,
  fetchRecentOrders,
  DashboardMetrics,
  RevenueDataPoint,
  TopItem,
  CategoryData,
  RecentOrder,
} from '@/lib/dashboard-data'
import { TrendingUp, DollarSign, Package, Sparkles, Upload, Receipt, Sun, Moon } from 'lucide-react'
import { subDays } from 'date-fns'

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])

  useEffect(() => {
    loadDashboardData()
  }, [selectedRange])

  async function loadDashboardData() {
    setLoading(true)
    setError(null)
    try {
      const { startDate, endDate } = getDateRange(selectedRange)
      
      // Calculate previous period dates
      const daysDiff = Math.ceil((endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24))
      const previousEndDate = subDays(startDate, 1)
      const previousStartDate = subDays(previousEndDate, daysDiff - 1)

      console.log('Fetching data from', startDate, 'to', endDate)

      // Fetch all data in parallel
      const [metricsData, revenue, items, categories, orders] = await Promise.all([
        fetchDashboardMetrics(startDate, endDate, previousStartDate, previousEndDate),
        fetchRevenueData(startDate, endDate),
        fetchTopItems(startDate, endDate),
        fetchCategoryData(startDate, endDate),
        fetchRecentOrders(10),
      ])

      console.log('Data fetched successfully:', { metricsData, revenue, items, categories, orders })

      setMetrics(metricsData)
      setRevenueData(revenue)
      setTopItems(items)
      setCategoryData(categories)
      setRecentOrders(orders)
    } catch (error) {
      console.error('Error loading dashboard data:', error)
      setError(error instanceof Error ? error.message : 'Failed to load dashboard data')
    } finally {
      setLoading(false)
    }
  }

  const revenueChange = metrics
    ? metrics.previousRevenue > 0
      ? ((metrics.totalRevenue - metrics.previousRevenue) / metrics.previousRevenue) * 100
      : 0
    : 0

  const itemsChange = metrics
    ? metrics.previousItems > 0
      ? ((metrics.totalItems - metrics.previousItems) / metrics.previousItems) * 100
      : 0
    : 0

  const lunchRevenueChange = metrics
    ? metrics.previousAverageLunchRevenue > 0
      ? ((metrics.averageLunchRevenue - metrics.previousAverageLunchRevenue) / metrics.previousAverageLunchRevenue) * 100
      : 0
    : 0

  const dinnerRevenueChange = metrics
    ? metrics.previousAverageDinnerRevenue > 0
      ? ((metrics.averageDinnerRevenue - metrics.previousAverageDinnerRevenue) / metrics.previousAverageDinnerRevenue) * 100
      : 0
    : 0

  const avgSaleValueChange = metrics
    ? metrics.previousAverageSaleValue > 0
      ? ((metrics.averageSaleValue - metrics.previousAverageSaleValue) / metrics.previousAverageSaleValue) * 100
      : 0
    : 0

  const avgValuePerItemChange = metrics
    ? metrics.previousAverageValuePerItem > 0
      ? ((metrics.averageValuePerItem - metrics.previousAverageValuePerItem) / metrics.previousAverageValuePerItem) * 100
      : 0
    : 0

  const avgItemsPerDayChange = metrics
    ? metrics.previousAverageItemsPerDay > 0
      ? ((metrics.averageItemsPerDay - metrics.previousAverageItemsPerDay) / metrics.previousAverageItemsPerDay) * 100
      : 0
    : 0

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Soi 54 Dashboard</h1>
            <p className="text-muted-foreground">Restaurant sales and analytics</p>
          </div>
          <div className="flex items-center gap-3">
            <DateRangeFilter selected={selectedRange} onSelect={setSelectedRange} />
            <Button
              onClick={() => setIsUploadOpen(true)}
              variant="outline"
            >
              <Upload className="w-4 h-4 mr-2" />
              POS Receipt
            </Button>
            <Button
              onClick={() => setIsTransactionHistoryOpen(true)}
              variant="outline"
              className="border-blue-300 text-blue-700 hover:bg-blue-50"
            >
              <Receipt className="w-4 h-4 mr-2" />
              Transaction History
            </Button>
            <Button
              onClick={() => setIsChatOpen(!isChatOpen)}
              className="bg-gradient-to-r from-purple-500 to-blue-500 hover:from-purple-600 hover:to-blue-600"
            >
              <Sparkles className="w-4 h-4 mr-2" />
              AI Assistant
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
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="mt-4 text-muted-foreground">Loading dashboard...</p>
            </div>
          </div>
        ) : !error && (
          <>
            {/* Metrics Cards */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <MetricCard
                title="Total Revenue"
                value={metrics?.totalRevenue || 0}
                format="currency"
                change={revenueChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Total Items Sold"
                value={metrics?.totalItems || 0}
                format="number"
                change={itemsChange}
                icon={<Package className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Lunch Revenue"
                value={Math.round(metrics?.averageLunchRevenue || 0)}
                format="currency"
                change={metrics?.previousLunchDays ? lunchRevenueChange : undefined}
                icon={<Sun className="h-4 w-4 text-orange-500" />}
              />
              <MetricCard
                title="Avg Dinner Revenue"
                value={Math.round(metrics?.averageDinnerRevenue || 0)}
                format="currency"
                change={metrics?.previousDinnerDays ? dinnerRevenueChange : undefined}
                icon={<Moon className="h-4 w-4 text-purple-500" />}
              />
              <MetricCard
                title="Average Sale Value"
                value={Math.round(metrics?.averageSaleValue || 0)}
                format="currency"
                change={avgSaleValueChange}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Value per Item"
                value={Math.round(metrics?.averageValuePerItem || 0)}
                format="currency"
                change={avgValuePerItemChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Items per Day"
                value={Math.round(metrics?.averageItemsPerDay || 0)}
                format="number"
                change={avgItemsPerDayChange}
                icon={<Package className="h-4 w-4" />}
              />
              <MetricCard
                title="Top Item"
                value={metrics?.topItem?.name || 'N/A'}
                format="text"
                icon={<Package className="h-4 w-4" />}
              />
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={revenueData} />

            {/* Charts Grid */}
            <div className="grid gap-4 md:grid-cols-2">
              <TopItemsChart data={topItems} />
              <CategoryChart data={categoryData} />
            </div>

            {/* Recent Orders Table */}
            <RecentOrdersTable data={recentOrders} />
          </>
        )}
      </div>

      {/* AI Chat Sidebar */}
      <AIChat isOpen={isChatOpen} onClose={() => setIsChatOpen(false)} />

      {/* Receipt Upload Modal */}
      <ReceiptUpload
        isOpen={isUploadOpen}
        onClose={() => setIsUploadOpen(false)}
        onSuccess={() => {
          loadDashboardData()
        }}
      />

      {/* Transaction History Upload Modal */}
      <TransactionHistoryUpload
        isOpen={isTransactionHistoryOpen}
        onClose={() => setIsTransactionHistoryOpen(false)}
        onSuccess={() => {
          loadDashboardData()
        }}
      />
    </div>
  )
}
