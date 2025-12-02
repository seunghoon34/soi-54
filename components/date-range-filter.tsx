'use client'

import { Button } from '@/components/ui/button'
import { DateRange } from '@/lib/date-utils'

interface DateRangeFilterProps {
  selected: DateRange
  onSelect: (range: DateRange) => void
}

const ranges: { value: DateRange; label: string }[] = [
  { value: '1d', label: 'Today' },
  { value: '3d', label: '3D' },
  { value: '7d', label: '7D' },
  { value: '1m', label: '1M' },
  { value: '3m', label: '3M' },
  { value: '6m', label: '6M' },
  { value: '1y', label: '1Y' },
]

export function DateRangeFilter({ selected, onSelect }: DateRangeFilterProps) {
  return (
    <div className="flex flex-wrap gap-2">
      {ranges.map((range) => (
        <Button
          key={range.value}
          variant={selected === range.value ? 'default' : 'outline'}
          size="sm"
          onClick={() => onSelect(range.value)}
          className="min-w-[60px]"
        >
          {range.label}
        </Button>
      ))}
    </div>
  )
}

