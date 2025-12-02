import { subDays, subMonths, startOfDay, endOfDay, format, getDay } from 'date-fns'

export type DateRange = '1d' | '3d' | '7d' | '1m' | '3m' | '6m' | '1y'

export interface DateRangeResult {
  startDate: Date
  endDate: Date
  label: string
  granularity: 'daily' | 'weekly' | 'monthly'
}

export function getDateRange(range: DateRange): DateRangeResult {
  let endDate = endOfDay(new Date())
  let startDate: Date
  let label: string
  let granularity: 'daily' | 'weekly' | 'monthly'

  // Skip Sunday for end date if today is Sunday
  endDate = endOfDay(skipSunday(endDate))

  switch (range) {
    case '1d':
      startDate = startOfDay(skipSunday(new Date()))
      label = 'Today'
      granularity = 'daily'
      break
    case '3d': {
      // Get last 3 business days (excluding Sundays)
      let count3 = 0
      let current3 = new Date(endDate)
      while (count3 < 3) {
        if (getDay(current3) !== 0) {
          count3++
        }
        if (count3 < 3) {
          current3 = subDays(current3, 1)
        }
      }
      startDate = startOfDay(current3)
      label = 'Last 3 Days'
      granularity = 'daily'
      break
    }
    case '7d': {
      // Get last 7 business days (excluding Sundays)
      let count7 = 0
      let current7 = new Date(endDate)
      while (count7 < 7) {
        if (getDay(current7) !== 0) {
          count7++
        }
        if (count7 < 7) {
          current7 = subDays(current7, 1)
        }
      }
      startDate = startOfDay(current7)
      label = 'Last 7 Days'
      granularity = 'daily'
      break
    }
    case '1m':
      startDate = startOfDay(subMonths(endDate, 1))
      label = 'Last Month'
      granularity = 'weekly'
      break
    case '3m':
      startDate = startOfDay(subMonths(endDate, 3))
      label = 'Last 3 Months'
      granularity = 'weekly'
      break
    case '6m':
      startDate = startOfDay(subMonths(endDate, 6))
      label = 'Last 6 Months'
      granularity = 'monthly'
      break
    case '1y':
      startDate = startOfDay(subMonths(endDate, 12))
      label = 'Last Year'
      granularity = 'monthly'
      break
    default:
      startDate = startOfDay(subDays(endDate, 6))
      label = 'Last 7 Days'
      granularity = 'daily'
  }

  return { startDate, endDate, label, granularity }
}

export function formatCurrency(amount: number): string {
  return `₩${amount.toLocaleString('ko-KR')}`
}

export function formatDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd, yyyy')
}

export function formatShortDate(date: string | Date): string {
  return format(new Date(date), 'MMM dd')
}

export function skipSunday(date: Date): Date {
  // If the date is Sunday (0), go back to Saturday
  if (getDay(date) === 0) {
    return subDays(date, 1)
  }
  return date
}

export function getBusinessDaysCount(startDate: Date, endDate: Date): number {
  let count = 0
  let current = new Date(startDate)
  
  while (current <= endDate) {
    // Count only if not Sunday (0)
    if (getDay(current) !== 0) {
      count++
    }
    current = subDays(current, -1) // Add 1 day
  }
  
  return count
}

