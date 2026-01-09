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
  MoreVertical
} from 'lucide-react'

interface Listing {
  id: string
  title: string
  price: number
  status: string
  views: number
  deviceType: string
  deviceModel: string
  condition: string
  createdAt: string
  images: { url: string }[]
}

export default function MyListingsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'all' | 'active' | 'sold' | 'draft'>('all')

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/listings')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user) {
      fetchListings()
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
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="animate-pulse text-gray-400">Loading...</div>
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  const filteredListings = listings.filter(l => {
    if (filter === 'all') return true
    if (filter === 'active') return l.status === 'ACTIVE'
    if (filter === 'sold') return l.status === 'SOLD'
    if (filter === 'draft') return l.status === 'DRAFT'
    return true
  })

  const statusCounts = {
    all: listings.length,
    active: listings.filter(l => l.status === 'ACTIVE').length,
    sold: listings.filter(l => l.status === 'SOLD').length,
    draft: listings.filter(l => l.status === 'DRAFT').length,
  }

  const statusColors: Record<string, string> = {
    ACTIVE: 'bg-green-100 text-green-700',
    SOLD: 'bg-blue-100 text-blue-700',
    DRAFT: 'bg-gray-100 text-gray-700',
    PENDING: 'bg-yellow-100 text-yellow-700',
    EXPIRED: 'bg-red-100 text-red-700',
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Account
          </Link>
          <div className="flex items-center justify-between mt-2">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
              <p className="text-gray-600">{listings.length} total listings</p>
            </div>
            <Link href="/listings/new" className="btn-primary flex items-center gap-2">
              <Plus className="w-4 h-4" />
              New Listing
            </Link>
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 mb-6">
          {(['all', 'active', 'sold', 'draft'] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === f
                  ? 'bg-primary-600 text-white'
                  : 'bg-white text-gray-600 hover:bg-gray-100'
              }`}
            >
              {f.charAt(0).toUpperCase() + f.slice(1)} ({statusCounts[f]})
            </button>
          ))}
        </div>

        {/* Listings */}
        {filteredListings.length === 0 ? (
          <div className="card p-12 text-center">
            <Package className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              {filter === 'all' ? 'No listings yet' : `No ${filter} listings`}
            </h3>
            <p className="text-gray-500 mb-6">
              {filter === 'all'
                ? "Start selling by creating your first listing."
                : `You don't have any ${filter} listings.`}
            </p>
            {filter === 'all' && (
              <Link href="/listings/new" className="btn-primary">
                Create Listing
              </Link>
            )}
          </div>
        ) : (
          <div className="card divide-y divide-gray-100">
            {filteredListings.map((listing) => (
              <div key={listing.id} className="p-4 flex items-center gap-4">
                {/* Image */}
                <div className="w-20 h-20 bg-gray-100 rounded-lg flex-shrink-0 overflow-hidden">
                  {listing.images?.[0] ? (
                    <img src={listing.images[0].url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400 text-xs">
                      No image
                    </div>
                  )}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <Link href={`/listings/${listing.id}`} className="font-medium text-gray-900 hover:text-primary-600 truncate">
                      {listing.title}
                    </Link>
                    <span className={`badge ${statusColors[listing.status] || 'bg-gray-100 text-gray-700'}`}>
                      {listing.status}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 mt-1">
                    {listing.deviceModel} · {listing.condition}
                  </p>
                  <div className="flex items-center gap-4 mt-2 text-sm text-gray-500">
                    <span className="font-semibold text-gray-900">${listing.price.toLocaleString()}</span>
                    <span className="flex items-center gap-1">
                      <Eye className="w-4 h-4" />
                      {listing.views} views
                    </span>
                    <span>Listed {new Date(listing.createdAt).toLocaleDateString()}</span>
                  </div>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Link
                    href={`/listings/${listing.id}/edit`}
                    className="p-2 hover:bg-gray-100 rounded-lg"
                    title="Edit"
                  >
                    <Edit2 className="w-5 h-5 text-gray-400" />
                  </Link>
                  <button
                    onClick={() => deleteListing(listing.id)}
                    className="p-2 hover:bg-red-50 rounded-lg"
                    title="Delete"
                  >
                    <Trash2 className="w-5 h-5 text-red-400" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
