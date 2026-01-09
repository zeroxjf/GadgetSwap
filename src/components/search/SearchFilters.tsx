'use client'

import { useState, useEffect } from 'react'
import { ChevronDown, ChevronUp } from 'lucide-react'
import { useSearchParams } from 'next/navigation'

interface FilterSectionProps {
  title: string
  children: React.ReactNode
  defaultOpen?: boolean
}

function FilterSection({ title, children, defaultOpen = true }: FilterSectionProps) {
  const [isOpen, setIsOpen] = useState(defaultOpen)

  return (
    <div className="border-b border-gray-200 dark:border-gray-700 py-4">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="flex items-center justify-between w-full text-left"
      >
        <span className="font-medium text-gray-900 dark:text-white">{title}</span>
        {isOpen ? (
          <ChevronUp className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        ) : (
          <ChevronDown className="w-4 h-4 text-gray-500 dark:text-gray-400" />
        )}
      </button>
      {isOpen && <div className="mt-3">{children}</div>}
    </div>
  )
}

const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'MacBook' },
  { value: 'IMAC', label: 'iMac' },
  { value: 'MAC_MINI', label: 'Mac Mini' },
  { value: 'APPLE_WATCH', label: 'Apple Watch' },
  { value: 'AIRPODS', label: 'AirPods' },
]

// Models per device type
const modelsByDeviceType: Record<string, { value: string; label: string }[]> = {
  IPHONE: [
    { value: 'iPhone 16 Pro Max', label: 'iPhone 16 Pro Max' },
    { value: 'iPhone 16 Pro', label: 'iPhone 16 Pro' },
    { value: 'iPhone 16 Plus', label: 'iPhone 16 Plus' },
    { value: 'iPhone 16', label: 'iPhone 16' },
    { value: 'iPhone 15 Pro Max', label: 'iPhone 15 Pro Max' },
    { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro' },
    { value: 'iPhone 15 Plus', label: 'iPhone 15 Plus' },
    { value: 'iPhone 15', label: 'iPhone 15' },
    { value: 'iPhone 14 Pro Max', label: 'iPhone 14 Pro Max' },
    { value: 'iPhone 14 Pro', label: 'iPhone 14 Pro' },
    { value: 'iPhone 14 Plus', label: 'iPhone 14 Plus' },
    { value: 'iPhone 14', label: 'iPhone 14' },
    { value: 'iPhone 13 Pro Max', label: 'iPhone 13 Pro Max' },
    { value: 'iPhone 13 Pro', label: 'iPhone 13 Pro' },
    { value: 'iPhone 13', label: 'iPhone 13' },
    { value: 'iPhone 13 mini', label: 'iPhone 13 mini' },
    { value: 'iPhone 12 Pro Max', label: 'iPhone 12 Pro Max' },
    { value: 'iPhone 12 Pro', label: 'iPhone 12 Pro' },
    { value: 'iPhone 12', label: 'iPhone 12' },
    { value: 'iPhone 12 mini', label: 'iPhone 12 mini' },
    { value: 'iPhone 11 Pro Max', label: 'iPhone 11 Pro Max' },
    { value: 'iPhone 11 Pro', label: 'iPhone 11 Pro' },
    { value: 'iPhone 11', label: 'iPhone 11' },
    { value: 'iPhone XS Max', label: 'iPhone XS Max' },
    { value: 'iPhone XS', label: 'iPhone XS' },
    { value: 'iPhone XR', label: 'iPhone XR' },
    { value: 'iPhone X', label: 'iPhone X' },
    { value: 'iPhone SE', label: 'iPhone SE' },
    { value: 'iPhone 8 Plus', label: 'iPhone 8 Plus' },
    { value: 'iPhone 8', label: 'iPhone 8' },
  ],
  IPAD: [
    { value: 'iPad Pro 13-inch (M4)', label: 'iPad Pro 13" (M4)' },
    { value: 'iPad Pro 11-inch (M4)', label: 'iPad Pro 11" (M4)' },
    { value: 'iPad Pro 12.9-inch (6th gen)', label: 'iPad Pro 12.9" (6th gen)' },
    { value: 'iPad Pro 11-inch (4th gen)', label: 'iPad Pro 11" (4th gen)' },
    { value: 'iPad Air 13-inch (M2)', label: 'iPad Air 13" (M2)' },
    { value: 'iPad Air 11-inch (M2)', label: 'iPad Air 11" (M2)' },
    { value: 'iPad Air (5th gen)', label: 'iPad Air (5th gen)' },
    { value: 'iPad (10th gen)', label: 'iPad (10th gen)' },
    { value: 'iPad (9th gen)', label: 'iPad (9th gen)' },
    { value: 'iPad mini (6th gen)', label: 'iPad mini (6th gen)' },
    { value: 'iPad mini (5th gen)', label: 'iPad mini (5th gen)' },
  ],
  MACBOOK: [
    { value: 'MacBook Pro 16 (M4)', label: 'MacBook Pro 16" (M4)' },
    { value: 'MacBook Pro 14 (M4)', label: 'MacBook Pro 14" (M4)' },
    { value: 'MacBook Pro 16 (M3)', label: 'MacBook Pro 16" (M3)' },
    { value: 'MacBook Pro 14 (M3)', label: 'MacBook Pro 14" (M3)' },
    { value: 'MacBook Pro 16 (M2)', label: 'MacBook Pro 16" (M2)' },
    { value: 'MacBook Pro 14 (M2)', label: 'MacBook Pro 14" (M2)' },
    { value: 'MacBook Pro 13 (M2)', label: 'MacBook Pro 13" (M2)' },
    { value: 'MacBook Air 15 (M3)', label: 'MacBook Air 15" (M3)' },
    { value: 'MacBook Air 13 (M3)', label: 'MacBook Air 13" (M3)' },
    { value: 'MacBook Air 15 (M2)', label: 'MacBook Air 15" (M2)' },
    { value: 'MacBook Air 13 (M2)', label: 'MacBook Air 13" (M2)' },
    { value: 'MacBook Air (M1)', label: 'MacBook Air (M1)' },
  ],
  IMAC: [
    { value: 'iMac 24 (M4)', label: 'iMac 24" (M4)' },
    { value: 'iMac 24 (M3)', label: 'iMac 24" (M3)' },
    { value: 'iMac 24 (M1)', label: 'iMac 24" (M1)' },
    { value: 'iMac 27 (2020)', label: 'iMac 27" (2020)' },
    { value: 'iMac Pro', label: 'iMac Pro' },
  ],
  MAC_MINI: [
    { value: 'Mac mini (M4)', label: 'Mac mini (M4)' },
    { value: 'Mac mini (M2)', label: 'Mac mini (M2)' },
    { value: 'Mac mini (M1)', label: 'Mac mini (M1)' },
  ],
  APPLE_WATCH: [
    { value: 'Apple Watch Ultra 2', label: 'Apple Watch Ultra 2' },
    { value: 'Apple Watch Ultra', label: 'Apple Watch Ultra' },
    { value: 'Apple Watch Series 10', label: 'Series 10' },
    { value: 'Apple Watch Series 9', label: 'Series 9' },
    { value: 'Apple Watch Series 8', label: 'Series 8' },
    { value: 'Apple Watch Series 7', label: 'Series 7' },
    { value: 'Apple Watch Series 6', label: 'Series 6' },
    { value: 'Apple Watch SE (2nd gen)', label: 'SE (2nd gen)' },
    { value: 'Apple Watch SE', label: 'SE' },
  ],
  AIRPODS: [
    { value: 'AirPods Pro (2nd gen)', label: 'AirPods Pro (2nd gen)' },
    { value: 'AirPods Pro', label: 'AirPods Pro (1st gen)' },
    { value: 'AirPods (4th gen)', label: 'AirPods (4th gen)' },
    { value: 'AirPods (3rd gen)', label: 'AirPods (3rd gen)' },
    { value: 'AirPods (2nd gen)', label: 'AirPods (2nd gen)' },
    { value: 'AirPods Max', label: 'AirPods Max' },
  ],
}

const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'FOR_PARTS', label: 'For Parts' },
]

const jailbreakStatuses = [
  { value: 'JAILBREAKABLE', label: 'Jailbreakable' },
  { value: 'NOT_JAILBROKEN', label: 'Stock (Not Jailbreakable)' },
]

// Simplified iOS versions - major versions only
const iosVersions = [
  { value: '18', label: 'iOS 18' },
  { value: '17', label: 'iOS 17' },
  { value: '16', label: 'iOS 16' },
  { value: '15', label: 'iOS 15' },
  { value: '14', label: 'iOS 14' },
  { value: '13', label: 'iOS 13 & below' },
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
  const searchParams = useSearchParams()

  // Initialize from URL params
  const initialDeviceType = searchParams.get('deviceType')?.split(',') || []

  const [selectedDeviceTypes, setSelectedDeviceTypes] = useState<string[]>(initialDeviceType)
  const [selectedModels, setSelectedModels] = useState<string[]>([])
  const [selectedConditions, setSelectedConditions] = useState<string[]>([])
  const [selectedJBStatus, setSelectedJBStatus] = useState<string[]>([])
  const [selectedStorage, setSelectedStorage] = useState<number[]>([])
  const [selectediOSVersion, setSelectediOSVersion] = useState<string>('')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [bootromOnly, setBootromOnly] = useState(false)

  // Get available models based on selected device type
  const availableModels = selectedDeviceTypes.length === 1
    ? modelsByDeviceType[selectedDeviceTypes[0]] || []
    : []

  // Clear models when device type changes
  useEffect(() => {
    setSelectedModels([])
  }, [selectedDeviceTypes.join(',')])

  // Check if iOS/jailbreak filters should show (only for iPhone/iPad)
  const showIOSFilters = selectedDeviceTypes.length === 0 ||
    selectedDeviceTypes.some(t => t === 'IPHONE' || t === 'IPAD')

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
    if (selectedModels.length) params.set('model', selectedModels.join(','))
    if (selectedConditions.length) params.set('condition', selectedConditions.join(','))
    if (selectedJBStatus.length) params.set('jailbreakStatus', selectedJBStatus.join(','))
    if (selectedStorage.length) params.set('storage', selectedStorage.join(','))
    if (minPrice) params.set('minPrice', minPrice)
    if (maxPrice) params.set('maxPrice', maxPrice)
    if (selectediOSVersion) params.set('osVersion', selectediOSVersion)
    if (bootromOnly) params.set('bootromExploit', 'true')

    window.location.href = `/search?${params.toString()}`
  }

  const handleReset = () => {
    setSelectedDeviceTypes([])
    setSelectedModels([])
    setSelectedConditions([])
    setSelectedJBStatus([])
    setSelectedStorage([])
    setMinPrice('')
    setMaxPrice('')
    setSelectediOSVersion('')
    setBootromOnly(false)
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 p-4">
      <h2 className="font-semibold text-lg mb-4 text-gray-900 dark:text-white">Filters</h2>

      {/* Device Type */}
      <FilterSection title="Device Type">
        <div className="space-y-2">
          {deviceTypes.map((type) => (
            <label key={type.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedDeviceTypes.includes(type.value)}
                onChange={() => toggleArrayValue(selectedDeviceTypes, type.value, setSelectedDeviceTypes)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{type.label}</span>
            </label>
          ))}
        </div>
      </FilterSection>

      {/* Model - only show when single device type is selected */}
      {availableModels.length > 0 && (
        <FilterSection title="Model">
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {availableModels.map((model) => (
              <label key={model.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedModels.includes(model.value)}
                  onChange={() => toggleArrayValue(selectedModels, model.value, setSelectedModels)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{model.label}</span>
              </label>
            ))}
          </div>
        </FilterSection>
      )}

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
          <span className="text-gray-400 dark:text-gray-500">-</span>
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
          {[
            { label: '$0-200', min: '0', max: '200' },
            { label: '$200-500', min: '200', max: '500' },
            { label: '$500-1000', min: '500', max: '1000' },
            { label: '$1000+', min: '1000', max: '' },
          ].map((range) => (
            <button
              key={range.label}
              onClick={() => {
                setMinPrice(range.min)
                setMaxPrice(range.max)
              }}
              className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded text-gray-600 dark:text-gray-300"
            >
              {range.label}
            </button>
          ))}
        </div>
      </FilterSection>

      {/* iOS Version - only show for iPhone/iPad or when no device type selected */}
      {showIOSFilters && (
        <FilterSection title="iOS/iPadOS Version">
          <div className="space-y-2">
            {iosVersions.map((version) => (
              <label key={version.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="radio"
                  name="iosVersion"
                  checked={selectediOSVersion === version.value}
                  onChange={() => setSelectediOSVersion(version.value)}
                  className="border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{version.label}</span>
              </label>
            ))}
            {selectediOSVersion && (
              <button
                onClick={() => setSelectediOSVersion('')}
                className="text-xs text-primary-600 hover:text-primary-700"
              >
                Clear selection
              </button>
            )}
          </div>
        </FilterSection>
      )}

      {/* Jailbreak Status - only show for iPhone/iPad */}
      {showIOSFilters && (
        <FilterSection title="Jailbreak Status">
          <div className="space-y-2">
            {jailbreakStatuses.map((status) => (
              <label key={status.value} className="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  checked={selectedJBStatus.includes(status.value)}
                  onChange={() => toggleArrayValue(selectedJBStatus, status.value, setSelectedJBStatus)}
                  className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
                />
                <span className="text-sm text-gray-700 dark:text-gray-300">{status.label}</span>
              </label>
            ))}
          </div>

          {/* Jailbreak-specific options */}
          <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-700 space-y-2">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={bootromOnly}
                onChange={(e) => setBootromOnly(e.target.checked)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">checkm8 device only</span>
            </label>
          </div>
        </FilterSection>
      )}

      {/* Condition */}
      <FilterSection title="Condition">
        <div className="space-y-2">
          {conditions.map((condition) => (
            <label key={condition.value} className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={selectedConditions.includes(condition.value)}
                onChange={() => toggleArrayValue(selectedConditions, condition.value, setSelectedConditions)}
                className="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500 dark:bg-gray-700"
              />
              <span className="text-sm text-gray-700 dark:text-gray-300">{condition.label}</span>
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
                  : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border-gray-300 dark:border-gray-600 hover:border-primary-600'
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
          onClick={handleReset}
          className="btn-secondary w-full"
        >
          Reset All
        </button>
      </div>
    </div>
  )
}
