'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import {
  AlertTriangle,
  CheckCircle,
  XCircle,
  MessageSquare,
  Clock,
  User,
  Star,
  ShoppingBag,
  Calendar,
  Eye,
  ChevronDown,
  ChevronUp,
  Loader2,
  RefreshCw,
  Flag,
  Image as ImageIcon,
  Fingerprint,
  AlertOctagon,
} from 'lucide-react'

interface ReviewListing {
  id: string
  title: string
  description: string
  price: number
  deviceType: string
  deviceModel: string
  condition: string
  osVersion: string | null
  jailbreakStatus: string
  verificationCode: string | null
  verificationPhotoUrl: string | null
  aiDetectionScore: number | null
  flaggedForReview: boolean
  safeSearchAdult: string | null
  safeSearchViolence: string | null
  createdAt: string
  images: Array<{ id: string; url: string; order: number }>
  seller: {
    id: string
    name: string | null
    email: string
    username: string | null
    image: string | null
    rating: number
    totalSales: number
    createdAt: string
  }
}

interface Stats {
  pending: number
  flagged: number
  approvedToday: number
  rejectedToday: number
}

export default function AdminReviewsPage() {
  const [listings, setListings] = useState<ReviewListing[]>([])
  const [stats, setStats] = useState<Stats | null>(null)
  const [loading, setLoading] = useState(true)
  const [expandedId, setExpandedId] = useState<string | null>(null)
  const [showFlaggedOnly, setShowFlaggedOnly] = useState(false)
  const [actionLoading, setActionLoading] = useState<string | null>(null)
  const [rejectReason, setRejectReason] = useState('')
  const [showRejectModal, setShowRejectModal] = useState<string | null>(null)
  const [actionType, setActionType] = useState<'REJECTED' | 'NEEDS_INFO'>('REJECTED')

  const fetchListings = async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams({
        status: 'PENDING_REVIEW',
        ...(showFlaggedOnly && { flagged: 'true' }),
      })

      const res = await fetch(`/api/admin/reviews?${params}`)
      const data = await res.json()

      if (res.ok) {
        setListings(data.listings)
        setStats(data.stats)
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchListings()
  }, [showFlaggedOnly])

  const handleAction = async (listingId: string, action: string, reason?: string) => {
    setActionLoading(listingId)
    try {
      const res = await fetch(`/api/admin/reviews/${listingId}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason }),
      })

      if (res.ok) {
        // Remove from list
        setListings((prev) => prev.filter((l) => l.id !== listingId))
        setShowRejectModal(null)
        setRejectReason('')
        // Update stats
        if (stats) {
          setStats({
            ...stats,
            pending: stats.pending - 1,
            ...(action === 'APPROVED' && { approvedToday: stats.approvedToday + 1 }),
            ...(action === 'REJECTED' && { rejectedToday: stats.rejectedToday + 1 }),
          })
        }
      }
    } catch (error) {
      console.error('Action failed:', error)
    } finally {
      setActionLoading(null)
    }
  }

  const getAIScoreColor = (score: number | null) => {
    if (score === null) return 'text-gray-400'
    if (score < 0.3) return 'text-green-600'
    if (score < 0.6) return 'text-yellow-600'
    return 'text-red-600'
  }

  const getSafeSearchBadge = (value: string | null) => {
    if (!value || value === 'UNKNOWN' || value === 'VERY_UNLIKELY' || value === 'UNLIKELY') {
      return null
    }
    const colors = {
      POSSIBLE: 'bg-yellow-100 text-yellow-700',
      LIKELY: 'bg-orange-100 text-orange-700',
      VERY_LIKELY: 'bg-red-100 text-red-700',
    }
    return (
      <span className={`text-xs px-2 py-0.5 rounded ${colors[value as keyof typeof colors] || ''}`}>
        {value}
      </span>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  return (
    <div>
      {/* Stats */}
      {stats && (
        <div className="grid grid-cols-4 gap-4 mb-6">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-yellow-100 dark:bg-yellow-900 rounded-lg flex items-center justify-center">
                <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.pending}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Pending Review</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.flagged}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Flagged</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.approvedToday}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Approved Today</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gray-100 dark:bg-gray-700 rounded-lg flex items-center justify-center">
                <XCircle className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.rejectedToday}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Rejected Today</p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-xl font-bold text-gray-900 dark:text-white">Review Queue</h2>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={showFlaggedOnly}
              onChange={(e) => setShowFlaggedOnly(e.target.checked)}
              className="rounded border-gray-300"
            />
            <span className="text-gray-600 dark:text-gray-300">Flagged only</span>
          </label>
          <button
            onClick={fetchListings}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-gray-100 dark:bg-gray-700 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600"
          >
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </div>
      </div>

      {/* Listings */}
      {listings.length === 0 ? (
        <div className="bg-white dark:bg-gray-800 rounded-lg p-12 text-center border border-gray-200 dark:border-gray-700">
          <CheckCircle className="w-12 h-12 text-green-500 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
            All caught up!
          </h3>
          <p className="text-gray-500 dark:text-gray-400">
            No listings pending review at the moment.
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {listings.map((listing) => (
            <div
              key={listing.id}
              className={`bg-white dark:bg-gray-800 rounded-lg border ${
                listing.flaggedForReview
                  ? 'border-red-300 dark:border-red-700'
                  : 'border-gray-200 dark:border-gray-700'
              }`}
            >
              {/* Header Row */}
              <div
                className="p-4 cursor-pointer"
                onClick={() => setExpandedId(expandedId === listing.id ? null : listing.id)}
              >
                <div className="flex items-start gap-4">
                  {/* Thumbnail */}
                  <div className="w-20 h-20 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden flex-shrink-0">
                    {listing.images[0] ? (
                      <img
                        src={listing.images[0].url}
                        alt={listing.title}
                        className="w-full h-full object-cover"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <ImageIcon className="w-8 h-8 text-gray-400" />
                      </div>
                    )}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <h3 className="font-semibold text-gray-900 dark:text-white truncate">
                            {listing.title}
                          </h3>
                          {listing.flaggedForReview && (
                            <span className="flex items-center gap-1 text-xs bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300 px-2 py-0.5 rounded">
                              <AlertOctagon className="w-3 h-3" />
                              Flagged
                            </span>
                          )}
                        </div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">
                          {listing.deviceModel} &middot; {listing.condition} &middot; ${listing.price}
                        </p>
                      </div>
                      <div className="flex items-center gap-2">
                        {expandedId === listing.id ? (
                          <ChevronUp className="w-5 h-5 text-gray-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-gray-400" />
                        )}
                      </div>
                    </div>

                    {/* Quick Info Row */}
                    <div className="flex items-center gap-4 mt-2 text-xs">
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <User className="w-3 h-3" />
                        {listing.seller.name || listing.seller.username || 'Unknown'}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <Star className="w-3 h-3" />
                        {listing.seller.rating.toFixed(1)}
                      </span>
                      <span className="flex items-center gap-1 text-gray-500 dark:text-gray-400">
                        <ShoppingBag className="w-3 h-3" />
                        {listing.seller.totalSales} sales
                      </span>
                      {listing.aiDetectionScore !== null && (
                        <span className={`flex items-center gap-1 ${getAIScoreColor(listing.aiDetectionScore)}`}>
                          AI Score: {(listing.aiDetectionScore * 100).toFixed(0)}%
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Quick Actions */}
                  <div className="flex items-center gap-2 flex-shrink-0" onClick={(e) => e.stopPropagation()}>
                    <button
                      onClick={() => handleAction(listing.id, 'APPROVED')}
                      disabled={actionLoading === listing.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
                    >
                      {actionLoading === listing.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CheckCircle className="w-4 h-4" />
                      )}
                      Approve
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(listing.id)
                        setActionType('REJECTED')
                      }}
                      disabled={actionLoading === listing.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
                    >
                      <XCircle className="w-4 h-4" />
                      Reject
                    </button>
                    <button
                      onClick={() => {
                        setShowRejectModal(listing.id)
                        setActionType('NEEDS_INFO')
                      }}
                      disabled={actionLoading === listing.id}
                      className="flex items-center gap-1 px-3 py-1.5 bg-yellow-600 text-white rounded-lg hover:bg-yellow-700 disabled:opacity-50"
                    >
                      <MessageSquare className="w-4 h-4" />
                      Info
                    </button>
                  </div>
                </div>
              </div>

              {/* Expanded Details */}
              {expandedId === listing.id && (
                <div className="border-t border-gray-200 dark:border-gray-700 p-4">
                  <div className="grid grid-cols-2 gap-6">
                    {/* Left: Images */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">
                        Listing Photos ({listing.images.length})
                      </h4>
                      <div className="grid grid-cols-3 gap-2">
                        {listing.images.map((img, idx) => (
                          <a
                            key={img.id}
                            href={img.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="aspect-square bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                          >
                            <img
                              src={img.url}
                              alt={`Photo ${idx + 1}`}
                              className="w-full h-full object-cover hover:scale-105 transition-transform"
                            />
                          </a>
                        ))}
                      </div>

                      {/* Verification Photo */}
                      {listing.verificationPhotoUrl && (
                        <div className="mt-4">
                          <h4 className="font-medium text-gray-900 dark:text-white mb-2 flex items-center gap-2">
                            <Fingerprint className="w-4 h-4" />
                            Verification Photo
                          </h4>
                          <div className="flex items-start gap-4">
                            <a
                              href={listing.verificationPhotoUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="w-32 h-32 bg-gray-100 dark:bg-gray-700 rounded-lg overflow-hidden"
                            >
                              <img
                                src={listing.verificationPhotoUrl}
                                alt="Verification"
                                className="w-full h-full object-cover"
                              />
                            </a>
                            <div>
                              <p className="text-sm text-gray-500 dark:text-gray-400 mb-1">
                                Expected Code:
                              </p>
                              <p className="text-2xl font-mono font-bold text-primary-600 dark:text-primary-400">
                                {listing.verificationCode}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Right: Details */}
                    <div>
                      <h4 className="font-medium text-gray-900 dark:text-white mb-3">Details</h4>
                      <div className="space-y-3 text-sm">
                        <div>
                          <span className="text-gray-500 dark:text-gray-400">Description:</span>
                          <p className="text-gray-900 dark:text-white mt-1">{listing.description}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-2">
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Device:</span>
                            <p className="text-gray-900 dark:text-white">{listing.deviceModel}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">iOS:</span>
                            <p className="text-gray-900 dark:text-white">{listing.osVersion || 'N/A'}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Condition:</span>
                            <p className="text-gray-900 dark:text-white">{listing.condition}</p>
                          </div>
                          <div>
                            <span className="text-gray-500 dark:text-gray-400">Price:</span>
                            <p className="text-gray-900 dark:text-white">${listing.price}</p>
                          </div>
                        </div>

                        {/* AI Detection */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">AI Analysis</h5>
                          <div className="flex items-center gap-4">
                            <div>
                              <span className="text-gray-500 dark:text-gray-400 text-xs">Detection Score:</span>
                              <p className={`font-bold ${getAIScoreColor(listing.aiDetectionScore)}`}>
                                {listing.aiDetectionScore !== null
                                  ? `${(listing.aiDetectionScore * 100).toFixed(0)}%`
                                  : 'N/A'}
                              </p>
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 dark:text-gray-400 text-xs">Adult:</span>
                              {getSafeSearchBadge(listing.safeSearchAdult) || (
                                <span className="text-green-600 text-xs">OK</span>
                              )}
                            </div>
                            <div className="flex items-center gap-2">
                              <span className="text-gray-500 dark:text-gray-400 text-xs">Violence:</span>
                              {getSafeSearchBadge(listing.safeSearchViolence) || (
                                <span className="text-green-600 text-xs">OK</span>
                              )}
                            </div>
                          </div>
                        </div>

                        {/* Seller Info */}
                        <div className="pt-3 border-t border-gray-200 dark:border-gray-700">
                          <h5 className="font-medium text-gray-900 dark:text-white mb-2">Seller</h5>
                          <div className="flex items-center gap-3">
                            {listing.seller.image && (
                              <img
                                src={listing.seller.image}
                                alt=""
                                className="w-10 h-10 rounded-full"
                              />
                            )}
                            <div>
                              <p className="font-medium text-gray-900 dark:text-white">
                                {listing.seller.name || listing.seller.username || 'Unknown'}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {listing.seller.email}
                              </p>
                            </div>
                            <div className="ml-auto text-right">
                              <p className="text-sm">
                                <Star className="w-3 h-3 inline text-yellow-500" />{' '}
                                {listing.seller.rating.toFixed(1)}
                              </p>
                              <p className="text-xs text-gray-500 dark:text-gray-400">
                                {listing.seller.totalSales} sales
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Reject/Needs Info Modal */}
      {showRejectModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {actionType === 'REJECTED' ? 'Reject Listing' : 'Request More Information'}
            </h3>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder={
                actionType === 'REJECTED'
                  ? 'Enter reason for rejection...'
                  : 'What additional information do you need?'
              }
              className="w-full h-32 p-3 border border-gray-300 dark:border-gray-600 rounded-lg resize-none focus:ring-2 focus:ring-primary-500 dark:bg-gray-700 dark:text-white"
            />
            <div className="flex justify-end gap-3 mt-4">
              <button
                onClick={() => {
                  setShowRejectModal(null)
                  setRejectReason('')
                }}
                className="px-4 py-2 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={() => handleAction(showRejectModal, actionType, rejectReason)}
                disabled={!rejectReason.trim() || actionLoading === showRejectModal}
                className={`px-4 py-2 text-white rounded-lg disabled:opacity-50 ${
                  actionType === 'REJECTED'
                    ? 'bg-red-600 hover:bg-red-700'
                    : 'bg-yellow-600 hover:bg-yellow-700'
                }`}
              >
                {actionLoading === showRejectModal ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : actionType === 'REJECTED' ? (
                  'Reject'
                ) : (
                  'Send Request'
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
