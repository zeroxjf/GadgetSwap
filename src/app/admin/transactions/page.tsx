'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Search,
  DollarSign,
  Package,
  Truck,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Eye,
  Loader2,
  ChevronLeft,
  ChevronRight,
  RefreshCw,
  Filter,
} from 'lucide-react'

interface Transaction {
  id: string
  amount: number
  platformFee: number
  stripeFee: number
  sellerPayout: number
  status: string
  createdAt: string
  completedAt: string | null
  listing: {
    id: string
    title: string
    deviceModel: string
  }
  buyer: {
    id: string
    name: string | null
    email: string
  }
  seller: {
    id: string
    name: string | null
    email: string
  }
}

interface Stats {
  total: number
  pending: number
  completed: number
  disputed: number
  totalRevenue: number
}

export default function AdminTransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)

  const fetchTransactions = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        limit: '20',
        ...(statusFilter !== 'all' && { status: statusFilter }),
        ...(search && { search }),
      })

      const res = await fetch(`/api/admin/transactions?${params}`)
      const data = await res.json()

      if (res.ok) {
        setTransactions(data.transactions)
        setStats(data.stats)
        setTotalPages(data.totalPages)
      }
    } catch (error) {
      console.error('Failed to fetch transactions:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTransactions()
  }, [page, statusFilter])

  useEffect(() => {
    const debounce = setTimeout(() => {
      setPage(1)
      fetchTransactions()
    }, 300)
    return () => clearTimeout(debounce)
  }, [search])

  const getStatusBadge = (status: string) => {
    const configs: Record<string, { icon: React.ReactNode; color: string; label: string }> = {
      PENDING: { icon: <Clock className="w-3 h-3" />, color: 'bg-yellow-100 text-yellow-700', label: 'Pending' },
      PAYMENT_RECEIVED: { icon: <DollarSign className="w-3 h-3" />, color: 'bg-blue-100 text-blue-700', label: 'Paid' },
      SHIPPED: { icon: <Truck className="w-3 h-3" />, color: 'bg-purple-100 text-purple-700', label: 'Shipped' },
      DELIVERED: { icon: <Package className="w-3 h-3" />, color: 'bg-indigo-100 text-indigo-700', label: 'Delivered' },
      COMPLETED: { icon: <CheckCircle className="w-3 h-3" />, color: 'bg-green-100 text-green-700', label: 'Completed' },
      CANCELLED: { icon: <XCircle className="w-3 h-3" />, color: 'bg-gray-100 text-gray-700', label: 'Cancelled' },
      REFUNDED: { icon: <XCircle className="w-3 h-3" />, color: 'bg-red-100 text-red-700', label: 'Refunded' },
      DISPUTED: { icon: <AlertTriangle className="w-3 h-3" />, color: 'bg-orange-100 text-orange-700', label: 'Disputed' },
    }

    const config = configs[status] || { icon: null, color: 'bg-gray-100 text-gray-700', label: status }

    return (
      <span className={`flex items-center gap-1 text-xs px-2 py-1 rounded ${config.color}`}>
        {config.icon}
        {config.label}
      </span>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Transactions</h1>
        <button
          onClick={fetchTransactions}
          className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
        >
          <RefreshCw className="w-4 h-4" />
          Refresh
        </button>
      </div>

      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Total</p>
            <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.total}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Pending</p>
            <p className="text-2xl font-bold text-yellow-600">{stats.pending}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Completed</p>
            <p className="text-2xl font-bold text-green-600">{stats.completed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Disputed</p>
            <p className="text-2xl font-bold text-orange-600">{stats.disputed}</p>
          </div>
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">Revenue</p>
            <p className="text-2xl font-bold text-emerald-600">${stats.totalRevenue.toLocaleString()}</p>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex items-center gap-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by buyer, seller, or listing..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
        >
          <option value="all">All Status</option>
          <option value="PENDING">Pending</option>
          <option value="PAYMENT_RECEIVED">Paid</option>
          <option value="SHIPPED">Shipped</option>
          <option value="DELIVERED">Delivered</option>
          <option value="COMPLETED">Completed</option>
          <option value="DISPUTED">Disputed</option>
          <option value="CANCELLED">Cancelled</option>
          <option value="REFUNDED">Refunded</option>
        </select>
      </div>

      {/* Transactions Table */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-12">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No transactions found</p>
          </div>
        ) : (
          <table className="w-full">
            <thead className="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Transaction
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Amount
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Buyer / Seller
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Date
                </th>
                <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
              {transactions.map((tx) => (
                <tr key={tx.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white truncate max-w-xs">
                        {tx.listing.title}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {tx.listing.deviceModel}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div>
                      <p className="font-medium text-gray-900 dark:text-white">${tx.amount}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        Fee: ${tx.platformFee.toFixed(2)}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm">
                      <p className="text-gray-900 dark:text-white">
                        {tx.buyer.name || tx.buyer.email}
                      </p>
                      <p className="text-gray-500 dark:text-gray-400">
                        → {tx.seller.name || tx.seller.email}
                      </p>
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    {getStatusBadge(tx.status)}
                  </td>
                  <td className="px-4 py-4 text-sm text-gray-500 dark:text-gray-400">
                    {new Date(tx.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-4 text-right">
                    <Link
                      href={`/admin/transactions/${tx.id}`}
                      className="text-primary-600 hover:text-primary-700"
                    >
                      <Eye className="w-4 h-4" />
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 py-3 border-t border-gray-200 dark:border-gray-700">
            <p className="text-sm text-gray-500 dark:text-gray-400">
              Page {page} of {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg disabled:opacity-50"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
