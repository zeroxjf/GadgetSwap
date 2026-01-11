'use client'

import Link from 'next/link'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  Search,
  Menu,
  X,
  User,
  Heart,
  MessageSquare,
  Bell,
  Plus,
  ChevronDown,
  LogOut,
  Settings,
  ClipboardList,
  LayoutDashboard
} from 'lucide-react'

const deviceCategories = [
  { name: 'iPhones', href: '/search?deviceType=IPHONE' },
  { name: 'iPads', href: '/search?deviceType=IPAD' },
  { name: 'MacBooks', href: '/search?deviceType=MACBOOK' },
  { name: 'iMacs', href: '/search?deviceType=IMAC' },
  { name: 'Apple Watch', href: '/search?deviceType=APPLE_WATCH' },
  { name: 'AirPods', href: '/search?deviceType=AIRPODS' },
]

export function Header() {
  const { data: session, status } = useSession()
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [unreadMessageCount, setUnreadMessageCount] = useState(0)
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0)
  const [notificationPulse, setNotificationPulse] = useState(false)
  const prevNotificationCountRef = useRef(0)

  const isLoggedIn = !!session?.user

  // Fetch unread message count
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchUnreadCount = async () => {
      try {
        const response = await fetch('/api/messages/unread-count')
        if (response.ok) {
          const data = await response.json()
          setUnreadMessageCount(data.count)
        }
      } catch (error) {
        console.error('Failed to fetch unread count:', error)
      }
    }

    fetchUnreadCount()
    // Refresh every 30 seconds
    const interval = setInterval(fetchUnreadCount, 30000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  // Fetch unread notification count
  useEffect(() => {
    if (!isLoggedIn) return

    const fetchNotificationCount = async () => {
      try {
        const response = await fetch('/api/notifications/unread-count')
        if (response.ok) {
          const data = await response.json()
          const newCount = data.count
          // Trigger pulse animation if count increased from previous
          if (newCount > prevNotificationCountRef.current && prevNotificationCountRef.current > 0) {
            setNotificationPulse(true)
            setTimeout(() => setNotificationPulse(false), 1000)
          }
          prevNotificationCountRef.current = newCount
          setUnreadNotificationCount(newCount)
        }
      } catch (error) {
        console.error('Failed to fetch notification count:', error)
      }
    }

    fetchNotificationCount()
    // Refresh every 15 seconds for notifications
    const interval = setInterval(fetchNotificationCount, 15000)
    return () => clearInterval(interval)
  }, [isLoggedIn])

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-50">
      {/* Main header */}
      <div className="max-w-7xl mx-auto px-3 sm:px-4 py-2.5 sm:py-3">
        <div className="flex items-center justify-between gap-2 sm:gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <img
              src="/logo.png"
              alt="GadgetSwap"
              className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl"
            />
            <span className="text-xl font-bold text-gray-900 dark:text-white hidden sm:block">
              GadgetSwap
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-2.5 sm:left-3 top-1/2 transform -translate-y-1/2 text-gray-400 dark:text-gray-500 w-4 h-4 sm:w-5 sm:h-5" />
              <input
                type="text"
                placeholder="Search devices..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 sm:pl-10 pr-3 sm:pr-4 py-2 sm:py-2.5 text-sm sm:text-base border border-gray-300 dark:border-gray-600 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 placeholder:text-gray-400 dark:placeholder:text-gray-500"
              />
            </div>
          </form>

          {/* Desktop nav */}
          <nav className="hidden lg:flex items-center gap-2">
            {isLoggedIn ? (
              <>
                <Link
                  href="/listings/new"
                  className="btn-primary flex items-center gap-2"
                >
                  <Plus className="w-4 h-4" />
                  Sell
                </Link>
                <Link href="/messages" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
                  <MessageSquare className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                  {unreadMessageCount > 0 && (
                    <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                  )}
                </Link>
                <Link href="/notifications" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg relative">
                  <Bell className={`w-5 h-5 text-gray-600 dark:text-gray-400 ${notificationPulse ? 'animate-bounce' : ''}`} />
                  {unreadNotificationCount > 0 && (
                    <>
                      <span className={`absolute top-1 right-1 min-w-[8px] h-2 bg-red-500 rounded-full ${notificationPulse ? 'animate-ping' : ''}`}></span>
                      <span className="absolute top-1 right-1 min-w-[8px] h-2 bg-red-500 rounded-full"></span>
                    </>
                  )}
                </Link>
                <Link href="/watchlist" className="p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg">
                  <Heart className="w-5 h-5 text-gray-600 dark:text-gray-400" />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary-100 dark:bg-primary-900/30 rounded-full flex items-center justify-center">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-primary-600 dark:text-primary-400 font-medium text-sm">
                          {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                        <p className="font-medium text-gray-900 dark:text-gray-100">{session?.user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{session?.user?.email}</p>
                      </div>
                      {/* Admin-only links */}
                      {session?.user?.role === 'ADMIN' && (
                        <>
                          <Link
                            href="/admin"
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Admin Dashboard
                          </Link>
                          <Link
                            href="/admin/reviews"
                            className="flex items-center gap-2 px-4 py-2 text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20"
                            onClick={() => setShowUserMenu(false)}
                          >
                            <ClipboardList className="w-4 h-4" />
                            Review Queue
                          </Link>
                          <div className="border-b border-gray-100 dark:border-gray-700 my-1"></div>
                        </>
                      )}
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        href="/account/listings"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <Settings className="w-4 h-4" />
                        My Listings
                      </Link>
                      <button
                        onClick={() => {
                          setShowUserMenu(false)
                          signOut({ callbackUrl: '/' })
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full"
                      >
                        <LogOut className="w-4 h-4" />
                        Sign Out
                      </button>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <>
                <Link href="/auth/signin" className="btn-secondary">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary">
                  Sign Up
                </Link>
              </>
            )}
          </nav>

          {/* Mobile menu button */}
          <button
            className="lg:hidden p-2 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600 dark:text-gray-400" />
            )}
          </button>
        </div>

        {/* Category nav */}
        <nav className="hidden md:flex items-center gap-6 mt-3 text-sm">
          {deviceCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/search?jailbreakStatus=JAILBREAKABLE"
            className="text-accent-600 dark:text-accent-400 hover:text-accent-700 dark:hover:text-accent-300 font-medium flex items-center gap-1"
          >
            Jailbreakable
            <span className="badge-purple text-xs">Hot</span>
          </Link>
          <Link
            href="/alerts"
            className="text-yellow-600 dark:text-yellow-400 hover:text-yellow-700 dark:hover:text-yellow-300 font-medium flex items-center gap-1"
          >
            <Bell className="w-3.5 h-3.5" />
            Alerts
            <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-1.5 py-0.5 rounded-full font-bold">New</span>
          </Link>
          <Link
            href="/market-insights"
            className="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors"
          >
            Market Insights
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900">
          <div className="px-4 py-3 space-y-3">
            {/* Categories */}
            <div className="space-y-1">
              {deviceCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="block py-2 text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/search?jailbreakStatus=JAILBREAKABLE"
                className="block py-2 text-accent-600 dark:text-accent-400 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jailbreakable Devices
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-2 py-2 text-yellow-600 dark:text-yellow-400 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-4 h-4" />
                Device Alerts
                <span className="bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 text-xs px-1.5 py-0.5 rounded-full font-bold">New</span>
              </Link>
            </div>

            <hr className="border-gray-200 dark:border-gray-700" />

            {/* Auth buttons */}
            {isLoggedIn ? (
              <div className="space-y-3">
                <Link href="/listings/new" className="btn-primary w-full justify-center text-sm py-2.5">
                  <Plus className="w-4 h-4 mr-2" />
                  Sell a Device
                </Link>
                <div className="flex justify-center gap-3">
                  <Link href="/messages" className="btn-secondary justify-center p-2.5 relative">
                    <MessageSquare className="w-5 h-5" />
                    {unreadMessageCount > 0 && (
                      <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                    )}
                  </Link>
                  <Link href="/notifications" className="btn-secondary justify-center p-2.5 relative">
                    <Bell className={`w-5 h-5 ${notificationPulse ? 'animate-bounce' : ''}`} />
                    {unreadNotificationCount > 0 && (
                      <>
                        <span className={`absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full ${notificationPulse ? 'animate-ping' : ''}`}></span>
                        <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                      </>
                    )}
                  </Link>
                  <Link href="/watchlist" className="btn-secondary justify-center p-2.5">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link href="/account" className="btn-secondary justify-center p-2.5">
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-3">
                <Link href="/auth/signin" className="btn-secondary flex-1 justify-center text-sm py-2.5">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary flex-1 justify-center text-sm py-2.5">
                  Sign Up
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </header>
  )
}
