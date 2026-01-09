'use client'

import { useState } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-900">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  )
}

const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone', count: 2341 },
  { value: 'IPAD', label: 'iPad', count: 892 },
  { value: 'MACBOOK', label: 'MacBook', count: 1203 },
  { value: 'IMAC', label: 'iMac', count: 234 },
  { value: 'MAC_MINI', label: 'Mac Mini', count: 156 },
  { value: 'APPLE_WATCH', label: 'Apple Watch', count: 456 },
  { value: 'AIRPODS', label: 'AirPods', count: 678 },
]

const conditions = [
  { value: 'NEW', label: 'New', count: 89 },
  { value: 'LIKE_NEW', label: 'Like New', count: 456 },
  { value: 'EXCELLENT', label: 'Excellent', count: 1203 },
  { value: 'GOOD', label: 'Good', count: 2145 },
  { value: 'FAIR', label: 'Fair', count: 876 },
  { value: 'POOR', label: 'Poor', count: 234 },
  { value: 'FOR_PARTS', label: 'For Parts', count: 123 },
]

const jailbreakStatuses = [
  { value: 'JAILBROKEN', label: 'Jailbroken', count: 456 },
  { value: 'JAILBREAKABLE', label: 'Jailbreakable', count: 1234 },
  { value: 'NOT_JAILBROKEN', label: 'Stock/Not JB', count: 3456 },
]

const storageOptions = [
  { value: 32, label: '32GB' },
  { value: 64, label: '64GB' },
  { value: 128, label: '128GB' },
  { value: 256, label: '256GB' },
  { value: 512, label: '512GB' },
  { value: 1024, label: '1TB' },
]

export function SearchFilters() {
  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedJBStatus, setSelectedJBStatus] = useState<string[]>([])
  const [selectedStorage, setSelectedStorage] = useState<number[]>([])
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [osVersionMin, setOsVersionMin] = useState('')
  const [osVersionMax, setOsVersionMax] = useState('')
  const [bootromOnly, setBootromOnly] = useState(false)

  const toggleArrayValue = <T,>(array: T[], value: T, setter: (arr: T[]) => void) => {
    if (array.includes(value)) {
      setter(array.filter((v) => v !== value))
    } else {
      setter([...array, value])
    }
  }

  const handleApplyFilters = () => {
    const params = new URLSearchParams()

    if (selectedDeviceTypes.length) params.set('deviceType', selectedDeviceTypes.join(','))
    if (selectedConditions.length) params.set('condition', selectedConditions.join(','))
    if (selectedJBStatus.length) params.set('jailbreakStatus', selectedJBStatus.join(','))
    if (selectedStorage.length) params.set('storage', selectedStorage.join(','))
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (osVersionMin) params.set('osVersionMin', osVersionMin)
    if (osVersionMax) params.set('osVersionMax', osVersionMax)
    if (bootromOnly) params.set('bootromExploit', 'true')

    window.location.href = `/search?${params.toString()}`
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4">
      <h2 className="font-semibold text-lg mb-4">Filters</h2>

      {/* Device Type */}
      <FilterSection title="Device Type">
        <div className="space-y-2">
          {deviceTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDeviceTypes.includes(type.value)}
                onChange={() => toggleArrayValue(selectedDeviceTypes, type.value, setSelectedDeviceTypes)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{type.label}</span>
              <span className="text-xs text-gray-400 ml-auto">({type.count})</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Price Range */}
      <FilterSection title="Price">
        <div className="flex items-center gap-2">
          <input
            type="number"
            placeholder="Min"
            value={minPrice}
            onChange={(e) => setMinPrice(e.target.value)}
            className="input py-1.5 text-sm w-full"
          />
          <span className="text-gray-400">-</span>
          <input
            type="number"
            placeholder="Max"
            value={maxPrice}
            onChange={(e) => setMaxPrice(e.target.value)}
            className="input py-1.5 text-sm w-full"
          />
        </div>
        {/* Quick price buttons */}
        <div className="flex flex-wrap gap-1 mt-2">
          {['$0-200', '$200-500', '$500-1000', '$1000+'].map((range) => (
            <button
              key={range}
              className="text-xs px-2 py-1 bg-gray-100 hover:bg-gray-200 rounded text-gray-600"
            >
              {range}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* iOS Version Range */}
      <FilterSection title="iOS Version">
        <div className="space-y-3">
          <div className="flex items-center gap-2">
            <input
              type="text"
              placeholder="From (e.g., 14.0)"
              value={osVersionMin}
              onChange={(e) => setOsVersionMin(e.target.value)}
              className="input py-1.5 text-sm w-full"
            />
            <span className="text-gray-400">-</span>
            <input
              type="text"
              placeholder="To (e.g., 16.1.2)"
              value={osVersionMax}
              onChange={(e) => setOsVersionMax(e.target.value)}
              className="input py-1.5 text-sm w-full"
            />
          </div>
          {/* Popular iOS versions */}
          <div>
            <p className="text-xs text-gray-500 mb-1">Popular versions:</p>
            <div className="flex flex-wrap gap-1">
              {['17.0', '16.6.1', '16.5', '15.4.1', '14.8'].map((ver) => (
                <button
                  key={ver}
                  onClick={() => {
                    setOsVersionMin(ver)
                    setOsVersionMax(ver)
                  }}
                  className="text-xs px-2 py-1 bg-purple-100 hover:bg-purple-200 rounded text-purple-700"
                >
                  {ver}
                </button>
              ))}
            </div>
          </div>
        </div>
      </FilterSection>

      {/* Jailbreak Status */}
      <FilterSection title="Jailbreak Status">
        <div className="space-y-2">
          {jailbreakStatuses.map((status) => (
            <label key={status.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedJBStatus.includes(status.value)}
                onChange={() => toggleArrayValue(selectedJBStatus, status.value, setSelectedJBStatus)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{status.label}</span>
              <span className="text-xs text-gray-400 ml-auto">({status.count})</span>
            </label>
          ))}
        </div>

        {/* Jailbreak-specific options */}
        <div className="mt-3 pt-3 border-t border-gray-100 space-y-2">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={bootromOnly}
              onChange={(e) => setBootromOnly(e.target.checked)}
              className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
            />
            <span className="text-sm text-gray-700">checkm8 device only</span>
          </label>
        </div>
      </FilterSection>

      {/* Condition */}
      <FilterSection title="Condition">
        <div className="space-y-2">
          {conditions.map((condition) => (
            <label key={condition.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedConditions.includes(condition.value)}
                onChange={() => toggleArrayValue(selectedConditions, condition.value, setSelectedConditions)}
                className="rounded border-gray-300 text-primary-600 focus:ring-primary-500"
              />
              <span className="text-sm text-gray-700">{condition.label}</span>
              <span className="text-xs text-gray-400 ml-auto">({condition.count})</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Storage */}
      <FilterSection title="Storage" defaultOpen={false}>
        <div className="flex flex-wrap gap-2">
          {storageOptions.map((storage) => (
            <button
              key={storage.value}
              onClick={() => toggleArrayValue(selectedStorage, storage.value, setSelectedStorage)}
              className={`px-3 py-1.5 rounded-full text-sm border transition-colors ${
                selectedStorage.includes(storage.value)
                  ? 'bg-primary-600 text-white border-primary-600'
                  : 'bg-white text-gray-700 border-gray-300 hover:border-primary-600'
              }`}
            >
              {storage.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* Apply/Reset buttons */}
      <div className="pt-4 space-y-2">
        <button
          onClick={handleApplyFilters}
          className="btn-primary w-full"
        >
          Apply Filters
        </button>
        <button
          onClick={() => {
            setSelectedDeviceTypes([])
            setSelectedConditions([])
            setSelectedJBStatus([])
            setSelectedStorage([])
            setMinPrice('')
            setMaxPrice('')
            setOsVersionMin('')
            setOsVersionMax('')
            setBootromOnly(false)
          }}
          className="btn-secondary w-full"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}
