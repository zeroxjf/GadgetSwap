'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ChevronLeft,
  Truck,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Search,
  Filter,
  ChevronRight,
  X,
} from 'lucide-react'

interface Sale {
  id: string
  listing: {
    id: string
    title: string
    deviceModel: string
    images: { url: string }[]
  }
  buyer: {
    name: string | null
    email: string
  }
  salePrice: number
  sellerPayout: number
  totalAmount: number
  status: string
  trackingNumber: string | null
  shippingCarrier: string | null
  createdAt: string
  shippedAt: string | null
  deliveredAt: string | null
  shippingName: string | null
  shippingCity: string | null
  shippingState: string | null
}

type FilterType = 'all' | 'needs_shipping' | 'shipped' | 'delivered' | 'completed' | 'disputed'

const statusConfig: Record<string, { icon: any; color: string; label: string }> = {
  PENDING: { icon: Clock, color: 'text-yellow-600 bg-yellow-100 dark:bg-yellow-900/30', label: 'Pending' },
  PAYMENT_RECEIVED: { icon: DollarSign, color: 'text-blue-600 bg-blue-100 dark:bg-blue-900/30', label: 'Needs Shipping' },
  SHIPPED: { icon: Truck, color: 'text-purple-600 bg-purple-100 dark:bg-purple-900/30', label: 'Shipped' },
  DELIVERED: { icon: Package, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Delivered' },
  COMPLETED: { icon: CheckCircle, color: 'text-green-600 bg-green-100 dark:bg-green-900/30', label: 'Completed' },
  DISPUTED: { icon: AlertCircle, color: 'text-red-600 bg-red-100 dark:bg-red-900/30', label: 'Disputed' },
  REFUNDED: { icon: AlertCircle, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700', label: 'Refunded' },
  CANCELLED: { icon: X, color: 'text-gray-600 bg-gray-100 dark:bg-gray-700', label: 'Cancelled' },
}

export default function SalesPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [sales, setSales] = useState<Sale[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [showShipModal, setShowShipModal] = useState<string | null>(null)
  const [trackingNumber, setTrackingNumber] = useState('')
  const [shippingCarrier, setShippingCarrier] = useState('')
  const [shipLoading, setShipLoading] = useState(false)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/sales')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchSales()
    }
  }, [session])

  const fetchSales = async () => {
    try {
      const response = await fetch('/api/user/sales')
      if (response.ok) {
        const data = await response.json()
        setSales(data.sales || [])
      }
    } catch (error) {
      console.error('Failed to fetch sales:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleShip = async (saleId: string) => {
    if (!trackingNumber.trim()) {
      alert('Please enter a tracking number')
      return
    }

    try {
      setShipLoading(true)
      const response = await fetch(`/api/transactions/${saleId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'ship',
          trackingNumber: trackingNumber.trim(),
          shippingCarrier: shippingCarrier || undefined,
        }),
      })

      const data = await response.json()

      if (!response.ok) {
        throw new Error(data.error || 'Failed to update shipping')
      }

      // Reset and refresh
      setShowShipModal(null)
      setTrackingNumber('')
      setShippingCarrier('')
      await fetchSales()
      alert(data.message || 'Order marked as shipped!')
    } catch (error: any) {
      alert(error.message)
    } finally {
      setShipLoading(false)
    }
  }

  const filteredSales = sales.filter((sale) => {
    switch (filter) {
      case 'needs_shipping':
        return sale.status === 'PAYMENT_RECEIVED'
      case 'shipped':
        return sale.status === 'SHIPPED'
      case 'delivered':
        return sale.status === 'DELIVERED'
      case 'completed':
        return sale.status === 'COMPLETED'
      case 'disputed':
        return sale.status === 'DISPUTED'
      default:
        return true
    }
  })

  const needsShippingCount = sales.filter((s) => s.status === 'PAYMENT_RECEIVED').length
  const totalEarnings = sales
    .filter((s) => ['DELIVERED', 'COMPLETED'].includes(s.status))
    .reduce((sum, s) => sum + s.sellerPayout, 0)

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
          <Link
            href="/account"
            className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1"
          >
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="mt-2 flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Sales</h1>
              <p className="text-gray-600 dark:text-gray-400">{sales.length} total orders</p>
            </div>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <Package className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Needs Shipping</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">{needsShippingCount}</p>
              </div>
            </div>
          </div>
          <div className="card p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <DollarSign className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Total Earnings</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">${totalEarnings.toFixed(2)}</p>
              </div>
            </div>
          </div>
          <div className="card p-4 col-span-2 md:col-span-1">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-purple-600 dark:text-purple-400" />
              </div>
              <div>
                <p className="text-sm text-gray-500 dark:text-gray-400">Completed Sales</p>
                <p className="text-xl font-bold text-gray-900 dark:text-white">
                  {sales.filter((s) => s.status === 'COMPLETED').length}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(
            [
              { key: 'all', label: 'All' },
              { key: 'needs_shipping', label: 'Needs Shipping', badge: needsShippingCount },
              { key: 'shipped', label: 'Shipped' },
              { key: 'delivered', label: 'Delivered' },
              { key: 'completed', label: 'Completed' },
              { key: 'disputed', label: 'Disputed' },
            ] as { key: FilterType; label: string; badge?: number }[]
          ).map((f) => (
            <button
              key={f.key}
              onClick={() => setFilter(f.key)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
                filter === f.key
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700'
              }`}
            >
              {f.label}
              {f.badge !== undefined && f.badge > 0 && (
                <span
                  className={`px-1.5 py-0.5 rounded-full text-xs ${
                    filter === f.key ? 'bg-white/20' : 'bg-red-500 text-white'
                  }`}
                >
                  {f.badge}
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Sales List */}
        {filteredSales.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No sales yet' : `No ${filter.replace('_', ' ')} orders`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filter === 'all'
                ? 'When you make a sale, it will appear here.'
                : 'Try a different filter to see other orders.'}
            </p>
            {filter === 'all' && (
              <Link href="/listings/new" className="btn-primary">
                Create a Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredSales.map((sale) => {
              const statusInfo = statusConfig[sale.status] || statusConfig.PENDING
              const StatusIcon = statusInfo.icon

              return (
                <div key={sale.id} className="card overflow-hidden">
                  <div className="p-4">
                    <div className="flex gap-4">
                      {/* Image */}
                      <div className="w-20 h-20 bg-gray-100 dark:bg-gray-800 rounded-lg flex-shrink-0 overflow-hidden">
                        {sale.listing.images?.[0] ? (
                          <img
                            src={sale.listing.images[0].url}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-400">
                            <Package className="w-6 h-6" />
                          </div>
                        )}
                      </div>

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <Link
                              href={`/orders/${sale.id}`}
                              className="font-medium text-gray-900 dark:text-white hover:text-primary-600 line-clamp-1"
                            >
                              {sale.listing.title}
                            </Link>
                            <p className="text-sm text-gray-500 dark:text-gray-400 mt-0.5">
                              {sale.listing.deviceModel}
                            </p>
                          </div>
                          <div
                            className={`flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}
                          >
                            <StatusIcon className="w-3.5 h-3.5" />
                            {statusInfo.label}
                          </div>
                        </div>

                        <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-1 text-sm">
                          <span className="text-gray-500 dark:text-gray-400">
                            Buyer: {sale.buyer.name || sale.buyer.email}
                          </span>
                          <span className="text-gray-500 dark:text-gray-400">
                            {new Date(sale.createdAt).toLocaleDateString()}
                          </span>
                        </div>

                        {/* Ship to address preview */}
                        {sale.status === 'PAYMENT_RECEIVED' && sale.shippingCity && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            Ship to: {sale.shippingCity}, {sale.shippingState}
                          </p>
                        )}

                        {/* Tracking info */}
                        {sale.trackingNumber && (
                          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                            {sale.shippingCarrier}: {sale.trackingNumber}
                          </p>
                        )}
                      </div>

                      {/* Price */}
                      <div className="text-right flex-shrink-0">
                        <p className="font-semibold text-gray-900 dark:text-white">
                          ${sale.sellerPayout.toFixed(2)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">Your payout</p>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="px-4 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-700 flex items-center gap-2">
                    {sale.status === 'PAYMENT_RECEIVED' && (
                      <button
                        onClick={() => setShowShipModal(sale.id)}
                        className="btn-primary text-sm"
                      >
                        <Truck className="w-4 h-4 mr-1" />
                        Add Tracking
                      </button>
                    )}
                    <Link href={`/orders/${sale.id}`} className="btn-secondary text-sm">
                      View Details
                      <ChevronRight className="w-4 h-4 ml-1" />
                    </Link>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Ship Modal */}
        {showShipModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white dark:bg-gray-800 rounded-xl max-w-md w-full p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
                  Add Tracking Information
                </h3>
                <button
                  onClick={() => {
                    setShowShipModal(null)
                    setTrackingNumber('')
                    setShippingCarrier('')
                  }}
                  className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                >
                  <X className="w-5 h-5 text-gray-500" />
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tracking Number *
                  </label>
                  <input
                    type="text"
                    value={trackingNumber}
                    onChange={(e) => setTrackingNumber(e.target.value)}
                    placeholder="Enter tracking number"
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Carrier (optional)
                  </label>
                  <select
                    value={shippingCarrier}
                    onChange={(e) => setShippingCarrier(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
                  >
                    <option value="">Auto-detect from tracking number</option>
                    <option value="ups">UPS</option>
                    <option value="fedex">FedEx</option>
                    <option value="usps">USPS</option>
                  </select>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    We'll try to auto-detect from the tracking number format
                  </p>
                </div>

                <div className="flex gap-3 pt-2">
                  <button
                    onClick={() => {
                      setShowShipModal(null)
                      setTrackingNumber('')
                      setShippingCarrier('')
                    }}
                    className="flex-1 btn-secondary"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={() => handleShip(showShipModal)}
                    disabled={shipLoading || !trackingNumber.trim()}
                    className="flex-1 btn-primary disabled:opacity-50"
                  >
                    {shipLoading ? 'Saving...' : 'Mark as Shipped'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
