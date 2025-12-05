'use client'

import { useState, useRef } from 'react'
import { X, Upload, Loader2, Plus, Trash2, Calendar, Check } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'

interface ReceiptItem {
  name: string
  quantity: number
  unit_price: number
  total_price: number
  category: string
}

interface ReceiptData {
  items: ReceiptItem[]
  total_amount: number
  item_count: number
}

interface ReceiptUploadProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

const CATEGORIES = ['식사류', '세트메뉴', '사이드메뉴', '음료수류', '기타']

export function ReceiptUpload({ isOpen, onClose, onSuccess }: ReceiptUploadProps) {
  const [step, setStep] = useState<'upload' | 'preview' | 'saving'>('upload')
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [imagePreview, setImagePreview] = useState<string | null>(null)
  const [receiptData, setReceiptData] = useState<ReceiptData | null>(null)
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
        const response = await fetch('/api/process-receipt', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ image: base64 }),
        })

        const data = await response.json()

        if (!response.ok) {
          let errorMsg = data.error || 'Failed to process receipt'
          if (data.rawResponse) {
            errorMsg += `\n\nRaw AI Response:\n${data.rawResponse}`
          }
          throw new Error(errorMsg)
        }

        setReceiptData(data)
        setStep('preview')
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to process receipt')
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

  const updateItem = (index: number, field: keyof ReceiptItem, value: any) => {
    if (!receiptData) return

    const newItems = [...receiptData.items]
    newItems[index] = { ...newItems[index], [field]: value }

    // Recalculate total_price if quantity or unit_price changed
    if (field === 'quantity' || field === 'unit_price') {
      newItems[index].total_price = newItems[index].quantity * newItems[index].unit_price
    }

    // Recalculate totals
    const newTotal = newItems.reduce((sum, item) => sum + item.total_price, 0)
    const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

    setReceiptData({
      items: newItems,
      total_amount: newTotal,
      item_count: newItemCount,
    })
  }

  const addItem = () => {
    if (!receiptData) return

    const newItem: ReceiptItem = {
      name: '',
      quantity: 1,
      unit_price: 0,
      total_price: 0,
      category: '기타',
    }

    setReceiptData({
      ...receiptData,
      items: [...receiptData.items, newItem],
    })
  }

  const removeItem = (index: number) => {
    if (!receiptData) return

    const newItems = receiptData.items.filter((_, i) => i !== index)
    const newTotal = newItems.reduce((sum, item) => sum + item.total_price, 0)
    const newItemCount = newItems.reduce((sum, item) => sum + item.quantity, 0)

    setReceiptData({
      items: newItems,
      total_amount: newTotal,
      item_count: newItemCount,
    })
  }

  const handleSave = async () => {
    if (!receiptData) return

    setStep('saving')
    setError(null)

    try {
      const response = await fetch('/api/save-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          orderDate: selectedDate,
          items: receiptData.items,
          totalAmount: receiptData.total_amount,
          itemCount: receiptData.item_count,
          receiptFilename: `${selectedDate}.jpg`,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save receipt')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save receipt')
      setStep('preview')
    }
  }

  const handleClose = () => {
    setStep('upload')
    setImagePreview(null)
    setReceiptData(null)
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
            {step === 'upload' && '📄 Upload Receipt'}
            {step === 'preview' && '✏️ Review & Edit'}
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
                  Receipt Date
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
                    : 'border-gray-300 hover:border-purple-500 cursor-pointer'
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
                    <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
                    <p className="text-gray-600">Processing receipt with AI...</p>
                    <p className="text-sm text-gray-400">This may take a few seconds</p>
                  </div>
                ) : imagePreview ? (
                  <div className="flex flex-col items-center gap-3">
                    <img
                      src={imagePreview}
                      alt="Receipt preview"
                      className="max-h-48 rounded-lg shadow"
                    />
                    <p className="text-sm text-gray-500">Click or drop to replace</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-3">
                    <Upload className="w-12 h-12 text-gray-400" />
                    <p className="text-gray-600">Drag & drop receipt image here</p>
                    <p className="text-sm text-gray-400">or click to browse (jpg, png, webp)</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'preview' && receiptData && (
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

              {/* Items Table */}
              <div className="border rounded-lg overflow-hidden">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left p-3 font-medium">Item Name</th>
                      <th className="text-center p-3 font-medium w-20">Qty</th>
                      <th className="text-right p-3 font-medium w-28">Unit Price</th>
                      <th className="text-right p-3 font-medium w-28">Total</th>
                      <th className="text-center p-3 font-medium w-32">Category</th>
                      <th className="w-10"></th>
                    </tr>
                  </thead>
                  <tbody>
                    {receiptData.items.map((item, index) => (
                      <tr key={index} className="border-t">
                        <td className="p-2">
                          <Input
                            value={item.name}
                            onChange={(e) => updateItem(index, 'name', e.target.value)}
                            className="h-8"
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.quantity}
                            onChange={(e) => updateItem(index, 'quantity', parseInt(e.target.value) || 0)}
                            className="h-8 text-center"
                            min={1}
                          />
                        </td>
                        <td className="p-2">
                          <Input
                            type="number"
                            value={item.unit_price}
                            onChange={(e) => updateItem(index, 'unit_price', parseInt(e.target.value) || 0)}
                            className="h-8 text-right"
                          />
                        </td>
                        <td className="p-2 text-right font-medium">
                          {formatCurrency(item.total_price)}
                        </td>
                        <td className="p-2">
                          <Select
                            value={item.category}
                            onValueChange={(value) => updateItem(index, 'category', value)}
                          >
                            <SelectTrigger className="h-8">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {CATEGORIES.map((cat) => (
                                <SelectItem key={cat} value={cat}>
                                  {cat}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </td>
                        <td className="p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(index)}
                            className="h-8 w-8 p-0 text-red-500 hover:text-red-700"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Add Item Button */}
              <Button variant="outline" size="sm" onClick={addItem} className="w-full">
                <Plus className="w-4 h-4 mr-1" />
                Add Item
              </Button>

              {/* Totals */}
              <div className="bg-gray-50 rounded-lg p-4 flex justify-between items-center">
                <div className="text-sm text-gray-600">
                  <span className="font-medium">{receiptData.item_count}</span> items total
                </div>
                <div className="text-xl font-bold">
                  Total: {formatCurrency(receiptData.total_amount)}
                </div>
              </div>
            </div>
          )}

          {step === 'saving' && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <Loader2 className="w-12 h-12 text-purple-500 animate-spin" />
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

