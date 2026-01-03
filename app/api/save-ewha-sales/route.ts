import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const {
      saleDate,
      instoreRevenue,
      instoreOrderCount,
      coupangRevenue,
      baeminRevenue,
      pandaRevenue,
      notes,
    } = body

    if (!saleDate) {
      return NextResponse.json({ error: 'Sale date is required' }, { status: 400 })
    }

    // Upsert the Ewha sales record (update if exists, insert if not)
    const { data, error } = await supabase
      .from('ewha_daily_sales')
      .upsert(
        {
          sale_date: saleDate,
          instore_revenue: Math.round(instoreRevenue || 0),
          instore_order_count: Math.round(instoreOrderCount || 0),
          coupang_revenue: Math.round(coupangRevenue || 0),
          baemin_revenue: Math.round(baeminRevenue || 0),
          panda_revenue: Math.round(pandaRevenue || 0),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'sale_date',
        }
      )
      .select()

    if (error) {
      console.error('Error saving Ewha sales:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in save-ewha-sales:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save Ewha sales' },
      { status: 500 }
    )
  }
}

