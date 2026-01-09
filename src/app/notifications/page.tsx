'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Bell,
  BellOff,
  Check,
  ChevronLeft,
  MessageSquare,
  ShoppingBag,
  Tag,
  Heart,
  AlertCircle,
  Star
} from 'lucide-react'

interface Notification {
  id: string
  type: string
  title: string
  message: string
  read: boolean
  link?: string
  createdAt: string
}

const notificationIcons: Record<string, any> = {
  NEW_MESSAGE: MessageSquare,
  LISTING_SOLD: ShoppingBag,
  PRICE_DROP: Tag,
  WATCHLIST_ALERT: Heart,
  DEVICE_ALERT_MATCH: Bell,
  TRANSACTION_UPDATE: ShoppingBag,
  REVIEW_RECEIVED: Star,
  SYSTEM: AlertCircle,
}

const notificationColors: Record<string, string> = {
  NEW_MESSAGE: 'bg-blue-100 text-blue-600',
  LISTING_SOLD: 'bg-green-100 text-green-600',
  PRICE_DROP: 'bg-orange-100 text-orange-600',
  WATCHLIST_ALERT: 'bg-red-100 text-red-600',
  DEVICE_ALERT_MATCH: 'bg-yellow-100 text-yellow-600',
  TRANSACTION_UPDATE: 'bg-purple-100 text-purple-600',
  REVIEW_RECEIVED: 'bg-yellow-100 text-yellow-600',
  SYSTEM: 'bg-gray-100 text-gray-600',
}

export default function NotificationsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/notifications')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchNotifications()
    }
  }, [session])

  const fetchNotifications = async () => {
    try {
      const response = await fetch('/api/notifications')
      if (response.ok) {
        const data = await response.json()
        setNotifications(data.notifications || [])
      }
    } catch (error) {
      console.error('Failed to fetch notifications:', error)
    } finally {
      setLoading(false)
    }
  }

  const markAsRead = async (notificationId: string) => {
    try {
      await fetch(`/api/notifications/${notificationId}/read`, { method: 'POST' })
      setNotifications(notifications.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      ))
    } catch (error) {
      console.error('Failed to mark as read:', error)
    }
  }

  const markAllAsRead = async () => {
    try {
      await fetch('/api/notifications/read-all', { method: 'POST' })
      setNotifications(notifications.map(n => ({ ...n, read: true })))
    } catch (error) {
      console.error('Failed to mark all as read:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Notifications</h1>
              <p className="text-gray-600 dark:text-gray-400">
                {unreadCount > 0 ? `${unreadCount} unread` : 'All caught up!'}
              </p>
            </div>
            {unreadCount > 0 && (
              <button onClick={markAllAsRead} className="btn-secondary text-sm flex items-center gap-2">
                <Check className="w-4 h-4" />
                Mark all read
              </button>
            )}
          </div>
        </div>

        {/* Notifications List */}
        {notifications.length === 0 ? (
          <div className="card p-12 text-center">
            <BellOff className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No notifications</h3>
            <p className="text-gray-500 dark:text-gray-400">
              You'll see notifications here when there's activity on your account.
            </p>
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            {notifications.map((notification) => {
              const Icon = notificationIcons[notification.type] || Bell
              const colorClass = notificationColors[notification.type] || 'bg-gray-100 text-gray-600'

              return (
                <div
                  key={notification.id}
                  className={`p-4 ${!notification.read ? 'bg-primary-50/50' : ''}`}
                  onClick={() => {
                    if (!notification.read) markAsRead(notification.id)
                    if (notification.link) router.push(notification.link)
                  }}
                >
                  <div className="flex gap-4 cursor-pointer">
                    <div className={`p-2 rounded-lg ${colorClass} flex-shrink-0`}>
                      <Icon className="w-5 h-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <p className={`font-medium ${!notification.read ? 'text-gray-900 dark:text-white' : 'text-gray-700 dark:text-gray-300'}`}>
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <span className="w-2 h-2 bg-primary-500 rounded-full flex-shrink-0 mt-2" />
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">{notification.message}</p>
                      <p className="text-xs text-gray-400 mt-2">
                        {new Date(notification.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: 'numeric',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
