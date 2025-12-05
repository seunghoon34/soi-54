import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

interface Transaction {
  time: string // HH:MM:SS format
  amount: number
  payment_type: string // 카드, 카반 (card, card refund)
}

interface TransactionHistoryData {
  business_date: string // YYYY-MM-DD format
  transactions: Transaction[]
  total_amount: number
  transaction_count: number
}

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const prompt = `
    You are a data extraction assistant. Extract ALL transaction information from this Korean transaction history receipt (거래내역).
    
    Return a JSON object with this EXACT structure:
    {
        "business_date": "YYYY-MM-DD",
        "transactions": [
            {
                "time": "HH:MM:SS",
                "amount": number (positive for sales, negative for refunds),
                "payment_type": "카드 or 카반"
            }
        ],
        "total_amount": number,
        "transaction_count": number
    }
    
    IMPORTANT:
    - Extract the business date from "조회일자" at the top (NOT from 출력시간 which is the print time)
    - 조회일자 shows the actual business date range (e.g., 2025-12-02 means December 2, 2025)
    - 출력시간 is just when the receipt was printed, ignore it for the business_date
    - Extract ALL transactions from the list
    - Each transaction has: date-time (MM-DD HH:MM:SS), sequence number, amount, and payment type
    - Keep negative amounts as negative (these are refunds/카반)
    - Payment types: "카드" (card payment) or "카반" (card refund)
    - Time format should be HH:MM:SS (24-hour format)
    - The total at the bottom is usually labeled "전체합계" or similar
    - Return ONLY valid JSON, no other text
    - All amounts should be numbers without commas (e.g., 50000 not "50,000")
    `

    const response = await openai.chat.completions.create({
      model: 'gpt-5-mini',
      messages: [
        {
          role: 'user',
          content: [
            { type: 'text', text: prompt },
            {
              type: 'image_url',
              image_url: {
                url: image, // base64 data URL
              },
            },
          ],
        },
      ],
      max_completion_tokens: 16000,
      reasoning_effort: 'low',
    } as any)

    const content = response.choices[0].message.content || ''

    console.log('📝 Raw Vision Response:', content)

    // Extract JSON from response - try multiple patterns
    let jsonMatch = content.match(/\{[\s\S]*\}/)
    
    // Also try to find JSON in markdown code blocks
    if (!jsonMatch) {
      const codeBlockMatch = content.match(/```(?:json)?\s*([\s\S]*?)```/)
      if (codeBlockMatch) {
        jsonMatch = codeBlockMatch[1].match(/\{[\s\S]*\}/)
      }
    }

    if (!jsonMatch) {
      console.error('❌ Could not extract JSON from:', content)
      return Response.json({ 
        error: 'Failed to extract JSON from response',
        rawResponse: content 
      }, { status: 500 })
    }

    try {
      const data: TransactionHistoryData = JSON.parse(jsonMatch[0])
      
      // Validate and recalculate
      if (data.transactions && Array.isArray(data.transactions)) {
        const calculatedCount = data.transactions.length
        const calculatedTotal = data.transactions.reduce((sum, txn) => sum + txn.amount, 0)
        
        console.log(`📊 AI transaction_count: ${data.transaction_count}, Calculated: ${calculatedCount}`)
        console.log(`📊 AI total: ${data.total_amount}, Calculated: ${calculatedTotal}`)
        
        // Use calculated values
        data.transaction_count = calculatedCount
        
        // Log discrepancy if any
        if (Math.abs(calculatedTotal - data.total_amount) > 100) {
          console.log(`⚠️ Total mismatch - Receipt: ${data.total_amount}, Transactions sum: ${calculatedTotal}`)
        }
      }
      
      // Now split by lunch (before 4pm) and dinner (4pm and after)
      let lunchRevenue = 0
      let lunchCount = 0
      let dinnerRevenue = 0
      let dinnerCount = 0
      
      for (const txn of data.transactions) {
        const hour = parseInt(txn.time.split(':')[0])
        
        if (hour < 16) { // Before 4pm = lunch
          lunchRevenue += txn.amount
          lunchCount++
        } else { // 4pm and after = dinner
          dinnerRevenue += txn.amount
          dinnerCount++
        }
      }
      
      const result = {
        business_date: data.business_date,
        lunch_revenue: lunchRevenue,
        lunch_transaction_count: lunchCount,
        dinner_revenue: dinnerRevenue,
        dinner_transaction_count: dinnerCount,
        total_revenue: data.total_amount,
        total_transaction_count: data.transaction_count,
        transactions: data.transactions, // Include for verification
      }
      
      console.log('✅ Parsed and split data:', JSON.stringify(result, null, 2))
      return Response.json(result)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError, 'Raw:', jsonMatch[0])
      return Response.json({ 
        error: 'Failed to parse JSON',
        rawResponse: content 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing transaction history:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process transaction history' },
      { status: 500 }
    )
  }
}

