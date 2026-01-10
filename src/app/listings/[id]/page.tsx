'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import {
  Heart,
  Share2,
  Flag,
  Star,
  Shield,
  MessageSquare,
  ChevronLeft,
  ChevronRight,
  Check,
  X,
  AlertCircle,
  Smartphone,
  HardDrive,
  Battery,
  Cpu,
  Info,
  Loader2,
  Package,
  Edit2,
  Wallet,
  ArrowRight,
  Eye,
} from 'lucide-react'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  condition: string
  status: string
  reviewStatus: string | null
  views: number
  featured: boolean
  deviceType: string
  deviceModel: string
  storageGB: number | null
  color: string | null
  carrier: string | null
  osVersion: string | null
  buildNumber: string | null
  jailbreakStatus: string
  jailbreakTool: string | null
  bootromExploit: boolean | null
  batteryHealth: number | null
  screenReplaced: boolean | null
  originalParts: boolean | null
  imeiClean: boolean | null
  icloudUnlocked: boolean
  images: { id: string; url: string; order: number }[]
  createdAt: string
  verificationCode: string | null
  sellerId: string
  seller: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    rating: number
    ratingCount: number
    totalSales: number
    createdAt: string
    stripeOnboardingComplete: boolean
    role: string
  }
}

export default function ListingDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session } = useSession()
  const listingId = params.id as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [currentImageIndex, setCurrentImageIndex] = useState(0)

  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`)
        if (!res.ok) {
          if (res.status === 404) {
            throw new Error('Listing not found')
          }
          throw new Error('Failed to fetch listing')
        }
        const data = await res.json()
        setListing(data.listing)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  const handleBuyNow = () => {
    if (!session) {
      router.push(`/auth/signin?callbackUrl=/checkout/${listingId}`)
      return
    }
    router.push(`/checkout/${listingId}`)
  }

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (error || !listing) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2 dark:text-white">Listing Not Found</h1>
          <p className="text-gray-600 dark:text-gray-400 mb-6">{error || 'This listing may have been removed or sold.'}</p>
          <Link href="/browse" className="btn-primary">
            Browse Listings
          </Link>
        </div>
      </div>
    )
  }

  const isOwnListing = session?.user?.id === listing.seller.id
  // Admin sellers bypass Stripe onboarding requirement
  const sellerCanReceivePayments = listing.seller.stripeOnboardingComplete || listing.seller.role === 'ADMIN'
  const canPurchase = listing.status === 'ACTIVE' && !isOwnListing && sellerCanReceivePayments

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 pb-24 lg:pb-8">
      {/* Breadcrumb */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div className="max-w-7xl mx-auto px-4 py-3">
          <nav className="text-sm text-gray-500 dark:text-gray-400">
            <Link href="/" className="hover:text-primary-600">Home</Link>
            <span className="mx-2">/</span>
            <Link href={`/browse?deviceType=${listing.deviceType}`} className="hover:text-primary-600">
              {listing.deviceType.replace('_', ' ')}
            </Link>
            <span className="mx-2">/</span>
            <span className="text-gray-900 dark:text-white">{listing.deviceModel}</span>
          </nav>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Left column - Images & Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Image gallery */}
            <div className="card overflow-hidden">
              <div className="aspect-[4/3] bg-gray-100 relative">
                {listing.images.length > 0 ? (
                  <img
                    src={listing.images[currentImageIndex]?.url}
                    alt={listing.title}
                    className="w-full h-full object-contain"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Package className="w-16 h-16 text-gray-300" />
                  </div>
                )}

                {listing.images.length > 1 && (
                  <>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === 0 ? listing.images.length - 1 : prev - 1))}
                      className="absolute left-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white shadow-lg"
                    >
                      <ChevronLeft className="w-5 h-5" />
                    </button>
                    <button
                      onClick={() => setCurrentImageIndex((prev) => (prev === listing.images.length - 1 ? 0 : prev + 1))}
                      className="absolute right-4 top-1/2 -translate-y-1/2 p-2 bg-white/80 rounded-full hover:bg-white shadow-lg"
                    >
                      <ChevronRight className="w-5 h-5" />
                    </button>

                    <div className="absolute bottom-4 left-1/2 -translate-x-1/2 bg-black/60 text-white text-sm px-3 py-1 rounded-full">
                      {currentImageIndex + 1} / {listing.images.length}
                    </div>
                  </>
                )}
              </div>

              {/* Thumbnails - always show if there are images */}
              {listing.images.length > 0 && (
                <div className="flex gap-2 p-3 overflow-x-auto border-t border-gray-100 dark:border-gray-700">
                  {listing.images.map((img, i) => (
                    <button
                      key={img.id}
                      onClick={() => setCurrentImageIndex(i)}
                      className={`w-16 h-16 rounded-lg overflow-hidden border-2 flex-shrink-0 ${
                        i === currentImageIndex ? 'border-primary-500' : 'border-transparent hover:border-gray-300'
                      }`}
                    >
                      <img src={img.url} alt="" className="w-full h-full object-cover" />
                    </button>
                  ))}
                  <div className="flex items-center justify-center px-2 text-xs text-gray-400">
                    {listing.images.length} photo{listing.images.length !== 1 ? 's' : ''}
                  </div>
                </div>
              )}
            </div>

            {/* Description */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Description</h2>
              <div className="prose prose-sm max-w-none text-gray-600 dark:text-gray-400 whitespace-pre-line">
                {listing.description}
              </div>
            </div>

            {/* Device Specifications */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 dark:text-white">Device Specifications</h2>

              <div className="grid sm:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <Smartphone className="w-5 h-5 text-gray-400" />
                    <div>
                      <p className="text-sm text-gray-500 dark:text-gray-400">Model</p>
                      <p className="font-medium dark:text-white">{listing.deviceModel}</p>
                    </div>
                  </div>

                  {listing.storageGB && (
                    <div className="flex items-center gap-3">
                      <HardDrive className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Storage</p>
                        <p className="font-medium dark:text-white">{listing.storageGB}GB</p>
                      </div>
                    </div>
                  )}

                  {listing.batteryHealth && (
                    <div className="flex items-center gap-3">
                      <Battery className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Battery Health</p>
                        <p className="font-medium dark:text-white">{listing.batteryHealth}%</p>
                      </div>
                    </div>
                  )}

                  {listing.carrier && (
                    <div className="flex items-center gap-3">
                      <Cpu className="w-5 h-5 text-gray-400" />
                      <div>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Carrier</p>
                        <p className="font-medium dark:text-white">{listing.carrier}</p>
                      </div>
                    </div>
                  )}
                </div>

                <div className="space-y-2">
                  <StatusItem label="IMEI Clean" status={listing.imeiClean} />
                  <StatusItem label="iCloud Unlocked" status={listing.icloudUnlocked} />
                  <StatusItem label="Original Parts" status={listing.originalParts} />
                  {listing.screenReplaced !== null && listing.screenReplaced !== undefined && (
                    <StatusItem label="Screen Replaced" status={!listing.screenReplaced} inverted />
                  )}
                </div>
              </div>
            </div>

            {/* Jailbreak Info */}
            {listing.osVersion && (
              <div className="card p-6 border-2 border-purple-200 bg-purple-50/50">
                <div className="flex items-center gap-2 mb-4">
                  <h2 className="text-lg font-semibold text-purple-900">Jailbreak Information</h2>
                </div>

                <div className="grid sm:grid-cols-2 gap-6">
                  <div>
                    <h3 className="font-medium text-purple-900 mb-3">iOS Details</h3>
                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-600">iOS Version</span>
                        <span className="font-medium">{listing.osVersion}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Status</span>
                        <span className={`badge ${
                          ['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'].includes(listing.jailbreakStatus)
                            ? 'bg-purple-100 text-purple-800'
                            : 'bg-gray-100 text-gray-600'
                        }`}>
                          {['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'].includes(listing.jailbreakStatus)
                            ? 'Jailbreakable'
                            : 'Stock'}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div>
                    <h3 className="font-medium text-purple-900 mb-3">Features</h3>
                    <div className="space-y-2">
                      <StatusItem label="checkm8 Compatible" status={listing.bootromExploit} />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Right column - Purchase card */}
          <div className="lg:col-span-1">
            <div className="sticky top-[120px] space-y-4">
              {/* Main purchase card */}
              <div className="card p-6">
                <h1 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {listing.title}
                </h1>

                <div className="flex items-baseline gap-2 mb-2">
                  <span className="text-3xl font-bold text-gray-900 dark:text-white">
                    ${listing.price.toLocaleString()}
                  </span>
                </div>

                {/* View count */}
                <div className="flex items-center gap-1 text-sm text-gray-500 dark:text-gray-400 mb-4">
                  <Eye className="w-4 h-4" />
                  <span>{listing.views.toLocaleString()} view{listing.views !== 1 ? 's' : ''}</span>
                </div>

                {/* Quick badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                  <span className="badge bg-blue-100 text-blue-800">{listing.condition.replace('_', ' ')}</span>
                  {listing.osVersion && (
                    <span className="badge bg-purple-100 text-purple-800">iOS {listing.osVersion}</span>
                  )}
                </div>

                {/* Verification Code - visible to all for verification */}
                {listing.verificationCode && (
                  <div className="bg-gradient-to-r from-emerald-50 to-teal-50 dark:from-emerald-900/30 dark:to-teal-900/30 border border-emerald-200 dark:border-emerald-700 rounded-lg p-3 mb-4">
                    <div className="flex items-center gap-2">
                      <Shield className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                      <span className="text-sm font-medium text-emerald-700 dark:text-emerald-300">Verification Code</span>
                    </div>
                    <code className="block mt-2 text-2xl font-mono font-bold tracking-[0.3em] text-emerald-800 dark:text-emerald-200">
                      {listing.verificationCode}
                    </code>
                    <p className="text-xs text-emerald-600 dark:text-emerald-400 mt-1">
                      Check that this code matches the handwritten code in the photos
                    </p>
                  </div>
                )}

                {/* Status messages */}
                {listing.reviewStatus === 'PENDING_REVIEW' && (
                  <div className="bg-yellow-50 border border-yellow-200 text-yellow-700 rounded-lg p-3 mb-4 text-sm flex items-center gap-2">
                    <Loader2 className="w-4 h-4 animate-spin" />
                    <span>This listing is under review and will be visible once approved.</span>
                  </div>
                )}

                {listing.reviewStatus === 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                    This listing was not approved. Please check your account for details.
                  </div>
                )}

                {listing.status !== 'ACTIVE' && listing.reviewStatus !== 'PENDING_REVIEW' && listing.reviewStatus !== 'REJECTED' && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                    This listing is no longer available
                  </div>
                )}

                {isOwnListing && (
                  <div className="bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 text-blue-700 dark:text-blue-300 rounded-lg p-3 mb-4 text-sm flex items-center justify-between">
                    <span>This is your listing</span>
                    <Link
                      href={`/listings/${listing.id}/edit`}
                      className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      Edit
                    </Link>
                  </div>
                )}

                {isOwnListing && !listing.seller.stripeOnboardingComplete && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4 mb-4">
                    <div className="flex items-start gap-3">
                      <Wallet className="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="font-medium text-amber-800 dark:text-amber-300">Payments coming soon</p>
                        <p className="text-sm text-amber-700 dark:text-amber-400 mt-1">
                          Stripe integration is awaiting approval. Payouts will be available once approved.
                        </p>
                      </div>
                    </div>
                  </div>
                )}


                {/* Action buttons */}
                <div className="space-y-3">
                  <button
                    onClick={handleBuyNow}
                    disabled={!canPurchase}
                    className="btn-primary w-full py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Buy Now
                  </button>
                  <button className="btn-outline w-full py-3 flex items-center justify-center gap-2">
                    <MessageSquare className="w-4 h-4" />
                    Message Seller
                  </button>
                </div>

                {/* Secondary actions */}
                <div className="flex items-center justify-center gap-4 mt-4 pt-4 border-t border-gray-100 dark:border-gray-700">
                  <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                    <Heart className="w-4 h-4" />
                    Save
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                    <Share2 className="w-4 h-4" />
                    Share
                  </button>
                  <button className="text-sm text-gray-500 hover:text-gray-700 dark:hover:text-gray-300 flex items-center gap-1">
                    <Flag className="w-4 h-4" />
                    Report
                  </button>
                </div>
              </div>

              {/* Seller card */}
              <div className="card p-4">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center overflow-hidden">
                    {listing.seller.image ? (
                      <img src={listing.seller.image} alt="" className="w-full h-full object-cover" />
                    ) : (
                      <span className="text-gray-500 font-medium">
                        {(listing.seller.name || listing.seller.username || 'U').charAt(0).toUpperCase()}
                      </span>
                    )}
                  </div>
                  <div>
                    <Link href={`/profile/${listing.seller.username || listing.seller.id}`} className="font-medium hover:text-primary-600">
                      {listing.seller.name || listing.seller.username || 'Seller'}
                    </Link>
                    <div className="flex items-center gap-1 text-sm">
                      <Star className="w-4 h-4 fill-yellow-400 text-yellow-400" />
                      <span className="font-medium">{listing.seller.rating.toFixed(1)}</span>
                      <span className="text-gray-400">({listing.seller.ratingCount} reviews)</span>
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 text-center text-sm border-t border-gray-100 dark:border-gray-700 pt-3">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{listing.seller.totalSales}</p>
                    <p className="text-gray-500 dark:text-gray-400">Sales</p>
                  </div>
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">
                      {Math.floor((Date.now() - new Date(listing.seller.createdAt).getTime()) / (1000 * 60 * 60 * 24 * 30))} mo
                    </p>
                    <p className="text-gray-500 dark:text-gray-400">Member</p>
                  </div>
                </div>
              </div>

              {/* Protection info */}
              <div className="card p-4 bg-green-50 border-green-200">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <p className="font-medium text-green-900">Buyer Protection</p>
                    <p className="text-sm text-green-700">
                      Funds held until delivery confirmed. Full refund if item doesn't match.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile sticky buy bar */}
      <div className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 p-4 lg:hidden">
        <div className="flex items-center gap-4">
          <div>
            <p className="text-2xl font-bold dark:text-white">${listing.price}</p>
            <p className="text-sm text-gray-500 dark:text-gray-400">{listing.condition.replace('_', ' ')}</p>
          </div>
          <button
            onClick={handleBuyNow}
            disabled={!canPurchase}
            className="btn-primary flex-1 py-3 disabled:opacity-50"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  )
}

function StatusItem({
  label,
  status,
  inverted = false
}: {
  label: string
  status: boolean | null | undefined
  inverted?: boolean
}) {
  const isPositive = inverted ? !status : status

  if (status === null || status === undefined) {
    return (
      <div className="flex items-center gap-2 text-sm">
        <AlertCircle className="w-4 h-4 text-gray-400" />
        <span className="text-gray-500">{label}: Unknown</span>
      </div>
    )
  }

  return (
    <div className="flex items-center gap-2 text-sm">
      {isPositive ? (
        <Check className="w-4 h-4 text-green-500" />
      ) : (
        <X className="w-4 h-4 text-red-500" />
      )}
      <span className={isPositive ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'}>
        {label}
      </span>
    </div>
  )
}
