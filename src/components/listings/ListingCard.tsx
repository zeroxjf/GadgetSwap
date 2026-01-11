'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, Zap, Loader2, Smartphone } from 'lucide-react'
import { useState } from 'react'
import { useSession } from 'next-auth/react'

interface ListingCardProps {
  listing: {
    id: string
    title: string
    price: number
    deviceType: string
    deviceModel: string
    condition: string
    osVersion?: string | null
    jailbreakStatus?: string
    jailbreakTool?: string | null
    bootromExploit?: boolean | null
    storageGB?: number | null
    images: { id: string; url: string; order: number }[]
    seller: {
      name: string | null
      rating: number
      totalSales: number
    }
    featured?: boolean
    isWatchlisted?: boolean
  }
}

const conditionConfig: Record<string, { label: string; bg: string; text: string; dot: string }> = {
  NEW: { label: 'New', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  LIKE_NEW: { label: 'Like New', bg: 'bg-emerald-50 dark:bg-emerald-900/30', text: 'text-emerald-700 dark:text-emerald-400', dot: 'bg-emerald-500' },
  EXCELLENT: { label: 'Excellent', bg: 'bg-blue-50 dark:bg-blue-900/30', text: 'text-blue-700 dark:text-blue-400', dot: 'bg-blue-500' },
  GOOD: { label: 'Good', bg: 'bg-amber-50 dark:bg-amber-900/30', text: 'text-amber-700 dark:text-amber-400', dot: 'bg-amber-500' },
  FAIR: { label: 'Fair', bg: 'bg-orange-50 dark:bg-orange-900/30', text: 'text-orange-700 dark:text-orange-400', dot: 'bg-orange-500' },
  POOR: { label: 'Poor', bg: 'bg-red-50 dark:bg-red-900/30', text: 'text-red-700 dark:text-red-400', dot: 'bg-red-500' },
  FOR_PARTS: { label: 'Parts', bg: 'bg-gray-100 dark:bg-gray-800', text: 'text-gray-600 dark:text-gray-400', dot: 'bg-gray-400' },
}

const isJailbreakable = (status?: string) => {
  return ['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'].includes(status || '')
}

export function ListingCard({ listing }: ListingCardProps) {
  const { data: session } = useSession()
  const [isWatchlisted, setIsWatchlisted] = useState(listing.isWatchlisted || false)
  const [isUpdating, setIsUpdating] = useState(false)

  const condition = conditionConfig[listing.condition] || conditionConfig.GOOD
  const canJailbreak = isJailbreakable(listing.jailbreakStatus)

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      window.location.href = `/auth/signin?callbackUrl=${encodeURIComponent(window.location.pathname)}`
      return
    }

    if (isUpdating) return

    setIsUpdating(true)
    const newState = !isWatchlisted

    try {
      const response = await fetch('/api/watchlist', {
        method: newState ? 'POST' : 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listingId: listing.id }),
      })

      if (response.ok) {
        setIsWatchlisted(newState)
      }
    } catch (error) {
      console.error('Watchlist error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group">
      <div className="bg-white dark:bg-gray-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 dark:border-gray-700/50">
        {/* Image */}
        <div className="relative aspect-[4/3] bg-gray-100 dark:bg-gray-900 overflow-hidden">
          {listing.images[0]?.url ? (
            <Image
              src={listing.images[0].url}
              alt={listing.title}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-500"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-900 flex items-center justify-center">
              <Smartphone className="w-12 h-12 text-gray-300 dark:text-gray-600" />
            </div>
          )}

          {/* Top overlay badges */}
          <div className="absolute top-0 left-0 right-0 p-2.5 flex justify-between items-start">
            {/* Left badges */}
            <div className="flex flex-wrap gap-1.5">
              {listing.featured && (
                <span className="inline-flex items-center gap-1 bg-gradient-to-r from-amber-500 to-orange-500 text-white text-[10px] font-semibold px-2 py-1 rounded-full shadow-lg">
                  <Zap className="w-3 h-3" />
                  Featured
                </span>
              )}
            </div>

            {/* Watchlist button */}
            <button
              onClick={handleWatchlist}
              disabled={isUpdating}
              className={`p-2 rounded-full shadow-lg transition-all duration-200 ${
                isWatchlisted
                  ? 'bg-red-500 text-white'
                  : 'bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm text-gray-600 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800'
              }`}
            >
              {isUpdating ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Heart className={`w-4 h-4 ${isWatchlisted ? 'fill-current' : ''}`} />
              )}
            </button>
          </div>

          {/* Bottom gradient overlay with iOS version & Jailbreak status */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-2.5 pt-10">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5">
                {listing.osVersion && (
                  <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-medium px-2 py-0.5 rounded">
                    iOS {listing.osVersion}
                  </span>
                )}
                {listing.bootromExploit && (
                  <span className="bg-amber-500/90 text-white text-xs font-medium px-2 py-0.5 rounded">
                    checkm8
                  </span>
                )}
              </div>
              <span className={`text-xs font-semibold px-2 py-0.5 rounded ${
                canJailbreak
                  ? 'bg-purple-500/90 text-white'
                  : 'bg-white/20 backdrop-blur-sm text-white/80'
              }`}>
                {canJailbreak ? 'JB: Yes' : 'JB: No'}
              </span>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="p-3.5">
          {/* Price & Storage row */}
          <div className="flex items-baseline justify-between mb-1.5">
            <span className="text-xl font-bold text-gray-900 dark:text-white">
              ${listing.price.toLocaleString()}
            </span>
            <div className="flex items-center gap-2">
              {listing.storageGB && (
                <span className="text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded">
                  {listing.storageGB}GB
                </span>
              )}
            </div>
          </div>

          {/* Title */}
          <h3 className="text-sm font-semibold text-gray-900 dark:text-white mb-2 line-clamp-1 group-hover:text-primary-600 dark:group-hover:text-primary-400 transition-colors">
            {listing.title}
          </h3>

          {/* Condition badge */}
          <div className="flex items-center gap-2 mb-3">
            <span className={`inline-flex items-center gap-1.5 text-xs font-medium px-2 py-1 rounded-md ${condition.bg} ${condition.text}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${condition.dot}`}></span>
              {condition.label}
            </span>
          </div>

          {/* Seller info */}
          <div className="flex items-center justify-between pt-2.5 border-t border-gray-100 dark:border-gray-700/50">
            <span className="text-xs text-gray-500 dark:text-gray-400 truncate max-w-[120px]">
              {listing.seller.name || 'Seller'}
            </span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {listing.seller.rating.toFixed(1)}
              </span>
              <span className="text-[10px] text-gray-400">
                ({listing.seller.totalSales})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
