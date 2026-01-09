'use client'

import { useSession, signOut } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Settings,
  ChevronLeft,
  Mail,
  Bell,
  CreditCard,
  LogOut,
  Trash2,
  Save,
  Loader2,
  X,
  Eye,
  EyeOff,
} from 'lucide-react'

export default function SettingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  // Change email modal state
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [changingEmail, setChangingEmail] = useState(false)
  const [emailForm, setEmailForm] = useState({ newEmail: '', currentPassword: '' })
  const [emailError, setEmailError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [settings, setSettings] = useState({
    emailNotifications: true,
    marketingEmails: false,
    priceDropAlerts: true,
    newMessageAlerts: true,
    orderUpdates: true,
  })

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/settings')
    }
  }, [status, router])

  const handleSave = async () => {
    setSaving(true)
    setMessage(null)

    try {
      const response = await fetch('/api/user/settings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(settings),
      })

      if (!response.ok) {
        throw new Error('Failed to save settings')
      }

      setMessage({ type: 'success', text: 'Settings saved successfully!' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to save settings' })
    } finally {
      setSaving(false)
    }
  }

  const handleDeleteAccount = async () => {
    const confirmed = confirm(
      'Are you sure you want to delete your account? This action cannot be undone.'
    )
    if (!confirmed) return

    const doubleConfirmed = confirm(
      'This will permanently delete all your data including listings, purchases, and reviews. Continue?'
    )
    if (!doubleConfirmed) return

    try {
      await fetch('/api/user', { method: 'DELETE' })
      await signOut({ callbackUrl: '/' })
    } catch (error) {
      alert('Failed to delete account')
    }
  }

  const handleChangeEmail = async (e: React.FormEvent) => {
    e.preventDefault()
    setEmailError('')
    setChangingEmail(true)

    try {
      const response = await fetch('/api/user/email', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(emailForm),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to change email')
      }

      // Success - sign out and redirect to sign in
      setShowEmailModal(false)
      setMessage({ type: 'success', text: 'Email updated! Please sign in with your new email.' })

      // Sign out after a short delay
      setTimeout(() => {
        signOut({ callbackUrl: '/auth/signin' })
      }, 2000)
    } catch (error) {
      setEmailError(error instanceof Error ? error.message : 'Failed to change email')
    } finally {
      setChangingEmail(false)
    }
  }

  const openEmailModal = () => {
    setEmailForm({ newEmail: '', currentPassword: '' })
    setEmailError('')
    setShowEmailModal(true)
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
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Account Settings</h1>
          <p className="text-gray-600">Manage your account preferences</p>
        </div>

        <div className="space-y-6">
          {/* Email */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-primary-100 rounded-lg">
                <Mail className="w-5 h-5 text-primary-600" />
              </div>
              <div>
                <h2 className="font-semibold text-gray-900">Email Address</h2>
                <p className="text-sm text-gray-500">{session.user.email}</p>
              </div>
            </div>
            <button onClick={openEmailModal} className="btn-secondary text-sm">
              Change Email
            </button>
          </div>

          {/* Notifications */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-yellow-100 rounded-lg">
                <Bell className="w-5 h-5 text-yellow-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Notification Preferences</h2>
            </div>
            <div className="space-y-4">
              {[
                { key: 'emailNotifications', label: 'Email Notifications', desc: 'Receive email notifications' },
                { key: 'priceDropAlerts', label: 'Price Drop Alerts', desc: 'Get notified when watched items drop in price' },
                { key: 'newMessageAlerts', label: 'New Messages', desc: 'Get notified when you receive messages' },
                { key: 'orderUpdates', label: 'Order Updates', desc: 'Updates about your purchases and sales' },
                { key: 'marketingEmails', label: 'Marketing Emails', desc: 'News, deals, and promotions' },
              ].map((item) => (
                <label key={item.key} className="flex items-center justify-between cursor-pointer">
                  <div>
                    <p className="font-medium text-gray-900">{item.label}</p>
                    <p className="text-sm text-gray-500">{item.desc}</p>
                  </div>
                  <input
                    type="checkbox"
                    checked={settings[item.key as keyof typeof settings]}
                    onChange={(e) => setSettings({ ...settings, [item.key]: e.target.checked })}
                    className="w-5 h-5 rounded border-gray-300 text-primary-600 focus:ring-primary-500"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Payment Methods */}
          <div className="card p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-green-100 rounded-lg">
                <CreditCard className="w-5 h-5 text-green-600" />
              </div>
              <h2 className="font-semibold text-gray-900">Payment Methods</h2>
            </div>
            <p className="text-sm text-gray-500 mb-4">
              Manage your saved payment methods and payout settings.
            </p>
            <div className="flex gap-2">
              <Link href="/account/payments" className="btn-secondary text-sm">
                Manage Payments
              </Link>
              <Link href="/account/payouts" className="btn-secondary text-sm">
                Payout Settings
              </Link>
            </div>
          </div>

          {/* Message */}
          {message && (
            <div className={`p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
            }`}>
              {message.text}
            </div>
          )}

          {/* Save Button */}
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary w-full flex items-center justify-center gap-2"
          >
            {saving ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4" />
                Save Settings
              </>
            )}
          </button>

          {/* Danger Zone */}
          <div className="card p-6 border-red-200">
            <h2 className="font-semibold text-red-600 mb-4">Danger Zone</h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-gray-900">Sign Out</p>
                  <p className="text-sm text-gray-500">Sign out of your account on this device</p>
                </div>
                <button
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="btn-secondary text-sm flex items-center gap-2"
                >
                  <LogOut className="w-4 h-4" />
                  Sign Out
                </button>
              </div>
              <hr className="border-gray-200" />
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium text-red-600">Delete Account</p>
                  <p className="text-sm text-gray-500">Permanently delete your account and all data</p>
                </div>
                <button
                  onClick={handleDeleteAccount}
                  className="btn bg-red-600 text-white hover:bg-red-700 text-sm flex items-center gap-2"
                >
                  <Trash2 className="w-4 h-4" />
                  Delete Account
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Change Email Modal */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-semibold text-gray-900">Change Email Address</h2>
              <button
                onClick={() => setShowEmailModal(false)}
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <form onSubmit={handleChangeEmail} className="space-y-4">
              <div>
                <label htmlFor="currentEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Email
                </label>
                <input
                  type="email"
                  id="currentEmail"
                  value={session.user.email || ''}
                  disabled
                  className="input bg-gray-50 text-gray-500"
                />
              </div>

              <div>
                <label htmlFor="newEmail" className="block text-sm font-medium text-gray-700 mb-1">
                  New Email Address
                </label>
                <input
                  type="email"
                  id="newEmail"
                  value={emailForm.newEmail}
                  onChange={(e) => setEmailForm({ ...emailForm, newEmail: e.target.value })}
                  placeholder="Enter new email address"
                  className="input"
                  required
                />
              </div>

              <div>
                <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">
                  Current Password
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    id="currentPassword"
                    value={emailForm.currentPassword}
                    onChange={(e) => setEmailForm({ ...emailForm, currentPassword: e.target.value })}
                    placeholder="Enter your password"
                    className="input pr-10"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
                <p className="text-xs text-gray-500 mt-1">
                  Required if you signed up with email/password
                </p>
              </div>

              {emailError && (
                <div className="p-3 bg-red-50 text-red-700 rounded-lg text-sm">
                  {emailError}
                </div>
              )}

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowEmailModal(false)}
                  className="btn-secondary flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={changingEmail || !emailForm.newEmail}
                  className="btn-primary flex-1 flex items-center justify-center gap-2"
                >
                  {changingEmail ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Updating...
                    </>
                  ) : (
                    'Update Email'
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
