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
  Clock,
  CheckCircle2,
  XCircle,
  History,
  PenSquare,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

interface RecipientCounts {
  all: number
  marketing: number
  sellers: number
  buyers: number
  pro: number
  plus: number
  free: number
}

interface EmailLog {
  id: string
  subject: string
  recipientType: string
  recipientCount: number
  successCount: number
  failedCount: number
  sentByEmail: string
  contentPreview: string | null
  status: string
  errorMessage: string | null
  createdAt: string
  completedAt: string | null
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

const recipientLabels: Record<string, string> = {
  all: 'All Users',
  marketing: 'Marketing',
  sellers: 'Sellers',
  buyers: 'Buyers',
  pro: 'Pro Members',
  plus: 'Plus Members',
  free: 'Free Users',
  test: 'Test Email',
}

export default function AdminEmailPage() {
  const [activeTab, setActiveTab] = useState<'compose' | 'sent'>('compose')
  const [subject, setSubject] = useState('')
  const [content, setContent] = useState('')
  const [recipientType, setRecipientType] = useState('all')
  const [testEmail, setTestEmail] = useState('')
  const [sending, setSending] = useState(false)
  const [result, setResult] = useState<{ success: boolean; message: string } | null>(null)
  const [counts, setCounts] = useState<RecipientCounts | null>(null)

  // Sent emails state
  const [emailLogs, setEmailLogs] = useState<EmailLog[]>([])
  const [loadingLogs, setLoadingLogs] = useState(false)
  const [logsPage, setLogsPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  useEffect(() => {
    fetchCounts()
  }, [])

  useEffect(() => {
    if (activeTab === 'sent') {
      fetchEmailLogs()
    }
  }, [activeTab, logsPage])

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

  const fetchEmailLogs = async () => {
    setLoadingLogs(true)
    try {
      const res = await fetch(`/api/admin/email?history=true&page=${logsPage}&limit=10`)
      const data = await res.json()
      if (res.ok) {
        setEmailLogs(data.emailLogs || [])
        setTotalPages(data.totalPages || 1)
      }
    } catch (error) {
      console.error('Failed to fetch email logs:', error)
    } finally {
      setLoadingLogs(false)
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
        // Clear form after successful send
        setSubject('')
        setContent('')
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

  const getStatusBadge = (log: EmailLog) => {
    switch (log.status) {
      case 'completed':
        if (log.failedCount === 0) {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs font-medium rounded-full">
              <CheckCircle2 className="w-3 h-3" />
              Delivered
            </span>
          )
        } else {
          return (
            <span className="inline-flex items-center gap-1 px-2 py-1 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs font-medium rounded-full">
              <AlertCircle className="w-3 h-3" />
              Partial
            </span>
          )
        }
      case 'failed':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 text-xs font-medium rounded-full">
            <XCircle className="w-3 h-3" />
            Failed
          </span>
        )
      case 'sending':
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-medium rounded-full">
            <Loader2 className="w-3 h-3 animate-spin" />
            Sending
          </span>
        )
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400 text-xs font-medium rounded-full">
            <Clock className="w-3 h-3" />
            Pending
          </span>
        )
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Email Users</h1>
          <p className="text-gray-500 dark:text-gray-400">Send announcements and view email history</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200 dark:border-gray-700">
        <nav className="flex gap-4">
          <button
            onClick={() => setActiveTab('compose')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'compose'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <PenSquare className="w-4 h-4" />
            Compose
          </button>
          <button
            onClick={() => setActiveTab('sent')}
            className={`flex items-center gap-2 px-4 py-3 border-b-2 font-medium text-sm transition-colors ${
              activeTab === 'sent'
                ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'
            }`}
          >
            <History className="w-4 h-4" />
            Sent Emails
          </button>
        </nav>
      </div>

      {activeTab === 'compose' ? (
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
      ) : (
        /* Sent Emails Tab */
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          {loadingLogs ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
            </div>
          ) : emailLogs.length === 0 ? (
            <div className="text-center py-12">
              <Mail className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
              <p className="text-gray-500 dark:text-gray-400">No emails sent yet</p>
              <button
                onClick={() => setActiveTab('compose')}
                className="mt-4 text-primary-600 hover:text-primary-700 font-medium"
              >
                Compose your first email
              </button>
            </div>
          ) : (
            <>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50 dark:bg-gray-700/50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Subject
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Recipients
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Delivery
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Sent By
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Date
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                    {emailLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td className="px-6 py-4">
                          <div className="max-w-xs">
                            <p className="font-medium text-gray-900 dark:text-white truncate">{log.subject}</p>
                            {log.contentPreview && (
                              <p className="text-xs text-gray-500 dark:text-gray-400 truncate mt-1">
                                {log.contentPreview}
                              </p>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-200">
                            {recipientLabels[log.recipientType] || log.recipientType}
                          </span>
                          <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                            {log.recipientCount.toLocaleString()} recipients
                          </p>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 text-sm">
                                <span className="text-green-600 dark:text-green-400 font-medium">
                                  {log.successCount.toLocaleString()}
                                </span>
                                <span className="text-gray-400">/</span>
                                <span className="text-gray-600 dark:text-gray-400">
                                  {log.recipientCount.toLocaleString()}
                                </span>
                              </div>
                              {log.failedCount > 0 && (
                                <p className="text-xs text-red-500 mt-0.5">
                                  {log.failedCount} failed
                                </p>
                              )}
                              {/* Progress bar */}
                              <div className="w-24 h-1.5 bg-gray-200 dark:bg-gray-600 rounded-full mt-1 overflow-hidden">
                                <div
                                  className={`h-full rounded-full ${
                                    log.failedCount === 0
                                      ? 'bg-green-500'
                                      : log.successCount === 0
                                      ? 'bg-red-500'
                                      : 'bg-yellow-500'
                                  }`}
                                  style={{
                                    width: `${(log.successCount / log.recipientCount) * 100}%`,
                                  }}
                                />
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          {getStatusBadge(log)}
                          {log.errorMessage && (
                            <p className="text-xs text-red-500 mt-1 max-w-[150px] truncate" title={log.errorMessage}>
                              {log.errorMessage}
                            </p>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          {log.sentByEmail}
                        </td>
                        <td className="px-6 py-4 text-sm text-gray-500 dark:text-gray-400">
                          <span title={new Date(log.createdAt).toLocaleString()}>
                            {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true })}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between px-6 py-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    Page {logsPage} of {totalPages}
                  </p>
                  <div className="flex gap-2">
                    <button
                      onClick={() => setLogsPage((p) => Math.max(1, p - 1))}
                      disabled={logsPage === 1}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>
                    <button
                      onClick={() => setLogsPage((p) => Math.min(totalPages, p + 1))}
                      disabled={logsPage === totalPages}
                      className="p-2 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      )}
    </div>
  )
}
