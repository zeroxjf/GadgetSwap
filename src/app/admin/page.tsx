'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import {
  Users,
  Package,
  DollarSign,
  AlertTriangle,
  TrendingUp,
  Clock,
  CheckCircle,
  XCircle,
  ShoppingCart,
  MessageSquare,
  Flag,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Eye,
  Globe,
  MousePointer,
  ExternalLink,
} from 'lucide-react'

interface DashboardStats {
  // Users
  totalUsers: number
  newUsersToday: number
  newUsersWeek: number
  activeUsersToday: number

  // Listings
  totalListings: number
  activeListings: number
  pendingReview: number
  flaggedListings: number

  // Transactions
  totalTransactions: number
  pendingTransactions: number
  completedToday: number
  revenueToday: number
  revenueWeek: number
  revenueMonth: number

  // Support
  openReports: number
  unresolvedDisputes: number
}

interface RecentActivity {
  id: string
  type: 'listing' | 'transaction' | 'user' | 'review' | 'report'
  message: string
  time: string
  link?: string
}

interface ActivityMetrics {
  activeUsers: {
    today: number
    week: number
    month: number
  }
  today: {
    logins: number
    listingsCreated: number
    purchases: number
    messagesSent: number
    total: number
  }
  week: {
    logins: number
    listingsCreated: number
    purchases: number
    messagesSent: number
    total: number
  }
}

interface ActivityFeedItem {
  id: string
  type: string
  description: string
  userId: string
  userName: string
  time: string
  metadata?: any
}

interface SiteTraffic {
  pageViews: {
    today: number
    yesterday: number
    thisWeek: number
    thisMonth: number
  }
  visitors: {
    today: number
    yesterday: number
    thisWeek: number
    thisMonth: number
  }
  topPages: Array<{ path: string; views: number; visitors: number }>
  topReferrers: Array<{ referrer: string; views: number; visitors: number }>
}

export default function AdminDashboardPage() {
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [siteTraffic, setSiteTraffic] = useState<SiteTraffic | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchDashboardData()
  }, [])

  const fetchDashboardData = async () => {
    try {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()
      if (res.ok) {
        setStats(data.stats)
        setRecentActivity(data.recentActivity || [])
        setActivityMetrics(data.activityMetrics || null)
        setActivityFeed(data.activityFeed || [])
        setSiteTraffic(data.siteTraffic || null)
      }
    } catch (error) {
      console.error('Failed to fetch dashboard data:', error)
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="text-center py-12">
        <p className="text-gray-500">Failed to load dashboard data</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Dashboard</h1>
        <p className="text-sm text-gray-500 dark:text-gray-400">
          Last updated: {new Date().toLocaleTimeString()}
        </p>
      </div>

      {/* Quick Action Cards */}
      {(stats.pendingReview > 0 || stats.flaggedListings > 0 || stats.unresolvedDisputes > 0) && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {stats.pendingReview > 0 && (
            <Link
              href="/admin/reviews"
              className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4 hover:bg-yellow-100 dark:hover:bg-yellow-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Clock className="w-8 h-8 text-yellow-600" />
                  <div>
                    <p className="text-2xl font-bold text-yellow-700 dark:text-yellow-400">{stats.pendingReview}</p>
                    <p className="text-sm text-yellow-600 dark:text-yellow-500">Pending Reviews</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-yellow-600" />
              </div>
            </Link>
          )}

          {stats.flaggedListings > 0 && (
            <Link
              href="/admin/reviews?flagged=true"
              className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4 hover:bg-red-100 dark:hover:bg-red-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Flag className="w-8 h-8 text-red-600" />
                  <div>
                    <p className="text-2xl font-bold text-red-700 dark:text-red-400">{stats.flaggedListings}</p>
                    <p className="text-sm text-red-600 dark:text-red-500">Flagged Listings</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-red-600" />
              </div>
            </Link>
          )}

          {stats.unresolvedDisputes > 0 && (
            <Link
              href="/admin/support"
              className="bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-8 h-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold text-orange-700 dark:text-orange-400">{stats.unresolvedDisputes}</p>
                    <p className="text-sm text-orange-600 dark:text-orange-500">Open Disputes</p>
                  </div>
                </div>
                <ArrowUpRight className="w-5 h-5 text-orange-600" />
              </div>
            </Link>
          )}
        </div>
      )}

      {/* Main Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        {/* Users */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
              <Users className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Total Users</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalUsers.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">+{stats.newUsersToday} today</p>
        </div>

        {/* Listings */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
              <Package className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Active Listings</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.activeListings.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.totalListings} total</p>
        </div>

        {/* Transactions */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-green-600 dark:text-green-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Transactions</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalTransactions.toLocaleString()}</p>
          <p className="text-xs text-gray-500 mt-1">{stats.pendingTransactions} pending</p>
        </div>

        {/* Revenue */}
        <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-emerald-100 dark:bg-emerald-900 rounded-lg flex items-center justify-center">
              <DollarSign className="w-5 h-5 text-emerald-600 dark:text-emerald-400" />
            </div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Revenue (Month)</span>
          </div>
          <p className="text-2xl font-bold text-gray-900 dark:text-white">${stats.revenueMonth.toLocaleString()}</p>
          <p className="text-xs text-green-600 mt-1">${stats.revenueToday} today</p>
        </div>
      </div>

      {/* Revenue & Activity Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Revenue Breakdown */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Revenue Overview</h2>
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">Today</span>
              <span className="font-semibold text-gray-900 dark:text-white">${stats.revenueToday.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">This Week</span>
              <span className="font-semibold text-gray-900 dark:text-white">${stats.revenueWeek.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <span className="text-gray-600 dark:text-gray-300">This Month</span>
              <span className="font-semibold text-gray-900 dark:text-white">${stats.revenueMonth.toLocaleString()}</span>
            </div>
          </div>
          <Link
            href="/admin/transactions"
            className="mt-4 flex items-center justify-center gap-2 w-full py-2 text-sm text-primary-600 hover:text-primary-700 dark:text-primary-400"
          >
            View all transactions
            <ArrowUpRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Recent Activity */}
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          {recentActivity.length === 0 ? (
            <p className="text-gray-500 dark:text-gray-400 text-center py-8">No recent activity</p>
          ) : (
            <div className="space-y-3">
              {recentActivity.slice(0, 8).map((activity) => (
                <div
                  key={activity.id}
                  className="flex items-start gap-3 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    activity.type === 'listing' ? 'bg-purple-100 dark:bg-purple-900' :
                    activity.type === 'transaction' ? 'bg-green-100 dark:bg-green-900' :
                    activity.type === 'user' ? 'bg-blue-100 dark:bg-blue-900' :
                    activity.type === 'review' ? 'bg-yellow-100 dark:bg-yellow-900' :
                    'bg-red-100 dark:bg-red-900'
                  }`}>
                    {activity.type === 'listing' && <Package className="w-4 h-4 text-purple-600" />}
                    {activity.type === 'transaction' && <ShoppingCart className="w-4 h-4 text-green-600" />}
                    {activity.type === 'user' && <Users className="w-4 h-4 text-blue-600" />}
                    {activity.type === 'review' && <CheckCircle className="w-4 h-4 text-yellow-600" />}
                    {activity.type === 'report' && <Flag className="w-4 h-4 text-red-600" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white truncate">{activity.message}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{activity.time}</p>
                  </div>
                  {activity.link && (
                    <Link href={activity.link} className="text-primary-600 hover:text-primary-700">
                      <Eye className="w-4 h-4" />
                    </Link>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Links */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Link
          href="/admin/reviews"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <Clock className="w-6 h-6 text-yellow-600 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Review Queue</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.pendingReview} pending</p>
        </Link>

        <Link
          href="/admin/users"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <Users className="w-6 h-6 text-blue-600 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">User Management</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalUsers} users</p>
        </Link>

        <Link
          href="/admin/transactions"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <ShoppingCart className="w-6 h-6 text-green-600 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Transactions</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.totalTransactions} total</p>
        </Link>

        <Link
          href="/admin/support"
          className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:border-primary-300 dark:hover:border-primary-700 transition-colors"
        >
          <MessageSquare className="w-6 h-6 text-purple-600 mb-2" />
          <h3 className="font-medium text-gray-900 dark:text-white">Support</h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">{stats.openReports} open</p>
        </Link>
      </div>
    </div>
  )
}
