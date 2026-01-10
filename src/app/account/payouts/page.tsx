'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Wallet,
  Building2,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  Loader2,
  Clock,
  DollarSign,
  ArrowRight,
} from 'lucide-react'

interface PayoutInfo {
  stripeConnected: boolean
  stripeOnboardingComplete: boolean
  payoutsEnabled: boolean
  pendingBalance: number
  availableBalance: number
  totalEarnings: number
  nextPayoutDate: string | null
}

export default function PayoutsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [connecting, setConnecting] = useState(false)
  const [payoutInfo, setPayoutInfo] = useState<PayoutInfo | null>(null)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/payouts')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchPayoutInfo()
    }
  }, [session?.user?.id])

  const fetchPayoutInfo = async () => {
    try {
      const response = await fetch('/api/payouts/info')
      if (response.ok) {
        const data = await response.json()
        setPayoutInfo(data)
      }
    } catch (error) {
      console.error('Error fetching payout info:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleConnectStripe = async () => {
    setConnecting(true)
    setMessage(null)

    try {
      const response = await fetch('/api/stripe/connect', {
        method: 'POST',
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to create connect account')
      }

      if (data.url) {
        window.location.href = data.url
      } else {
        throw new Error('No onboarding URL returned from Stripe')
      }
    } catch (error: any) {
      console.error('Stripe connect error:', error)
      setMessage({ type: 'error', text: error.message || 'Failed to connect Stripe. Please try again.' })
      setConnecting(false)
    }
  }

  const handleOpenDashboard = async () => {
    try {
      const response = await fetch('/api/stripe/dashboard-link', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create dashboard link')
      }

      const { url } = await response.json()
      if (url) {
        window.open(url, '_blank')
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to open Stripe dashboard.' })
    }
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
    }).format(amount / 100)
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/settings" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Payout Settings</h1>
          <p className="text-gray-600">Manage how you receive payments from sales</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Not Connected */}
        {!payoutInfo?.stripeConnected && (
          <div className="card p-8 text-center">
            <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Wallet className="w-8 h-8 text-primary-600" />
            </div>
            <h2 className="text-xl font-semibold text-gray-900 mb-2">Connect Your Bank Account</h2>
            <p className="text-gray-500 mb-6 max-w-md mx-auto">
              To receive payouts from your sales, you need to connect a bank account through Stripe.
              This is a secure, one-time setup process.
            </p>
            <button
              onClick={handleConnectStripe}
              disabled={connecting}
              className="btn-primary inline-flex items-center gap-2"
            >
              {connecting ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Building2 className="w-4 h-4" />
              )}
              Connect with Stripe
            </button>
            <p className="text-xs text-gray-400 mt-4">
              Powered by Stripe - Bank-level security for your payments
            </p>
          </div>
        )}

        {/* Onboarding Incomplete */}
        {payoutInfo?.stripeConnected && !payoutInfo?.stripeOnboardingComplete && (
          <div className="card p-6 border-yellow-200 bg-yellow-50 mb-6">
            <div className="flex items-start gap-4">
              <AlertCircle className="w-6 h-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-yellow-800">Complete Your Setup</h3>
                <p className="text-sm text-yellow-700 mt-1">
                  Your Stripe account is connected but setup is incomplete. Complete the verification
                  process to start receiving payouts.
                </p>
                <button
                  onClick={handleConnectStripe}
                  disabled={connecting}
                  className="mt-4 btn bg-yellow-600 text-white hover:bg-yellow-700 text-sm inline-flex items-center gap-2"
                >
                  {connecting ? (
                    <Loader2 className="w-4 h-4 animate-spin" />
                  ) : (
                    <ArrowRight className="w-4 h-4" />
                  )}
                  Complete Setup
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Connected and Complete */}
        {payoutInfo?.stripeConnected && payoutInfo?.stripeOnboardingComplete && (
          <>
            {/* Status */}
            <div className="card p-4 mb-6 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="w-5 h-5 text-green-600" />
                </div>
                <div>
                  <p className="font-medium text-gray-900">Stripe Connected</p>
                  <p className="text-sm text-gray-500">
                    {payoutInfo.payoutsEnabled ? 'Payouts enabled' : 'Payouts pending verification'}
                  </p>
                </div>
              </div>
              <button
                onClick={handleOpenDashboard}
                className="btn-secondary text-sm inline-flex items-center gap-2"
              >
                <ExternalLink className="w-4 h-4" />
                Stripe Dashboard
              </button>
            </div>

            {/* Balance Overview */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Clock className="w-4 h-4" />
                  <span className="text-sm">Pending</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payoutInfo.pendingBalance || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">In escrow or processing</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <Wallet className="w-4 h-4" />
                  <span className="text-sm">Available</span>
                </div>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(payoutInfo.availableBalance || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">Ready for payout</p>
              </div>

              <div className="card p-4">
                <div className="flex items-center gap-2 text-gray-500 mb-1">
                  <DollarSign className="w-4 h-4" />
                  <span className="text-sm">Total Earned</span>
                </div>
                <p className="text-2xl font-bold text-gray-900">
                  {formatCurrency(payoutInfo.totalEarnings || 0)}
                </p>
                <p className="text-xs text-gray-500 mt-1">All-time earnings</p>
              </div>
            </div>

            {/* Payout Schedule */}
            <div className="card p-6">
              <h3 className="font-semibold text-gray-900 mb-4">Payout Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Payout frequency</span>
                  <span className="font-medium text-gray-900">Daily (automatic)</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Payout speed</span>
                  <span className="font-medium text-gray-900">2-3 business days</span>
                </div>
                <div className="flex items-center justify-between py-3 border-b border-gray-100">
                  <span className="text-gray-600">Escrow period</span>
                  <span className="font-medium text-gray-900">24 hours after delivery</span>
                </div>
                {payoutInfo.nextPayoutDate && (
                  <div className="flex items-center justify-between py-3">
                    <span className="text-gray-600">Next payout</span>
                    <span className="font-medium text-gray-900">
                      {new Date(payoutInfo.nextPayoutDate).toLocaleDateString()}
                    </span>
                  </div>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-4">
                Manage your payout schedule and bank details in the{' '}
                <button onClick={handleOpenDashboard} className="text-primary-600 hover:underline">
                  Stripe Dashboard
                </button>
              </p>
            </div>
          </>
        )}

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">How Payouts Work</h3>
          <ul className="text-sm text-blue-700 space-y-2">
            <li>1. When you sell an item, payment is collected from the buyer</li>
            <li>2. Funds are held in escrow until delivery is confirmed</li>
            <li>3. After 24 hours, funds are released to your Stripe balance</li>
            <li>4. Stripe automatically transfers available funds to your bank</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
