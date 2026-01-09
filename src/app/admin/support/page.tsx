'use client'

import { useState, useEffect } from 'react'
import {
  MessageSquare,
  AlertTriangle,
  Flag,
  CheckCircle,
  Clock,
  User,
  Package,
  Eye,
  Loader2,
  RefreshCw,
  ChevronDown,
  ChevronUp,
  Send,
  XCircle,
} from 'lucide-react'

interface Report {
  id: string
  type: 'listing' | 'user' | 'transaction' | 'other'
  reason: string
  description: string
  status: 'OPEN' | 'IN_PROGRESS' | 'RESOLVED' | 'DISMISSED'
  createdAt: string
  reporter: {
    id: string
    name: string | null
    email: string
  }
  targetListing?: {
    id: string
    title: string
  } | null
  targetUser?: {
    id: string
    name: string | null
    email: string
  } | null
}

// Simulated reports for now - in production this would come from a Report model
const mockReports: Report[] = [
  {
    id: '1',
    type: 'listing',
    reason: 'Suspicious listing',
    description: 'This listing appears to have fake photos and the price is too good to be true.',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    reporter: { id: '1', name: 'John Doe', email: 'john@example.com' },
    targetListing: { id: 'l1', title: 'iPhone 15 Pro Max 256GB' },
  },
  {
    id: '2',
    type: 'user',
    reason: 'Scam attempt',
    description: 'This seller tried to take payment outside the platform.',
    status: 'IN_PROGRESS',
    createdAt: new Date(Date.now() - 86400000).toISOString(),
    reporter: { id: '2', name: 'Jane Smith', email: 'jane@example.com' },
    targetUser: { id: 'u1', name: 'Suspicious Seller', email: 'seller@example.com' },
  },
]

export default function AdminSupportPage() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [responseText, setResponseText] = useState('')

  useEffect(() => {
    // In production, fetch from API
    setTimeout(() => {
      setReports(mockReports)
      setLoading(false)
    }, 500)
  }, [])

  const handleUpdateStatus = (reportId: string, newStatus: Report['status']) => {
    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: newStatus } : r))
    )
  }

  const getStatusBadge = (status: Report['status']) => {
    const configs = {
      OPEN: { icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Open' },
      IN_PROGRESS: { icon: <MessageSquare className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'In Progress' },
      RESOLVED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700', label: 'Resolved' },
      DISMISSED: { icon: <XCircle className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: 'Dismissed' },
    }

    const config = configs[status]
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  const getTypeBadge = (type: Report['type']) => {
    const configs = {
      listing: { icon: <Package className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700' },
      user: { icon: <User className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700' },
      transaction: { icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700' },
      other: { icon: <Flag className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700' },
    }

    const config = configs[type]
    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        {config.icon}
        {type.charAt(0).toUpperCase() + type.slice(1)}
      </span>
    )
  }

  const filteredReports = reports.filter((r) => {
    if (statusFilter === 'all') return true
    return r.status === statusFilter
  })

  const stats = {
    open: reports.filter((r) => r.status === 'OPEN').length,
    inProgress: reports.filter((r) => r.status === 'IN_PROGRESS').length,
    resolved: reports.filter((r) => r.status === 'RESOLVED').length,
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Support & Reports</h1>
        <button
          onClick={() => setLoading(true)}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
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
      </div>

      {/* Filter */}
      <div className="flex items-center gap-4">
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Reports</option>
          <option value="OPEN">Open</option>
          <option value="IN_PROGRESS">In Progress</option>
          <option value="RESOLVED">Resolved</option>
          <option value="DISMISSED">Dismissed</option>
        </select>
      </div>

      {/* Reports List */}
      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">No reports</h3>
          <p className="text-gray-500 dark:text-gray-400">
            {statusFilter === 'all' ? 'No reports have been submitted.' : `No ${statusFilter.toLowerCase()} reports.`}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
            >
              {/* Header */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === report.id ? null : report.id)}
              >
                <div className="flex items-start justify-between">
                  <div className="flex items-start gap-4">
                    <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                      <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white">{report.reason}</h3>
                        {getTypeBadge(report.type)}
                        {getStatusBadge(report.status)}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        Reported by {report.reporter.name || report.reporter.email} •{' '}
                        {new Date(report.createdAt).toLocaleDateString()}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {expandedId === report.id ? (
                      <ChevronUp className="w-5 h-5 text-gray-400" />
                    ) : (
                      <ChevronDown className="w-5 h-5 text-gray-400" />
                    )}
                  </div>
                </div>
              </div>

              {/* Expanded Content */}
              {expandedId === report.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Report Details</h4>
                      <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">{report.description}</p>

                      {report.targetListing && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3 mb-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reported Listing</p>
                          <p className="font-medium text-gray-900 dark:text-white">{report.targetListing.title}</p>
                        </div>
                      )}

                      {report.targetUser && (
                        <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-3">
                          <p className="text-xs text-gray-500 dark:text-gray-400 mb-1">Reported User</p>
                          <p className="font-medium text-gray-900 dark:text-white">
                            {report.targetUser.name || report.targetUser.email}
                          </p>
                        </div>
                      )}
                    </div>

                    {/* Actions */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Actions</h4>
                      <div className="space-y-2">
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'IN_PROGRESS')}
                          className="w-full px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2"
                        >
                          <MessageSquare className="w-4 h-4" />
                          Mark In Progress
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'RESOLVED')}
                          className="w-full px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2"
                        >
                          <CheckCircle className="w-4 h-4" />
                          Mark Resolved
                        </button>
                        <button
                          onClick={() => handleUpdateStatus(report.id, 'DISMISSED')}
                          className="w-full px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center justify-center gap-2"
                        >
                          <XCircle className="w-4 h-4" />
                          Dismiss
                        </button>
                      </div>

                      {/* Response */}
                      <div className="mt-4">
                        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                          Send Response
                        </label>
                        <textarea
                          value={responseText}
                          onChange={(e) => setResponseText(e.target.value)}
                          placeholder="Type your response to the reporter..."
                          className="w-full h-24 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
                        />
                        <button
                          disabled={!responseText.trim()}
                          className="mt-2 px-4 py-2 bg-primary-600 text-white rounded-lg hover:bg-primary-700 disabled:opacity-50 flex items-center gap-2"
                        >
                          <Send className="w-4 h-4" />
                          Send
                        </button>
                      </div>
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
