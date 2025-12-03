import OpenAI from 'openai'
import { supabase } from '@/lib/supabase'
import { format, subDays, parseISO, getDay } from 'date-fns'

export const runtime = 'edge'

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// Define tools for querying Supabase
const tools: OpenAI.Chat.Completions.ChatCompletionTool[] = [
  {
    type: 'function',
    function: {
      name: 'get_sales_summary',
      description: 'Get a summary of sales data including total revenue, orders, and items sold for a date range',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back (e.g., 7 for last week, 30 for last month)',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_top_items',
      description: 'Get the top selling menu items by quantity sold',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back',
          },
          limit: {
            type: 'number',
            description: 'Number of top items to return (default 10)',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_category_breakdown',
      description: 'Get sales breakdown by category (e.g., 식사류, 사이드메뉴, etc.)',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back',
          },
        },
        required: ['days'],
      },
    },
  },
  {
    type: 'function',
    function: {
      name: 'get_daily_revenue',
      description: 'Get daily revenue data to analyze trends',
      parameters: {
        type: 'object',
        properties: {
          days: {
            type: 'number',
            description: 'Number of days to look back',
          },
        },
        required: ['days'],
      },
    },
  },
]

// Tool execution functions
async function getSalesSummary(days: number) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, total_amount, order_date')
    .gte('order_date', startDate)
    .lte('order_date', endDate)

  const filteredOrders = orders?.filter((o) => getDay(parseISO(o.order_date)) !== 0) || []
  const orderIds = filteredOrders.map((o) => o.id)

  let totalItems = 0
  if (orderIds.length > 0) {
    const { data: items } = await supabase
      .from('order_items')
      .select('quantity')
      .in('order_id', orderIds)
    totalItems = items?.reduce((sum, i) => sum + i.quantity, 0) || 0
  }

  const totalRevenue = filteredOrders.reduce((sum, o) => sum + o.total_amount, 0)
  const totalOrders = filteredOrders.length
  const uniqueDays = new Set(filteredOrders.map((o) => o.order_date)).size

  return {
    period: `Last ${days} days`,
    totalRevenue: `₩${totalRevenue.toLocaleString('ko-KR')}`,
    totalOrders,
    totalItems,
    averageOrderValue: totalOrders > 0 ? `₩${Math.round(totalRevenue / totalOrders).toLocaleString('ko-KR')}` : '₩0',
    averageItemsPerDay: uniqueDays > 0 ? Math.round(totalItems / uniqueDays) : 0,
    daysWithSales: uniqueDays,
  }
}

async function getTopItems(days: number, limit: number = 10) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_date')
    .gte('order_date', startDate)
    .lte('order_date', endDate)

  const filteredOrders = orders?.filter((o) => getDay(parseISO(o.order_date)) !== 0) || []
  const orderIds = filteredOrders.map((o) => o.id)

  if (orderIds.length === 0) return []

  const { data: items } = await supabase
    .from('order_items')
    .select('item_name, quantity, total_price')
    .in('order_id', orderIds)

  const itemMap = new Map<string, { quantity: number; revenue: number }>()
  items?.forEach((item) => {
    const existing = itemMap.get(item.item_name) || { quantity: 0, revenue: 0 }
    itemMap.set(item.item_name, {
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total_price,
    })
  })

  return Array.from(itemMap.entries())
    .map(([name, data]) => ({
      name,
      quantitySold: data.quantity,
      revenue: `₩${data.revenue.toLocaleString('ko-KR')}`,
    }))
    .sort((a, b) => b.quantitySold - a.quantitySold)
    .slice(0, limit)
}

async function getCategoryBreakdown(days: number) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data: orders } = await supabase
    .from('orders')
    .select('id, order_date')
    .gte('order_date', startDate)
    .lte('order_date', endDate)

  const filteredOrders = orders?.filter((o) => getDay(parseISO(o.order_date)) !== 0) || []
  const orderIds = filteredOrders.map((o) => o.id)

  if (orderIds.length === 0) return []

  const { data: items } = await supabase
    .from('order_items')
    .select('category, quantity, total_price')
    .in('order_id', orderIds)
    .not('category', 'is', null)

  const categoryMap = new Map<string, { quantity: number; revenue: number }>()
  items?.forEach((item) => {
    if (!item.category) return
    const existing = categoryMap.get(item.category) || { quantity: 0, revenue: 0 }
    categoryMap.set(item.category, {
      quantity: existing.quantity + item.quantity,
      revenue: existing.revenue + item.total_price,
    })
  })

  const totalRevenue = Array.from(categoryMap.values()).reduce((sum, c) => sum + c.revenue, 0)

  return Array.from(categoryMap.entries())
    .map(([category, data]) => ({
      category,
      itemsSold: data.quantity,
      revenue: `₩${data.revenue.toLocaleString('ko-KR')}`,
      percentOfRevenue: totalRevenue > 0 ? `${((data.revenue / totalRevenue) * 100).toFixed(1)}%` : '0%',
    }))
    .sort((a, b) => b.itemsSold - a.itemsSold)
}

async function getDailyRevenue(days: number) {
  const endDate = format(new Date(), 'yyyy-MM-dd')
  const startDate = format(subDays(new Date(), days), 'yyyy-MM-dd')

  const { data: orders } = await supabase
    .from('orders')
    .select('order_date, total_amount, item_count')
    .gte('order_date', startDate)
    .lte('order_date', endDate)
    .order('order_date', { ascending: true })

  const dailyMap = new Map<string, { revenue: number; items: number }>()
  orders?.forEach((order) => {
    if (getDay(parseISO(order.order_date)) === 0) return
    const existing = dailyMap.get(order.order_date) || { revenue: 0, items: 0 }
    dailyMap.set(order.order_date, {
      revenue: existing.revenue + order.total_amount,
      items: existing.items + order.item_count,
    })
  })

  return Array.from(dailyMap.entries()).map(([date, data]) => ({
    date,
    revenue: `₩${data.revenue.toLocaleString('ko-KR')}`,
    itemsSold: data.items,
  }))
}

// Execute tool calls
async function executeTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'get_sales_summary':
      return await getSalesSummary(args.days as number)
    case 'get_top_items':
      return await getTopItems(args.days as number, args.limit as number)
    case 'get_category_breakdown':
      return await getCategoryBreakdown(args.days as number)
    case 'get_daily_revenue':
      return await getDailyRevenue(args.days as number)
    default:
      return { error: 'Unknown tool' }
  }
}

export async function POST(req: Request) {
  const { messages } = await req.json()

  const systemMessage = {
    role: 'system' as const,
    content: `You are a helpful AI assistant for Soi 54, a Thai restaurant in Korea. You help analyze sales data and provide business insights and patterns.

Use the available tools to fetch data from the database before answering questions. Always use tools to get current data rather than making assumptions.

When presenting data:
- Use Korean Won (₩) for currency
- Be concise and actionable
- Highlight important trends or anomalies
- The restaurant is closed on Sundays, so that data is excluded

Respond in a friendly, professional manner. Keep responses brief but insightful in the users initial language.`,
  }

  const allMessages = [systemMessage, ...messages]

  // First API call to get tool calls (non-streaming)
  const response = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: allMessages,
    tools,
    tool_choice: 'auto',
  })

  const assistantMessage = response.choices[0].message

  // If there are tool calls, execute them and stream the final response
  if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
    const toolResults = await Promise.all(
      assistantMessage.tool_calls.map(async (toolCall: any) => {
        const args = JSON.parse(toolCall.function.arguments)
        const result = await executeTool(toolCall.function.name, args)
        return {
          role: 'tool' as const,
          tool_call_id: toolCall.id,
          content: JSON.stringify(result),
        }
      })
    )

    // Stream the final response
    const stream = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [...allMessages, assistantMessage, ...toolResults],
      stream: true,
    })

    // Create a readable stream for the response
    const encoder = new TextEncoder()
    const readable = new ReadableStream({
      async start(controller) {
        for await (const chunk of stream) {
          const content = chunk.choices[0]?.delta?.content || ''
          if (content) {
            controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
          }
        }
        controller.enqueue(encoder.encode('data: [DONE]\n\n'))
        controller.close()
      },
    })

    return new Response(readable, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'Connection': 'keep-alive',
      },
    })
  }

  // No tool calls - stream direct response
  const stream = await openai.chat.completions.create({
    model: 'gpt-5-mini',
    messages: allMessages,
    stream: true,
  })

  const encoder = new TextEncoder()
  const readable = new ReadableStream({
    async start(controller) {
      for await (const chunk of stream) {
        const content = chunk.choices[0]?.delta?.content || ''
        if (content) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ content })}\n\n`))
        }
      }
      controller.enqueue(encoder.encode('data: [DONE]\n\n'))
      controller.close()
    },
  })

  return new Response(readable, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  })
}
