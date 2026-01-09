'use client'

import { useState } from 'react'
import { Search, ChevronDown } from 'lucide-react'
import { useRouter } from 'next/navigation'

const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'MacBook' },
  { value: 'APPLE_WATCH', label: 'Apple Watch' },
]

const popularVersions = [
  '17.0', '16.6.1', '16.5', '16.1.2', '16.0',
  '15.4.1', '15.1', '14.8', '14.3'
]

export function JailbreakSearch() {
  const router = useRouter()
  const [deviceType, setDeviceType] = useState('IPHONE')
  const [osVersion, setOsVersion] = useState('')
  const [showVersionPicker, setShowVersionPicker] = useState(false)

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()

    const params = new URLSearchParams()
    if (deviceType) params.set('deviceType', deviceType)
    if (osVersion) params.set('osVersion', osVersion)

    router.push(`/search?${params.toString()}`)
  }

  return (
    <form onSubmit={handleSearch}>
      <div className="space-y-4">
        {/* Device Type */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">
            Device Type
          </label>
          <select
            value={deviceType}
            onChange={(e) => setDeviceType(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            {deviceTypes.map((type) => (
              <option key={type.value} value={type.value} className="text-gray-900">
                {type.label}
              </option>
            ))}
          </select>
        </div>

        {/* iOS Version */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">
            iOS Version
          </label>
          <div className="relative">
            <input
              type="text"
              value={osVersion}
              onChange={(e) => setOsVersion(e.target.value)}
              onFocus={() => setShowVersionPicker(true)}
              onBlur={() => setTimeout(() => setShowVersionPicker(false), 200)}
              placeholder="e.g., 15.4.1"
              className="w-full px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
            />

            {/* Quick version picker */}
            {showVersionPicker && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white rounded-lg shadow-lg p-2 z-10">
                <p className="text-xs text-gray-500 px-2 mb-1">Popular versions:</p>
                <div className="flex flex-wrap gap-1">
                  {popularVersions.map((version) => (
                    <button
                      key={version}
                      type="button"
                      onClick={() => {
                        setOsVersion(version)
                        setShowVersionPicker(false)
                      }}
                      className="px-2 py-1 text-sm bg-gray-100 hover:bg-primary-100 hover:text-primary-700 rounded text-gray-700"
                    >
                      {version}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Quick filters */}
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => router.push('/search?jailbreakStatus=JAILBREAKABLE')}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
          >
            Jailbreakable Only
          </button>
          <button
            type="button"
            onClick={() => router.push('/search?bootromExploit=true')}
            className="text-xs px-3 py-1.5 rounded-full bg-white/20 hover:bg-white/30 text-white border border-white/30 transition-colors"
          >
            checkm8 Devices
          </button>
        </div>

        {/* Search button */}
        <button
          type="submit"
          className="w-full btn bg-white text-primary-700 hover:bg-primary-50 py-3 font-semibold flex items-center justify-center gap-2"
        >
          <Search className="w-4 h-4" />
          Search Devices
        </button>
      </div>
    </form>
  )
}
