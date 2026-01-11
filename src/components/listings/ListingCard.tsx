'use client'

import Link from 'next/link'
import Image from 'next/image'
import { Heart, Star, Zap, Loader2 } from 'lucide-react'
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

const conditionLabels: Record<string, { label: string; color: string }> = {
  NEW: { label: 'New', color: 'bg-green-100 text-green-800' },
  LIKE_NEW: { label: 'Like New', color: 'bg-green-100 text-green-800' },
  EXCELLENT: { label: 'Excellent', color: 'bg-blue-100 text-blue-800' },
  GOOD: { label: 'Good', color: 'bg-yellow-100 text-yellow-800' },
  FAIR: { label: 'Fair', color: 'bg-orange-100 text-orange-800' },
  POOR: { label: 'Poor', color: 'bg-red-100 text-red-800' },
  FOR_PARTS: { label: 'For Parts', color: 'bg-gray-100 text-gray-800' },
}

const jailbreakLabels: Record<string, { label: string; color: string }> = {
  JAILBROKEN: { label: 'Jailbreakable', color: 'bg-purple-100 text-purple-800' },
  JAILBREAKABLE: { label: 'Jailbreakable', color: 'bg-purple-100 text-purple-800' },
  ROOTLESS_JB: { label: 'Jailbreakable', color: 'bg-purple-100 text-purple-800' },
  ROOTFUL_JB: { label: 'Jailbreakable', color: 'bg-purple-100 text-purple-800' },
  NOT_JAILBROKEN: { label: 'Stock', color: 'bg-gray-100 text-gray-600' },
  UNKNOWN: { label: '', color: '' },
}

export function ListingCard({ listing }: ListingCardProps) {
  const { data: session } = useSession()
  const [isWatchlisted, setIsWatchlisted] = useState(listing.isWatchlisted || false)
  const [isUpdating, setIsUpdating] = useState(false)

  const condition = conditionLabels[listing.condition] || conditionLabels.GOOD
  const jailbreak = listing.jailbreakStatus
    ? jailbreakLabels[listing.jailbreakStatus]
    : null

  const handleWatchlist = async (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()

    if (!session?.user) {
      // Redirect to sign in or show message
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
      } else {
        console.error('Failed to update watchlist')
      }
    } catch (error) {
      console.error('Watchlist error:', error)
    } finally {
      setIsUpdating(false)
    }
  }

  return (
    <Link href={`/listings/${listing.id}`} className="group">
      <div className="card overflow-hidden hover:shadow-lg transition-shadow">
        {/* Image */}
        <div className="relative aspect-square bg-gray-100">
          {listing.images[0]?.url ? (
            <Image
              src={listing.images[0].url}
              alt={listing.title}
              fill
              className="object-cover"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
            />
          ) : (
            <div className="w-full h-full bg-gradient-to-br from-gray-200 to-gray-300 flex items-center justify-center">
              <span className="text-gray-400 text-sm">{listing.deviceModel}</span>
            </div>
          )}

          {/* Featured badge */}
          {listing.featured && (
            <div className="absolute top-2 left-2 bg-accent-500 text-white text-xs font-medium px-2 py-1 rounded-full flex items-center gap-1">
              <Zap className="w-3 h-3" />
              Featured
            </div>
          )}

          {/* Watchlist button */}
          <button
            onClick={handleWatchlist}
            disabled={isUpdating}
            className="absolute top-2 right-2 p-2 bg-white/80 backdrop-blur-sm rounded-full hover:bg-white transition-colors disabled:opacity-50"
          >
            {isUpdating ? (
              <Loader2 className="w-4 h-4 text-gray-600 animate-spin" />
            ) : (
              <Heart
                className={`w-4 h-4 ${
                  isWatchlisted ? 'fill-red-500 text-red-500' : 'text-gray-600'
                }`}
              />
            )}
          </button>

        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          {/* iOS Version & Jailbreak Status - PROMINENT */}
          <div className="flex gap-2 mb-2.5 sm:mb-3">
            {listing.osVersion && (
              <div className="flex-1 bg-gradient-to-r from-gray-900 to-gray-700 dark:from-gray-700 dark:to-gray-600 text-white rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-center">
                <p className="text-[9px] sm:text-[10px] tracking-wide text-gray-300">iOS</p>
                <p className="text-base sm:text-lg font-bold leading-tight">{listing.osVersion}</p>
              </div>
            )}
            <div className={`flex-1 rounded-lg px-2.5 sm:px-3 py-1.5 sm:py-2 text-center ${
              jailbreak && jailbreak.label === 'Jailbreakable'
                ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white'
                : 'bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300'
            }`}>
              <p className="text-[9px] sm:text-[10px] tracking-wide opacity-75">Jailbreakable?</p>
              <p className="text-sm font-bold leading-tight">
                {jailbreak && jailbreak.label === 'Jailbreakable' ? 'Yes' : 'No'}
              </p>
            </div>
          </div>

          {/* Price */}
          <div className="flex items-baseline justify-between mb-1">
            <span className="text-lg sm:text-xl font-bold text-gray-900 dark:text-white">
              ${listing.price.toLocaleString()}
            </span>
            {listing.storageGB && (
              <span className="text-xs sm:text-sm text-gray-500 dark:text-gray-400">{listing.storageGB}GB</span>
            )}
          </div>

          {/* Title */}
          <h3 className="text-sm sm:text-base font-medium text-gray-900 dark:text-white mb-2 line-clamp-2 group-hover:text-primary-600 transition-colors">
            {listing.title}
          </h3>

          {/* Condition & checkm8 badges */}
          <div className="flex flex-wrap gap-1.5 mb-2 sm:mb-3">
            <span className={`badge text-[11px] sm:text-xs ${condition.color}`}>{condition.label}</span>
            {listing.bootromExploit && (
              <span className="badge text-[11px] sm:text-xs bg-amber-100 text-amber-800">checkm8</span>
            )}
          </div>

          {/* Seller info - hidden on mobile for compact view */}
          <div className="hidden sm:flex items-center justify-between pt-2 border-t border-gray-100 dark:border-gray-700">
            <span className="text-sm text-gray-600 dark:text-gray-400">{listing.seller.name}</span>
            <div className="flex items-center gap-1">
              <Star className="w-3.5 h-3.5 fill-yellow-400 text-yellow-400" />
              <span className="text-sm font-medium">{listing.seller.rating}</span>
              <span className="text-xs text-gray-400">
                ({listing.seller.totalSales})
              </span>
            </div>
          </div>
        </div>
      </div>
    </Link>
  )
}
