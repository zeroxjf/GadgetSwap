'use client'

import { useState } from 'react'
import { Search } from 'lucide-react'
import { useRouter } from 'next/navigation'

const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
]

const iosVersions = [
  { value: '18', label: 'iOS 18' },
  { value: '17', label: 'iOS 17' },
  { value: '16', label: 'iOS 16' },
  { value: '15', label: 'iOS 15' },
  { value: '14', label: 'iOS 14' },
]

export function JailbreakSearch() {
  const router = useRouter()
  const [deviceType, setDeviceType] = useState('IPHONE')
  const [osVersion, setOsVersion] = useState('')

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

        {/* iOS/iPadOS Version */}
        <div>
          <label className="block text-sm font-medium mb-2 text-white/80">
            iOS/iPadOS Version
          </label>
          <select
            value={osVersion}
            onChange={(e) => setOsVersion(e.target.value)}
            className="w-full px-4 py-2.5 rounded-lg bg-white/20 border border-white/30 text-white placeholder-white/60 focus:outline-none focus:ring-2 focus:ring-white/50"
          >
            <option value="" className="text-gray-900">Any version</option>
            {iosVersions.map((version) => (
              <option key={version.value} value={version.value} className="text-gray-900">
                {version.label}
              </option>
            ))}
          </select>
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
