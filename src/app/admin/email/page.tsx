'use client'

import { useState, useEffect } from 'react'
import {
  Mail,
  Send,
  Users,
  Loader2,
  CheckCircle,
  AlertCircle,
  TestTube,
  Crown,
  ShoppingBag,
  Package,
  Megaphone,
} from 'lucide-react'

interface RecipientCounts {
  all: number
  marketing: number
  sellers: number
  buyers: number
  pro: number
  plus: number
  free: number
}

const recipientOptions = [
  { value: 'all', label: 'All Users', description: 'Everyone with email notifications enabled', icon: Users },
  { value: 'marketing', label: 'Marketing Subscribers', description: 'Users who opted into marketing emails', icon: Megaphone },
  { value: 'sellers', label: 'Sellers', description: 'Users with at least one listing', icon: Package },
  { value: 'buyers', label: 'Buyers', description: 'Users with at least one purchase', icon: ShoppingBag },
  { value: 'pro', label: 'Pro Members', description: 'Pro subscription tier', icon: Crown },
  { value: 'plus', label: 'Plus Members', description: 'Plus subscription tier', icon: Crown },
  { value: 'free', label: 'Free Users', description: 'Free tier only', icon: Users },
]

export default function AdminEmailPage() {
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [recipientType, setRecipientType] = useState('all')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [counts, setCounts] = useState<RecipientCounts | null>(null)

  useEffect(() => {
    fetchCounts()
  }, [])

  const fetchCounts = async () => {
    try {
      const res = await fetch('/api/admin/email')
      const data = await res.json()
      if (res.ok) {
        setCounts(data.recipientCounts)
      }
    } catch (error) {
      console.error('Failed to fetch counts:', error)
    }
  }

  const handleSendTest = async () => {
    if (!testEmail || !subject || !content) {
      setResult({ success: false, message: 'Please fill in all fields and test email' })
      return
    }

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, testEmail }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({ success: true, message: data.message })
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to send test email' })
    } finally {
      setSending(false)
    }
  }

  const handleSendAll = async () => {
    if (!subject || !content) {
      setResult({ success: false, message: 'Please fill in subject and content' })
      return
    }

    const recipientCount = counts?.[recipientType as keyof RecipientCounts] || 0
    if (!confirm(`Are you sure you want to send this email to ${recipientCount} users?`)) {
      return
    }

    setSending(true)
    setResult(null)

    try {
      const res = await fetch('/api/admin/email', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ subject, content, recipientType }),
      })

      const data = await res.json()

      if (res.ok) {
        setResult({
          success: true,
          message: `${data.message}. Success: ${data.stats.success}, Failed: ${data.stats.failed}`,
        })
      } else {
        setResult({ success: false, message: data.error })
      }
    } catch (error) {
      setResult({ success: false, message: 'Failed to send emails' })
    } finally {
      setSending(false)
    }
  }

  const selectedCount = counts?.[recipientType as keyof RecipientCounts] || 0

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email All Users</h1>
          <p className="text-gray-500 dark:text-gray-400">Send announcements and updates to your users</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Email Composer */}
        <div className="lg:col-span-2 space-y-6">
          {/* Subject */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Subject
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              placeholder="e.g., Exciting News from GadgetSwap!"
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          {/* Content */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Email Content (HTML supported)
            </label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder="<h2>Hello!</h2><p>We have some exciting news...</p>"
              rows={12}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono text-sm"
            />
            <p className="mt-2 text-xs text-gray-500 dark:text-gray-400">
              Your content will be wrapped in the GadgetSwap email template with header and footer.
            </p>
          </div>

          {/* Test Email */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Send Test Email First
            </label>
            <div className="flex gap-3">
              <input
                type="email"
                value={testEmail}
                onChange={(e) => setTestEmail(e.target.value)}
                placeholder="your@email.com"
                className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
              <button
                onClick={handleSendTest}
                disabled={sending || !testEmail || !subject || !content}
                className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {sending ? <Loader2 className="w-4 h-4 animate-spin" /> : <TestTube className="w-4 h-4" />}
                Send Test
              </button>
            </div>
          </div>

          {/* Result Message */}
          {result && (
            <div
              className={`p-4 rounded-lg flex items-center gap-3 ${
                result.success
                  ? 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400'
                  : 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-400'
              }`}
            >
              {result.success ? (
                <CheckCircle className="w-5 h-5 flex-shrink-0" />
              ) : (
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
              )}
              <span>{result.message}</span>
            </div>
          )}
        </div>

        {/* Recipient Selection */}
        <div className="space-y-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h3 className="font-semibold text-gray-900 dark:text-white mb-4">Recipients</h3>
            <div className="space-y-2">
              {recipientOptions.map((option) => {
                const count = counts?.[option.value as keyof RecipientCounts] || 0
                const Icon = option.icon
                return (
                  <label
                    key={option.value}
                    className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                      recipientType === option.value
                        ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="recipientType"
                      value={option.value}
                      checked={recipientType === option.value}
                      onChange={(e) => setRecipientType(e.target.value)}
                      className="sr-only"
                    />
                    <Icon className={`w-5 h-5 ${
                      recipientType === option.value ? 'text-primary-600' : 'text-gray-400'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-gray-900 dark:text-white text-sm">{option.label}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{option.description}</p>
                    </div>
                    <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                      {count.toLocaleString()}
                    </span>
                  </label>
                )
              })}
            </div>
          </div>

          {/* Send Button */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div className="text-center mb-4">
              <p className="text-3xl font-bold text-gray-900 dark:text-white">{selectedCount.toLocaleString()}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">recipients will receive this email</p>
            </div>
            <button
              onClick={handleSendAll}
              disabled={sending || !subject || !content || selectedCount === 0}
              className="w-full px-6 py-3 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 font-semibold"
            >
              {sending ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Sending...
                </>
              ) : (
                <>
                  <Send className="w-5 h-5" />
                  Send to {selectedCount.toLocaleString()} Users
                </>
              )}
            </button>
            <p className="text-xs text-gray-500 dark:text-gray-400 text-center mt-3">
              Only users with email notifications enabled will receive this email.
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}
