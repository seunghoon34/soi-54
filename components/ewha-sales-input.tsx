'use client'

import { useState } from 'react'
import { X, Loader2, Calendar, Check, Store, Truck } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import { Input } from '@/components/ui/input'

interface EwhaSalesInputProps {
  isOpen: boolean
  onClose: () => void
  onSuccess: () => void
}

export function EwhaSalesInput({ isOpen, onClose, onSuccess }: EwhaSalesInputProps) {
  const [selectedDate, setSelectedDate] = useState(() => {
    const today = new Date()
    return today.toISOString().split('T')[0]
  })
  const [instoreRevenue, setInstoreRevenue] = useState('')
  const [instoreOrderCount, setInstoreOrderCount] = useState('')
  const [coupangRevenue, setCoupangRevenue] = useState('')
  const [baeminRevenue, setBaeminRevenue] = useState('')
  const [pandaRevenue, setPandaRevenue] = useState('')
  const [notes, setNotes] = useState('')
  const [isSaving, setIsSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const totalDelivery = (parseInt(coupangRevenue) || 0) + (parseInt(baeminRevenue) || 0) + (parseInt(pandaRevenue) || 0)
  const totalRevenue = (parseInt(instoreRevenue) || 0) + totalDelivery

  const handleSave = async () => {
    if (!instoreRevenue && !coupangRevenue && !baeminRevenue && !pandaRevenue) {
      setError('Please enter at least one revenue value')
      return
    }

    setIsSaving(true)
    setError(null)

    try {
      const response = await fetch('/api/save-ewha-sales', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          saleDate: selectedDate,
          instoreRevenue: parseInt(instoreRevenue) || 0,
          instoreOrderCount: parseInt(instoreOrderCount) || 0,
          coupangRevenue: parseInt(coupangRevenue) || 0,
          baeminRevenue: parseInt(baeminRevenue) || 0,
          pandaRevenue: parseInt(pandaRevenue) || 0,
          notes: notes.trim() || null,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to save sales data')
      }

      onSuccess()
      handleClose()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to save sales data')
    } finally {
      setIsSaving(false)
    }
  }

  const handleClose = () => {
    setInstoreRevenue('')
    setInstoreOrderCount('')
    setCoupangRevenue('')
    setBaeminRevenue('')
    setPandaRevenue('')
    setNotes('')
    setError(null)
    setSelectedDate(new Date().toISOString().split('T')[0])
    onClose()
  }

  const formatCurrency = (amount: number) => `₩${amount.toLocaleString('ko-KR')}`

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col bg-white">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-rose-500">
          <div className="flex items-center gap-2">
            <Store className="w-5 h-5 text-white" />
            <h2 className="text-lg font-semibold text-white">Add Ewha Daily Sales</h2>
          </div>
          <Button variant="ghost" size="sm" onClick={handleClose} className="text-white hover:bg-white/20">
            <X className="w-4 h-4" />
          </Button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
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
              className="w-full max-w-xs"
              disabled={isSaving}
            />
          </div>

          {/* In-Store Section */}
          <Card className="p-4 border-2 border-blue-200 bg-blue-50">
            <div className="flex items-center gap-2 mb-3">
              <Store className="w-5 h-5 text-blue-600" />
              <h3 className="font-semibold text-blue-900">In-Store Sales</h3>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-xs text-blue-700 mb-1">Revenue (₩)</label>
                <Input
                  type="number"
                  value={instoreRevenue}
                  onChange={(e) => setInstoreRevenue(e.target.value)}
                  placeholder="0"
                  className="bg-white border-blue-300"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs text-blue-700 mb-1">Order Count</label>
                <Input
                  type="number"
                  value={instoreOrderCount}
                  onChange={(e) => setInstoreOrderCount(e.target.value)}
                  placeholder="0"
                  className="bg-white border-blue-300"
                  disabled={isSaving}
                />
              </div>
            </div>
          </Card>

          {/* Delivery Section */}
          <Card className="p-4 border-2 border-emerald-200 bg-emerald-50">
            <div className="flex items-center gap-2 mb-3">
              <Truck className="w-5 h-5 text-emerald-600" />
              <h3 className="font-semibold text-emerald-900">Delivery Sales</h3>
            </div>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-xs text-emerald-700 mb-1">Coupang (₩)</label>
                <Input
                  type="number"
                  value={coupangRevenue}
                  onChange={(e) => setCoupangRevenue(e.target.value)}
                  placeholder="0"
                  className="bg-white border-emerald-300"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-700 mb-1">Baemin (₩)</label>
                <Input
                  type="number"
                  value={baeminRevenue}
                  onChange={(e) => setBaeminRevenue(e.target.value)}
                  placeholder="0"
                  className="bg-white border-emerald-300"
                  disabled={isSaving}
                />
              </div>
              <div>
                <label className="block text-xs text-emerald-700 mb-1">Panda (₩)</label>
                <Input
                  type="number"
                  value={pandaRevenue}
                  onChange={(e) => setPandaRevenue(e.target.value)}
                  placeholder="0"
                  className="bg-white border-emerald-300"
                  disabled={isSaving}
                />
              </div>
            </div>
          </Card>

          {/* Summary */}
          <Card className="p-4 bg-gray-50 border-2">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div>
                <div className="text-xs text-gray-500 mb-1">In-Store</div>
                <div className="font-bold text-blue-600">{formatCurrency(parseInt(instoreRevenue) || 0)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Delivery Total</div>
                <div className="font-bold text-emerald-600">{formatCurrency(totalDelivery)}</div>
              </div>
              <div>
                <div className="text-xs text-gray-500 mb-1">Total Revenue</div>
                <div className="font-bold text-gray-900 text-lg">{formatCurrency(totalRevenue)}</div>
              </div>
            </div>
          </Card>

          {/* Notes */}
          <div>
            <label className="block text-sm font-medium mb-2 text-gray-700">
              Notes (optional)
            </label>
            <Input
              type="text"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Any notes for this day..."
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
            disabled={isSaving}
            className="bg-pink-600 hover:bg-pink-700"
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

