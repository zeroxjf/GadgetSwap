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
} from 'lucide-react'

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

  const handleUpdateStatus = async (ticketId: string, newStatus: string, response?: string) => {
    setUpdating(ticketId)
    try {
      const res = await fetch('/api/admin/support', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ticketId,
          status: newStatus,
          adminResponse: response,
        }),
      })

      if (res.ok) {
        setTickets((prev) =>
          prev.map((t) =>
            t.id === ticketId
              ? { ...t, status: newStatus, adminResponse: response || t.adminResponse }
              : t
          )
        )
        setResponseText('')
        // Update stats
        fetchTickets()
      }
    } catch (error) {
      console.error('Failed to update ticket:', error)
    } finally {
      setUpdating(null)
    }
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

  const getPriorityBadge = (priority: string) => {
    if (priority === 'high' || priority === 'urgent') {
      return (
        <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded">
          {priority.toUpperCase()}
        </span>
      )
    }
    return null
  }

  return (
    <div className="space-y-6">
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
                      <div className="space-y-2">
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
                        {ticket.status !== 'RESOLVED' && (
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
                      {!ticket.adminResponse && ticket.status !== 'CLOSED' && (
                        <div className="mt-4">
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                            Add Response (optional)
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
