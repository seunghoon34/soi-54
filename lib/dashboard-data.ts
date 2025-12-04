import { supabase } from './supabase'
import { format, getDay, parseISO } from 'date-fns'

export interface DashboardMetrics {
  totalRevenue: number
  totalOrders: number
  totalItems: number
  averageSaleValue: number
  averageValuePerItem: number
  averageItemsPerDay: number
  topItem: {
    name: string
    quantity: number
  } | null
  previousRevenue: number
  previousOrders: number
  previousItems: number
}

export interface RevenueDataPoint {
  date: string
  revenue: number
  orders: number
  itemsSold: number
  avgValuePerItem: number
  topItems: Array<{ name: string; count: number }>
}

export interface TopItem {
  name: string
  quantity: number
  revenue: number
}

export interface CategoryData {
  category: string
  revenue: number
  count: number
}

export interface RecentOrder {
  id: string
  orderDate: string
  totalAmount: number
  itemCount: number
  receiptFilename: string
}

export async function fetchDashboardMetrics(
  startDate: Date,
  endDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
): Promise<DashboardMetrics> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')
  const prevStartDateStr = format(previousStartDate, 'yyyy-MM-dd')
  const prevEndDateStr = format(previousEndDate, 'yyyy-MM-dd')

  // Fetch current period from daily_revenue view (already aggregated correctly)
  const { data: dailyData, error: dailyError } = await supabase
    .from('daily_revenue')
    .select('*')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)

  if (dailyError) throw dailyError

  // Filter out Sundays
  const currentDays = dailyData?.filter((day: any) => {
    const orderDate = parseISO(day.order_date)
    return getDay(orderDate) !== 0
  }) || []

  // Fetch previous period from daily_revenue view
  const { data: prevDailyData, error: prevDailyError } = await supabase
    .from('daily_revenue')
    .select('*')
    .gte('order_date', prevStartDateStr)
    .lte('order_date', prevEndDateStr)

  if (prevDailyError) throw prevDailyError

  // Filter out Sundays
  const prevDays = prevDailyData?.filter((day: any) => {
    const orderDate = parseISO(day.order_date)
    return getDay(orderDate) !== 0
  }) || []

  // Calculate metrics from daily_revenue
  const totalRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.total_revenue || 0), 0)
  const totalOrders = currentDays.reduce((sum: number, day: any) => sum + (day.order_count || 0), 0)
  const totalItems = currentDays.reduce((sum: number, day: any) => sum + (day.total_items || 0), 0)
  const averageSaleValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const averageValuePerItem = totalItems > 0 ? totalRevenue / totalItems : 0
  
  const daysWithOrders = currentDays.length > 0 ? currentDays.length : 1
  const averageItemsPerDay = totalItems / daysWithOrders

  const previousRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.total_revenue || 0), 0)
  const previousOrders = prevDays.reduce((sum: number, day: any) => sum + (day.order_count || 0), 0)
  const previousItemsTotal = prevDays.reduce((sum: number, day: any) => sum + (day.total_items || 0), 0)

  // Fetch top item from order_items (still need this for item names)
  const orderIds: string[] = []
  for (const day of currentDays) {
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('order_date', day.order_date)
    orders?.forEach((o: any) => orderIds.push(o.id))
  }

  let topItem = null
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('item_name, quantity')
      .in('order_id', orderIds)

    const itemQuantities = new Map<string, number>()
    items?.forEach((item: any) => {
      const current = itemQuantities.get(item.item_name) || 0
      itemQuantities.set(item.item_name, current + item.quantity)
    })

    if (itemQuantities.size > 0) {
      const [name, quantity] = Array.from(itemQuantities.entries()).sort((a, b) => b[1] - a[1])[0]
      topItem = { name, quantity }
    }
  }

  return {
    totalRevenue,
    totalOrders,
    totalItems,
    averageSaleValue,
    averageValuePerItem,
    averageItemsPerDay,
    topItem,
    previousRevenue,
    previousOrders,
    previousItems: previousItemsTotal,
  }
}

export async function fetchRevenueData(
  startDate: Date,
  endDate: Date
): Promise<RevenueDataPoint[]> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  // Fetch from daily_revenue view (has correct total_items)
  const { data: dailyData, error: dailyError } = await supabase
    .from('daily_revenue')
    .select('*')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)
    .order('order_date', { ascending: true })

  if (dailyError) throw dailyError

  // Filter out Sundays
  const days = dailyData?.filter((day: any) => {
    const orderDate = parseISO(day.order_date)
    return getDay(orderDate) !== 0
  }) || []

  // For each day, get top items from order_items
  const results: RevenueDataPoint[] = []

  for (const day of days) {
    // Get order IDs for this date
    const { data: orders } = await supabase
      .from('orders')
      .select('id')
      .eq('order_date', day.order_date)

    const orderIds = orders?.map((o: any) => o.id) || []

    // Get top items for this date
    let topItems: Array<{ name: string; count: number }> = []
    if (orderIds.length > 0) {
      const { data: items } = await supabase
        .from('order_items')
        .select('item_name, quantity')
        .in('order_id', orderIds)

      const itemMap = new Map<string, number>()
      items?.forEach((item: any) => {
        const current = itemMap.get(item.item_name) || 0
        itemMap.set(item.item_name, current + item.quantity)
      })

      topItems = Array.from(itemMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([name, count]) => ({ name, count }))
    }

    const itemsSold = day.total_items || 0
    const revenue = day.total_revenue || 0

    results.push({
      date: day.order_date,
      revenue,
      orders: day.order_count || 0,
      itemsSold,
      avgValuePerItem: itemsSold > 0 ? Math.round(revenue / itemsSold) : 0,
      topItems,
    })
  }

  return results
}

export async function fetchTopItems(startDate: Date, endDate: Date): Promise<TopItem[]> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  // First get order IDs in date range (excluding Sundays)
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_date')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)

  if (ordersError) throw ordersError

  // Filter out Sundays
  const orders = allOrders?.filter((order: any) => {
    const orderDate = parseISO(order.order_date)
    return getDay(orderDate) !== 0
  }) || []

  const orderIds = orders?.map((o) => o.id) || []
  if (orderIds.length === 0) return []

  // Then get items for those orders
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('item_name, quantity, total_price')
    .in('order_id', orderIds)

  if (itemsError) throw itemsError

  // Aggregate by item
  const itemMap = new Map<string, { quantity: number; revenue: number }>()
  items?.forEach((item: any) => {
    const existing = itemMap.get(item.item_name) || { quantity: 0, revenue: 0 }
    itemMap.set(item.item_name, {
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total_price,
    })
  })

  return Array.from(itemMap.entries())
    .map(([name, { quantity, revenue }]) => ({ name, quantity, revenue }))
    .sort((a, b) => b.quantity - a.quantity)
    .slice(0, 10)
}

export async function fetchCategoryData(startDate: Date, endDate: Date): Promise<CategoryData[]> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  // First get order IDs in date range (excluding Sundays)
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, order_date')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)

  if (ordersError) throw ordersError

  // Filter out Sundays
  const orders = allOrders?.filter((order: any) => {
    const orderDate = parseISO(order.order_date)
    return getDay(orderDate) !== 0
  }) || []

  const orderIds = orders?.map((o) => o.id) || []
  if (orderIds.length === 0) return []

  // Then get items for those orders
  const { data: items, error: itemsError } = await supabase
    .from('order_items')
    .select('category, total_price')
    .in('order_id', orderIds)
    .not('category', 'is', null)

  if (itemsError) throw itemsError

  // Aggregate by category
  const categoryMap = new Map<string, { revenue: number; count: number }>()
  items?.forEach((item: any) => {
    const existing = categoryMap.get(item.category) || { revenue: 0, count: 0 }
    categoryMap.set(item.category, {
      revenue: existing.revenue + item.total_price,
      count: existing.count + 1,
    })
  })

  return Array.from(categoryMap.entries()).map(([category, { revenue, count }]) => ({
    category,
    revenue,
    count,
  }))
}

export async function fetchRecentOrders(limit: number = 10): Promise<RecentOrder[]> {
  const { data, error } = await supabase
    .from('orders')
    .select('id, order_date, total_amount, item_count, receipt_filename')
    .order('order_date', { ascending: false })
    .limit(limit * 2) // Fetch more to account for Sunday filtering

  if (error) throw error

  // Filter out Sundays
  const filteredOrders = data?.filter((order: any) => {
    const orderDate = parseISO(order.order_date)
    return getDay(orderDate) !== 0
  }).slice(0, limit) || []

  return filteredOrders.map((order: any) => ({
    id: order.id,
    orderDate: order.order_date,
    totalAmount: order.total_amount,
    itemCount: order.item_count || 0,
    receiptFilename: order.receipt_filename,
  }))
}

