import { supabase } from './supabase'
import { format, getDay, parseISO } from 'date-fns'

export interface EwhaDashboardMetrics {
  totalRevenue: number
  instoreRevenue: number
  totalDeliveryRevenue: number
  instoreOrderCount: number
  coupangRevenue: number
  baeminRevenue: number
  pandaRevenue: number
  avgDailyRevenue: number
  daysWithData: number
  // Previous period for comparison
  previousTotalRevenue: number
  previousInstoreRevenue: number
  previousTotalDeliveryRevenue: number
  previousInstoreOrderCount: number
  previousCoupangRevenue: number
  previousBaeminRevenue: number
  previousPandaRevenue: number
  previousDaysWithData: number
}

export interface EwhaRevenueDataPoint {
  date: string
  totalRevenue: number
  instoreRevenue: number
  coupangRevenue: number
  baeminRevenue: number
  pandaRevenue: number
  totalDeliveryRevenue: number
  instoreOrderCount: number
}

export async function fetchEwhaDashboardMetrics(
  startDate: Date,
  endDate: Date,
  previousStartDate: Date,
  previousEndDate: Date
): Promise<EwhaDashboardMetrics> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')
  const prevStartDateStr = format(previousStartDate, 'yyyy-MM-dd')
  const prevEndDateStr = format(previousEndDate, 'yyyy-MM-dd')

  // Fetch current period data
  const { data: currentData, error: currentError } = await supabase
    .from('ewha_daily_sales')
    .select('*')
    .gte('sale_date', startDateStr)
    .lte('sale_date', endDateStr)

  if (currentError) throw currentError

  // Filter out Sundays
  const currentDays = currentData?.filter((day: any) => {
    const saleDate = parseISO(day.sale_date)
    return getDay(saleDate) !== 0
  }) || []

  // Fetch previous period data
  const { data: prevData, error: prevError } = await supabase
    .from('ewha_daily_sales')
    .select('*')
    .gte('sale_date', prevStartDateStr)
    .lte('sale_date', prevEndDateStr)

  if (prevError) throw prevError

  // Filter out Sundays
  const prevDays = prevData?.filter((day: any) => {
    const saleDate = parseISO(day.sale_date)
    return getDay(saleDate) !== 0
  }) || []

  // Calculate current period metrics
  const totalRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.total_revenue || 0), 0)
  const instoreRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.instore_revenue || 0), 0)
  const totalDeliveryRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.total_delivery_revenue || 0), 0)
  const instoreOrderCount = currentDays.reduce((sum: number, day: any) => sum + (day.instore_order_count || 0), 0)
  const coupangRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.coupang_revenue || 0), 0)
  const baeminRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.baemin_revenue || 0), 0)
  const pandaRevenue = currentDays.reduce((sum: number, day: any) => sum + (day.panda_revenue || 0), 0)
  const daysWithData = currentDays.length
  const avgDailyRevenue = daysWithData > 0 ? totalRevenue / daysWithData : 0

  // Calculate previous period metrics
  const previousTotalRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.total_revenue || 0), 0)
  const previousInstoreRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.instore_revenue || 0), 0)
  const previousTotalDeliveryRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.total_delivery_revenue || 0), 0)
  const previousInstoreOrderCount = prevDays.reduce((sum: number, day: any) => sum + (day.instore_order_count || 0), 0)
  const previousCoupangRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.coupang_revenue || 0), 0)
  const previousBaeminRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.baemin_revenue || 0), 0)
  const previousPandaRevenue = prevDays.reduce((sum: number, day: any) => sum + (day.panda_revenue || 0), 0)
  const previousDaysWithData = prevDays.length

  return {
    totalRevenue,
    instoreRevenue,
    totalDeliveryRevenue,
    instoreOrderCount,
    coupangRevenue,
    baeminRevenue,
    pandaRevenue,
    avgDailyRevenue,
    daysWithData,
    previousTotalRevenue,
    previousInstoreRevenue,
    previousTotalDeliveryRevenue,
    previousInstoreOrderCount,
    previousCoupangRevenue,
    previousBaeminRevenue,
    previousPandaRevenue,
    previousDaysWithData,
  }
}

export async function fetchEwhaRevenueData(
  startDate: Date,
  endDate: Date
): Promise<EwhaRevenueDataPoint[]> {
  const startDateStr = format(startDate, 'yyyy-MM-dd')
  const endDateStr = format(endDate, 'yyyy-MM-dd')

  const { data, error } = await supabase
    .from('ewha_daily_sales')
    .select('*')
    .gte('sale_date', startDateStr)
    .lte('sale_date', endDateStr)
    .order('sale_date', { ascending: true })

  if (error) throw error

  // Filter out Sundays
  const filteredData = data?.filter((day: any) => {
    const saleDate = parseISO(day.sale_date)
    return getDay(saleDate) !== 0
  }) || []

  return filteredData.map((day: any) => ({
    date: day.sale_date,
    totalRevenue: day.total_revenue || 0,
    instoreRevenue: day.instore_revenue || 0,
    coupangRevenue: day.coupang_revenue || 0,
    baeminRevenue: day.baemin_revenue || 0,
    pandaRevenue: day.panda_revenue || 0,
    totalDeliveryRevenue: day.total_delivery_revenue || 0,
    instoreOrderCount: day.instore_order_count || 0,
  }))
}

