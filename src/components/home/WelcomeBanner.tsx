'use client'

// Welcome popup for first-time visitors - must be dismissed
import { useState, useEffect } from 'react'
import { X, Rocket, PartyPopper, Sparkles, Shield, Clock, Bell, CreditCard } from 'lucide-react'
import Link from 'next/link'

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed')
    if (!dismissed) {
      // Small delay for smoother appearance
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleDismiss = () => {
    setIsClosing(true)
    localStorage.setItem('welcomeBannerDismissed', 'true')
    setTimeout(() => setIsVisible(false), 300)
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
        {/* Gradient header */}
        <div className="bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 px-6 py-8 text-center text-white">
          <div className="flex justify-center mb-3">
            <div className="bg-white/20 rounded-full p-3">
              <Rocket className="w-8 h-8" />
            </div>
          </div>
          <h2 className="text-2xl font-bold mb-1">We Just Launched!</h2>
          <div className="flex items-center justify-center gap-1 text-white/90">
            <Sparkles className="w-4 h-4" />
            <span>You found us early</span>
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Content */}
        <div className="px-6 py-6 text-center">
          <p className="text-gray-600 dark:text-gray-300 mb-2">
            Yes, it looks like a ghost town in here.
          </p>
          <p className="text-gray-900 dark:text-white font-medium mb-5">
            You're early — like, making-history early.
            <PartyPopper className="w-5 h-5 inline ml-1.5 -mt-1 text-accent-500" />
          </p>

          <div className="space-y-3 mb-5">
            <Link
              href="/listings/new"
              onClick={handleDismiss}
              className="block w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg shadow-primary-500/25"
            >
              Create the First Listing
            </Link>
            <button
              onClick={handleDismiss}
              className="block w-full text-gray-500 dark:text-gray-400 px-6 py-2 rounded-xl font-medium hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Just Browsing
            </button>
          </div>

          {/* Trust badges */}
          <div className="grid grid-cols-3 gap-2 mb-4">
            <div className="flex flex-col items-center gap-1 p-2 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
              <Shield className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              <span className="text-xs font-medium text-blue-700 dark:text-blue-300">IMEI Verified</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 bg-green-50 dark:bg-green-900/20 rounded-lg">
              <Clock className="w-5 h-5 text-green-600 dark:text-green-400" />
              <span className="text-xs font-medium text-green-700 dark:text-green-300">24h Escrow</span>
            </div>
            <div className="flex flex-col items-center gap-1 p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg">
              <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              <span className="text-xs font-medium text-yellow-700 dark:text-yellow-300">Instant Alerts</span>
            </div>
          </div>

          {/* Stripe badge */}
          <div className="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
            <CreditCard className="w-4 h-4" />
            <span className="text-sm">Payments secured by <span className="font-semibold text-[#635BFF]">Stripe</span></span>
          </div>
        </div>

        {/* Close button */}
        <button
          onClick={handleDismiss}
          className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Close"
        >
          <X className="w-5 h-5" />
        </button>
      </div>
    </div>
  )
}
