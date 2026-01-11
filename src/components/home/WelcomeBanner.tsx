'use client'

import { useState, useEffect } from 'react'
import { X, Sparkles, Bell, Package } from 'lucide-react'
import Link from 'next/link'

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed')
    if (!dismissed) {
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleDismiss = () => {
    setIsClosing(true)
    localStorage.setItem('welcomeBannerDismissed', 'true')
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
        isClosing ? 'opacity-0' : 'opacity-100'
      }`}
    >
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div
        className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-md w-full overflow-hidden transition-all duration-300 ${
          isClosing ? 'scale-95 opacity-0' : 'scale-100 opacity-100'
        }`}
      >
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-400 to-yellow-500 px-6 py-6 text-center">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-3">
              <Sparkles className="w-8 h-8 text-amber-900" />
            </div>
          </div>
          <h2 className="text-2xl font-bold text-amber-900">You're Early!</h2>
        </div>

        {/* Content */}
        <div className="px-6 py-6">
          <p className="text-gray-600 dark:text-gray-300 text-center mb-6">
            The site's a bit of a ghost town right now, but as we grow, so will the inventory.
          </p>

          <div className="space-y-3 mb-6">
            <Link
              href="/listings/new"
              onClick={handleDismiss}
              className="flex items-center justify-center gap-2 w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all"
            >
              <Package className="w-5 h-5" />
              List a Device
            </Link>
            <Link
              href="/alerts"
              onClick={handleDismiss}
              className="flex items-center justify-center gap-2 w-full bg-white dark:bg-gray-700 border border-gray-200 dark:border-gray-600 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-50 dark:hover:bg-gray-600 transition-colors shadow-sm"
            >
              <Bell className="w-5 h-5" />
              Set Up Alerts
            </Link>
          </div>

          <button
            onClick={handleDismiss}
            className="block w-full text-center text-gray-500 dark:text-gray-400 font-medium hover:text-gray-700 dark:hover:text-gray-200 transition-colors"
          >
            Just browsing
          </button>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 text-amber-900/70 hover:text-amber-900 hover:bg-white/20 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
