'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  Plus,
  Trash2,
  Edit2,
  Smartphone,
  ChevronLeft,
  ToggleLeft,
  ToggleRight,
  Zap,
  Filter,
  Mail,
  CheckCircle,
  ArrowRight
} from 'lucide-react'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'

interface DeviceAlert {
  id: string
  name: string
  active: boolean
  deviceType?: string
  deviceModel?: string
  osVersionMin?: string
  osVersionMax?: string
  osVersionExact?: string
  jailbreakStatus?: string
  storageMinGB?: number
  storageMaxGB?: number
  priceMin?: number
  priceMax?: number
  matchCount: number
  lastMatchAt?: string
}

export default function AlertsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [alerts, setAlerts] = useState<DeviceAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (session?.user) {
      fetchAlerts()
    } else if (status === 'unauthenticated') {
      setLoading(false)
    }
  }, [session, status])

  const fetchAlerts = async () => {
    try {
      const response = await fetch('/api/alerts')
      if (response.ok) {
        const data = await response.json()
        setAlerts(data.alerts || [])
      }
    } catch (error) {
      console.error('Failed to fetch alerts:', error)
    } finally {
      setLoading(false)
    }
  }

  const toggleAlert = async (alertId: string, active: boolean) => {
    try {
      await fetch(`/api/alerts/${alertId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ active }),
      })
      setAlerts(alerts.map(a => a.id === alertId ? { ...a, active } : a))
    } catch (error) {
      console.error('Failed to toggle alert:', error)
    }
  }

  const deleteAlert = async (alertId: string) => {
    if (!confirm('Are you sure you want to delete this alert?')) return
    try {
      await fetch(`/api/alerts/${alertId}`, { method: 'DELETE' })
      setAlerts(alerts.filter(a => a.id !== alertId))
    } catch (error) {
      console.error('Failed to delete alert:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  // Feature showcase for unauthenticated users
  if (!session?.user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
        {/* Hero Section */}
        <div className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <Bell className="w-8 h-8" />
            </div>
            <h1 className="text-4xl font-bold mb-4">Device Alerts</h1>
            <p className="text-xl text-primary-100 max-w-2xl mx-auto">
              Stop refreshing. Get notified instantly when a device matching your exact specs is listed.
            </p>
          </div>
        </div>

        {/* Features */}
        <div className="max-w-4xl mx-auto px-4 py-16">
          <div className="grid md:grid-cols-3 gap-8 mb-16">
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-xl mb-4">
                <Filter className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Precise Filters</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Set alerts for specific iOS versions, device models, storage sizes, and price ranges.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-xl mb-4">
                <Zap className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Instant Notifications</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Get an email the moment a matching device is listed. Be first to message the seller.
              </p>
            </div>
            <div className="text-center">
              <div className="inline-flex items-center justify-center w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-xl mb-4">
                <Smartphone className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 dark:text-white mb-2">Jailbreak Focused</h3>
              <p className="text-gray-600 dark:text-gray-400 text-sm">
                Filter by jailbreak status. Find devices on exploitable firmware versions.
              </p>
            </div>
          </div>

          {/* Example Alert Card */}
          <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-lg p-6 mb-12">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Example Alert</h3>
            <div className="bg-gray-50 dark:bg-gray-700 rounded-xl p-4">
              <div className="flex items-start gap-4">
                <div className="p-3 rounded-lg bg-green-100 dark:bg-green-900/50">
                  <Smartphone className="w-6 h-6 text-green-600 dark:text-green-400" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-gray-900 dark:text-white">iPhone 14 Pro - Jailbreakable</h4>
                  <div className="flex flex-wrap gap-2 mt-2">
                    <span className="px-2 py-1 bg-gray-200 dark:bg-gray-600 rounded text-xs font-medium text-gray-700 dark:text-gray-300">iPhone 14 Pro</span>
                    <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/50 rounded text-xs font-medium text-purple-700 dark:text-purple-300">iOS 16.0 - 16.6.1</span>
                    <span className="px-2 py-1 bg-green-100 dark:bg-green-900/50 rounded text-xs font-medium text-green-700 dark:text-green-300">Jailbreakable</span>
                    <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/50 rounded text-xs font-medium text-blue-700 dark:text-blue-300">$400 - $800</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* How It Works */}
          <div className="mb-12">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white text-center mb-8">How It Works</h2>
            <div className="grid md:grid-cols-3 gap-6">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">1</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Create an Alert</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Choose device type, iOS version, and other criteria.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">2</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">We Monitor Listings</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Every new listing is checked against your alerts.</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 w-8 h-8 bg-primary-600 text-white rounded-full flex items-center justify-center font-bold">3</div>
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-white">Get Notified</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">Instant email when a match is found.</p>
                </div>
              </div>
            </div>
          </div>

          {/* CTA */}
          <div className="text-center">
            <Link
              href="/auth/signup?callbackUrl=/alerts/new"
              className="inline-flex items-center gap-2 bg-gradient-to-r from-primary-600 to-accent-600 text-white px-8 py-4 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg"
            >
              Create Your First Alert
              <ArrowRight className="w-5 h-5" />
            </Link>
            <p className="text-gray-500 dark:text-gray-400 text-sm mt-4">
              Free accounts get 1 alert. <Link href="/subscription" className="text-primary-600 hover:underline">Upgrade</Link> for more.
            </p>
          </div>
        </div>
      </div>
    )
  }

  const { tier } = useSubscriptionTier()
  const maxAlerts = tier === 'PRO' ? Infinity : tier === 'PLUS' ? 3 : 1

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Device Alerts</h1>
              <p className="text-gray-600 dark:text-gray-400">Get notified when devices matching your criteria are listed</p>
            </div>
            {alerts.length < maxAlerts && (
              <Link href="/alerts/new" className="btn-primary flex items-center gap-2">
                <Plus className="w-4 h-4" />
                New Alert
              </Link>
            )}
          </div>
        </div>

        {/* Alert Limits */}
        <div className="card p-4 mb-6 bg-primary-50 border-primary-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium text-primary-900">
                {alerts.length} / {maxAlerts === Infinity ? '∞' : maxAlerts} alerts used
              </p>
              <p className="text-sm text-primary-700">
                {tier === 'FREE'
                  ? 'Upgrade to Plus for 3 alerts or Pro for unlimited'
                  : tier === 'PLUS'
                  ? 'Upgrade to Pro for unlimited alerts'
                  : 'You have unlimited alerts'}
              </p>
            </div>
            {tier !== 'PRO' && (
              <Link href="/subscription" className="btn-secondary text-sm">
                Upgrade
              </Link>
            )}
          </div>
        </div>

        {/* Alerts List */}
        {alerts.length === 0 ? (
          <div className="card p-12 text-center">
            <Bell className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No alerts yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              Create an alert to get notified when devices matching your criteria are listed.
            </p>
            <Link href="/alerts/new" className="btn-primary">
              Create Your First Alert
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {alerts.map((alert) => (
              <div key={alert.id} className="card p-4">
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-lg ${alert.active ? 'bg-green-100' : 'bg-gray-100'}`}>
                      <Smartphone className={`w-6 h-6 ${alert.active ? 'text-green-600' : 'text-gray-400'}`} />
                    </div>
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">{alert.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alert.deviceModel && (
                          <span className="badge bg-gray-100 text-gray-700">{alert.deviceModel}</span>
                        )}
                        {alert.osVersionExact ? (
                          <span className="badge bg-purple-100 text-purple-700">iOS {alert.osVersionExact}</span>
                        ) : alert.osVersionMin && alert.osVersionMax ? (
                          <span className="badge bg-purple-100 text-purple-700">
                            iOS {alert.osVersionMin} - {alert.osVersionMax}
                          </span>
                        ) : alert.osVersionMin ? (
                          <span className="badge bg-purple-100 text-purple-700">
                            iOS {alert.osVersionMin}+
                          </span>
                        ) : alert.osVersionMax ? (
                          <span className="badge bg-purple-100 text-purple-700">
                            iOS ≤{alert.osVersionMax}
                          </span>
                        ) : null}
                        {alert.jailbreakStatus && alert.jailbreakStatus !== 'UNKNOWN' && (
                          <span className="badge bg-green-100 text-green-700">{alert.jailbreakStatus}</span>
                        )}
                        {(alert.priceMin || alert.priceMax) && (
                          <span className="badge bg-blue-100 text-blue-700">
                            ${alert.priceMin || 0} - ${alert.priceMax || '∞'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                        {alert.matchCount} matches
                        {alert.lastMatchAt && ` · Last match ${new Date(alert.lastMatchAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.active)}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title={alert.active ? 'Disable alert' : 'Enable alert'}
                    >
                      {alert.active ? (
                        <ToggleRight className="w-6 h-6 text-green-600" />
                      ) : (
                        <ToggleLeft className="w-6 h-6 text-gray-400" />
                      )}
                    </button>
                    <Link
                      href={`/alerts/${alert.id}/edit`}
                      className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                      title="Edit alert"
                    >
                      <Edit2 className="w-5 h-5 text-gray-400" />
                    </Link>
                    <button
                      onClick={() => deleteAlert(alert.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Delete alert"
                    >
                      <Trash2 className="w-5 h-5 text-red-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
