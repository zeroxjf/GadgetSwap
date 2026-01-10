'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Package,
  ChevronLeft,
  Plus,
  Edit2,
  Trash2,
  Eye,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Info,
  FileEdit,
  ArrowRight,
  Wallet,
} from 'lucide-react'

interface Listing {
  id: string
  title: string
  price: number
  status: string
  reviewStatus: string
  rejectionReason?: string | null
  views: number
  deviceType: string
  deviceModel: string
  condition: string
  createdAt: string
  images: { url: string }[]
}

type FilterType = 'all' | 'draft' | 'active' | 'sold' | 'pending_review' | 'rejected' | 'needs_info'

export default function MyListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<FilterType>('all')
  const [payoutsSetup, setPayoutsSetup] = useState<boolean | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/listings')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchListings()
      fetchPayoutStatus()
    }
  }, [session])

  const fetchListings = async () => {
    try {
      const response = await fetch('/api/user/listings')
      if (response.ok) {
        const data = await response.json()
        setListings(data.listings || [])
      }
    } catch (error) {
      console.error('Failed to fetch listings:', error)
    } finally {
      setLoading(false)
    }
  }

  const fetchPayoutStatus = async () => {
    try {
      const response = await fetch('/api/payouts/info')
      if (response.ok) {
        const data = await response.json()
        setPayoutsSetup(data.stripeOnboardingComplete)
      }
    } catch (error) {
      console.error('Failed to fetch payout status:', error)
    }
  }

  const deleteListing = async (listingId: string) => {
    if (!confirm('Are you sure you want to delete this listing?')) return
    try {
      await fetch(`/api/listings/${listingId}`, { method: 'DELETE' })
      setListings(listings.filter(l => l.id !== listingId))
    } catch (error) {
      console.error('Failed to delete listing:', error)
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

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true
    if (filter === 'draft') return l.status === 'DRAFT'
    if (filter === 'active') return l.status === 'ACTIVE' && l.reviewStatus === 'APPROVED'
    if (filter === 'sold') return l.status === 'SOLD'
    if (filter === 'pending_review') return l.reviewStatus === 'PENDING_REVIEW' && l.status !== 'DRAFT'
    if (filter === 'rejected') return l.reviewStatus === 'REJECTED'
    if (filter === 'needs_info') return l.reviewStatus === 'NEEDS_INFO'
    return true
  })

  const statusCounts: Record<FilterType, number> = {
    all: listings.length,
    draft: listings.filter(l => l.status === 'DRAFT').length,
    active: listings.filter(l => l.status === 'ACTIVE' && l.reviewStatus === 'APPROVED').length,
    sold: listings.filter(l => l.status === 'SOLD').length,
    pending_review: listings.filter(l => l.reviewStatus === 'PENDING_REVIEW' && l.status !== 'DRAFT').length,
    rejected: listings.filter(l => l.reviewStatus === 'REJECTED').length,
    needs_info: listings.filter(l => l.reviewStatus === 'NEEDS_INFO').length,
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    SOLD: 'bg-blue-100 text-blue-700',
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    REMOVED: 'bg-red-100 text-red-700',
    EXPIRED: 'bg-red-100 text-red-700',
  }

  const reviewStatusConfig: Record<string, { color: string; icon: React.ReactNode; label: string }> = {
    PENDING_REVIEW: {
      color: 'bg-yellow-100 text-yellow-700 border-yellow-200',
      icon: <Clock className="w-3.5 h-3.5" />,
      label: 'Pending Review',
    },
    APPROVED: {
      color: 'bg-green-100 text-green-700 border-green-200',
      icon: <CheckCircle className="w-3.5 h-3.5" />,
      label: 'Approved',
    },
    REJECTED: {
      color: 'bg-red-100 text-red-700 border-red-200',
      icon: <XCircle className="w-3.5 h-3.5" />,
      label: 'Rejected',
    },
    NEEDS_INFO: {
      color: 'bg-orange-100 text-orange-700 border-orange-200',
      icon: <AlertCircle className="w-3.5 h-3.5" />,
      label: 'Needs Info',
    },
  }

  const filterLabels: Record<FilterType, string> = {
    all: 'All',
    draft: 'Drafts',
    active: 'Active',
    sold: 'Sold',
    pending_review: 'Pending',
    rejected: 'Rejected',
    needs_info: 'Needs Info',
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">My Listings</h1>
              <p className="text-gray-600 dark:text-gray-400">{listings.length} total listings</p>
            </div>
            <Link href="/listings/new?new=true" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </div>
        </div>

        {/* Stripe pending notice */}
        {payoutsSetup === false && listings.length > 0 && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg flex items-start gap-3">
            <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="font-medium text-amber-800 dark:text-amber-200">Payments coming soon</p>
              <p className="text-sm text-amber-700 dark:text-amber-300 mt-1">
                Stripe integration is awaiting approval. Payouts will be available once approved. Your listings are visible to buyers.
              </p>
            </div>
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-2 mb-6">
          {(['all', 'draft', 'active', 'sold', 'pending_review', 'rejected', 'needs_info'] as FilterType[]).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-700'
              }`}
            >
              {filterLabels[f]} {statusCounts[f] > 0 && `(${statusCounts[f]})`}
            </button>
          ))}
        </div>

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">
              {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
            </h3>
            <p className="text-gray-500 dark:text-gray-400 mb-6">
              {filter === 'all'
                ? "Start selling by creating your first listing."
                : `You don't have any ${filter} listings.`}
            </p>
            {filter === 'all' && (
              <Link href="/listings/new?new=true" className="btn-primary">
                Create Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="card divide-y divide-gray-100 dark:divide-gray-700">
            {filteredListings.map((listing) => {
              const reviewConfig = reviewStatusConfig[listing.reviewStatus]
              const isDraft = listing.status === 'DRAFT'
              return (
                <div key={listing.id} className="p-4">
                  <div className="flex items-start gap-4">
                    {/* Image */}
                    <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                      {listing.images?.[0] ? (
                        <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                          {isDraft ? <FileEdit className="w-8 h-8" /> : 'No image'}
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 flex-wrap">
                        {isDraft ? (
                          <span className="font-medium text-gray-900 dark:text-white truncate">
                            {listing.title || 'Untitled Draft'}
                          </span>
                        ) : (
                          <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 dark:text-white hover:text-primary-600 truncate">
                            {listing.title}
                          </Link>
                        )}
                        {/* Draft Badge */}
                        {isDraft && (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border bg-gray-100 text-gray-700 border-gray-200">
                            <FileEdit className="w-3.5 h-3.5" />
                            Draft
                          </span>
                        )}
                        {/* Review Status Badge */}
                        {!isDraft && reviewConfig && (
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium border ${reviewConfig.color}`}>
                            {reviewConfig.icon}
                            {reviewConfig.label}
                          </span>
                        )}
                        {/* Status Badge (Active/Sold) */}
                        {listing.reviewStatus === 'APPROVED' && (
                          <span className={`badge ${statusColors[listing.status] || 'bg-gray-100 text-gray-700'}`}>
                            {listing.status}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                        {listing.deviceModel || 'No device selected'} {listing.condition ? `· ${listing.condition}` : ''}
                      </p>
                      <div className="flex items-center gap-4 mt-2 text-sm text-gray-500 dark:text-gray-400">
                        {listing.price > 0 ? (
                          <span className="font-semibold text-gray-900 dark:text-white">${listing.price.toLocaleString()}</span>
                        ) : (
                          <span className="text-gray-400">No price set</span>
                        )}
                        {!isDraft && listing.reviewStatus === 'APPROVED' && (
                          <span className="flex items-center gap-1">
                            <Eye className="w-4 h-4" />
                            {listing.views} views
                          </span>
                        )}
                        <span>{isDraft ? 'Last edited' : 'Listed'} {new Date(listing.createdAt).toLocaleDateString()}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      {isDraft ? (
                        <Link
                          href="/listings/new"
                          className="btn-primary text-sm flex items-center gap-1"
                        >
                          Continue
                          <ArrowRight className="w-4 h-4" />
                        </Link>
                      ) : (
                        <Link
                          href={`/listings/${listing.id}/edit`}
                          className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg"
                          title="Edit"
                        >
                          <Edit2 className="w-5 h-5 text-gray-400" />
                        </Link>
                      )}
                      <button
                        onClick={() => deleteListing(listing.id)}
                        className="p-2 hover:bg-red-50 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-5 h-5 text-red-400" />
                      </button>
                    </div>
                  </div>

                  {/* Rejection Reason / Needs Info Message */}
                  {!isDraft && (listing.reviewStatus === 'REJECTED' || listing.reviewStatus === 'NEEDS_INFO') && listing.rejectionReason && (
                    <div className={`mt-3 p-3 rounded-lg flex items-start gap-2 ${
                      listing.reviewStatus === 'REJECTED'
                        ? 'bg-red-50 border border-red-200'
                        : 'bg-orange-50 border border-orange-200'
                    }`}>
                      <Info className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                        listing.reviewStatus === 'REJECTED' ? 'text-red-600' : 'text-orange-600'
                      }`} />
                      <div>
                        <p className={`text-sm font-medium ${
                          listing.reviewStatus === 'REJECTED' ? 'text-red-800' : 'text-orange-800'
                        }`}>
                          {listing.reviewStatus === 'REJECTED' ? 'Rejection Reason:' : 'Action Required:'}
                        </p>
                        <p className={`text-sm ${
                          listing.reviewStatus === 'REJECTED' ? 'text-red-700' : 'text-orange-700'
                        }`}>
                          {listing.rejectionReason}
                        </p>
                        {listing.reviewStatus === 'NEEDS_INFO' && (
                          <Link
                            href={`/listings/${listing.id}/edit`}
                            className="text-sm font-medium text-orange-700 hover:text-orange-800 underline mt-1 inline-block"
                          >
                            Update listing
                          </Link>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Pending Review Message */}
                  {listing.reviewStatus === 'PENDING_REVIEW' && !isDraft && (
                    <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start gap-2">
                      <Clock className="w-4 h-4 text-yellow-600 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-yellow-700">
                        Your listing is being reviewed by our team. This usually takes less than 24 hours.
                      </p>
                    </div>
                  )}

                  {/* Draft Message */}
                  {isDraft && (
                    <div className="mt-3 p-3 bg-gray-50 border border-gray-200 rounded-lg flex items-start gap-2">
                      <FileEdit className="w-4 h-4 text-gray-500 flex-shrink-0 mt-0.5" />
                      <p className="text-sm text-gray-600">
                        This listing is saved as a draft. Click &quot;Continue&quot; to complete and submit it for review.
                      </p>
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
