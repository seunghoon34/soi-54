'use client'

import { useRouter, usePathname } from 'next/navigation'
import { ChevronDown, MapPin } from 'lucide-react'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { useState } from 'react'

const locations = [
  { id: 'daejeon', name: 'Daejeon', subtext: '대전점', path: '/' },
  { id: 'ewha', name: 'Ewha', subtext: '이화여대점', path: '/ewha' },
]

export function LocationSelector() {
  const router = useRouter()
  const pathname = usePathname()
  const [isOpen, setIsOpen] = useState(false)
  
  const currentLocation = locations.find(loc => loc.path === pathname) || locations[0]

  const handleSelect = (path: string) => {
    setIsOpen(false)
    router.push(path)
  }

  return (
    <Popover open={isOpen} onOpenChange={setIsOpen}>
      <PopoverTrigger asChild>
        <button className="flex items-center gap-2 hover:opacity-80 transition-opacity group">
          <h1 className="text-3xl font-bold tracking-tight">{currentLocation.name} Dashboard</h1>
          <ChevronDown className="w-5 h-5 text-gray-400 group-hover:text-gray-600 transition-colors" />
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-56 p-1 bg-white" align="start">
        <div className="text-xs text-gray-500 px-2 py-1.5 font-medium">Select Location</div>
        {locations.map((location) => (
          <button
            key={location.id}
            onClick={() => handleSelect(location.path)}
            className={`w-full flex items-center gap-3 px-2 py-2 rounded-md text-left transition-colors ${
              location.path === pathname
                ? 'bg-gray-100 text-gray-900'
                : 'hover:bg-gray-50 text-gray-700'
            }`}
          >
            <MapPin className={`w-4 h-4 ${location.path === pathname ? 'text-blue-500' : 'text-gray-400'}`} />
            <div>
              <div className="font-medium">{location.name}</div>
              <div className="text-xs text-gray-500">{location.subtext}</div>
            </div>
            {location.path === pathname && (
              <div className="ml-auto w-2 h-2 rounded-full bg-blue-500" />
            )}
          </button>
        ))}
      </PopoverContent>
    </Popover>
  )
}

