import OpenAI from 'openai'

export const runtime = 'nodejs'
export const maxDuration = 60

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  try {
    const { image } = await req.json()

    if (!image) {
      return Response.json({ error: 'No image provided' }, { status: 400 })
    }

    const prompt = `
    You are a data extraction assistant. Extract ALL information from this Korean restaurant receipt image.
    
    Return a JSON object with this EXACT structure:
    {
        "items": [
            {
                "name": "item name in Korean",
                "quantity": number,
                "unit_price": number,
                "total_price": number,
                "category": "one of: 식사류, 세트메뉴, 사이드메뉴, 음료수류, 기타"
            }
        ],
        "total_amount": number,
        "item_count": number
    }
    
    IMPORTANT:
    - Extract ALL items from the receipt
    - Read the Korean text CAREFULLY and accurately
    - This is a Thai restaurant. Common menu items include:
      - 꾸어이띠어우누아 (kuaytiew nua - beef noodle soup)
      - 꾸어이띠어우똠얌 (kuaytiew tom yum - NOT 꿍얌 or 꿍얌)
      - 팟타이꿍 (pad thai kung - NOT 팟타이꽁)
      - 솜땀타이 (som tam thai - NOT 쏨땀타이)
      - 똠얌꿍 (tom yum kung)
      - 팟붕화이댕무그룹 (pak boong fai daeng)
      - 꿍팟퐁커리 (kung phat pong curry)
    - Categories: 식사류 (meals), 세트메뉴 (set menus), 사이드메뉴 (side dishes), 음료수류 (beverages), 기타 (other)
    - If you see "식사류 합계" or "세트메뉴 합계", those are subtotals, not items
    - The final total is usually labeled "전체합계"
    - Return ONLY valid JSON, no other text
    - All prices should be numbers without commas (e.g., 50000 not "50,000")
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
      max_completion_tokens: 16000, // GPT-5 needs more tokens for reasoning + output
      reasoning_effort: 'low', // Get output faster, less reasoning tokens
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
      const data = JSON.parse(jsonMatch[0])
      
      // Recalculate item_count and total_amount from items (don't trust AI math)
      if (data.items && Array.isArray(data.items)) {
        const calculatedItemCount = data.items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
        const calculatedTotal = data.items.reduce((sum: number, item: any) => sum + (item.total_price || 0), 0)
        
        console.log(`📊 AI item_count: ${data.item_count}, Calculated: ${calculatedItemCount}`)
        console.log(`📊 AI total: ${data.total_amount}, Calculated: ${calculatedTotal}`)
        
        // Use calculated values
        data.item_count = calculatedItemCount
        // Keep AI total_amount as it reads from receipt, but log discrepancy
        if (Math.abs(calculatedTotal - data.total_amount) > 100) {
          console.log(`⚠️ Total mismatch - Receipt: ${data.total_amount}, Items sum: ${calculatedTotal}`)
        }
      }
      
      console.log('✅ Parsed data:', JSON.stringify(data, null, 2))
      return Response.json(data)
    } catch (parseError) {
      console.error('❌ JSON parse error:', parseError, 'Raw:', jsonMatch[0])
      return Response.json({ 
        error: 'Failed to parse JSON',
        rawResponse: content 
      }, { status: 500 })
    }
  } catch (error) {
    console.error('Error processing receipt:', error)
    return Response.json(
      { error: error instanceof Error ? error.message : 'Failed to process receipt' },
      { status: 500 }
    )
  }
}

