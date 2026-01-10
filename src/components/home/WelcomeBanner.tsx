'use client'

import { useState, useEffect } from 'react'
import { X, Rocket, Sparkles, Shield, Clock, Bell, CreditCard, Crown, ArrowRight, Package } from 'lucide-react'
import Link from 'next/link'
import { GuidedTour } from './GuidedTour'

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [showTour, setShowTour] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed')
    if (!dismissed) {
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  const handleDismiss = (startTour: boolean = false) => {
    setIsClosing(true)
    localStorage.setItem('welcomeBannerDismissed', 'true')
    setTimeout(() => {
      setIsVisible(false)
      if (startTour) {
        // Small delay before starting tour
        setTimeout(() => setShowTour(true), 300)
      }
    }, 300)
  }

  const handleTourComplete = () => {
    setShowTour(false)
  }

  return (
    <>
      {/* Guided Tour */}
      <GuidedTour isActive={showTour} onComplete={handleTourComplete} />

      {/* Welcome Modal */}
      {isVisible && (
        <div
          className={`fixed inset-0 z-50 flex items-center justify-center p-4 transition-all duration-300 ${
            isClosing ? 'opacity-0' : 'opacity-100'
          }`}
        >
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={() => handleDismiss(false)}
          />

          {/* Modal */}
          <div
            className={`relative bg-white dark:bg-gray-900 rounded-2xl shadow-2xl max-w-lg w-full overflow-hidden transition-all duration-300 ${
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
              <h2 className="text-2xl font-bold mb-1">Welcome to GadgetSwap!</h2>
              <div className="flex items-center justify-center gap-1 text-white/90">
                <Sparkles className="w-4 h-4" />
                <span>The marketplace for iOS enthusiasts</span>
                <Sparkles className="w-4 h-4" />
              </div>
            </div>

            {/* Content */}
            <div className="px-6 py-6">
              {/* Early Adopter Seller Promo */}
              <div className="bg-gradient-to-r from-amber-50 to-yellow-50 dark:from-amber-900/30 dark:to-yellow-900/30 border border-amber-200 dark:border-amber-700 rounded-xl p-4 mb-5">
                <div className="flex items-start gap-3">
                  <div className="bg-amber-100 dark:bg-amber-800 rounded-full p-2">
                    <Crown className="w-5 h-5 text-amber-600 dark:text-amber-300" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-bold text-amber-900 dark:text-amber-100 mb-1">
                      Early Seller Bonus
                    </h3>
                    <p className="text-sm text-amber-800 dark:text-amber-200 mb-2">
                      Got inventory to sell? As an early adopter, we'll give you a{' '}
                      <span className="font-bold">free lifetime Pro plan</span> — that's{' '}
                      <span className="font-bold">0% platform fees forever</span>.
                    </p>
                    <Link
                      href="/auth/signup?ref=early-seller"
                      onClick={() => handleDismiss(false)}
                      className="inline-flex items-center gap-1 text-sm font-semibold text-amber-700 dark:text-amber-300 hover:text-amber-900 dark:hover:text-amber-100"
                    >
                      <Package className="w-4 h-4" />
                      Claim your free Pro account
                      <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              </div>

              {/* Action buttons */}
              <div className="space-y-3 mb-5">
                <button
                  onClick={() => handleDismiss(true)}
                  className="block w-full bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg shadow-primary-500/25"
                >
                  Take a Quick Tour
                </button>
                <Link
                  href="/listings/new"
                  onClick={() => handleDismiss(false)}
                  className="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                >
                  List a Device
                </Link>
                <button
                  onClick={() => handleDismiss(false)}
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
              onClick={() => handleDismiss(false)}
              className="absolute top-3 right-3 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}
    </>
  )
}
