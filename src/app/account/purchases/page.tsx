'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ShoppingBag,
  ChevronLeft,
  Package,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react'

interface Purchase {
  id: string
  listing: {
    id: string
    title: string
    deviceModel: string
    images: { url: string }[]
  }
  seller: {
    name: string | null
    username: string | null
  }
  salePrice: number
  totalAmount: number
  status: string
  trackingNumber?: string
  shippingCarrier?: string
  createdAt: string
  shippedAt?: string
  deliveredAt?: string
}

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600 bg-yellow-100', label: 'Pending' },
  PAYMENT_RECEIVED: { icon: CheckCircle, color: 'text-blue-600 bg-blue-100', label: 'Payment Received' },
  SHIPPED: { icon: Truck, color: 'text-purple-600 bg-purple-100', label: 'Shipped' },
  DELIVERED: { icon: Package, color: 'text-green-600 bg-green-100', label: 'Delivered' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-600 bg-green-100', label: 'Completed' },
  DISPUTED: { icon: AlertCircle, color: 'text-red-600 bg-red-100', label: 'Disputed' },
  REFUNDED: { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: 'Refunded' },
  CANCELLED: { icon: AlertCircle, color: 'text-gray-600 bg-gray-100', label: 'Cancelled' },
}

export default function PurchasesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [purchases, setPurchases] = useState<Purchase[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/purchases')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchPurchases()
    }
  }, [session])

  const fetchPurchases = async () => {
    try {
      const response = await fetch('/api/user/purchases')
      if (response.ok) {
        const data = await response.json()
        setPurchases(data.purchases || [])
      }
    } catch (error) {
      console.error('Failed to fetch purchases:', error)
    } finally {
      setLoading(false)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900 dark:text-white">Purchase History</h1>
            <p className="text-gray-600 dark:text-gray-400">{purchases.length} purchases</p>
          </div>
        </div>

        {/* Purchases */}
        {purchases.length === 0 ? (
          <div className="card p-12 text-center">
            <ShoppingBag className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No purchases yet</h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              When you buy something, it will appear here.
            </p>
            <Link href="/search" className="btn-primary">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {purchases.map((purchase) => {
              const statusInfo = statusConfig[purchase.status] || statusConfig.PENDING
              const StatusIcon = statusInfo.icon

              return (
                <div key={purchase.id} className="card p-4">
                  <div className="flex gap-4">
                    {/* Image */}
                    <div className="w-24 h-24 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {purchase.listing.images?.[0] ? (
                        <img src={purchase.listing.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          No image
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div>
                          <Link href={`/listings/${purchase.listing.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600">
                            {purchase.listing.title}
                          </Link>
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {purchase.listing.deviceModel} · Sold by @{purchase.seller.username || purchase.seller.name}
                          </p>
                        </div>
                        <div className={`flex items-center gap-1 px-2 py-1 rounded-full text-sm ${statusInfo.color}`}>
                          <StatusIcon className="w-4 h-4" />
                          {statusInfo.label}
                        </div>
                      </div>

                      <div className="flex items-center justify-between mt-4">
                        <div className="text-sm text-gray-500 dark:text-gray-400">
                          <p>Ordered {new Date(purchase.createdAt).toLocaleDateString()}</p>
                          {purchase.trackingNumber && (
                            <p className="mt-1">
                              Tracking: {purchase.shippingCarrier} {purchase.trackingNumber}
                            </p>
                          )}
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-900 dark:text-white">${purchase.totalAmount.toFixed(2)}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400">Total paid</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                    <Link href={`/orders/${purchase.id}`} className="btn-secondary text-sm">
                      View Details
                    </Link>
                    {purchase.status === 'DELIVERED' && (
                      <button className="btn-secondary text-sm">
                        Leave Review
                      </button>
                    )}
                    {['SHIPPED', 'DELIVERED'].includes(purchase.status) && purchase.trackingNumber && (
                      <button className="btn-secondary text-sm">
                        Track Package
                      </button>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
