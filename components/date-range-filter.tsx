'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Calendar } from '@/components/ui/calendar'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { DateRange, CustomDateRange } from '@/lib/date-utils'
import { CalendarIcon, X } from 'lucide-react'
import { format } from 'date-fns'
import { DateRange as DayPickerDateRange } from 'react-day-picker'

interface DateRangeFilterProps {
  selected: DateRange
  customRange?: CustomDateRange
  onSelect: (range: DateRange, customRange?: CustomDateRange) => void
}

const presets: { value: DateRange; label: string }[] = [
  { value: '1d', label: 'Today' },
  { value: '3d', label: '3D' },
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
]

export function DateRangeFilter({ selected, customRange, onSelect }: DateRangeFilterProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [tempRange, setTempRange] = useState<DayPickerDateRange | undefined>(
    customRange ? { from: customRange.from, to: customRange.to } : undefined
  )

  const handlePresetSelect = (range: DateRange) => {
    onSelect(range)
  }

  const handleApplyCustom = () => {
    if (tempRange?.from && tempRange?.to) {
      onSelect('custom', { from: tempRange.from, to: tempRange.to })
      setIsOpen(false)
    }
  }

  const handleClearCustom = () => {
    setTempRange(undefined)
    onSelect('7d')
    setIsOpen(false)
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      {/* Preset Buttons */}
      {presets.map((preset) => (
        <Button
          key={preset.value}
          variant={selected === preset.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => handlePresetSelect(preset.value)}
          className="min-w-[50px]"
        >
          {preset.label}
        </Button>
      ))}

      {/* Custom Date Range Picker */}
      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant={selected === 'custom' ? 'default' : 'outline'}
            size="sm"
            className="min-w-[120px] gap-2"
          >
            <CalendarIcon className="h-4 w-4" />
            {selected === 'custom' && customRange ? (
              <span className="text-xs">
                {format(customRange.from, 'MMM d')} - {format(customRange.to, 'MMM d')}
              </span>
            ) : (
              'Custom'
            )}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-auto p-0 bg-white" align="end">
          <div className="p-3 border-b">
            <div className="text-sm font-medium">Select Date Range</div>
            <div className="text-xs text-muted-foreground mt-1">
              {tempRange?.from ? (
                tempRange.to ? (
                  <>
                    {format(tempRange.from, 'LLL dd, yyyy')} - {format(tempRange.to, 'LLL dd, yyyy')}
                  </>
                ) : (
                  format(tempRange.from, 'LLL dd, yyyy')
                )
              ) : (
                'Pick a start and end date'
              )}
            </div>
          </div>
          <Calendar
            initialFocus
            mode="range"
            defaultMonth={tempRange?.from}
            selected={tempRange}
            onSelect={setTempRange}
            numberOfMonths={2}
            disabled={{ after: new Date() }}
          />
          <div className="p-3 border-t flex justify-between gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClearCustom}
              className="text-gray-500"
            >
              <X className="h-4 w-4 mr-1" />
              Clear
            </Button>
            <Button
              size="sm"
              onClick={handleApplyCustom}
              disabled={!tempRange?.from || !tempRange?.to}
            >
              Apply Range
            </Button>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
