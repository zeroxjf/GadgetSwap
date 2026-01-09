import Link from 'next/link'
import {
  Smartphone,
  Tablet,
  Laptop,
  Watch,
  Shield,
  TrendingUp,
  Search,
  Zap,
  ArrowRight,
  Star,
  CheckCircle,
  Bell
} from 'lucide-react'
import { ListingCard } from '@/components/listings/ListingCard'
import { JailbreakSearch } from '@/components/search/JailbreakSearch'
import { prisma } from '@/lib/prisma'

// Fetch real listings from database
async function getFeaturedListings() {
  try {
    const listings = await prisma.listing.findMany({
      where: {
        status: 'ACTIVE',
      },
      include: {
        images: {
          orderBy: { order: 'asc' },
          take: 1,
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            rating: true,
            totalSales: true,
          },
        },
      },
      orderBy: [
        { featured: 'desc' },
        { createdAt: 'desc' },
      ],
      take: 8,
    })
    // Convert Decimal fields to numbers for JSON serialization
    return listings.map(listing => ({
      ...listing,
      price: Number(listing.price),
      seller: {
        ...listing.seller,
        rating: Number(listing.seller.rating),
      },
    }))
  } catch (error) {
    console.error('Failed to fetch listings:', error)
    return []
  }
}

// Get listing counts by device type
async function getListingCounts() {
  try {
    const counts = await prisma.listing.groupBy({
      by: ['deviceType'],
      where: { status: 'ACTIVE' },
      _count: { id: true },
    })
    return counts.reduce((acc, item) => {
      acc[item.deviceType] = item._count.id
      return acc
    }, {} as Record<string, number>)
  } catch (error) {
    return {}
  }
}

const categoryConfig = [
  { name: 'iPhones', icon: Smartphone, href: '/search?deviceType=IPHONE', deviceType: 'IPHONE' },
  { name: 'iPads', icon: Tablet, href: '/search?deviceType=IPAD', deviceType: 'IPAD' },
  { name: 'MacBooks', icon: Laptop, href: '/search?deviceType=MACBOOK', deviceType: 'MACBOOK' },
  { name: 'Apple Watch', icon: Watch, href: '/search?deviceType=APPLE_WATCH', deviceType: 'APPLE_WATCH' },
]

const features = [
  {
    icon: Shield,
    title: 'Buyer Protection',
    description: 'Every purchase protected by Stripe. Full refund if item doesn\'t match description.',
  },
  {
    icon: Bell,
    title: 'Device Alerts',
    description: 'Get notified instantly when someone lists a device matching your exact specs and iOS version.',
  },
  {
    icon: Search,
    title: 'iOS Version Search',
    description: 'Find devices with specific iOS versions for jailbreaking or downgrading.',
  },
  {
    icon: Zap,
    title: 'Industry-Low 4% Fee',
    description: 'Save up to 70% on fees vs eBay. Keep more of your sale. Go Plus/Pro for 0%.',
  },
]

// Competitor fee data - total fees sellers pay
// GadgetSwap: 1% platform + ~3% Stripe = ~4% total
// Swappa: 3% platform + 3.5% PayPal = 6.5% total
// eBay: 13.25% (includes payment processing)
const competitorFees = [
  { name: 'eBay', fee: 13.25, color: 'bg-red-500' },
  { name: 'Mercari', fee: 10, color: 'bg-orange-500' },
  { name: 'Swappa', fee: 6.5, note: '3% + 3.5% PayPal', color: 'bg-gray-500' },
  { name: 'GadgetSwap', fee: 4, note: '1% + ~3% Stripe', color: 'bg-green-500', highlight: true },
]

export default async function HomePage() {
  const [listings, counts] = await Promise.all([
    getFeaturedListings(),
    getListingCounts(),
  ])

  // Build categories with real counts
  const categories = categoryConfig.map(cat => ({
    ...cat,
    count: counts[cat.deviceType] || 0,
  }))

  return (
    <div className="min-h-screen">
      {/* Hero Section */}
      <section className="bg-gradient-to-br from-primary-600 via-primary-700 to-accent-600 text-white py-16 md:py-24">
        <div className="max-w-7xl mx-auto px-4">
          {/* Alert Feature Callout Banner */}
          <div className="flex justify-center mb-8">
            <Link
              href="/alerts"
              className="inline-flex items-center gap-3 bg-white/15 backdrop-blur-sm border border-white/30 rounded-full px-5 py-2.5 hover:bg-white/25 transition-colors group"
            >
              <span className="flex items-center justify-center w-8 h-8 bg-yellow-400 rounded-full">
                <Bell className="w-4 h-4 text-yellow-900" />
              </span>
              <span className="text-white font-medium">
                New: Set alerts for specific iOS versions & specs — get notified instantly
              </span>
              <ArrowRight className="w-4 h-4 text-white/70 group-hover:translate-x-1 transition-transform" />
            </Link>
          </div>

          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <h1 className="text-4xl md:text-5xl font-bold mb-6">
                The Marketplace for
                <span className="text-primary-200"> iOS Enthusiasts</span>
              </h1>
              <p className="text-lg text-primary-100 mb-8">
                Buy and sell Apple devices with confidence. Search by iOS version,
                find jailbreakable devices, and <span className="text-white font-medium">get alerts when your exact specs are listed</span> — all with
                the lowest fees in the industry.
              </p>
              <div className="flex flex-col sm:flex-row gap-4">
                <Link
                  href="/search"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 px-6 py-3 font-semibold"
                >
                  Browse Devices
                </Link>
                <Link
                  href="/alerts"
                  className="btn bg-yellow-400 text-yellow-900 hover:bg-yellow-300 px-6 py-3 font-semibold flex items-center gap-2"
                >
                  <Bell className="w-4 h-4" />
                  Set Up Alerts
                </Link>
              </div>

              {/* Trust badges */}
              <div className="flex flex-wrap items-center gap-4 md:gap-6 mt-8 text-sm text-primary-200">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-yellow-400" />
                  <span>Instant Alerts</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>Stripe Protected</span>
                </div>
                <div className="flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  <span>4% Low Fees</span>
                </div>
              </div>
            </div>

            {/* Quick iOS Search */}
            <div className="bg-white/10 backdrop-blur-sm rounded-2xl p-6 border border-white/20">
              <h2 className="text-xl font-semibold mb-4">Find by iOS Version</h2>
              <JailbreakSearch />
              <div className="mt-4 pt-4 border-t border-white/20">
                <Link
                  href="/alerts"
                  className="flex items-center justify-between text-sm text-primary-200 hover:text-white transition-colors"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="w-4 h-4 text-yellow-400" />
                    Can't find what you need? Set up an alert
                  </span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Categories */}
      <section className="py-12 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {categories.map((category) => (
              <Link
                key={category.name}
                href={category.href}
                className="card p-6 hover:shadow-md transition-shadow group"
              >
                <category.icon className="w-8 h-8 text-primary-600 mb-3 group-hover:scale-110 transition-transform" />
                <h3 className="font-semibold text-gray-900">{category.name}</h3>
                <p className="text-sm text-gray-500">{category.count.toLocaleString()} listings</p>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Featured Listings */}
      <section className="py-12 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Featured Listings</h2>
              <p className="text-gray-600">Hand-picked deals from verified sellers</p>
            </div>
            <Link
              href="/search?featured=true"
              className="text-primary-600 hover:text-primary-700 font-medium flex items-center gap-1"
            >
              View all <ArrowRight className="w-4 h-4" />
            </Link>
          </div>

          {listings.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ListingCard key={listing.id} listing={listing as any} />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 bg-white rounded-xl border border-gray-200">
              <p className="text-gray-500 mb-4">No listings yet. Be the first to list your device!</p>
              <Link href="/listings/new" className="btn-primary">
                Create Listing
              </Link>
            </div>
          )}
        </div>
      </section>

      {/* Jailbreak-Focused Section */}
      <section className="py-12 bg-gradient-to-r from-accent-600 to-purple-600 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-8">
            <h2 className="text-3xl font-bold mb-4">Built for the Jailbreak Community</h2>
            <p className="text-lg text-purple-100 max-w-2xl mx-auto">
              Unlike other marketplaces, we understand what jailbreakers need.
              Search by iOS version, find checkm8-compatible devices, and know
              exactly what you're getting.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-6 mb-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="font-semibold text-lg mb-2">iOS Version Search</h3>
              <p className="text-purple-100 text-sm mb-4">
                Find devices on specific iOS versions. Perfect for targeting
                jailbreak-compatible firmware.
              </p>
              <Link href="/search" className="text-white hover:underline text-sm font-medium">
                Search by iOS →
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="font-semibold text-lg mb-2">Jailbreak Status</h3>
              <p className="text-purple-100 text-sm mb-4">
                Every listing shows jailbreak status, tool used, and bootrom
                exploit availability.
              </p>
              <Link href="/search?jailbreakStatus=JAILBREAKABLE" className="text-white hover:underline text-sm font-medium">
                Find Jailbreakable →
              </Link>
            </div>

            <div className="bg-white/10 backdrop-blur-sm rounded-xl p-6 border border-white/20">
              <h3 className="font-semibold text-lg mb-2">Compatibility Checker</h3>
              <p className="text-purple-100 text-sm mb-4">
                Our database knows which iOS versions work with which jailbreak
                tools. No more guessing.
              </p>
              <Link href="/tools/jailbreak-checker" className="text-white hover:underline text-sm font-medium">
                Check Compatibility →
              </Link>
            </div>
          </div>

          {/* Fair Pricing for Jailbreakable Devices */}
          <div className="bg-white/15 backdrop-blur-sm rounded-2xl p-6 border border-white/30 max-w-3xl mx-auto">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 bg-green-400 rounded-xl flex items-center justify-center flex-shrink-0">
                <TrendingUp className="w-6 h-6 text-green-900" />
              </div>
              <div>
                <h3 className="font-bold text-lg mb-2">Fair Jailbreak Pricing: Up to 1.5x Market Value</h3>
                <p className="text-purple-100 text-sm mb-3">
                  We know devices on jailbreakable iOS versions are worth more — they're rare and in high demand.
                  That's why sellers can list jailbreakable iPhones at up to <span className="text-white font-semibold">1.5x the standard market value</span>.
                </p>
                <p className="text-purple-200 text-sm">
                  But we also believe in keeping things accessible. This cap prevents extreme price gouging
                  while still rewarding sellers for preserving valuable firmware. Fair for everyone.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Device Alerts Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-primary-100 text-primary-700 px-3 py-1 rounded-full text-sm font-medium mb-4">
                <Bell className="w-4 h-4" />
                Never Miss a Deal
              </div>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Device Alerts for Exact Specs
              </h2>
              <p className="text-gray-600 mb-6">
                Looking for an iPhone 14 Pro on iOS 16.1.2? Set up an alert and get
                notified instantly when someone lists exactly what you're looking for.
                No more constantly refreshing the search page.
              </p>
              <ul className="space-y-3 mb-6">
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Filter by device type, model, and storage</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Target specific iOS versions or ranges</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Set jailbreak status requirements</span>
                </li>
                <li className="flex items-start gap-3">
                  <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                  <span className="text-gray-700">Define your price range</span>
                </li>
              </ul>
              <div className="flex flex-wrap gap-4">
                <Link href="/alerts" className="btn-primary">
                  Set Up Alerts
                </Link>
                <div className="text-sm text-gray-500 flex items-center">
                  <span className="font-medium text-gray-700">Free:</span>&nbsp;1 alert&nbsp;
                  <span className="text-gray-400">|</span>&nbsp;
                  <span className="font-medium text-gray-700">Plus:</span>&nbsp;3 alerts&nbsp;
                  <span className="text-gray-400">|</span>&nbsp;
                  <span className="font-medium text-primary-600">Pro:</span>&nbsp;Unlimited
                </div>
              </div>
            </div>
            <div className="bg-gray-50 rounded-2xl p-6 border border-gray-200">
              <div className="text-sm font-medium text-gray-500 mb-4">Example Alert</div>
              <div className="space-y-4">
                <div className="bg-white rounded-lg p-4 border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">iPhone 14 Pro - iOS 16.x</span>
                    <span className="bg-green-100 text-green-700 text-xs px-2 py-1 rounded-full">Active</span>
                  </div>
                  <div className="flex flex-wrap gap-2 text-xs">
                    <span className="bg-gray-100 px-2 py-1 rounded">iOS 16.0 - 16.1.2</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">256GB+</span>
                    <span className="bg-gray-100 px-2 py-1 rounded">Under $900</span>
                    <span className="bg-purple-100 text-purple-700 px-2 py-1 rounded">Jailbreakable</span>
                  </div>
                </div>
                <div className="bg-primary-50 rounded-lg p-4 border border-primary-200">
                  <div className="flex items-center gap-2 text-primary-700 text-sm font-medium mb-2">
                    <Bell className="w-4 h-4" />
                    New Match Found!
                  </div>
                  <p className="text-sm text-gray-600">
                    iPhone 14 Pro 256GB on iOS 16.1.2 just listed for $849
                  </p>
                  <Link href="#" className="text-primary-600 text-sm font-medium hover:underline mt-2 inline-block">
                    View Listing →
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-gray-900 mb-4">Why GadgetSwap?</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">
              We built the marketplace we wished existed. Lower fees, better
              search, and features designed for Apple enthusiasts.
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature) => (
              <div key={feature.title} className="text-center">
                <div className="w-12 h-12 bg-white rounded-xl flex items-center justify-center mx-auto mb-4 shadow-sm">
                  <feature.icon className="w-6 h-6 text-primary-600" />
                </div>
                <h3 className="font-semibold text-gray-900 mb-2">{feature.title}</h3>
                <p className="text-sm text-gray-600">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee Comparison - Major Section */}
      <section className="py-16 bg-gradient-to-b from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-12">
            <span className="inline-block bg-green-500 text-white text-sm font-bold px-4 py-1 rounded-full mb-4">
              LOWER FEES THAN SWAPPA & EBAY
            </span>
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Keep More Money From Every Sale
            </h2>
            <p className="text-gray-400 text-lg max-w-2xl mx-auto">
              We charge just 1% platform fee + ~3% Stripe = ~4% total.
              That's 33% less than Swappa and 70% less than eBay.
            </p>
          </div>

          {/* Main competitor comparison - Swappa & eBay focus */}
          <div className="max-w-4xl mx-auto mb-12">
            <div className="grid md:grid-cols-3 gap-6">
              {/* eBay */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-red-400 mb-2">eBay</h3>
                  <div className="text-5xl font-bold text-red-400 mb-2">13.25%</div>
                  <p className="text-sm text-gray-400 mb-1">Final value fee</p>
                  <p className="text-sm text-gray-500 mb-4">(includes payment processing)</p>
                  <div className="bg-red-900/30 rounded-lg p-3 text-sm">
                    <p className="text-gray-300">On $800 sale:</p>
                    <p className="text-red-400 font-bold text-lg">-$106 in fees</p>
                    <p className="text-gray-500">You keep: $694</p>
                  </div>
                </div>
              </div>

              {/* Swappa */}
              <div className="bg-gray-800 rounded-2xl p-6 border border-gray-700">
                <div className="text-center">
                  <h3 className="text-xl font-bold text-gray-300 mb-2">Swappa</h3>
                  <div className="text-5xl font-bold text-gray-300 mb-2">~6%</div>
                  <p className="text-sm text-gray-400 mb-1">3% platform fee</p>
                  <p className="text-sm text-gray-500 mb-4">+ ~3% Stripe</p>
                  <div className="bg-gray-700/50 rounded-lg p-3 text-sm">
                    <p className="text-gray-300">On $800 sale:</p>
                    <p className="text-gray-300 font-bold text-lg">-$48 in fees</p>
                    <p className="text-gray-500">You keep: $752</p>
                  </div>
                </div>
              </div>

              {/* GadgetSwap */}
              <div className="bg-gradient-to-b from-green-900/50 to-green-900/30 rounded-2xl p-6 border-2 border-green-500 relative">
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-green-500 text-white text-xs font-bold px-3 py-1 rounded-full">
                  LOWEST FEES
                </div>
                <div className="text-center">
                  <h3 className="text-xl font-bold text-green-400 mb-2">GadgetSwap</h3>
                  <div className="text-5xl font-bold text-green-400 mb-2">~4%</div>
                  <p className="text-sm text-green-300 mb-1">1% platform fee</p>
                  <p className="text-sm text-gray-400 mb-4">+ ~3% Stripe</p>
                  <div className="bg-green-900/50 rounded-lg p-3 text-sm">
                    <p className="text-gray-300">On $800 sale:</p>
                    <p className="text-green-400 font-bold text-lg">-$32 in fees</p>
                    <p className="text-white font-medium">You keep: $768</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Savings highlight */}
          <div className="max-w-3xl mx-auto">
            <div className="bg-green-900/30 rounded-2xl p-6 border border-green-700">
              <div className="grid md:grid-cols-2 gap-6 text-center">
                <div>
                  <p className="text-gray-400 mb-1">Save vs Swappa</p>
                  <p className="text-3xl font-bold text-green-400">$16</p>
                  <p className="text-sm text-gray-500">per $800 sale</p>
                </div>
                <div>
                  <p className="text-gray-400 mb-1">Save vs eBay</p>
                  <p className="text-3xl font-bold text-green-400">$74</p>
                  <p className="text-sm text-gray-500">per $800 sale</p>
                </div>
              </div>
              <p className="text-center text-gray-400 mt-4 text-sm">
                Sell 10 devices a month? That's <span className="text-green-400 font-bold">$160+ more</span> in your pocket vs Swappa.
              </p>
            </div>
          </div>

          {/* Visual bar comparison */}
          <div className="max-w-3xl mx-auto mt-12">
            <h3 className="text-center text-lg font-semibold mb-6 text-gray-300">Total Seller Fees Comparison</h3>
            <div className="space-y-3">
              {competitorFees.map((competitor) => (
                <div key={competitor.name} className="flex items-center gap-4">
                  <div className={`w-28 text-right text-sm ${competitor.highlight ? 'text-white font-bold' : 'text-gray-400'}`}>
                    {competitor.name}
                  </div>
                  <div className="flex-1 bg-gray-700 rounded-full h-8 overflow-hidden">
                    <div
                      className={`h-full ${competitor.color} flex items-center justify-end pr-3 transition-all`}
                      style={{ width: `${(competitor.fee / 15) * 100}%` }}
                    >
                      <span className="font-bold text-sm text-white">
                        {competitor.fee}%
                      </span>
                    </div>
                  </div>
                  {competitor.highlight && (
                    <span className="text-green-400 font-bold text-xs w-20">BEST</span>
                  )}
                  {!competitor.highlight && (
                    <span className="w-20"></span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Pro upsell */}
          <div className="text-center mt-12">
            <div className="inline-block bg-gray-800 rounded-2xl p-6 border border-gray-700">
              <p className="text-gray-300 mb-2">Power sellers: Go Pro for</p>
              <p className="text-4xl font-bold text-green-400 mb-2">0% fees</p>
              <p className="text-gray-400 text-sm mb-4">Unlimited listings, premium features</p>
              <Link href="/subscription" className="btn bg-green-500 text-white hover:bg-green-600 px-8 py-3 font-semibold">
                See Pro Plans →
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-gray-900 text-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">Ready to Start Trading?</h2>
          <p className="text-gray-400 mb-8 text-lg">
            Join thousands of Apple enthusiasts buying and selling on GadgetSwap.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/auth/signup" className="btn-primary px-8 py-3 text-lg">
              Create Free Account
            </Link>
            <Link href="/search" className="btn-outline border-gray-600 text-white hover:bg-gray-800 px-8 py-3 text-lg">
              Browse Listings
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}
