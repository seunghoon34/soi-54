import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { saleDate, totalAmount, notes } = body

    if (!saleDate) {
      return NextResponse.json({ error: 'Sale date is required' }, { status: 400 })
    }

    if (totalAmount === undefined || totalAmount === null || totalAmount < 0) {
      return NextResponse.json({ error: 'Valid total amount is required' }, { status: 400 })
    }

    // Upsert the delivery sales record (update if exists, insert if not)
    const { data, error } = await supabase
      .from('delivery_sales')
      .upsert(
        {
          sale_date: saleDate,
          total_amount: Math.round(totalAmount),
          notes: notes || null,
          updated_at: new Date().toISOString(),
        },
        {
          onConflict: 'sale_date',
        }
      )
      .select()

    if (error) {
      console.error('Error saving delivery sales:', error)
      return NextResponse.json({ error: error.message }, { status: 500 })
    }

    return NextResponse.json({ success: true, data })
  } catch (error) {
    console.error('Error in save-delivery-sales:', error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to save delivery sales' },
      { status: 500 }
    )
  }
}

