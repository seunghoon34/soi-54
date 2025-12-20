'use client'

import { useState } from 'react'
import { X, Loader2, Calendar, Check, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface DeliverySalesInputProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function DeliverySalesInput({ isOpen, onClose, onSuccess }: DeliverySalesInputProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [amount, setAmount] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSave = async () => {
    if (!amount || isNaN(Number(amount)) || Number(amount) <= 0) {
      setError('Please enter a valid amount')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/save-delivery-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleDate: selectedDate,
          totalAmount: Math.round(Number(amount)),
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save delivery sales')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save delivery sales')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setAmount('')
    setNotes('')
    setError(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-md overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-emerald-500 to-teal-500">
          <div className="flex items-center gap-2">
            <Truck className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Add Delivery Sales</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="p-4 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          {/* Date Picker */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              <Calendar className="w-4 h-4 inline mr-1" />
              Sale Date
            </label>
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-full"
              disabled={isSaving}
            />
          </div>

          {/* Amount Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Total Amount (฿)
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 font-medium">฿</span>
              <Input
                type="number"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0"
                className="pl-8 text-lg font-semibold"
                disabled={isSaving}
                min="0"
                step="1"
              />
            </div>
          </div>

          {/* Notes Input */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Notes (optional)
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g., GrabFood, Lineman, etc."
              disabled={isSaving}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="border-t p-4 flex justify-end gap-2 bg-gray-50">
          <Button variant="outline" onClick={handleClose} disabled={isSaving}>
            Cancel
          </Button>
          <Button 
            onClick={handleSave} 
            disabled={isSaving || !amount}
            className="bg-emerald-600 hover:bg-emerald-700"
          >
            {isSaving ? (
              <>
                <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Check className="w-4 h-4 mr-1" />
                Save
              </>
            )}
          </Button>
        </div>
      </Card>
    </div>
  )
}

