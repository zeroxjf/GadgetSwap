'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Wallet,
  ArrowRight,
  CheckCircle,
  Loader2,
  Building2,
  Shield,
  Zap,
} from 'lucide-react'

export default function OnboardingPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [connecting, setConnecting] = useState(false)
  const [skipping, setSkipping] = useState(false)
  const [checkingStatus, setCheckingStatus] = useState(true)
  const [alreadyComplete, setAlreadyComplete] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/onboarding')
    }
  }, [status, router])

  // Check if user has already completed onboarding or Stripe setup
  useEffect(() => {
    if (session?.user?.id) {
      checkOnboardingStatus()
    }
  }, [session?.user?.id])

  const checkOnboardingStatus = async () => {
    try {
      const response = await fetch('/api/user/profile')
      if (response.ok) {
        const data = await response.json()
        // If already completed onboarding or has Stripe set up, redirect
        if (data.user.onboardingComplete || data.user.stripeOnboardingComplete) {
          setAlreadyComplete(true)
          router.push('/')
        }
      }
    } catch (error) {
      console.error('Error checking status:', error)
    } finally {
      setCheckingStatus(false)
    }
  }

  const handleConnectStripe = async () => {
    setConnecting(true)

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create connect account')
      }

      const { url } = await response.json()
      if (url) {
        // Mark onboarding as seen before redirecting to Stripe
        await fetch('/api/user/onboarding', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ complete: true }),
        })
        window.location.href = url
      }
    } catch (error) {
      console.error('Stripe connect error:', error)
      setConnecting(false)
    }
  }

  const handleSkip = async () => {
    setSkipping(true)

    try {
      await fetch('/api/user/onboarding', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ complete: true }),
      })
      router.push('/')
    } catch (error) {
      console.error('Skip error:', error)
      setSkipping(false)
    }
  }

  if (status === 'loading' || checkingStatus || alreadyComplete) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center px-4 py-12">
      <div className="max-w-lg w-full">
        {/* Welcome */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full flex items-center justify-center mx-auto mb-4">
            <Wallet className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
            Welcome to GadgetSwap!
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            Set up your seller account to start listing devices
          </p>
        </div>

        {/* Main Card */}
        <div className="card p-6 mb-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
            Connect your bank account
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6">
            To sell on GadgetSwap, you'll need to connect a bank account through Stripe.
            This allows you to receive payouts when your items sell.
          </p>

          {/* Benefits */}
          <div className="space-y-3 mb-6">
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-green-100 dark:bg-green-900 rounded-full">
                <Shield className="w-4 h-4 text-green-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Secure payments</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Bank-level security powered by Stripe</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-blue-100 dark:bg-blue-900 rounded-full">
                <Zap className="w-4 h-4 text-blue-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Fast payouts</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Get paid within 2-3 business days</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="p-1.5 bg-purple-100 dark:bg-purple-900 rounded-full">
                <CheckCircle className="w-4 h-4 text-purple-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900 dark:text-white text-sm">Make your listings visible</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Listings only appear once payouts are set up</p>
              </div>
            </div>
          </div>

          <button
            onClick={handleConnectStripe}
            disabled={connecting}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2"
          >
            {connecting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                Connecting...
              </>
            ) : (
              <>
                <Building2 className="w-5 h-5" />
                Connect with Stripe
              </>
            )}
          </button>
        </div>

        {/* Skip option */}
        <div className="text-center">
          <button
            onClick={handleSkip}
            disabled={skipping}
            className="text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 text-sm inline-flex items-center gap-1"
          >
            {skipping ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                Skipping...
              </>
            ) : (
              <>
                Skip for now
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
          <p className="text-xs text-gray-400 dark:text-gray-500 mt-2">
            You can set this up later in Account Settings
          </p>
        </div>
      </div>
    </div>
  )
}
