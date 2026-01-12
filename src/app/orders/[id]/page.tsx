'use client'

import { useSession } from 'next-auth/react'
import { useRouter, useParams } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  MapPin,
  User,
  Calendar,
  ExternalLink,
  Copy,
  Check,
  MessageSquare,
  AlertTriangle,
  DollarSign,
  ShieldCheck,
} from 'lucide-react'

interface Transaction {
  id: string
  status: string
  salePrice: number
  taxAmount: number
  shippingCost: number
  platformFee: number
  stripeFee: number
  sellerPayout: number
  totalAmount: number
  trackingNumber: string | null
  shippingCarrier: string | null
  shippingName: string | null
  shippingLine1: string | null
  shippingLine2: string | null
  shippingCity: string | null
  shippingState: string | null
  shippingZip: string | null
  shippingCountry: string | null
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  escrowReleaseAt: string | null
  fundsHeld: boolean
  disputeStatus: string | null
  disputeReason: string | null
  listing: {
    id: string
    title: string
    deviceModel: string
    images: { url: string }[]
  }
  buyer: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
  seller: {
    id: string
    name: string | null
    email: string
    image: string | null
  }
}

const statusSteps = [
  { key: 'PENDING', label: 'Order Placed', icon: Clock },
  { key: 'PAYMENT_RECEIVED', label: 'Payment Received', icon: DollarSign },
  { key: 'SHIPPED', label: 'Shipped', icon: Truck },
  { key: 'DELIVERED', label: 'Delivered', icon: Package },
  { key: 'COMPLETED', label: 'Completed', icon: CheckCircle },
]

const statusOrder = ['PENDING', 'PAYMENT_RECEIVED', 'SHIPPED', 'DELIVERED', 'COMPLETED']

const carrierTrackingUrls: Record<string, string> = {
  UPS: 'https://www.ups.com/track?tracknum=',
  FEDEX: 'https://www.fedex.com/fedextrack/?trknbr=',
  USPS: 'https://tools.usps.com/go/TrackConfirmAction?tLabels=',
}

export default function OrderDetailPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const params = useParams()
  const orderId = params.id as string

  const [transaction, setTransaction] = useState<Transaction | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [actionLoading, setActionLoading] = useState(false)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push(`/auth/signin?callbackUrl=/orders/${orderId}`)
    }
  }, [status, router, orderId])

  useEffect(() => {
    if (session?.user && orderId) {
      fetchTransaction()
    }
  }, [session, orderId])

  const fetchTransaction = async () => {
    try {
      setLoading(true)
      const response = await fetch(`/api/transactions/${orderId}`)
      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Failed to fetch order')
      }
      const data = await response.json()
      setTransaction(data.transaction)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (action: string, data?: any) => {
    if (!transaction) return

    try {
      setActionLoading(true)
      const response = await fetch(`/api/transactions/${transaction.id}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, ...data }),
      })

      if (!response.ok) {
        const result = await response.json()
        throw new Error(result.error || 'Action failed')
      }

      await fetchTransaction()
    } catch (err: any) {
      alert(err.message)
    } finally {
      setActionLoading(false)
    }
  }

  const copyTrackingNumber = () => {
    if (transaction?.trackingNumber) {
      navigator.clipboard.writeText(transaction.trackingNumber)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    }
  }

  const getTrackingUrl = () => {
    if (!transaction?.trackingNumber || !transaction?.shippingCarrier) return null
    const baseUrl = carrierTrackingUrls[transaction.shippingCarrier]
    return baseUrl ? `${baseUrl}${transaction.trackingNumber}` : null
  }

  const getCurrentStep = () => {
    if (!transaction) return 0
    if (transaction.status === 'DISPUTED' || transaction.status === 'REFUNDED' || transaction.status === 'CANCELLED') {
      return -1
    }
    return statusOrder.indexOf(transaction.status)
  }

  const isBuyer = session?.user?.id === transaction?.buyer?.id
  const isSeller = session?.user?.id === transaction?.seller?.id

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
        <div className="max-w-4xl mx-auto px-4">
          <div className="card p-8 text-center">
            <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
            <h2 className="text-xl font-semibold text-gray-900 dark:text-white mb-2">Error</h2>
            <p className="text-gray-600 dark:text-gray-400">{error}</p>
            <Link href="/account" className="btn-primary mt-4 inline-block">
              Back to Account
            </Link>
          </div>
        </div>
      </div>
    )
  }

  if (!transaction) return null

  const currentStep = getCurrentStep()
  const trackingUrl = getTrackingUrl()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-6">
          <Link
            href={isSeller ? '/account/sales' : '/account/purchases'}
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to {isSeller ? 'Sales' : 'Purchases'}
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Order Details</h1>
              <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">
                Order #{transaction.id.slice(-8).toUpperCase()}
              </p>
            </div>
            {transaction.status === 'DISPUTED' && (
              <span className="px-3 py-1 bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400 rounded-full text-sm font-medium flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" />
                Disputed
              </span>
            )}
          </div>
        </div>

        {/* Status Progress */}
        {currentStep >= 0 && (
          <div className="card p-6 mb-6">
            <div className="flex items-center justify-between">
              {statusSteps.map((step, index) => {
                const StepIcon = step.icon
                const isActive = index <= currentStep
                const isCurrent = index === currentStep

                return (
                  <div key={step.key} className="flex-1 relative">
                    <div className="flex flex-col items-center">
                      <div
                        className={`w-10 h-10 rounded-full flex items-center justify-center ${
                          isActive
                            ? 'bg-green-500 text-white'
                            : 'bg-gray-200 dark:bg-gray-700 text-gray-400'
                        } ${isCurrent ? 'ring-4 ring-green-200 dark:ring-green-900' : ''}`}
                      >
                        <StepIcon className="w-5 h-5" />
                      </div>
                      <span
                        className={`text-xs mt-2 text-center ${
                          isActive ? 'text-green-600 dark:text-green-400 font-medium' : 'text-gray-400'
                        }`}
                      >
                        {step.label}
                      </span>
                    </div>
                    {index < statusSteps.length - 1 && (
                      <div
                        className={`absolute top-5 left-1/2 w-full h-0.5 ${
                          index < currentStep ? 'bg-green-500' : 'bg-gray-200 dark:bg-gray-700'
                        }`}
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        )}

        <div className="grid md:grid-cols-3 gap-6">
          {/* Main Content */}
          <div className="md:col-span-2 space-y-6">
            {/* Item Details */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Item</h2>
              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 dark:bg-gray-800 rounded-lg overflow-hidden flex-shrink-0">
                  {transaction.listing.images?.[0] ? (
                    <img
                      src={transaction.listing.images[0].url}
                      alt={transaction.listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <div>
                  <Link
                    href={`/listings/${transaction.listing.id}`}
                    className="font-medium text-gray-900 dark:text-white hover:text-primary-600"
                  >
                    {transaction.listing.title}
                  </Link>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                    {transaction.listing.deviceModel}
                  </p>
                  <p className="text-lg font-semibold text-gray-900 dark:text-white mt-2">
                    ${transaction.salePrice.toFixed(2)}
                  </p>
                </div>
              </div>
            </div>

            {/* Tracking Info */}
            {transaction.trackingNumber && (
              <div className="card p-6">
                <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <Truck className="w-5 h-5" />
                  Tracking Information
                </h2>
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">
                        {transaction.shippingCarrier}
                      </p>
                      <p className="font-mono font-medium text-gray-900 dark:text-white">
                        {transaction.trackingNumber}
                      </p>
                    </div>
                    <div className="flex gap-2">
                      <button
                        onClick={copyTrackingNumber}
                        className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                        title="Copy tracking number"
                      >
                        {copied ? (
                          <Check className="w-5 h-5 text-green-500" />
                        ) : (
                          <Copy className="w-5 h-5 text-gray-400" />
                        )}
                      </button>
                      {trackingUrl && (
                        <a
                          href={trackingUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
                          title="Track package"
                        >
                          <ExternalLink className="w-5 h-5 text-gray-400" />
                        </a>
                      )}
                    </div>
                  </div>
                  {transaction.shippedAt && (
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                      Shipped on {new Date(transaction.shippedAt).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            )}

            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>
              <div className="text-gray-700 dark:text-gray-300">
                <p className="font-medium">{transaction.shippingName}</p>
                <p>{transaction.shippingLine1}</p>
                {transaction.shippingLine2 && <p>{transaction.shippingLine2}</p>}
                <p>
                  {transaction.shippingCity}, {transaction.shippingState} {transaction.shippingZip}
                </p>
                <p>{transaction.shippingCountry}</p>
              </div>
            </div>

            {/* Actions */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Actions</h2>
              <div className="space-y-3">
                {/* Buyer: Confirm Delivery */}
                {isBuyer && transaction.status === 'SHIPPED' && (
                  <button
                    onClick={() => handleAction('confirm_delivery')}
                    disabled={actionLoading}
                    className="w-full btn-primary"
                  >
                    {actionLoading ? 'Processing...' : 'Confirm Delivery'}
                  </button>
                )}

                {/* Escrow info for buyer */}
                {isBuyer && transaction.status === 'DELIVERED' && transaction.fundsHeld && (
                  <div className="p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                    <div className="flex items-start gap-3">
                      <ShieldCheck className="w-5 h-5 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" />
                      <div>
                        <p className="font-medium text-green-800 dark:text-green-200">
                          Buyer Protection Active
                        </p>
                        <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                          Funds will be released to seller on{' '}
                          {transaction.escrowReleaseAt
                            ? new Date(transaction.escrowReleaseAt).toLocaleString()
                            : 'soon'}
                          . If there's an issue, open a dispute before then.
                        </p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Open Dispute (either party, before funds released) */}
                {transaction.fundsHeld &&
                  !['PENDING', 'COMPLETED', 'DISPUTED', 'REFUNDED', 'CANCELLED'].includes(transaction.status) && (
                    <button
                      onClick={() => {
                        const reason = prompt('Please describe the issue:')
                        if (reason) {
                          handleAction('dispute', { reason })
                        }
                      }}
                      disabled={actionLoading}
                      className="w-full btn-secondary text-red-600 border-red-200 hover:bg-red-50 dark:text-red-400 dark:border-red-800 dark:hover:bg-red-900/20"
                    >
                      Open Dispute
                    </button>
                  )}

                {/* Message other party */}
                <Link
                  href={`/messages?userId=${isBuyer ? transaction.seller.id : transaction.buyer.id}&listingId=${transaction.listing.id}`}
                  className="w-full btn-secondary flex items-center justify-center gap-2"
                >
                  <MessageSquare className="w-4 h-4" />
                  Message {isBuyer ? 'Seller' : 'Buyer'}
                </Link>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Order Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Item Price</span>
                  <span className="text-gray-900 dark:text-white">${transaction.salePrice.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Shipping</span>
                  <span className="text-gray-900 dark:text-white">
                    {transaction.shippingCost > 0 ? `$${transaction.shippingCost.toFixed(2)}` : 'Free'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-500 dark:text-gray-400">Tax</span>
                  <span className="text-gray-900 dark:text-white">${transaction.taxAmount.toFixed(2)}</span>
                </div>
                <div className="border-t border-gray-200 dark:border-gray-700 pt-3 flex justify-between font-semibold">
                  <span className="text-gray-900 dark:text-white">Total</span>
                  <span className="text-gray-900 dark:text-white">${transaction.totalAmount.toFixed(2)}</span>
                </div>
              </div>

              {/* Seller payout info */}
              {isSeller && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500 dark:text-gray-400">Your Payout</span>
                    <span className="text-green-600 dark:text-green-400 font-semibold">
                      ${transaction.sellerPayout.toFixed(2)}
                    </span>
                  </div>
                  <p className="text-xs text-gray-400 mt-1">
                    After platform fee (${transaction.platformFee.toFixed(2)}) and payment processing
                  </p>
                </div>
              )}
            </div>

            {/* Other Party Info */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">
                {isBuyer ? 'Seller' : 'Buyer'}
              </h2>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden flex-shrink-0">
                  {(isBuyer ? transaction.seller : transaction.buyer).image ? (
                    <img
                      src={(isBuyer ? transaction.seller : transaction.buyer).image!}
                      alt=""
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center">
                      <User className="w-6 h-6 text-gray-400" />
                    </div>
                  )}
                </div>
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    {(isBuyer ? transaction.seller : transaction.buyer).name || 'User'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {(isBuyer ? transaction.seller : transaction.buyer).email}
                  </p>
                </div>
              </div>
            </div>

            {/* Timeline */}
            <div className="card p-6">
              <h2 className="font-semibold text-gray-900 dark:text-white mb-4">Timeline</h2>
              <div className="space-y-4">
                <div className="flex gap-3">
                  <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                  <div>
                    <p className="text-sm font-medium text-gray-900 dark:text-white">Order Placed</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {new Date(transaction.createdAt).toLocaleString()}
                    </p>
                  </div>
                </div>
                {transaction.shippedAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Shipped</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.shippedAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
                {transaction.deliveredAt && (
                  <div className="flex gap-3">
                    <div className="w-2 h-2 bg-green-500 rounded-full mt-2" />
                    <div>
                      <p className="text-sm font-medium text-gray-900 dark:text-white">Delivered</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        {new Date(transaction.deliveredAt).toLocaleString()}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
