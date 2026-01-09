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
  ToggleRight
} from 'lucide-react'

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
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/alerts')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchAlerts()
    }
  }, [session])

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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const maxAlerts = session.user.subscriptionTier === 'PRO' ? Infinity :
                    session.user.subscriptionTier === 'PLUS' ? 3 : 1

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">Device Alerts</h1>
              <p className="text-gray-600">Get notified when devices matching your criteria are listed</p>
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
                {session.user.subscriptionTier === 'FREE'
                  ? 'Upgrade to Plus for 3 alerts or Pro for unlimited'
                  : session.user.subscriptionTier === 'PLUS'
                  ? 'Upgrade to Pro for unlimited alerts'
                  : 'You have unlimited alerts'}
              </p>
            </div>
            {session.user.subscriptionTier !== 'PRO' && (
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
            <h3 className="text-lg font-medium text-gray-900 mb-2">No alerts yet</h3>
            <p className="text-gray-500 mb-6">
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
                      <h3 className="font-medium text-gray-900">{alert.name}</h3>
                      <div className="flex flex-wrap gap-2 mt-2">
                        {alert.deviceModel && (
                          <span className="badge bg-gray-100 text-gray-700">{alert.deviceModel}</span>
                        )}
                        {alert.osVersionExact ? (
                          <span className="badge bg-purple-100 text-purple-700">iOS {alert.osVersionExact}</span>
                        ) : (alert.osVersionMin || alert.osVersionMax) && (
                          <span className="badge bg-purple-100 text-purple-700">
                            iOS {alert.osVersionMin || '?'} - {alert.osVersionMax || '?'}
                          </span>
                        )}
                        {alert.jailbreakStatus && alert.jailbreakStatus !== 'UNKNOWN' && (
                          <span className="badge bg-green-100 text-green-700">{alert.jailbreakStatus}</span>
                        )}
                        {(alert.priceMin || alert.priceMax) && (
                          <span className="badge bg-blue-100 text-blue-700">
                            ${alert.priceMin || 0} - ${alert.priceMax || '∞'}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 mt-2">
                        {alert.matchCount} matches
                        {alert.lastMatchAt && ` · Last match ${new Date(alert.lastMatchAt).toLocaleDateString()}`}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => toggleAlert(alert.id, !alert.active)}
                      className="p-2 hover:bg-gray-100 rounded-lg"
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
                      className="p-2 hover:bg-gray-100 rounded-lg"
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
