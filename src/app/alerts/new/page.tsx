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

const iosVersions = [
  { value: '', label: 'Any iOS version' },
  { value: '18', label: 'iOS 18' },
  { value: '17', label: 'iOS 17' },
  { value: '16', label: 'iOS 16' },
  { value: '15', label: 'iOS 15' },
  { value: '14', label: 'iOS 14' },
  { value: '13', label: 'iOS 13 & below' },
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
    osVersion: '',
    jailbreakStatus: '',
    bootromExploitOnly: false,
    storageMinGB: '',
    storageMaxGB: '',
    priceMin: '',
    priceMax: '',
    emailNotify: true,
  })

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
      const response = await fetch('/api/alerts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...formData,
          storageMinGB: formData.storageMinGB ? parseInt(formData.storageMinGB) : null,
          storageMaxGB: formData.storageMaxGB ? parseInt(formData.storageMaxGB) : null,
          priceMin: formData.priceMin ? parseFloat(formData.priceMin) : null,
          priceMax: formData.priceMax ? parseFloat(formData.priceMax) : null,
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

          {/* iOS Version */}
          <div className="card p-6">
            <h2 className="font-semibold text-gray-900 mb-4">iOS/iPadOS Version</h2>
            <div>
              <label className="label mb-1 block">Version</label>
              <select
                value={formData.osVersion}
                onChange={(e) => setFormData({ ...formData, osVersion: e.target.value })}
                className="input"
              >
                {iosVersions.map((version) => (
                  <option key={version.value} value={version.value}>{version.label}</option>
                ))}
              </select>
              <p className="text-xs text-gray-500 mt-1">
                Select a major iOS version to filter listings
              </p>
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
