'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, Calendar, Check, TrendingUp, TrendingDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface TransactionHistoryData {
  business_date: string
  lunch_revenue: number
  lunch_transaction_count: number
  dinner_revenue: number
  dinner_transaction_count: number
  total_revenue: number
  total_transaction_count: number
  transactions?: Array<{
    time: string
    amount: number
    payment_type: string
  }>
}

interface TransactionHistoryUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function TransactionHistoryUpload({ isOpen, onClose, onSuccess }: TransactionHistoryUploadProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'saving'>('upload')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [transactionData, setTransactionData] = useState<TransactionHistoryData | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    if (!file.type.startsWith('image/')) {
      setError('Please select an image file')
      return
    }

    // Convert to base64
    const reader = new FileReader()
    reader.onload = async (event) => {
      const base64 = event.target?.result as string
      setImagePreview(base64)
      setError(null)

      // Process with OpenAI Vision
      setIsProcessing(true)
      try {
        const response = await fetch('/api/process-transaction-history', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await response.json()

        if (!response.ok) {
          let errorMsg = data.error || 'Failed to process transaction history'
          if (data.rawResponse) {
            errorMsg += `\n\nRaw AI Response:\n${data.rawResponse}`
          }
          throw new Error(errorMsg)
        }

        setTransactionData(data)
        // Use the date from the receipt if available
        if (data.business_date) {
          setSelectedDate(data.business_date)
        }
        setStep('preview')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process transaction history')
      } finally {
        setIsProcessing(false)
      }
    }
    reader.readAsDataURL(file)
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    const file = e.dataTransfer.files[0]
    if (file && file.type.startsWith('image/')) {
      const input = fileInputRef.current
      if (input) {
        const dt = new DataTransfer()
        dt.items.add(file)
        input.files = dt.files
        handleFileSelect({ target: input } as any)
      }
    }
  }

  const handleSave = async () => {
    if (!transactionData) return

    setStep('saving')
    setError(null)

    try {
      const response = await fetch('/api/save-transaction-history', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          businessDate: selectedDate,
          lunchRevenue: transactionData.lunch_revenue,
          lunchTransactionCount: transactionData.lunch_transaction_count,
          dinnerRevenue: transactionData.dinner_revenue,
          dinnerTransactionCount: transactionData.dinner_transaction_count,
          totalRevenue: transactionData.total_revenue,
          totalTransactionCount: transactionData.total_transaction_count,
          receiptFilename: `${selectedDate}-transactions.jpg`,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save transaction history')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save transaction history')
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setImagePreview(null)
    setTransactionData(null)
    setError(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
    onClose()
  }

  const formatCurrency = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b">
          <h2 className="text-lg font-semibold">
            {step === 'upload' && '📊 Upload Transaction History'}
            {step === 'preview' && '✏️ Review Revenue Split'}
            {step === 'saving' && '💾 Saving...'}
          </h2>
          <Button variant="ghost" size="sm" onClick={handleClose}>
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm max-h-48 overflow-y-auto">
              <pre className="whitespace-pre-wrap font-mono text-xs">{error}</pre>
            </div>
          )}

          {step === 'upload' && (
            <div className="space-y-4">
              {/* Date Picker */}
              <div>
                <label className="block text-sm font-medium mb-2">
                  <Calendar className="w-4 h-4 inline mr-1" />
                  Business Date
                </label>
                <Input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="w-full max-w-xs"
                />
              </div>

              {/* Upload Area */}
              <div
                onDrop={isProcessing ? undefined : handleDrop}
                onDragOver={(e) => e.preventDefault()}
                className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                  isProcessing 
                    ? 'border-gray-200 bg-gray-50 cursor-not-allowed' 
                    : 'border-gray-300 hover:border-blue-500 cursor-pointer'
                }`}
                onClick={isProcessing ? undefined : () => fileInputRef.current?.click()}
              >
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  className="hidden"
                  disabled={isProcessing}
                />

                {isProcessing ? (
                  <div className="flex flex-col items-center gap-3">
                    <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
                    <p className="text-gray-600">Processing transaction history with AI...</p>
                    <p className="text-sm text-gray-400">This may take a few seconds</p>
                  </div>
                ) : imagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Transaction history preview"
                      className="max-h-48 rounded-lg shadow"
                    />
                    <p className="text-sm text-gray-500">Click or drop to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-600">Drag & drop transaction history image here</p>
                    <p className="text-sm text-gray-400">or click to browse (jpg, png, webp)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && transactionData && (
            <div className="space-y-4">
              {/* Date Picker - Editable */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Calendar className="w-4 h-4 text-gray-500" />
                  <Input
                    type="date"
                    value={selectedDate}
                    onChange={(e) => setSelectedDate(e.target.value)}
                    className="w-auto"
                  />
                </div>
                <Button variant="outline" size="sm" onClick={() => setStep('upload')}>
                  ← Back
                </Button>
              </div>

              {/* Revenue Split Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Lunch Card */}
                <Card className="p-4 border-2 border-orange-200 bg-orange-50">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingUp className="w-5 h-5 text-orange-600" />
                    <h3 className="font-semibold text-orange-900">Lunch Revenue</h3>
                    <span className="text-xs text-orange-600 ml-auto">Before 4pm</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-orange-900">
                      {formatCurrency(transactionData.lunch_revenue)}
                    </div>
                    <div className="text-sm text-orange-700">
                      {transactionData.lunch_transaction_count} transactions
                    </div>
                    {transactionData.lunch_transaction_count > 0 && (
                      <div className="text-xs text-orange-600">
                        Avg: {formatCurrency(Math.round(transactionData.lunch_revenue / transactionData.lunch_transaction_count))}
                      </div>
                    )}
                  </div>
                </Card>

                {/* Dinner Card */}
                <Card className="p-4 border-2 border-purple-200 bg-purple-50">
                  <div className="flex items-center gap-2 mb-3">
                    <TrendingDown className="w-5 h-5 text-purple-600" />
                    <h3 className="font-semibold text-purple-900">Dinner Revenue</h3>
                    <span className="text-xs text-purple-600 ml-auto">4pm and after</span>
                  </div>
                  <div className="space-y-2">
                    <div className="text-3xl font-bold text-purple-900">
                      {formatCurrency(transactionData.dinner_revenue)}
                    </div>
                    <div className="text-sm text-purple-700">
                      {transactionData.dinner_transaction_count} transactions
                    </div>
                    {transactionData.dinner_transaction_count > 0 && (
                      <div className="text-xs text-purple-600">
                        Avg: {formatCurrency(Math.round(transactionData.dinner_revenue / transactionData.dinner_transaction_count))}
                      </div>
                    )}
                  </div>
                </Card>
              </div>

              {/* Total Summary */}
              <Card className="p-4 bg-gray-50 border-2">
                <div className="flex justify-between items-center">
                  <div>
                    <div className="text-sm text-gray-600 mb-1">Total Revenue</div>
                    <div className="text-2xl font-bold">
                      {formatCurrency(transactionData.total_revenue)}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm text-gray-600 mb-1">Total Transactions</div>
                    <div className="text-2xl font-bold">
                      {transactionData.total_transaction_count}
                    </div>
                  </div>
                </div>
              </Card>

              {/* Revenue Split Percentage */}
              <div className="bg-white border rounded-lg p-4">
                <div className="text-sm font-medium mb-2">Revenue Distribution</div>
                <div className="flex h-8 rounded-lg overflow-hidden">
                  <div 
                    className="bg-orange-400 flex items-center justify-center text-white text-xs font-medium"
                    style={{ 
                      width: `${transactionData.total_revenue > 0 ? (transactionData.lunch_revenue / transactionData.total_revenue * 100) : 50}%` 
                    }}
                  >
                    {transactionData.total_revenue > 0 && 
                      `${Math.round(transactionData.lunch_revenue / transactionData.total_revenue * 100)}%`
                    }
                  </div>
                  <div 
                    className="bg-purple-400 flex items-center justify-center text-white text-xs font-medium"
                    style={{ 
                      width: `${transactionData.total_revenue > 0 ? (transactionData.dinner_revenue / transactionData.total_revenue * 100) : 50}%` 
                    }}
                  >
                    {transactionData.total_revenue > 0 && 
                      `${Math.round(transactionData.dinner_revenue / transactionData.total_revenue * 100)}%`
                    }
                  </div>
                </div>
                <div className="flex justify-between mt-2 text-xs text-gray-600">
                  <span>🌅 Lunch</span>
                  <span>🌙 Dinner</span>
                </div>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-blue-500 animate-spin" />
              <p className="text-gray-600">Saving to database...</p>
            </div>
          )}
        </div>

        {/* Footer */}
        {step === 'preview' && (
          <div className="border-t p-4 flex justify-end gap-2">
            <Button variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button onClick={handleSave} className="bg-green-600 hover:bg-green-700">
              <Check className="w-4 h-4 mr-1" />
              Confirm & Save
            </Button>
          </div>
        )}
      </Card>
    </div>
  )
}

