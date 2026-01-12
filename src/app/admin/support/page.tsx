'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  Bug,
  HelpCircle,
  CheckCircle,
  Clock,
  User,
  Eye,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  XCircle,
  ExternalLink,
  Mail,
  AlertCircle,
  CheckCircle2,
  RotateCcw,
  Flag,
  AlertTriangle,
} from 'lucide-react'

interface Toast {
  type: 'success' | 'error' | 'info'
  title: string
  message: string
  details?: string[]
}

interface Ticket {
  id: string
  type: string
  message: string
  email: string | null
  status: string
  priority: string
  pageUrl: string | null
  adminResponse: string | null
  createdAt: string
  user: {
    id: string
    name: string | null
    email: string
    image: string | null
  } | null
}

interface Stats {
  open: number
  inProgress: number
  resolved: number
  closed: number
}

export default function AdminSupportPage() {
  const [tickets, setTickets] = useState<Ticket[]>([])
  const [stats, setStats] = useState<Stats>({ open: 0, inProgress: 0, resolved: 0, closed: 0 })
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')
  const [updating, setUpdating] = useState<string | null>(null)
  const [toast, setToast] = useState<Toast | null>(null)

  // Auto-dismiss toast after 8 seconds
  useEffect(() => {
    if (toast) {
      const timer = setTimeout(() => setToast(null), 8000)
      return () => clearTimeout(timer)
    }
  }, [toast])

  const fetchTickets = async () => {
    setLoading(true)
    try {
      const res = await fetch(`/api/admin/support?status=${statusFilter}`)
      if (res.ok) {
        const data = await res.json()
        setTickets(data.tickets)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch tickets:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [statusFilter])

  const handleUpdateTicket = async (ticketId: string, updates: { status?: string; priority?: string; adminResponse?: string }) => {
    setUpdating(ticketId)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          ...updates,
        }),
      })

      const data = await res.json()

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? {
                  ...t,
                  status: updates.status || t.status,
                  priority: updates.priority || t.priority,
                  adminResponse: updates.adminResponse || t.adminResponse
                }
              : t
          )
        )
        setResponseText('')

        // Show success toast with email delivery details
        if (updates.adminResponse) {
          if (data.emailSent) {
            setToast({
              type: 'success',
              title: 'Response Sent Successfully',
              message: 'Your response has been saved and emailed to the user.',
              details: [
                `Email sent to: ${data.emailRecipient}`,
                `CC copy sent to: ${data.emailCc}`,
              ],
            })
          } else {
            setToast({
              type: 'info',
              title: 'Response Saved (Email Not Sent)',
              message: data.emailError || 'Response saved but email could not be sent.',
              details: data.emailError ? [`Reason: ${data.emailError}`] : undefined,
            })
          }
        } else if (updates.priority) {
          setToast({
            type: 'success',
            title: 'Priority Updated',
            message: `Ticket priority changed to ${updates.priority}.`,
          })
        } else if (updates.status) {
          setToast({
            type: 'success',
            title: 'Ticket Updated',
            message: `Ticket status changed to ${updates.status.replace('_', ' ').toLowerCase()}.`,
          })
        }

        // Update stats
        fetchTickets()
      } else {
        setToast({
          type: 'error',
          title: 'Update Failed',
          message: data.error || 'Failed to update ticket.',
        })
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
      setToast({
        type: 'error',
        title: 'Error',
        message: 'An unexpected error occurred.',
      })
    } finally {
      setUpdating(null)
    }
  }

  // Wrapper for status updates
  const handleUpdateStatus = (ticketId: string, newStatus: string, response?: string) => {
    handleUpdateTicket(ticketId, { status: newStatus, adminResponse: response })
  }

  // Wrapper for priority updates
  const handleUpdatePriority = (ticketId: string, newPriority: string) => {
    handleUpdateTicket(ticketId, { priority: newPriority })
  }

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      OPEN: { icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Open' },
      IN_PROGRESS: { icon: <MessageSquare className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
      RESOLVED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700', label: 'Resolved' },
      CLOSED: { icon: <XCircle className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: 'Closed' },
    }

    const config = configs[status] || configs.OPEN
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const getTypeBadge = (type: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string }> = {
      bug: { icon: <Bug className="w-3 h-3" />, color: 'bg-red-100 text-red-700' },
      feedback: { icon: <MessageSquare className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      question: { icon: <HelpCircle className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
      other: { icon: <MessageSquare className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700' },
    }

    const config = configs[type] || configs.other
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        {config.icon}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const getPriorityBadge = (priority: string, showAll = false) => {
    const configs: Record<string, { color: string; icon?: React.ReactNode }> = {
      low: { color: 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-300' },
      normal: { color: 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300' },
      high: { color: 'bg-orange-100 text-orange-700 dark:bg-orange-900 dark:text-orange-300', icon: <Flag className="w-3 h-3" /> },
      urgent: { color: 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300', icon: <AlertTriangle className="w-3 h-3" /> },
    }

    const config = configs[priority] || configs.normal

    // Only show badge for high/urgent unless showAll is true
    if (!showAll && priority !== 'high' && priority !== 'urgent') {
      return null
    }

    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-0.5 rounded ${config.color}`}>
        {config.icon}
        {priority.toUpperCase()}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toast && (
        <div className={`fixed top-4 right-4 z-50 max-w-md p-4 rounded-lg shadow-lg border animate-in slide-in-from-right-5 ${
          toast.type === 'success' ? 'bg-green-50 dark:bg-green-900/50 border-green-200 dark:border-green-700' :
          toast.type === 'error' ? 'bg-red-50 dark:bg-red-900/50 border-red-200 dark:border-red-700' :
          'bg-blue-50 dark:bg-blue-900/50 border-blue-200 dark:border-blue-700'
        }`}>
          <div className="flex items-start gap-3">
            <div className={`flex-shrink-0 ${
              toast.type === 'success' ? 'text-green-600 dark:text-green-400' :
              toast.type === 'error' ? 'text-red-600 dark:text-red-400' :
              'text-blue-600 dark:text-blue-400'
            }`}>
              {toast.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> :
               toast.type === 'error' ? <XCircle className="w-5 h-5" /> :
               <AlertCircle className="w-5 h-5" />}
            </div>
            <div className="flex-1">
              <p className={`font-semibold ${
                toast.type === 'success' ? 'text-green-800 dark:text-green-200' :
                toast.type === 'error' ? 'text-red-800 dark:text-red-200' :
                'text-blue-800 dark:text-blue-200'
              }`}>{toast.title}</p>
              <p className={`text-sm mt-1 ${
                toast.type === 'success' ? 'text-green-700 dark:text-green-300' :
                toast.type === 'error' ? 'text-red-700 dark:text-red-300' :
                'text-blue-700 dark:text-blue-300'
              }`}>{toast.message}</p>
              {toast.details && toast.details.length > 0 && (
                <ul className={`mt-2 text-xs space-y-1 ${
                  toast.type === 'success' ? 'text-green-600 dark:text-green-400' :
                  toast.type === 'error' ? 'text-red-600 dark:text-red-400' :
                  'text-blue-600 dark:text-blue-400'
                }`}>
                  {toast.details.map((detail, i) => (
                    <li key={i} className="flex items-center gap-1">
                      <Mail className="w-3 h-3" />
                      {detail}
                    </li>
                  ))}
                </ul>
              )}
            </div>
            <button
              onClick={() => setToast(null)}
              className={`flex-shrink-0 ${
                toast.type === 'success' ? 'text-green-500 hover:text-green-700' :
                toast.type === 'error' ? 'text-red-500 hover:text-red-700' :
                'text-blue-500 hover:text-blue-700'
              }`}
            >
              <XCircle className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support Tickets</h1>
        <button
          onClick={fetchTickets}
          disabled={loading}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-4 gap-4">
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
              <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.open}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Open</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.inProgress}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">In Progress</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.resolved}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Resolved</p>
            </div>
          </div>
        </div>

        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
              <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.closed}</p>
              <p className="text-sm text-gray-500 dark:text-gray-400">Closed</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Tickets</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="CLOSED">Closed</option>
        </select>
      </div>

      {/* Tickets List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : tickets.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No tickets</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter === 'all' ? 'No support tickets yet.' : `No ${statusFilter.toLowerCase()} tickets.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {tickets.map((ticket) => (
            <div
              key={ticket.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === ticket.id ? null : ticket.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                      ticket.type === 'bug' ? 'bg-red-100 dark:bg-red-900' : 'bg-blue-100 dark:bg-blue-900'
                    }`}>
                      {ticket.type === 'bug' ? (
                        <Bug className={`w-5 h-5 ${ticket.type === 'bug' ? 'text-red-600 dark:text-red-400' : 'text-blue-600 dark:text-blue-400'}`} />
                      ) : (
                        <MessageSquare className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      )}
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1 flex-wrap">
                        <span className="font-medium text-gray-900 dark:text-white truncate max-w-md">
                          {ticket.message.slice(0, 60)}{ticket.message.length > 60 ? '...' : ''}
                        </span>
                        {getTypeBadge(ticket.type)}
                        {getStatusBadge(ticket.status)}
                        {getPriorityBadge(ticket.priority)}
                      </div>
                      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
                        {ticket.user ? (
                          <span className="flex items-center gap-1">
                            <User className="w-3 h-3" />
                            {ticket.user.name || ticket.user.email}
                          </span>
                        ) : (
                          <span className="flex items-center gap-1">
                            <Mail className="w-3 h-3" />
                            {ticket.email || 'Anonymous'}
                          </span>
                        )}
                        <span>•</span>
                        <span>{new Date(ticket.createdAt).toLocaleString()}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === ticket.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === ticket.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Message</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 whitespace-pre-wrap bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-4">
                        {ticket.message}
                      </p>

                      {ticket.pageUrl && (
                        <div className="mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Submitted from:</p>
                          <a
                            href={ticket.pageUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-sm text-primary-600 hover:underline flex items-center gap-1"
                          >
                            {ticket.pageUrl.replace(/^https?:\/\/[^\/]+/, '')}
                            <ExternalLink className="w-3 h-3" />
                          </a>
                        </div>
                      )}

                      {ticket.adminResponse && (
                        <div className="bg-green-50 dark:bg-green-900/30 rounded-lg p-3">
                          <p className="text-xs text-green-600 dark:text-green-400 mb-1">Admin Response:</p>
                          <p className="text-sm text-gray-700 dark:text-gray-300">{ticket.adminResponse}</p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Actions</h4>

                      {/* Priority Selector */}
                      <div className="mb-4">
                        <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Priority</label>
                        <div className="flex gap-1">
                          {['low', 'normal', 'high', 'urgent'].map((p) => (
                            <button
                              key={p}
                              onClick={() => handleUpdatePriority(ticket.id, p)}
                              disabled={updating === ticket.id || ticket.priority === p}
                              className={`flex-1 px-2 py-1.5 text-xs rounded-lg border transition-colors disabled:opacity-50 ${
                                ticket.priority === p
                                  ? p === 'urgent'
                                    ? 'bg-red-600 text-white border-red-600'
                                    : p === 'high'
                                    ? 'bg-orange-500 text-white border-orange-500'
                                    : p === 'normal'
                                    ? 'bg-blue-600 text-white border-blue-600'
                                    : 'bg-gray-500 text-white border-gray-500'
                                  : 'bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300'
                              }`}
                            >
                              {p.charAt(0).toUpperCase() + p.slice(1)}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Status Actions */}
                      <div className="space-y-2">
                        {/* Reopen button for resolved/closed tickets */}
                        {(ticket.status === 'RESOLVED' || ticket.status === 'CLOSED') && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'OPEN')}
                            disabled={updating === ticket.id}
                            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Reopen Ticket
                          </button>
                        )}

                        {ticket.status === 'OPEN' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'IN_PROGRESS')}
                            disabled={updating === ticket.id}
                            className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Eye className="w-4 h-4" />}
                            Mark In Progress
                          </button>
                        )}

                        {ticket.status === 'IN_PROGRESS' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'OPEN')}
                            disabled={updating === ticket.id}
                            className="w-full px-4 py-2 bg-yellow-500 text-white rounded-lg hover:bg-yellow-600 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <RotateCcw className="w-4 h-4" />}
                            Move Back to Open
                          </button>
                        )}

                        {ticket.status !== 'RESOLVED' && ticket.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED')}
                            disabled={updating === ticket.id}
                            className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle className="w-4 h-4" />}
                            Mark Resolved
                          </button>
                        )}

                        {ticket.status !== 'CLOSED' && (
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'CLOSED')}
                            disabled={updating === ticket.id}
                            className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 disabled:opacity-50 flex items-center justify-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <XCircle className="w-4 h-4" />}
                            Close Ticket
                          </button>
                        )}
                      </div>

                      {/* Response */}
                      {ticket.status !== 'CLOSED' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            {ticket.adminResponse ? 'Add Another Response' : 'Add Response'}
                          </label>
                          <textarea
                            value={responseText}
                            onChange={(e) => setResponseText(e.target.value)}
                            placeholder="Type a response..."
                            className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white text-sm"
                          />
                          <button
                            onClick={() => handleUpdateStatus(ticket.id, 'RESOLVED', responseText)}
                            disabled={!responseText.trim() || updating === ticket.id}
                            className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                          >
                            {updating === ticket.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                            Send & Resolve
                          </button>
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
