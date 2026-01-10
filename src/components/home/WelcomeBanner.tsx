'use client'

import { useState, useEffect } from 'react'
import { X, Rocket, Sparkles, Shield, Clock, Bell, CreditCard, Crown, ArrowRight, Package, Loader2, CheckCircle } from 'lucide-react'
import Link from 'next/link'
import { useSession } from 'next-auth/react'

export function WelcomeBanner() {
  const { data: session, status } = useSession()
  const [isVisible, setIsVisible] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [claiming, setClaiming] = useState(false)
  const [claimed, setClaimed] = useState(false)

  useEffect(() => {
    const dismissed = localStorage.getItem('welcomeBannerDismissed')
    if (!dismissed) {
      setTimeout(() => setIsVisible(true), 500)
    }
  }, [])

  // Check if user already has Pro
  useEffect(() => {
    if (session?.user?.subscriptionTier === 'PRO') {
      setClaimed(true)
    }
  }, [session])

  const handleDismiss = () => {
    setIsClosing(true)
    localStorage.setItem('welcomeBannerDismissed', 'true')
    setTimeout(() => {
      setIsVisible(false)
    }, 300)
  }

  const handleClaimPro = async () => {
    if (!session) {
      // Not logged in, redirect to signup
      handleDismiss()
      window.location.href = '/auth/signup?ref=early-adopter-pro'
      return
    }

    setClaiming(true)
    try {
      const res = await fetch('/api/claim-pro', { method: 'POST' })
      if (res.ok) {
        setClaimed(true)
      }
    } catch (error) {
      console.error('Claim Pro error:', error)
    } finally {
      setClaiming(false)
    }
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
          {/* Early Adopter Pro Offer */}
          <div className={`rounded-xl p-4 mb-5 ${claimed ? 'bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-700' : 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/30 dark:to-pink-900/30 border border-purple-200 dark:border-purple-700'}`}>
            <div className="flex items-start gap-3">
              <div className={`rounded-full p-2 ${claimed ? 'bg-green-100 dark:bg-green-800' : 'bg-purple-100 dark:bg-purple-800'}`}>
                {claimed ? (
                  <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-300" />
                ) : (
                  <Crown className="w-5 h-5 text-purple-600 dark:text-purple-300" />
                )}
              </div>
              <div className="flex-1">
                {claimed ? (
                  <>
                    <h3 className="font-bold text-green-900 dark:text-green-100 mb-1">
                      Lifetime Pro Activated!
                    </h3>
                    <p className="text-sm text-green-800 dark:text-green-200">
                      You have lifetime access to all Pro features. Thank you for being an early supporter!
                    </p>
                  </>
                ) : (
                  <>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-purple-900 dark:text-purple-100">
                        Free Lifetime Pro
                      </h3>
                      <span className="px-2 py-0.5 bg-purple-600 text-white text-xs font-medium rounded-full flex items-center gap-1">
                        <Sparkles className="w-3 h-3" /> Limited Time
                      </span>
                    </div>
                    <p className="text-sm text-purple-800 dark:text-purple-200 mb-3">
                      As an early adopter, claim your{' '}
                      <span className="font-bold">free lifetime Pro membership</span> — that's{' '}
                      <span className="font-bold">0% fees forever</span> (we cover Stripe fees too!), unlimited listings, and priority support.
                    </p>
                    <button
                      onClick={handleClaimPro}
                      disabled={claiming}
                      className="inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700 text-white font-semibold px-4 py-2 rounded-lg disabled:opacity-50 transition-all"
                    >
                      {claiming ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          Claiming...
                        </>
                      ) : (
                        <>
                          <Crown className="w-4 h-4" />
                          {session ? 'Claim Lifetime Pro - Free' : 'Sign Up & Claim Pro'}
                          <ArrowRight className="w-4 h-4" />
                        </>
                      )}
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="space-y-3 mb-5">
            <Link
              href="/search"
              onClick={handleDismiss}
              className="block w-full text-center bg-gradient-to-r from-primary-600 to-accent-600 text-white px-6 py-3 rounded-xl font-semibold hover:from-primary-700 hover:to-accent-700 transition-all shadow-lg shadow-primary-500/25"
            >
              Browse Devices
            </Link>
            <Link
              href="/listings/new"
              onClick={handleDismiss}
              className="block w-full text-center bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white px-6 py-3 rounded-xl font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
            >
              List a Device
            </Link>
            <button
              onClick={handleDismiss}
              className="block w-full text-gray-500 dark:text-gray-400 px-6 py-2 rounded-xl font-medium hover:text-gray-700 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              Just Looking
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
