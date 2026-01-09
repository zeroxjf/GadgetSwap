'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import {
  Filter,
  Grid,
  List,
  X,
  Search,
  Loader2
} from 'lucide-react'
import { ListingCard } from '@/components/listings/ListingCard'
import { SearchFilters } from '@/components/search/SearchFilters'
import { getDeviceTypeLabel, getConditionLabel, getJailbreakStatusLabel } from '@/lib/device-data'

const sortOptions = [
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'price_asc', label: 'Price: Low to High' },
  { value: 'price_desc', label: 'Price: High to Low' },
  { value: 'popular', label: 'Most Popular' },
]

function SearchContent() {
  const searchParams = useSearchParams()
  const [showFilters, setShowFilters] = useState(false)
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [sortBy, setSortBy] = useState('newest')
  const [listings, setListings] = useState<any[]>([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)

  // Get filters from URL
  const query = searchParams.get('q') || ''
  const deviceType = searchParams.get('deviceType') || ''
  const osVersion = searchParams.get('osVersion') || ''
  const jailbreakStatus = searchParams.get('jailbreakStatus') || ''
  const condition = searchParams.get('condition') || ''
  const priceMin = searchParams.get('priceMin') || ''
  const priceMax = searchParams.get('priceMax') || ''

  // Fetch listings from API
  useEffect(() => {
    const fetchListings = async () => {
      setLoading(true)
      try {
        const params = new URLSearchParams()
        if (query) params.set('q', query)
        if (deviceType) params.set('deviceType', deviceType)
        if (osVersion) params.set('osVersion', osVersion)
        if (jailbreakStatus) params.set('jailbreakStatus', jailbreakStatus)
        if (condition) params.set('condition', condition)
        if (priceMin) params.set('priceMin', priceMin)
        if (priceMax) params.set('priceMax', priceMax)
        params.set('sortBy', sortBy)

        const response = await fetch(`/api/listings?${params.toString()}`)
        const data = await response.json()

        if (response.ok) {
          setListings(data.listings || [])
          setTotal(data.total || 0)
        }
      } catch (error) {
        console.error('Error fetching listings:', error)
      } finally {
        setLoading(false)
      }
    }

    fetchListings()
  }, [query, deviceType, osVersion, jailbreakStatus, condition, priceMin, priceMax, sortBy])

  // Active filters for display
  const activeFilters = [
    deviceType && { key: 'deviceType', label: `Type: ${getDeviceTypeLabel(deviceType)}` },
    osVersion && { key: 'osVersion', label: `iOS: ${osVersion}` },
    jailbreakStatus && { key: 'jailbreakStatus', label: getJailbreakStatusLabel(jailbreakStatus) },
    condition && { key: 'condition', label: `Condition: ${getConditionLabel(condition)}` },
    (priceMin || priceMax) && { key: 'price', label: `$${priceMin || '0'} - $${priceMax || '∞'}` },
  ].filter(Boolean)

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Search header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-[108px] z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
            {/* Results count */}
            <div>
              <h1 className="text-xl font-semibold text-gray-900 dark:text-white">
                {query ? `Results for "${query}"` : 'All Listings'}
              </h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {loading ? 'Searching...' : `${total} devices found`}
              </p>
            </div>

            {/* Controls */}
            <div className="flex items-center gap-3 w-full sm:w-auto">
              {/* Filter toggle (mobile) */}
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="btn-secondary flex items-center gap-2 lg:hidden"
              >
                <Filter className="w-4 h-4" />
                Filters
                {activeFilters.length > 0 && (
                  <span className="bg-primary-600 text-white text-xs rounded-full w-5 h-5 flex items-center justify-center">
                    {activeFilters.length}
                  </span>
                )}
              </button>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="input py-2 pr-8 min-w-[160px]"
              >
                {sortOptions.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.label}
                  </option>
                ))}
              </select>

              {/* View mode */}
              <div className="hidden sm:flex items-center border border-gray-300 dark:border-gray-600 rounded-lg overflow-hidden">
                <button
                  onClick={() => setViewMode('grid')}
                  className={`p-2 ${viewMode === 'grid' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <Grid className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
                <button
                  onClick={() => setViewMode('list')}
                  className={`p-2 ${viewMode === 'list' ? 'bg-gray-100 dark:bg-gray-700' : 'hover:bg-gray-50 dark:hover:bg-gray-700'}`}
                >
                  <List className="w-4 h-4 text-gray-600 dark:text-gray-300" />
                </button>
              </div>
            </div>
          </div>

          {/* Active filters */}
          {activeFilters.length > 0 && (
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <span className="text-sm text-gray-500 dark:text-gray-400">Active filters:</span>
              {activeFilters.map((filter: any) => (
                <span
                  key={filter.key}
                  className="inline-flex items-center gap-1 px-2 py-1 bg-primary-100 dark:bg-primary-900/30 text-primary-700 dark:text-primary-300 rounded-full text-sm"
                >
                  {filter.label}
                  <button className="hover:bg-primary-200 dark:hover:bg-primary-800 rounded-full p-0.5">
                    <X className="w-3 h-3" />
                  </button>
                </span>
              ))}
              <button className="text-sm text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 underline">
                Clear all
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="flex gap-6">
          {/* Sidebar filters (desktop) */}
          <aside className="hidden lg:block w-64 flex-shrink-0">
            <div className="sticky top-[200px]">
              <SearchFilters />
            </div>
          </aside>

          {/* Mobile filters drawer */}
          {showFilters && (
            <div className="fixed inset-0 z-50 lg:hidden">
              <div className="absolute inset-0 bg-black/50" onClick={() => setShowFilters(false)} />
              <div className="absolute right-0 top-0 bottom-0 w-80 bg-white dark:bg-gray-800 overflow-y-auto">
                <div className="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                  <h2 className="font-semibold text-gray-900 dark:text-white">Filters</h2>
                  <button onClick={() => setShowFilters(false)}>
                    <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
                  </button>
                </div>
                <div className="p-4">
                  <SearchFilters />
                </div>
              </div>
            </div>
          )}

          {/* Results grid */}
          <div className="flex-1">
            {loading ? (
              <div className="flex items-center justify-center py-16">
                <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
              </div>
            ) : listings.length > 0 ? (
              <div className={`grid gap-4 ${
                viewMode === 'grid'
                  ? 'grid-cols-1 sm:grid-cols-2 xl:grid-cols-3'
                  : 'grid-cols-1'
              }`}>
                {listings.map((listing) => (
                  <ListingCard key={listing.id} listing={listing} />
                ))}
              </div>
            ) : (
              <div className="text-center py-16">
                <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 dark:text-white mb-2">No listings found</h3>
                <p className="text-gray-500 dark:text-gray-400 mb-4">
                  {query || activeFilters.length > 0
                    ? 'Try adjusting your filters or search terms'
                    : 'Be the first to list a device!'
                  }
                </p>
                {(query || activeFilters.length > 0) && (
                  <a href="/search" className="btn-primary">Clear Filters</a>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function SearchPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    }>
      <SearchContent />
    </Suspense>
  )
}
