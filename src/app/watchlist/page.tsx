'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  Heart,
  ChevronLeft,
  Trash2,
  ExternalLink
} from 'lucide-react'
import { ListingCard } from '@/components/listings/ListingCard'

interface WatchlistItem {
  id: string
  listing: {
    id: string
    title: string
    price: number
    deviceType: string
    deviceModel: string
    condition: string
    osVersion?: string
    jailbreakStatus?: string
    storageGB?: number
    images: { id: string; url: string; order: number }[]
    seller: {
      name: string | null
      rating: number
      totalSales: number
    }
    status: string
  }
  createdAt: string
}

export default function WatchlistPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [watchlist, setWatchlist] = useState<WatchlistItem[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/watchlist')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchWatchlist()
    }
  }, [session])

  const fetchWatchlist = async () => {
    try {
      const response = await fetch('/api/watchlist')
      if (response.ok) {
        const data = await response.json()
        setWatchlist(data.watchlist || [])
      }
    } catch (error) {
      console.error('Failed to fetch watchlist:', error)
    } finally {
      setLoading(false)
    }
  }

  const removeFromWatchlist = async (listingId: string) => {
    try {
      await fetch(`/api/watchlist/${listingId}`, { method: 'DELETE' })
      setWatchlist(watchlist.filter(w => w.listing.id !== listingId))
    } catch (error) {
      console.error('Failed to remove from watchlist:', error)
    }
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const activeListings = watchlist.filter(w => w.listing.status === 'ACTIVE')
  const soldListings = watchlist.filter(w => w.listing.status !== 'ACTIVE')

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="mt-2">
            <h1 className="text-2xl font-bold text-gray-900">My Watchlist</h1>
            <p className="text-gray-600">{watchlist.length} saved items</p>
          </div>
        </div>

        {/* Watchlist */}
        {watchlist.length === 0 ? (
          <div className="card p-12 text-center">
            <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">Your watchlist is empty</h3>
            <p className="text-gray-500 mb-6">
              Save listings you're interested in to keep track of them here.
            </p>
            <Link href="/search" className="btn-primary">
              Browse Listings
            </Link>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Active Listings */}
            {activeListings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-900 mb-4">
                  Available ({activeListings.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                  {activeListings.map((item) => (
                    <div key={item.id} className="relative">
                      <ListingCard listing={item.listing as any} />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          removeFromWatchlist(item.listing.id)
                        }}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 z-10"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Sold/Unavailable Listings */}
            {soldListings.length > 0 && (
              <div>
                <h2 className="text-lg font-semibold text-gray-500 mb-4">
                  No Longer Available ({soldListings.length})
                </h2>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 opacity-60">
                  {soldListings.map((item) => (
                    <div key={item.id} className="relative">
                      <div className="absolute inset-0 bg-gray-900/50 z-10 rounded-lg flex items-center justify-center">
                        <span className="bg-red-500 text-white px-3 py-1 rounded-full text-sm font-medium">
                          {item.listing.status === 'SOLD' ? 'Sold' : 'Unavailable'}
                        </span>
                      </div>
                      <ListingCard listing={item.listing as any} />
                      <button
                        onClick={(e) => {
                          e.preventDefault()
                          removeFromWatchlist(item.listing.id)
                        }}
                        className="absolute top-2 right-2 p-2 bg-white rounded-full shadow-md hover:bg-red-50 z-20"
                        title="Remove from watchlist"
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}
