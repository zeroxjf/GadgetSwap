'use client'

import { useEffect, useState } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { CheckCircle, ArrowRight, Loader2 } from 'lucide-react'

export default function SubscriptionSuccessPage() {
  const searchParams = useSearchParams()
  const sessionId = searchParams.get('session_id')
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    // Give a moment for the webhook to process
    const timer = setTimeout(() => {
      setIsLoading(false)
    }, 2000)

    return () => clearTimeout(timer)
  }, [sessionId])

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-12 h-12 text-primary-500 animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Setting up your subscription...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle className="w-10 h-10 text-green-500" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Welcome to GadgetSwap Pro!
          </h1>
          <p className="text-gray-600 mb-6">
            Your subscription is now active. Enjoy 0% platform fees on all your sales!
          </p>

          <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-green-800 mb-2">What's included:</h3>
            <ul className="text-sm text-green-700 space-y-1 text-left">
              <li>• 0% platform fee (only ~3% Stripe processing)</li>
              <li>• Unlimited active listings</li>
              <li>• Unlimited device alerts</li>
              <li>• Priority 24/7 support</li>
              <li>• Featured listing spots</li>
              <li>• Advanced analytics dashboard</li>
            </ul>
          </div>

          <div className="space-y-3">
            <Link
              href="/listings/new"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              Create a Listing
              <ArrowRight className="w-4 h-4" />
            </Link>
            <Link
              href="/account"
              className="btn-secondary w-full"
            >
              Go to Account
            </Link>
          </div>
        </div>

        <p className="text-sm text-gray-500 mt-6">
          A confirmation email has been sent to your email address.
        </p>
      </div>
    </div>
  )
}
