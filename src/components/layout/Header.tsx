'use client'

import Link from 'next/link'
import { useState } from 'react'
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
  Zap,
  LogOut,
  Settings
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

  const isLoggedIn = !!session?.user

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (searchQuery.trim()) {
      window.location.href = `/search?q=${encodeURIComponent(searchQuery)}`
    }
  }

  return (
    <header className="bg-white border-b border-gray-200 sticky top-0 z-50">
      {/* Top bar - Fee comparison banner */}
      <div className="bg-gradient-to-r from-green-600 to-emerald-600 text-white text-sm py-2">
        <div className="max-w-7xl mx-auto px-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <span className="font-bold">1% + ~3% Stripe = ~4% total</span>
            <span className="hidden sm:inline text-green-200">|</span>
            <span className="hidden sm:inline text-green-100">
              Lower than <span className="line-through text-green-300">Swappa 6.5%</span>
              {' '}& <span className="line-through text-green-300">eBay 13%</span>
            </span>
            <span className="sm:hidden text-green-200">Beat Swappa & eBay</span>
          </div>
          <Link href="/subscription" className="font-semibold hover:underline flex items-center gap-1">
            <span className="hidden sm:inline">Go Pro →</span>
            <span className="bg-white text-green-600 px-2 py-0.5 rounded text-xs font-bold">0% FEES</span>
          </Link>
        </div>
      </div>

      {/* Main header */}
      <div className="max-w-7xl mx-auto px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 flex-shrink-0">
            <div className="w-10 h-10 bg-gradient-to-br from-primary-500 to-accent-500 rounded-xl flex items-center justify-center">
              <span className="text-white font-bold text-lg">G</span>
            </div>
            <span className="text-xl font-bold text-gray-900 hidden sm:block">
              GadgetSwap
            </span>
          </Link>

          {/* Search bar */}
          <form onSubmit={handleSearch} className="flex-1 max-w-2xl">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search devices, iOS versions, models..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2.5 border border-gray-300 rounded-full focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
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
                <Link href="/messages" className="p-2 hover:bg-gray-100 rounded-lg relative">
                  <MessageSquare className="w-5 h-5 text-gray-600" />
                  <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
                </Link>
                <Link href="/notifications" className="p-2 hover:bg-gray-100 rounded-lg">
                  <Bell className="w-5 h-5 text-gray-600" />
                </Link>
                <Link href="/watchlist" className="p-2 hover:bg-gray-100 rounded-lg">
                  <Heart className="w-5 h-5 text-gray-600" />
                </Link>

                {/* User dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserMenu(!showUserMenu)}
                    className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
                  >
                    <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                      {session?.user?.image ? (
                        <img src={session.user.image} alt="" className="w-8 h-8 rounded-full" />
                      ) : (
                        <span className="text-primary-600 font-medium text-sm">
                          {session?.user?.name?.charAt(0) || session?.user?.email?.charAt(0) || 'U'}
                        </span>
                      )}
                    </div>
                    <ChevronDown className="w-4 h-4 text-gray-400" />
                  </button>

                  {showUserMenu && (
                    <div className="absolute right-0 mt-2 w-56 bg-white rounded-lg shadow-lg border border-gray-200 py-1 z-50">
                      <div className="px-4 py-2 border-b border-gray-100">
                        <p className="font-medium text-gray-900">{session?.user?.name || 'User'}</p>
                        <p className="text-sm text-gray-500">{session?.user?.email}</p>
                      </div>
                      <Link
                        href="/account"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
                        onClick={() => setShowUserMenu(false)}
                      >
                        <User className="w-4 h-4" />
                        My Account
                      </Link>
                      <Link
                        href="/account/listings"
                        className="flex items-center gap-2 px-4 py-2 text-gray-700 hover:bg-gray-50"
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
                        className="flex items-center gap-2 px-4 py-2 text-red-600 hover:bg-red-50 w-full"
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
            className="lg:hidden p-2 hover:bg-gray-100 rounded-lg"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? (
              <X className="w-6 h-6 text-gray-600" />
            ) : (
              <Menu className="w-6 h-6 text-gray-600" />
            )}
          </button>
        </div>

        {/* Category nav */}
        <nav className="hidden md:flex items-center gap-6 mt-3 text-sm">
          {deviceCategories.map((category) => (
            <Link
              key={category.name}
              href={category.href}
              className="text-gray-600 hover:text-primary-600 transition-colors"
            >
              {category.name}
            </Link>
          ))}
          <Link
            href="/search?jailbreakStatus=JAILBREAKABLE"
            className="text-accent-600 hover:text-accent-700 font-medium flex items-center gap-1"
          >
            Jailbreakable
            <span className="badge-purple text-xs">Hot</span>
          </Link>
          <Link
            href="/alerts"
            className="text-yellow-600 hover:text-yellow-700 font-medium flex items-center gap-1"
          >
            <Bell className="w-3.5 h-3.5" />
            Alerts
            <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full font-bold">New</span>
          </Link>
          <Link
            href="/market-insights"
            className="text-gray-600 hover:text-primary-600 transition-colors"
          >
            Market Insights
          </Link>
        </nav>
      </div>

      {/* Mobile menu */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-t border-gray-200 bg-white">
          <div className="px-4 py-3 space-y-3">
            {/* Categories */}
            <div className="space-y-1">
              {deviceCategories.map((category) => (
                <Link
                  key={category.name}
                  href={category.href}
                  className="block py-2 text-gray-600 hover:text-primary-600"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {category.name}
                </Link>
              ))}
              <Link
                href="/search?jailbreakStatus=JAILBREAKABLE"
                className="block py-2 text-accent-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                Jailbreakable Devices
              </Link>
              <Link
                href="/alerts"
                className="flex items-center gap-2 py-2 text-yellow-600 font-medium"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Bell className="w-4 h-4" />
                Device Alerts
                <span className="bg-yellow-100 text-yellow-700 text-xs px-1.5 py-0.5 rounded-full font-bold">New</span>
              </Link>
            </div>

            <hr className="border-gray-200" />

            {/* Auth buttons */}
            {isLoggedIn ? (
              <div className="space-y-2">
                <Link href="/listings/new" className="btn-primary w-full justify-center">
                  <Plus className="w-4 h-4 mr-2" />
                  Sell a Device
                </Link>
                <div className="grid grid-cols-4 gap-2">
                  <Link href="/messages" className="btn-secondary justify-center p-2">
                    <MessageSquare className="w-5 h-5" />
                  </Link>
                  <Link href="/notifications" className="btn-secondary justify-center p-2">
                    <Bell className="w-5 h-5" />
                  </Link>
                  <Link href="/watchlist" className="btn-secondary justify-center p-2">
                    <Heart className="w-5 h-5" />
                  </Link>
                  <Link href="/account" className="btn-secondary justify-center p-2">
                    <User className="w-5 h-5" />
                  </Link>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Link href="/auth/signin" className="btn-secondary flex-1 justify-center">
                  Sign In
                </Link>
                <Link href="/auth/signup" className="btn-primary flex-1 justify-center">
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
