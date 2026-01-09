'use client'

import { useState, useMemo } from 'react'
import Link from 'next/link'
import {
  Search,
  ChevronLeft,
  CheckCircle,
  XCircle,
  AlertCircle,
  Smartphone,
  Info,
  ExternalLink
} from 'lucide-react'
import {
  checkJailbreakCompatibility,
  getSupportedDevices,
  JailbreakResult
} from '@/lib/jailbreak-compatibility'
import { ModelAutocomplete } from '@/components/ui/ModelAutocomplete'
import { DeviceModel } from '@/lib/device-models'

// Convert device names to DeviceModel format for autocomplete
const deviceModels: DeviceModel[] = getSupportedDevices()
  .filter(d => d.startsWith('iPhone') || d.startsWith('iPad') || d.startsWith('iPod'))
  .map(name => ({
    value: name,
    label: name,
    storageOptions: [],
  }))

export default function JailbreakCheckerPage() {
  const [deviceModel, setDeviceModel] = useState('')
  const [iosVersion, setIosVersion] = useState('')
  const [result, setResult] = useState<JailbreakResult | null>(null)
  const [checked, setChecked] = useState(false)

  const checkJailbreak = () => {
    setChecked(true)
    const compatResult = checkJailbreakCompatibility(deviceModel, iosVersion)
    setResult(compatResult)
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Home
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Jailbreak Compatibility Checker</h1>
          <p className="text-gray-600">Check if your device and iOS version can be jailbroken</p>
        </div>

        {/* Checker Form */}
        <div className="card p-6 mb-6">
          <div className="space-y-4">
            <div>
              <label htmlFor="device" className="label mb-1 block">Device Model</label>
              <ModelAutocomplete
                models={deviceModels}
                value={deviceModel}
                onChange={(value) => {
                  setDeviceModel(value)
                  setChecked(false)
                  setResult(null)
                }}
                placeholder="Type to search (e.g., iPhone 14)"
              />
            </div>

            <div>
              <label htmlFor="ios" className="label mb-1 block">iOS Version</label>
              <input
                id="ios"
                type="text"
                value={iosVersion}
                onChange={(e) => {
                  setIosVersion(e.target.value)
                  setChecked(false)
                  setResult(null)
                }}
                placeholder="e.g., 16.1.2"
                className="input"
              />
              <p className="text-xs text-gray-500 mt-1">
                Find this in Settings → General → About → iOS Version
              </p>
            </div>

            <button
              onClick={checkJailbreak}
              disabled={!deviceModel || !iosVersion}
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <Search className="w-4 h-4" />
              Check Compatibility
            </button>
          </div>
        </div>

        {/* Result */}
        {checked && result && (
          <div className={`card p-6 border-2 ${
            result.canJailbreak ? 'border-green-500 bg-green-50' :
            result.status === 'NOT_JAILBROKEN' ? 'border-red-500 bg-red-50' :
            'border-yellow-500 bg-yellow-50'
          }`}>
            <div className="flex items-start gap-4">
              {result.canJailbreak ? (
                <CheckCircle className="w-8 h-8 text-green-600 flex-shrink-0" />
              ) : result.status === 'NOT_JAILBROKEN' ? (
                <XCircle className="w-8 h-8 text-red-600 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-8 h-8 text-yellow-600 flex-shrink-0" />
              )}

              <div className="flex-1">
                <h3 className={`text-lg font-bold ${
                  result.canJailbreak ? 'text-green-900' :
                  result.status === 'NOT_JAILBROKEN' ? 'text-red-900' :
                  'text-yellow-900'
                }`}>
                  {result.canJailbreak ? 'Jailbreakable!' :
                   result.status === 'NOT_JAILBROKEN' ? 'Not Jailbreakable' :
                   'Unknown Status'}
                </h3>

                <p className="text-gray-700 mt-1">
                  {deviceModel} on iOS {iosVersion}
                </p>

                {result.hasBootromExploit && (
                  <div className="mt-3 inline-flex items-center gap-1 bg-amber-100 text-amber-800 px-3 py-1 rounded-full text-sm font-medium">
                    <Smartphone className="w-4 h-4" />
                    checkm8 compatible
                  </div>
                )}

                {result.tools.length > 0 && (
                  <div className="mt-4">
                    <p className="font-medium text-gray-900 mb-2">Available Tools:</p>
                    <div className="space-y-2">
                      {result.tools.map((tool, i) => (
                        <div key={i} className="flex items-center justify-between bg-white p-3 rounded-lg">
                          <div>
                            <span className="font-medium">{tool.name}</span>
                            <span className="text-gray-500 text-sm ml-2">({tool.type})</span>
                            {tool.notes && (
                              <p className="text-sm text-gray-600 mt-1">{tool.notes}</p>
                            )}
                          </div>
                          {tool.website && (
                            <a
                              href={tool.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="btn-secondary text-sm flex items-center gap-1"
                            >
                              <ExternalLink className="w-3 h-3" />
                              Visit
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {result.notes && (
                  <div className="mt-4 flex items-start gap-2 text-gray-600">
                    <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
                    <p className="text-sm">{result.notes}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Info Box */}
        <div className="card p-6 mt-6 bg-blue-50 border-blue-200">
          <div className="flex items-start gap-3">
            <Info className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
            <div>
              <h3 className="font-medium text-blue-900">About This Tool</h3>
              <p className="text-sm text-blue-700 mt-1">
                This checker uses community-maintained jailbreak compatibility data. For the most
                up-to-date information, always check resources like{' '}
                <a href="https://ios.cfw.guide" target="_blank" rel="noopener noreferrer" className="underline">
                  ios.cfw.guide
                </a>{' '}
                or{' '}
                <a href="https://reddit.com/r/jailbreak" target="_blank" rel="noopener noreferrer" className="underline">
                  r/jailbreak
                </a>.
              </p>
            </div>
          </div>
        </div>

        {/* CTA */}
        <div className="card p-6 mt-6 text-center">
          <h3 className="font-semibold text-gray-900 mb-2">Looking for a jailbreakable device?</h3>
          <p className="text-gray-600 mb-4">
            Browse our marketplace for devices on jailbreakable iOS versions.
          </p>
          <Link href="/search?jailbreakStatus=JAILBREAKABLE" className="btn-primary">
            Browse Jailbreakable Devices
          </Link>
        </div>
      </div>
    </div>
  )
}
