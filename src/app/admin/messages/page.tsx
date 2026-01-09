'use client'

import { useState, useEffect } from 'react'
import { format } from 'date-fns'
import {
  AlertTriangle,
  Shield,
  Phone,
  Mail,
  CreditCard,
  Share2,
  ExternalLink,
  MessageSquare,
  Ban,
  CheckCircle,
  XCircle,
  Eye,
  ChevronDown,
  Loader2,
  RefreshCw,
  AlertOctagon,
} from 'lucide-react'

interface ModerationFlag {
  id: string
  type: string
  severity: string
  match: string
  context: string
  reviewed: boolean
}

interface FlaggedMessage {
  id: string
  content: string
  createdAt: string
  flagged: boolean
  blocked: boolean
  riskScore: number
  sender: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
    role: string
    createdAt: string
  }
  receiver: {
    id: string
    name: string | null
    username: string | null
    email: string
    image: string | null
  }
  listing: {
    id: string
    title: string
    price: number
  } | null
  moderationFlags: ModerationFlag[]
}

const flagTypeIcons: Record<string, React.ReactNode> = {
  phone: <Phone className="w-4 h-4" />,
  email: <Mail className="w-4 h-4" />,
  payment_app: <CreditCard className="w-4 h-4" />,
  social_media: <Share2 className="w-4 h-4" />,
  external_link: <ExternalLink className="w-4 h-4" />,
  evasion: <AlertOctagon className="w-4 h-4" />,
  crypto: <CreditCard className="w-4 h-4" />,
}

const flagTypeLabels: Record<string, string> = {
  phone: 'Phone Number',
  email: 'Email Address',
  payment_app: 'Payment App',
  social_media: 'Social Media',
  external_link: 'External Link',
  evasion: 'Evasion Tactic',
  crypto: 'Cryptocurrency',
}

const severityColors: Record<string, string> = {
  low: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
  medium: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
  high: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
}

export default function AdminFlaggedMessagesPage() {
  const [messages, setMessages] = useState<FlaggedMessage[]>([])
  const [stats, setStats] = useState({
    totalFlagged: 0,
    totalBlocked: 0,
    pendingReview: 0,
  })
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [filter, setFilter] = useState<'all' | 'pending' | 'blocked' | 'reviewed'>('all')
  const [expandedMessage, setExpandedMessage] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const fetchMessages = async () => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/admin/messages?status=${filter}`)
      if (!response.ok) throw new Error('Failed to fetch messages')
      const data = await response.json()
      setMessages(data.messages)
      setStats(data.stats)
    } catch (err) {
      setError('Failed to load flagged messages')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchMessages()
  }, [filter])

  const handleAction = async (messageId: string, action: string, notes?: string) => {
    try {
      setActionLoading(messageId)
      const response = await fetch('/api/admin/messages', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ messageId, action, notes }),
      })

      if (!response.ok) throw new Error('Action failed')

      // Refresh the list
      await fetchMessages()
    } catch (err) {
      console.error('Action error:', err)
      alert('Failed to perform action')
    } finally {
      setActionLoading(null)
    }
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600 dark:text-red-400'
    if (score >= 40) return 'text-orange-600 dark:text-orange-400'
    return 'text-yellow-600 dark:text-yellow-400'
  }

  const getRiskBgColor = (score: number) => {
    if (score >= 70) return 'bg-red-100 dark:bg-red-900/30'
    if (score >= 40) return 'bg-orange-100 dark:bg-orange-900/30'
    return 'bg-yellow-100 dark:bg-yellow-900/30'
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-orange-500" />
            Flagged Messages
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Review messages flagged for off-platform transaction attempts
          </p>
        </div>
        <button
          onClick={fetchMessages}
          disabled={loading}
          className="flex items-center gap-2 px-4 py-2 bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <AlertTriangle className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Total Flagged</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalFlagged}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Blocked</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalBlocked}</p>
            </div>
          </div>
        </div>
        <div className="bg-white dark:bg-gray-800 rounded-xl p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <Eye className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pendingReview}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2">
        {(['all', 'pending', 'blocked', 'reviewed'] as const).map((f) => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              filter === f
                ? 'bg-primary-600 text-white'
                : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
            }`}
          >
            {f.charAt(0).toUpperCase() + f.slice(1)}
          </button>
        ))}
      </div>

      {/* Error state */}
      {error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-xl p-4 text-red-700 dark:text-red-400">
          {error}
        </div>
      )}

      {/* Loading state */}
      {loading && (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
        </div>
      )}

      {/* Messages list */}
      {!loading && messages.length === 0 && (
        <div className="bg-white dark:bg-gray-800 rounded-xl p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 dark:text-white">No flagged messages</h3>
          <p className="text-gray-500 dark:text-gray-400 mt-1">
            All messages are clean or have been reviewed.
          </p>
        </div>
      )}

      {!loading && messages.length > 0 && (
        <div className="space-y-4">
          {messages.map((message) => (
            <div
              key={message.id}
              className={`bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 overflow-hidden ${
                message.blocked ? 'ring-2 ring-red-500' : ''
              }`}
            >
              {/* Message Header */}
              <div className="p-4 border-b border-gray-100 dark:border-gray-700">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    {message.sender.image ? (
                      <img
                        src={message.sender.image}
                        alt={message.sender.name || 'User'}
                        className="w-10 h-10 rounded-full object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                        <span className="text-gray-500 font-medium">
                          {(message.sender.name || message.sender.email)?.[0]?.toUpperCase()}
                        </span>
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">
                        {message.sender.name || message.sender.username || message.sender.email}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        To: {message.receiver.name || message.receiver.username || message.receiver.email}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    {/* Risk Score Badge */}
                    <div className={`px-3 py-1 rounded-full text-sm font-medium ${getRiskBgColor(message.riskScore)} ${getRiskColor(message.riskScore)}`}>
                      Risk: {message.riskScore}%
                    </div>
                    {message.blocked && (
                      <span className="px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 rounded text-xs font-medium">
                        BLOCKED
                      </span>
                    )}
                    <span className="text-sm text-gray-500 dark:text-gray-400">
                      {format(new Date(message.createdAt), 'MMM d, yyyy h:mm a')}
                    </span>
                  </div>
                </div>

                {/* Listing context if applicable */}
                {message.listing && (
                  <div className="mt-2 px-3 py-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Re: </span>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">{message.listing.title}</span>
                    <span className="text-gray-500 dark:text-gray-400"> (${message.listing.price})</span>
                  </div>
                )}
              </div>

              {/* Message Content */}
              <div className="p-4 bg-gray-50 dark:bg-gray-900/50">
                <p className="text-gray-800 dark:text-gray-200 whitespace-pre-wrap">{message.content}</p>
              </div>

              {/* Flags */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700">
                <button
                  onClick={() => setExpandedMessage(expandedMessage === message.id ? null : message.id)}
                  className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white"
                >
                  <ChevronDown className={`w-4 h-4 transition-transform ${expandedMessage === message.id ? 'rotate-180' : ''}`} />
                  {message.moderationFlags.length} flag{message.moderationFlags.length !== 1 ? 's' : ''} detected
                </button>

                {expandedMessage === message.id && (
                  <div className="mt-3 space-y-2">
                    {message.moderationFlags.map((flag) => (
                      <div
                        key={flag.id}
                        className={`p-3 rounded-lg ${severityColors[flag.severity]} flex items-start gap-3`}
                      >
                        {flagTypeIcons[flag.type] || <AlertTriangle className="w-4 h-4" />}
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{flagTypeLabels[flag.type] || flag.type}</span>
                            <span className="text-xs opacity-75">({flag.severity})</span>
                            {flag.reviewed && (
                              <CheckCircle className="w-3 h-3 text-green-600" />
                            )}
                          </div>
                          <p className="text-sm mt-1 opacity-90">Match: "{flag.match}"</p>
                          <p className="text-xs mt-1 opacity-75">Context: ...{flag.context}...</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="p-4 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50 flex items-center gap-3">
                <button
                  onClick={() => handleAction(message.id, 'mark_reviewed')}
                  disabled={actionLoading === message.id}
                  className="flex items-center gap-2 px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 text-sm font-medium"
                >
                  {actionLoading === message.id ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <CheckCircle className="w-4 h-4" />
                  )}
                  Mark Reviewed
                </button>
                {message.blocked && (
                  <button
                    onClick={() => handleAction(message.id, 'unblock')}
                    disabled={actionLoading === message.id}
                    className="flex items-center gap-2 px-3 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
                  >
                    <Eye className="w-4 h-4" />
                    Unblock (False Positive)
                  </button>
                )}
                <button
                  onClick={() => {
                    if (confirm('Are you sure you want to ban this user?')) {
                      handleAction(message.id, 'ban_user')
                    }
                  }}
                  disabled={actionLoading === message.id}
                  className="flex items-center gap-2 px-3 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
                >
                  <Ban className="w-4 h-4" />
                  Ban User
                </button>
                <div className="flex-1" />
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  Sender joined: {format(new Date(message.sender.createdAt), 'MMM d, yyyy')}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
