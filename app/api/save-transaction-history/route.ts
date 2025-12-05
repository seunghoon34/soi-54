import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { 
      businessDate, 
      lunchRevenue, 
      lunchTransactionCount,
      dinnerRevenue,
      dinnerTransactionCount,
      totalRevenue, 
      totalTransactionCount, 
      receiptFilename 
    } = await req.json()

    if (!businessDate || totalRevenue === undefined) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already processed (by date)
    const { data: existingRecord } = await supabase
      .from('daily_revenue_splits')
      .select('id')
      .eq('business_date', businessDate)
      .single()

    if (existingRecord) {
      return Response.json(
        { error: `Transaction history for ${businessDate} already exists. Delete the existing one first.` },
        { status: 400 }
      )
    }

    // Insert daily revenue split
    const { data: revenueSplitData, error: revenueSplitError } = await supabase
      .from('daily_revenue_splits')
      .insert({
        business_date: businessDate,
        lunch_revenue: lunchRevenue || 0,
        lunch_transaction_count: lunchTransactionCount || 0,
        dinner_revenue: dinnerRevenue || 0,
        dinner_transaction_count: dinnerTransactionCount || 0,
        total_revenue: totalRevenue,
        total_transaction_count: totalTransactionCount || 0,
        receipt_filename: receiptFilename || `${businessDate}-transactions.jpg`,
      })
      .select()
      .single()

    if (revenueSplitError) {
      throw revenueSplitError
    }

    // Log successful processing
    await supabase.from('processing_log').insert({
      receipt_filename: receiptFilename || `${businessDate}-transactions.jpg`,
      order_date: businessDate,
      status: 'success',
    })

    console.log('✅ Saved transaction history:', revenueSplitData)
    return Response.json({ success: true, id: revenueSplitData.id })
  } catch (error) {
    console.error('Error saving transaction history:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save transaction history' },
      { status: 500 }
    )
  }
}

