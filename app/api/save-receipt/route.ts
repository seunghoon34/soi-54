import { supabase } from '@/lib/supabase'

export async function POST(req: Request) {
  try {
    const { orderDate, items, totalAmount, itemCount, receiptFilename } = await req.json()

    if (!orderDate || !items || !totalAmount) {
      return Response.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Check if already processed (by date)
    const { data: existingOrder } = await supabase
      .from('orders')
      .select('id')
      .eq('order_date', orderDate)
      .single()

    if (existingOrder) {
      return Response.json(
        { error: `Receipt for ${orderDate} already exists. Delete the existing one first.` },
        { status: 400 }
      )
    }

    // Insert order
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert({
        order_date: orderDate,
        total_amount: totalAmount,
        item_count: itemCount,
        receipt_filename: receiptFilename || `${orderDate}.jpg`,
      })
      .select()
      .single()

    if (orderError) {
      throw orderError
    }

    const orderId = orderData.id

    // Insert order items
    const itemsToInsert = items.map((item: any) => ({
      order_id: orderId,
      item_name: item.name,
      category: item.category || '기타',
      quantity: item.quantity,
      unit_price: item.unit_price,
      total_price: item.total_price,
    }))

    const { error: itemsError } = await supabase.from('order_items').insert(itemsToInsert)

    if (itemsError) {
      // Rollback: delete the order if items fail
      await supabase.from('orders').delete().eq('id', orderId)
      throw itemsError
    }

    // Log successful processing
    await supabase.from('processing_log').insert({
      receipt_filename: receiptFilename || `${orderDate}.jpg`,
      order_date: orderDate,
      status: 'success',
    })

    return Response.json({ success: true, orderId })
  } catch (error) {
    console.error('Error saving receipt:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to save receipt' },
      { status: 500 }
    )
  }
}

