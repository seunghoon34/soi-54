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

  // Fetch current period orders (excluding Sundays)
  const { data: allOrders, error: ordersError } = await supabase
    .from('orders')
    .select('id, total_amount, order_date')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)

  if (ordersError) throw ordersError

  // Filter out Sundays
  const orders = allOrders?.filter((order: any) => {
    const orderDate = parseISO(order.order_date)
    return getDay(orderDate) !== 0 // Exclude Sunday (0)
  }) || []

  // Fetch previous period orders (excluding Sundays)
  const { data: allPrevOrders, error: prevOrdersError } = await supabase
    .from('orders')
    .select('id, total_amount, order_date')
    .gte('order_date', prevStartDateStr)
    .lte('order_date', prevEndDateStr)

  if (prevOrdersError) throw prevOrdersError

  // Filter out Sundays
  const prevOrders = allPrevOrders?.filter((order: any) => {
    const orderDate = parseISO(order.order_date)
    return getDay(orderDate) !== 0 // Exclude Sunday (0)
  }) || []

  const orderIds = orders?.map((o: any) => o.id) || []
  const prevOrderIds = prevOrders?.map((o: any) => o.id) || []

  // Fetch items for current period
  let currentItems: any[] = []
  if (orderIds.length > 0) {
    const { data, error: itemsError } = await supabase
      .from('order_items')
      .select('item_name, quantity')
      .in('order_id', orderIds)

    if (itemsError) throw itemsError
    currentItems = data || []
  }

  // Fetch items for previous period
  let previousItems: any[] = []
  if (prevOrderIds.length > 0) {
    const { data, error: prevItemsError } = await supabase
      .from('order_items')
      .select('quantity')
      .in('order_id', prevOrderIds)

    if (prevItemsError) throw prevItemsError
    previousItems = data || []
  }

  // Calculate metrics
  const totalRevenue = orders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const totalOrders = orders?.length || 0
  const totalItems = currentItems.reduce((sum, item) => sum + item.quantity, 0)
  const averageSaleValue = totalOrders > 0 ? totalRevenue / totalOrders : 0
  const averageValuePerItem = totalItems > 0 ? totalRevenue / totalItems : 0
  
  // Calculate unique days with orders (not total calendar days)
  const uniqueOrderDates = new Set(
    orders?.map((order: any) => order.order_date) || []
  )
  
  // Use actual number of days with orders (excludes closed days like Sundays)
  const daysWithOrders = uniqueOrderDates.size > 0 ? uniqueOrderDates.size : 1
  const averageItemsPerDay = totalItems / daysWithOrders

  const previousRevenue = prevOrders?.reduce((sum, order) => sum + order.total_amount, 0) || 0
  const previousOrders = prevOrders?.length || 0
  const previousItemsTotal = previousItems.reduce((sum, item) => sum + item.quantity, 0)

  // Calculate top item
  const itemQuantities = new Map<string, number>()
  currentItems.forEach((item: any) => {
    const current = itemQuantities.get(item.item_name) || 0
    itemQuantities.set(item.item_name, current + item.quantity)
  })

  let topItem = null
  if (itemQuantities.size > 0) {
    const [name, quantity] = Array.from(itemQuantities.entries()).sort((a, b) => b[1] - a[1])[0]
    topItem = { name, quantity }
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

  const { data, error } = await supabase
    .from('orders')
    .select('order_date, total_amount')
    .gte('order_date', startDateStr)
    .lte('order_date', endDateStr)
    .order('order_date', { ascending: true })

  if (error) throw error

  // Group by date and filter out Sundays
  const revenueMap = new Map<string, { revenue: number; orders: number }>()
  data?.forEach((order: any) => {
    const orderDate = parseISO(order.order_date)
    // Skip Sundays (day 0)
    if (getDay(orderDate) === 0) return
    
    const existing = revenueMap.get(order.order_date) || { revenue: 0, orders: 0 }
    revenueMap.set(order.order_date, {
      revenue: existing.revenue + order.total_amount,
      orders: existing.orders + 1,
    })
  })

  return Array.from(revenueMap.entries()).map(([date, { revenue, orders }]) => ({
    date,
    revenue,
    orders,
  }))
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
    .limit(limit)

  if (error) throw error

  return (
    data?.map((order: any) => ({
      id: order.id,
      orderDate: order.order_date,
      totalAmount: order.total_amount,
      itemCount: order.item_count,
      receiptFilename: order.receipt_filename,
    })) || []
  )
}

