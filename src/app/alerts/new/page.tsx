'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  ChevronLeft,
  Save,
  Loader2
} from 'lucide-react'
import { getModelsForDeviceType } from '@/lib/device-models'
import { ModelAutocomplete } from '@/components/ui/ModelAutocomplete'

const deviceTypes = [
  { value: '', label: 'Any device type' },
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'MacBook' },
  { value: 'APPLE_WATCH', label: 'Apple Watch' },
]

const jailbreakStatuses = [
  { value: '', label: 'Any status' },
  { value: 'JAILBREAKABLE', label: 'Jailbreakable' },
  { value: 'NOT_JAILBROKEN', label: 'Stock (Not Jailbreakable)' },
]

const versionFilterTypes = [
  { value: 'any', label: 'Any version' },
  { value: 'atOrBelow', label: 'At or below' },
  { value: 'atOrAbove', label: 'At or above' },
  { value: 'exact', label: 'Exact version' },
  { value: 'range', label: 'Version range' },
]

// Granular versions for jailbreak targeting
const iosVersions = [
  '18.2', '18.1', '18.0',
  '17.7', '17.6', '17.5', '17.4', '17.3', '17.2', '17.1', '17.0',
  '16.7', '16.6', '16.5', '16.4', '16.3', '16.2', '16.1', '16.0',
  '15.8', '15.7', '15.6', '15.5', '15.4', '15.3', '15.2', '15.1', '15.0',
  '14.8', '14.7', '14.6', '14.5', '14.4', '14.3', '14.2', '14.1', '14.0',
  '13.7', '13.5', '13.0', '12.5', '12.4', '12.0', '11.0', '10.0',
]

const macosVersions = [
  '15.2', '15.1', '15.0',
  '14.7', '14.6', '14.5', '14.4', '14.3', '14.2', '14.1', '14.0',
  '13.6', '13.5', '13.4', '13.3', '13.2', '13.1', '13.0',
  '12.7', '12.6', '12.5', '12.0', '11.0',
]

const watchosVersions = [
  '11.2', '11.1', '11.0',
  '10.6', '10.5', '10.4', '10.3', '10.2', '10.1', '10.0',
  '9.6', '9.5', '9.4', '9.0', '8.7', '8.5', '8.0', '7.0',
]

export default function NewAlertPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    name: '',
    deviceType: '',
    deviceModel: '',
    versionFilterType: 'any',
    osVersionMin: '',
    osVersionMax: '',
    osVersionExact: '',
    conditionMin: '',
    jailbreakStatus: '',
    bootromExploitOnly: false,
    storageMinGB: '',
    storageMaxGB: '',
    priceMin: '',
    priceMax: '',
    emailNotify: true,
  })

  // Get versions based on device type
  const getVersionsForDevice = () => {
    if (formData.deviceType === 'MACBOOK') return macosVersions
    if (formData.deviceType === 'APPLE_WATCH') return watchosVersions
    return iosVersions
  }

  const getOsName = () => {
    if (formData.deviceType === 'MACBOOK') return 'macOS'
    if (formData.deviceType === 'APPLE_WATCH') return 'watchOS'
    return 'iOS'
  }

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/alerts/new')
    }
  }, [status, router])

  const availableModels = formData.deviceType
    ? getModelsForDeviceType(formData.deviceType)
    : []

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setSaving(true)
    setError(null)

    if (!formData.name) {
      setError('Please give your alert a name')
      setSaving(false)
      return
    }

    try {
      // Build version parameters based on filter type
      let osVersionMin: string | null = null
      let osVersionMax: string | null = null
      let osVersionExact: string | null = null

      switch (formData.versionFilterType) {
        case 'atOrBelow':
          osVersionMax = formData.osVersionMax || null
          break
        case 'atOrAbove':
          osVersionMin = formData.osVersionMin || null
          break
        case 'exact':
          osVersionExact = formData.osVersionExact || null
          break
        case 'range':
          osVersionMin = formData.osVersionMin || null
          osVersionMax = formData.osVersionMax || null
          break
      }

      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: formData.name,
          deviceType: formData.deviceType || null,
          deviceModel: formData.deviceModel || null,
          osVersionMin,
          osVersionMax,
          osVersionExact,
          conditionMin: formData.conditionMin || null,
          jailbreakStatus: formData.jailbreakStatus || null,
          bootromExploitOnly: formData.bootromExploitOnly,
          storageMinGB: formData.storageMinGB ? parseInt(formData.storageMinGB) : null,
          storageMaxGB: formData.storageMaxGB ? parseInt(formData.storageMaxGB) : null,
          priceMin: formData.priceMin ? parseFloat(formData.priceMin) : null,
          priceMax: formData.priceMax ? parseFloat(formData.priceMax) : null,
          emailNotify: formData.emailNotify,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create alert')
      }

      router.push('/alerts')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create alert')
    } finally {
      setSaving(false)
    }
  }

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/alerts" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Alerts
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Create Device Alert</h1>
          <p className="text-gray-600">Get notified when a matching device is listed</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Alert Name */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Alert Name</h2>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              placeholder="e.g., iPhone 14 Pro on iOS 16.x"
              className="input"
            />
            <p className="text-xs text-gray-500 mt-1">
              Give your alert a descriptive name so you can identify it later
            </p>
          </div>

          {/* Device Criteria */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Device Criteria</h2>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1 block">Device Type</label>
                  <select
                    value={formData.deviceType}
                    onChange={(e) => setFormData({ ...formData, deviceType: e.target.value, deviceModel: '' })}
                    className="input"
                  >
                    {deviceTypes.map((type) => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block">Model</label>
                  {formData.deviceType ? (
                    <ModelAutocomplete
                      models={availableModels}
                      value={formData.deviceModel}
                      onChange={(value) => setFormData({ ...formData, deviceModel: value })}
                      placeholder="Any model (type to filter)"
                    />
                  ) : (
                    <input
                      type="text"
                      disabled
                      placeholder="Select device type first"
                      className="input"
                    />
                  )}
                  <p className="text-xs text-gray-500 mt-1">
                    Leave empty to match any model
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="label mb-1 block">Min Storage (GB)</label>
                  <input
                    type="number"
                    value={formData.storageMinGB}
                    onChange={(e) => setFormData({ ...formData, storageMinGB: e.target.value })}
                    placeholder="e.g., 128"
                    className="input"
                  />
                </div>
                <div>
                  <label className="label mb-1 block">Max Storage (GB)</label>
                  <input
                    type="number"
                    value={formData.storageMaxGB}
                    onChange={(e) => setFormData({ ...formData, storageMaxGB: e.target.value })}
                    placeholder="e.g., 512"
                    className="input"
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Software Version */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">{getOsName()} Version</h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-1 block">Filter Type</label>
                <select
                  value={formData.versionFilterType}
                  onChange={(e) => setFormData({ ...formData, versionFilterType: e.target.value })}
                  className="input"
                >
                  {versionFilterTypes.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
              </div>

              {formData.versionFilterType === 'atOrBelow' && (
                <div>
                  <label className="label mb-1 block">{getOsName()} Version (or below)</label>
                  <select
                    value={formData.osVersionMax}
                    onChange={(e) => setFormData({ ...formData, osVersionMax: e.target.value })}
                    className="input"
                  >
                    <option value="">Select version</option>
                    {getVersionsForDevice().map((version) => (
                      <option key={version} value={version}>{getOsName()} {version}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Great for finding jailbreakable devices on older firmware
                  </p>
                </div>
              )}

              {formData.versionFilterType === 'atOrAbove' && (
                <div>
                  <label className="label mb-1 block">{getOsName()} Version (or above)</label>
                  <select
                    value={formData.osVersionMin}
                    onChange={(e) => setFormData({ ...formData, osVersionMin: e.target.value })}
                    className="input"
                  >
                    <option value="">Select version</option>
                    {getVersionsForDevice().map((version) => (
                      <option key={version} value={version}>{getOsName()} {version}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Find devices with newer software
                  </p>
                </div>
              )}

              {formData.versionFilterType === 'exact' && (
                <div>
                  <label className="label mb-1 block">Exact {getOsName()} Version</label>
                  <select
                    value={formData.osVersionExact}
                    onChange={(e) => setFormData({ ...formData, osVersionExact: e.target.value })}
                    className="input"
                  >
                    <option value="">Select version</option>
                    {getVersionsForDevice().map((version) => (
                      <option key={version} value={version}>{getOsName()} {version}</option>
                    ))}
                  </select>
                  <p className="text-xs text-gray-500 mt-1">
                    Match only this specific version
                  </p>
                </div>
              )}

              {formData.versionFilterType === 'range' && (
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="label mb-1 block">Minimum Version</label>
                    <select
                      value={formData.osVersionMin}
                      onChange={(e) => setFormData({ ...formData, osVersionMin: e.target.value })}
                      className="input"
                    >
                      <option value="">Select version</option>
                      {getVersionsForDevice().map((version) => (
                        <option key={version} value={version}>{getOsName()} {version}</option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="label mb-1 block">Maximum Version</label>
                    <select
                      value={formData.osVersionMax}
                      onChange={(e) => setFormData({ ...formData, osVersionMax: e.target.value })}
                      className="input"
                    >
                      <option value="">Select version</option>
                      {getVersionsForDevice().map((version) => (
                        <option key={version} value={version}>{getOsName()} {version}</option>
                      ))}
                    </select>
                  </div>
                </div>
              )}

              {formData.versionFilterType === 'any' && (
                <p className="text-sm text-gray-500">
                  Match devices on any {getOsName()} version
                </p>
              )}
            </div>
          </div>

          {/* Jailbreak Criteria */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Jailbreak Criteria</h2>
            <div className="space-y-4">
              <div>
                <label className="label mb-1 block">Jailbreak Status</label>
                <select
                  value={formData.jailbreakStatus}
                  onChange={(e) => setFormData({ ...formData, jailbreakStatus: e.target.value })}
                  className="input"
                >
                  {jailbreakStatuses.map((status) => (
                    <option key={status.value} value={status.value}>{status.label}</option>
                  ))}
                </select>
              </div>

              <label className="flex items-center gap-3 cursor-pointer p-3 bg-gray-50 rounded-lg">
                <input
                  type="checkbox"
                  checked={formData.bootromExploitOnly}
                  onChange={(e) => setFormData({ ...formData, bootromExploitOnly: e.target.checked })}
                  className="rounded border-gray-300 text-primary-600"
                />
                <div>
                  <span className="font-medium">checkm8 devices only</span>
                  <p className="text-sm text-gray-500">Only match devices with bootrom exploit (iPhone X and earlier)</p>
                </div>
              </label>
            </div>
          </div>

          {/* Price Range */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Price Range</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="label mb-1 block">Min Price ($)</label>
                <input
                  type="number"
                  value={formData.priceMin}
                  onChange={(e) => setFormData({ ...formData, priceMin: e.target.value })}
                  placeholder="0"
                  className="input"
                  min="0"
                />
              </div>
              <div>
                <label className="label mb-1 block">Max Price ($)</label>
                <input
                  type="number"
                  value={formData.priceMax}
                  onChange={(e) => setFormData({ ...formData, priceMax: e.target.value })}
                  placeholder="Any"
                  className="input"
                  min="0"
                />
              </div>
            </div>
          </div>

          {/* Minimum Condition */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">Minimum Condition</h2>
            <div>
              <select
                value={formData.conditionMin}
                onChange={(e) => setFormData({ ...formData, conditionMin: e.target.value })}
                className="input"
              >
                <option value="">Any condition</option>
                <option value="NEW">New or better</option>
                <option value="LIKE_NEW">Like New or better</option>
                <option value="EXCELLENT">Excellent or better</option>
                <option value="GOOD">Good or better</option>
                <option value="FAIR">Fair or better</option>
                <option value="POOR">Poor or better</option>
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Only match devices at or above this condition level
              </p>
            </div>
          </div>

          {/* Error Message */}
          {error && (
            <div className="p-4 bg-red-50 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          {/* Submit */}
          <div className="flex justify-end gap-4">
            <Link href="/alerts" className="btn-secondary">
              Cancel
            </Link>
            <button type="submit" disabled={saving} className="btn-primary flex items-center gap-2">
              {saving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Bell className="w-4 h-4" />
                  Create Alert
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
