'use client'

import { useState, useEffect } from 'react'
import {
  Users,
  Package,
  ShoppingCart,
  MessageSquare,
  Activity,
  Loader2,
  Eye,
  Globe,
  MousePointer,
  ExternalLink,
  TrendingUp,
  Calendar,
  RefreshCw,
} from 'lucide-react'

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
  debug?: {
    hasToken: boolean
    hasProjectId: boolean
    hasTeamId: boolean
    error?: string
  }
}

const activityTypeIcons: Record<string, { icon: typeof Activity; color: string; bg: string }> = {
  LOGIN: { icon: Users, color: 'text-blue-600', bg: 'bg-blue-100 dark:bg-blue-900' },
  SIGNUP: { icon: Users, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
  LISTING_CREATED: { icon: Package, color: 'text-purple-600', bg: 'bg-purple-100 dark:bg-purple-900' },
  PURCHASE: { icon: ShoppingCart, color: 'text-emerald-600', bg: 'bg-emerald-100 dark:bg-emerald-900' },
  SALE: { icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100 dark:bg-green-900' },
  MESSAGE_SENT: { icon: MessageSquare, color: 'text-yellow-600', bg: 'bg-yellow-100 dark:bg-yellow-900' },
}

export default function AdminActivityPage() {
  const [activityMetrics, setActivityMetrics] = useState<ActivityMetrics | null>(null)
  const [activityFeed, setActivityFeed] = useState<ActivityFeedItem[]>([])
  const [siteTraffic, setSiteTraffic] = useState<SiteTraffic | null>(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    fetchData()
  }, [])

  const fetchData = async (isRefresh = false) => {
    if (isRefresh) setRefreshing(true)
    try {
      const res = await fetch('/api/admin/dashboard')
      const data = await res.json()
      if (res.ok) {
        setActivityMetrics(data.activityMetrics || null)
        setActivityFeed(data.activityFeed || [])
        setSiteTraffic(data.siteTraffic || null)
      }
    } catch (error) {
      console.error('Failed to fetch data:', error)
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Activity & Traffic</h1>
          <p className="text-gray-500 dark:text-gray-400">Monitor user activity and site traffic</p>
        </div>
        <button
          onClick={() => fetchData(true)}
          disabled={refreshing}
          className="flex items-center gap-2 px-4 py-2 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-4 h-4 ${refreshing ? 'animate-spin' : ''}`} />
          Refresh
        </button>
      </div>

      {/* User Activity Section */}
      {activityMetrics && (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">User Activity</h2>
            <Activity className="w-5 h-5 text-gray-400" />
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Active Users Today */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4">
              <p className="text-sm text-blue-600 dark:text-blue-400 font-medium">Active Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityMetrics.activeUsers.today}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">unique users</p>
            </div>

            {/* Active Users Week */}
            <div className="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4">
              <p className="text-sm text-green-600 dark:text-green-400 font-medium">Active This Week</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityMetrics.activeUsers.week}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">unique users</p>
            </div>

            {/* Active Users Month */}
            <div className="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4">
              <p className="text-sm text-purple-600 dark:text-purple-400 font-medium">Active This Month</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityMetrics.activeUsers.month}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">unique users</p>
            </div>

            {/* Total Actions Today */}
            <div className="bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20 rounded-lg p-4">
              <p className="text-sm text-orange-600 dark:text-orange-400 font-medium">Actions Today</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{activityMetrics.today.total}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">total events</p>
            </div>
          </div>

          {/* Activity Breakdown - Today vs Week */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Today's Activity */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <Calendar className="w-4 h-4" />
                Today
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.today.logins}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.today.listingsCreated}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Listings</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.today.purchases}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Purchases</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.today.messagesSent}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                  </div>
                </div>
              </div>
            </div>

            {/* This Week's Activity */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3 flex items-center gap-2">
                <TrendingUp className="w-4 h-4" />
                This Week
              </h3>
              <div className="grid grid-cols-2 gap-3">
                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-full flex items-center justify-center">
                    <Users className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.week.logins}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Logins</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-full flex items-center justify-center">
                    <Package className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.week.listingsCreated}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Listings</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-full flex items-center justify-center">
                    <ShoppingCart className="w-4 h-4 text-green-600 dark:text-green-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.week.purchases}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Purchases</p>
                  </div>
                </div>

                <div className="flex items-center gap-3 p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <div className="w-8 h-8 bg-yellow-100 dark:bg-yellow-900 rounded-full flex items-center justify-center">
                    <MessageSquare className="w-4 h-4 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">{activityMetrics.week.messagesSent}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Messages</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Site Traffic Section */}
      {siteTraffic ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Site Traffic</h2>
            <a
              href="https://vercel.com/dashboard"
              target="_blank"
              rel="noopener noreferrer"
              className="text-sm text-primary-600 hover:text-primary-700 flex items-center gap-1"
            >
              Vercel Analytics
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
            {/* Page Views Today */}
            <div className="bg-gradient-to-br from-cyan-50 to-sky-50 dark:from-cyan-900/20 dark:to-sky-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Eye className="w-4 h-4 text-cyan-600 dark:text-cyan-400" />
                <p className="text-sm text-cyan-600 dark:text-cyan-400 font-medium">Page Views</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{siteTraffic.pageViews.today.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">today</p>
            </div>

            {/* Visitors Today */}
            <div className="bg-gradient-to-br from-violet-50 to-purple-50 dark:from-violet-900/20 dark:to-purple-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <MousePointer className="w-4 h-4 text-violet-600 dark:text-violet-400" />
                <p className="text-sm text-violet-600 dark:text-violet-400 font-medium">Visitors</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{siteTraffic.visitors.today.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">today</p>
            </div>

            {/* Page Views This Week */}
            <div className="bg-gradient-to-br from-teal-50 to-emerald-50 dark:from-teal-900/20 dark:to-emerald-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Globe className="w-4 h-4 text-teal-600 dark:text-teal-400" />
                <p className="text-sm text-teal-600 dark:text-teal-400 font-medium">Views (Week)</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{siteTraffic.pageViews.thisWeek.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">this week</p>
            </div>

            {/* Visitors This Week */}
            <div className="bg-gradient-to-br from-rose-50 to-pink-50 dark:from-rose-900/20 dark:to-pink-900/20 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-1">
                <Users className="w-4 h-4 text-rose-600 dark:text-rose-400" />
                <p className="text-sm text-rose-600 dark:text-rose-400 font-medium">Visitors (Week)</p>
              </div>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{siteTraffic.visitors.thisWeek.toLocaleString()}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">this week</p>
            </div>
          </div>

          {/* Top Pages & Referrers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Top Pages */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Pages</h3>
              {siteTraffic.topPages.length > 0 ? (
                <div className="space-y-2">
                  {siteTraffic.topPages.slice(0, 10).map((page, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{page.path}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{page.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
              )}
            </div>

            {/* Top Referrers */}
            <div>
              <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">Top Referrers</h3>
              {siteTraffic.topReferrers.length > 0 ? (
                <div className="space-y-2">
                  {siteTraffic.topReferrers.slice(0, 10).map((referrer, index) => (
                    <div key={index} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                      <span className="text-sm text-gray-700 dark:text-gray-300 truncate flex-1 mr-2">{referrer.referrer}</span>
                      <span className="text-sm font-medium text-gray-900 dark:text-white whitespace-nowrap">{referrer.views.toLocaleString()}</span>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-500 dark:text-gray-400">No data yet</p>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white">Site Traffic</h2>
          </div>
          <div className="text-center py-8">
            <Globe className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">Vercel Analytics not configured</p>
            <p className="text-sm text-gray-400 dark:text-gray-500 mb-4">
              Add VERCEL_API_TOKEN and VERCEL_PROJECT_ID env vars to enable
            </p>
            <div className="text-xs text-left bg-gray-100 dark:bg-gray-700 p-3 rounded max-w-md mx-auto">
              <p className="font-mono mb-2">Required env vars:</p>
              <ul className="space-y-1 text-gray-600 dark:text-gray-400">
                <li>VERCEL_API_TOKEN - Create at Vercel Settings &gt; Tokens</li>
                <li>VERCEL_PROJECT_ID - Found in Project Settings &gt; General</li>
                <li>VERCEL_TEAM_ID - Team Settings &gt; General (if team project)</li>
              </ul>
            </div>
          </div>
        </div>
      )}

      {/* Debug Info for Site Traffic */}
      {siteTraffic?.debug?.error && (
        <div className="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <h3 className="text-sm font-medium text-red-800 dark:text-red-300 mb-2">Vercel Analytics Debug</h3>
          <div className="text-xs text-red-700 dark:text-red-400 space-y-1">
            <p>Has Token: {siteTraffic.debug.hasToken ? 'Yes' : 'No'}</p>
            <p>Has Project ID: {siteTraffic.debug.hasProjectId ? 'Yes' : 'No'}</p>
            <p>Has Team ID: {siteTraffic.debug.hasTeamId ? 'Yes' : 'No'}</p>
            {siteTraffic.debug.error && (
              <p className="mt-2 p-2 bg-red-100 dark:bg-red-900/40 rounded font-mono break-all">
                Error: {siteTraffic.debug.error}
              </p>
            )}
          </div>
        </div>
      )}

      {/* Recent Activity Feed */}
      <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity Feed</h2>
        {activityFeed.length === 0 ? (
          <div className="text-center py-8">
            <Activity className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400">No activity recorded yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activityFeed.map((item) => {
              const typeConfig = activityTypeIcons[item.type] || { icon: Activity, color: 'text-gray-600', bg: 'bg-gray-100 dark:bg-gray-700' }
              const Icon = typeConfig.icon
              return (
                <div
                  key={item.id}
                  className="flex items-start gap-3 p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 rounded-lg transition-colors"
                >
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${typeConfig.bg}`}>
                    <Icon className={`w-4 h-4 ${typeConfig.color}`} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm text-gray-900 dark:text-white">{item.description}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                      {item.userName} &middot; {item.time}
                    </p>
                  </div>
                  <span className="text-xs px-2 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded-full">
                    {item.type.replace('_', ' ')}
                  </span>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
