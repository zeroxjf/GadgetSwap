'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Shield,
  ChevronLeft,
  Key,
  Smartphone,
  Monitor,
  LogOut,
  AlertTriangle
} from 'lucide-react'

interface Session {
  id: string
  device: string
  browser: string
  location: string
  lastActive: string
  current: boolean
}

export default function SecurityPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sessions, setSessions] = useState<Session[]>([])
  const [loading, setLoading] = useState(true)
  const [twoFactorEnabled, setTwoFactorEnabled] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/security')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      // Only show current session - real session management would require backend support
      setLoading(false)
      setSessions([
        {
          id: 'current',
          device: 'Current Device',
          browser: 'Current Browser',
          location: 'Your location',
          lastActive: 'Now',
          current: true,
        },
      ])
    }
  }, [session])

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to sign out this device?')) return
    setSessions(sessions.filter(s => s.id !== sessionId))
  }

  const revokeAllSessions = async () => {
    if (!confirm('This will sign you out of all devices except this one. Continue?')) return
    setSessions(sessions.filter(s => s.current))
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

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Security</h1>
          <p className="text-gray-600">Manage your account security settings</p>
        </div>

        <div className="space-y-6">
          {/* Password */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Key className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Password</h2>
                <p className="text-sm text-gray-500">Last changed: Never</p>
              </div>
            </div>
            <button className="btn-secondary text-sm">
              Change Password
            </button>
          </div>

          {/* Two-Factor Authentication */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-lg ${twoFactorEnabled ? 'bg-green-100' : 'bg-yellow-100'}`}>
                  <Smartphone className={`w-5 h-5 ${twoFactorEnabled ? 'text-green-600' : 'text-yellow-600'}`} />
                </div>
                <div>
                  <h2 className="font-semibold text-gray-900">Two-Factor Authentication</h2>
                  <p className="text-sm text-gray-500">
                    {twoFactorEnabled ? 'Enabled' : 'Add an extra layer of security'}
                  </p>
                </div>
              </div>
              <span className={`badge ${twoFactorEnabled ? 'bg-green-100 text-green-700' : 'bg-yellow-100 text-yellow-700'}`}>
                {twoFactorEnabled ? 'Enabled' : 'Disabled'}
              </span>
            </div>

            {!twoFactorEnabled && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                <div className="flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-yellow-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-yellow-800">Recommended</p>
                    <p className="text-sm text-yellow-700">
                      Two-factor authentication adds an extra layer of security to your account.
                      We strongly recommend enabling it.
                    </p>
                  </div>
                </div>
              </div>
            )}

            <button
              onClick={() => setTwoFactorEnabled(!twoFactorEnabled)}
              className={twoFactorEnabled ? 'btn-secondary text-sm' : 'btn-primary text-sm'}
            >
              {twoFactorEnabled ? 'Manage 2FA' : 'Enable 2FA'}
            </button>
          </div>

          {/* Active Sessions */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  <Monitor className="w-5 h-5 text-blue-600" />
                </div>
                <h2 className="font-semibold text-gray-900">Active Sessions</h2>
              </div>
              {sessions.length > 1 && (
                <button onClick={revokeAllSessions} className="text-sm text-red-600 hover:text-red-700">
                  Sign out all other devices
                </button>
              )}
            </div>

            <div className="space-y-4">
              {sessions.map((s) => (
                <div key={s.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center gap-3">
                    <Monitor className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="font-medium text-gray-900">
                        {s.device} · {s.browser}
                        {s.current && (
                          <span className="ml-2 badge bg-green-100 text-green-700">This device</span>
                        )}
                      </p>
                      <p className="text-sm text-gray-500">
                        {s.location} · {s.lastActive}
                      </p>
                    </div>
                  </div>
                  {!s.current && (
                    <button
                      onClick={() => revokeSession(s.id)}
                      className="p-2 hover:bg-red-50 rounded-lg"
                      title="Sign out"
                    >
                      <LogOut className="w-5 h-5 text-red-400" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Security Log */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Shield className="w-5 h-5 text-gray-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Security Log</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              View recent security-related activity on your account.
            </p>
            <button className="btn-secondary text-sm">
              View Security Log
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
