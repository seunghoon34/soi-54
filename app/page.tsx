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
import { DeliverySalesInput } from '@/components/delivery-sales-input'
import { Button } from '@/components/ui/button'
import { DateRange, CustomDateRange, getDateRange } from '@/lib/date-utils'
import {
  fetchDashboardMetrics,
  fetchRevenueData,
  fetchTopItems,
  fetchCategoryData,
  fetchRecentOrders,
  fetchDeliverySales,
  DashboardMetrics,
  RevenueDataPoint,
  TopItem,
  CategoryData,
  RecentOrder,
  DeliverySalesData,
} from '@/lib/dashboard-data'
import { TrendingUp, DollarSign, Package, Sparkles, Upload, Receipt, Sun, Moon, Truck } from 'lucide-react'
import { subDays } from 'date-fns'

export default function DashboardPage() {
  const [selectedRange, setSelectedRange] = useState<DateRange>('7d')
  const [customRange, setCustomRange] = useState<CustomDateRange | undefined>(undefined)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [isChatOpen, setIsChatOpen] = useState(false)
  const [isUploadOpen, setIsUploadOpen] = useState(false)
  const [isTransactionHistoryOpen, setIsTransactionHistoryOpen] = useState(false)
  const [isDeliverySalesOpen, setIsDeliverySalesOpen] = useState(false)
  const [metrics, setMetrics] = useState<DashboardMetrics | null>(null)
  const [revenueData, setRevenueData] = useState<RevenueDataPoint[]>([])
  const [topItems, setTopItems] = useState<TopItem[]>([])
  const [categoryData, setCategoryData] = useState<CategoryData[]>([])
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [deliverySalesData, setDeliverySalesData] = useState<DeliverySalesData | null>(null)

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

      console.log('Fetching data from', startDate, 'to', endDate)

      // Fetch all data in parallel
      const [metricsData, revenue, items, categories, orders, deliverySales] = await Promise.all([
        fetchDashboardMetrics(startDate, endDate, previousStartDate, previousEndDate),
        fetchRevenueData(startDate, endDate),
        fetchTopItems(startDate, endDate),
        fetchCategoryData(startDate, endDate),
        fetchRecentOrders(10),
        fetchDeliverySales(startDate, endDate, previousStartDate, previousEndDate),
      ])

      console.log('Data fetched successfully:', { metricsData, revenue, items, categories, orders, deliverySales })

      setMetrics(metricsData)
      setRevenueData(revenue)
      setTopItems(items)
      setCategoryData(categories)
      setRecentOrders(orders)
      setDeliverySalesData(deliverySales)
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

  const deliverySalesChange = deliverySalesData
    ? deliverySalesData.previousDeliverySales > 0
      ? ((deliverySalesData.totalDeliverySales - deliverySalesData.previousDeliverySales) / deliverySalesData.previousDeliverySales) * 100
      : 0
    : 0

  const avgDeliverySalesChange = deliverySalesData
    ? deliverySalesData.previousAverageDeliverySales > 0
      ? ((deliverySalesData.averageDeliverySales - deliverySalesData.previousAverageDeliverySales) / deliverySalesData.previousAverageDeliverySales) * 100
      : 0
    : 0

  // Total revenue including delivery sales
  const totalCombinedRevenue = (metrics?.totalRevenue || 0) + (deliverySalesData?.totalDeliverySales || 0)
  const previousCombinedRevenue = (metrics?.previousRevenue || 0) + (deliverySalesData?.previousDeliverySales || 0)
  const combinedRevenueChange = previousCombinedRevenue > 0
    ? ((totalCombinedRevenue - previousCombinedRevenue) / previousCombinedRevenue) * 100
    : 0

  // Lunch to Dinner ratio (based on average daily revenue)
  const totalLunchRevenue = (metrics?.averageLunchRevenue || 0) * (metrics?.lunchDays || 0)
  const totalDinnerRevenue = (metrics?.averageDinnerRevenue || 0) * (metrics?.dinnerDays || 0)
  const lunchDinnerTotal = totalLunchRevenue + totalDinnerRevenue
  const lunchPercent = lunchDinnerTotal > 0 ? Math.round((totalLunchRevenue / lunchDinnerTotal) * 100) : 0
  const dinnerPercent = lunchDinnerTotal > 0 ? Math.round((totalDinnerRevenue / lunchDinnerTotal) * 100) : 0

  // In-store vs Delivery ratio
  const inStoreRevenue = metrics?.totalRevenue || 0
  const deliveryRevenue = deliverySalesData?.totalDeliverySales || 0
  const totalSalesForRatio = inStoreRevenue + deliveryRevenue
  const inStorePercent = totalSalesForRatio > 0 ? Math.round((inStoreRevenue / totalSalesForRatio) * 100) : 0
  const deliveryPercent = totalSalesForRatio > 0 ? Math.round((deliveryRevenue / totalSalesForRatio) * 100) : 0

  // Average Daily Revenue (POS + Delivery combined)
  const numberOfDays = metrics?.totalOrders || 1 // totalOrders = number of days with POS data
  const avgDailyRevenue = totalCombinedRevenue / numberOfDays
  const previousNumberOfDays = metrics?.previousOrders || 1
  const previousAvgDailyRevenue = previousCombinedRevenue / previousNumberOfDays
  const avgDailyRevenueChange = previousAvgDailyRevenue > 0
    ? ((avgDailyRevenue - previousAvgDailyRevenue) / previousAvgDailyRevenue) * 100
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
            <DateRangeFilter 
              selected={selectedRange} 
              customRange={customRange}
              onSelect={(range, custom) => {
                setSelectedRange(range)
                setCustomRange(custom)
              }} 
            />
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
              onClick={() => setIsDeliverySalesOpen(true)}
              variant="outline"
              className="border-emerald-300 text-emerald-700 hover:bg-emerald-50"
            >
              <Truck className="w-4 h-4 mr-2" />
              Delivery Sales
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
                title="Total Revenue (All)"
                value={totalCombinedRevenue}
                format="currency"
                change={combinedRevenueChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="In Store Revenue"
                value={metrics?.totalRevenue || 0}
                format="currency"
                change={revenueChange}
                icon={<DollarSign className="h-4 w-4" />}
              />
              <MetricCard
                title="Delivery Sales"
                value={deliverySalesData?.totalDeliverySales || 0}
                format="currency"
                change={deliverySalesData?.previousDeliverySales ? deliverySalesChange : undefined}
                icon={<Truck className="h-4 w-4 text-emerald-500" />}
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
                title="Avg Daily Revenue"
                value={Math.round(avgDailyRevenue)}
                format="currency"
                change={metrics?.previousOrders ? avgDailyRevenueChange : undefined}
                icon={<TrendingUp className="h-4 w-4" />}
              />
              <MetricCard
                title="Avg Delivery Revenue"
                value={Math.round(deliverySalesData?.averageDeliverySales || 0)}
                format="currency"
                change={deliverySalesData?.previousDeliveryDays ? avgDeliverySalesChange : undefined}
                icon={<Truck className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            {/* Secondary Metrics Row */}
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
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
                title="Lunch : Dinner"
                value={lunchDinnerTotal > 0 ? `${lunchPercent}% : ${dinnerPercent}%` : 'N/A'}
                format="text"
                icon={<Sun className="h-4 w-4 text-orange-500" />}
              />
              <MetricCard
                title="In-store : Delivery"
                value={totalSalesForRatio > 0 ? `${inStorePercent}% : ${deliveryPercent}%` : 'N/A'}
                format="text"
                icon={<Truck className="h-4 w-4 text-emerald-500" />}
              />
            </div>

            {/* Revenue Chart */}
            <RevenueChart data={revenueData} deliverySalesMap={deliverySalesData?.dailyDeliverySales} />

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

      {/* Delivery Sales Input Modal */}
      <DeliverySalesInput
        isOpen={isDeliverySalesOpen}
        onClose={() => setIsDeliverySalesOpen(false)}
        onSuccess={() => {
          loadDashboardData()
        }}
      />
    </div>
  )
}
