'use client'

import { useState, useEffect } from 'react'
import { useSession } from 'next-auth/react'
import Link from 'next/link'
import {
  TrendingUp,
  Search,
  BarChart3,
  Info,
  ExternalLink,
  Check,
  X,
  Loader2,
  Lock,
  Crown,
  Zap
} from 'lucide-react'
import {
  checkJailbreakCompatibility as checkJB,
  getSupportedDevices,
  JailbreakResult
} from '@/lib/jailbreak-compatibility'
import { useSubscriptionTier } from '@/hooks/useSubscriptionTier'

// Jailbreak tools reference data (this is static reference data, not mock data)
const jailbreakTools = [
  {
    name: 'NathanLR',
    type: 'Semi-Untethered',
    iosMin: '16.5.1',
    iosMax: '17.0',
    devices: ['A12+'],
    url: 'https://github.com/NathanLR/NathanLR',
    notes: 'iOS 17.0 only (17.0.1+ patched)',
  },
  {
    name: 'Dopamine',
    type: 'Semi-Untethered',
    iosMin: '15.0',
    iosMax: '16.6.1',
    devices: ['A8-A14: 15.0-16.6.1', 'A15-A16: 15.0-16.5'],
    url: 'https://ellekit.space/dopamine/',
  },
  {
    name: 'palera1n',
    type: 'Semi-Tethered',
    iosMin: '15.0',
    iosMax: '17.x',
    devices: ['A8-A11 (checkm8)'],
    url: 'https://palera.in/',
  },
  {
    name: 'unc0ver',
    type: 'Semi-Untethered',
    iosMin: '11.0',
    iosMax: '14.8',
    devices: ['A8-A14'],
    url: 'https://unc0ver.dev/',
  },
  {
    name: 'Taurine',
    type: 'Semi-Untethered',
    iosMin: '14.0',
    iosMax: '14.8.1',
    devices: ['A8-A14'],
    url: 'https://taurine.app/',
  },
  {
    name: 'checkra1n',
    type: 'Semi-Tethered',
    iosMin: '12.0',
    iosMax: '14.8.1',
    devices: ['A5-A11 (checkm8)'],
    url: 'https://checkra.in/',
  },
]

const deviceModels = getSupportedDevices().filter(d => d.startsWith('iPhone') || d.startsWith('iPad'))

interface MarketStats {
  totalListings: number
  jailbreakableCount: number
  avgPrice: number
}

function ProUpsellOverlay() {
  return (
    <div className="fixed inset-0 z-20 flex items-center justify-center bg-black/20">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 max-w-md mx-4 text-center">
        <div className="w-16 h-16 bg-gradient-to-br from-primary-500 to-accent-500 rounded-full flex items-center justify-center mx-auto mb-6">
          <Crown className="w-8 h-8 text-white" />
        </div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-3">
          Pro Feature
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          Market Insights is exclusively available for Pro members. Get detailed analytics, price trends, and market data to make smarter buying and selling decisions.
        </p>

        <div className="space-y-3 text-left mb-6">
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Real-time market analytics & price trends</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>Jailbreak compatibility checker</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>iOS version demand insights</span>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <Check className="w-5 h-5 text-green-500 flex-shrink-0" />
            <span>0% seller fees (vs 4% standard)</span>
          </div>
        </div>

        <Link
          href="/subscription"
          className="btn bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:from-primary-700 hover:to-accent-700 w-full justify-center py-3 font-semibold"
        >
          <Zap className="w-4 h-4 mr-2" />
          Upgrade to Pro - $12/mo
        </Link>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-3">
          Cancel anytime.
        </p>
      </div>
    </div>
  )
}

function MarketInsightsContent({ isPro }: { isPro: boolean }) {
  const [iosVersion, setIosVersion] = useState('')
  const [deviceModel, setDeviceModel] = useState('')
  const [checkerResult, setCheckerResult] = useState<JailbreakResult | null>(null)
  const [stats, setStats] = useState<MarketStats | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMarketStats()
  }, [])

  const fetchMarketStats = async () => {
    try {
      const response = await fetch('/api/listings?limit=1')
      const data = await response.json()

      // Calculate basic stats from available data
      setStats({
        totalListings: data.total || 0,
        jailbreakableCount: 0, // Would need separate query
        avgPrice: 0,
      })
    } catch (error) {
      console.error('Error fetching stats:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCheckJailbreak = () => {
    if (!iosVersion || !deviceModel) return
    const result = checkJB(deviceModel, iosVersion)
    setCheckerResult(result)
  }

  return (
    <div className={`min-h-screen bg-gray-50 dark:bg-gray-900 ${!isPro ? 'select-none' : ''}`}>
      {/* Hero */}
      <section className="bg-gradient-to-br from-gray-900 to-gray-800 text-white py-12">
        <div className="max-w-7xl mx-auto px-4">
          <h1 className="text-3xl md:text-4xl font-bold mb-4">Market Insights</h1>
          <p className="text-gray-300 max-w-2xl">
            Jailbreak compatibility information and market data to help you make
            informed buying and selling decisions.
          </p>
        </div>
      </section>

      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main content */}
          <div className="lg:col-span-2 space-y-8">
            {/* Jailbreak Compatibility Checker */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold dark:text-white">Jailbreak Compatibility Checker</h2>
                <span className="badge bg-purple-100 text-purple-800">Popular</span>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Select your device and iOS version to check jailbreak compatibility.
              </p>

              <div className="grid sm:grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="label mb-1 block">Device Model</label>
                  <select
                    value={deviceModel}
                    onChange={(e) => {
                      setDeviceModel(e.target.value)
                      setCheckerResult(null)
                    }}
                    className="input"
                    disabled={!isPro}
                  >
                    <option value="">Select device</option>
                    {deviceModels.map((model) => (
                      <option key={model} value={model}>{model}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="label mb-1 block">iOS Version</label>
                  <input
                    type="text"
                    value={iosVersion}
                    onChange={(e) => {
                      setIosVersion(e.target.value)
                      setCheckerResult(null)
                    }}
                    placeholder="e.g., 16.1.2"
                    className="input"
                    disabled={!isPro}
                  />
                </div>
              </div>

              <button
                onClick={handleCheckJailbreak}
                disabled={!iosVersion || !deviceModel || !isPro}
                className="btn-primary px-6 disabled:opacity-50"
              >
                Check Compatibility
              </button>

              {/* Results */}
              {checkerResult && (
                <div className={`mt-4 rounded-lg p-4 ${
                  checkerResult.canJailbreak
                    ? 'bg-green-50 border border-green-200'
                    : 'bg-red-50 border border-red-200'
                }`}>
                  <div className="flex items-center gap-2 mb-3">
                    {checkerResult.canJailbreak ? (
                      <Check className="w-5 h-5 text-green-600" />
                    ) : (
                      <X className="w-5 h-5 text-red-600" />
                    )}
                    <span className={`font-medium ${
                      checkerResult.canJailbreak ? 'text-green-800' : 'text-red-800'
                    }`}>
                      {deviceModel} on iOS {iosVersion} is{' '}
                      {checkerResult.canJailbreak ? 'jailbreakable' : 'not currently jailbreakable'}
                    </span>
                  </div>

                  {checkerResult.hasBootromExploit && (
                    <p className="text-sm text-amber-700 bg-amber-50 px-3 py-1 rounded-full inline-block mb-3">
                      checkm8 compatible device
                    </p>
                  )}

                  {checkerResult.canJailbreak && checkerResult.tools.length > 0 && (
                    <div className="space-y-2">
                      <p className="text-sm text-gray-600 mb-2">Compatible tools:</p>
                      {checkerResult.tools.map((tool) => (
                        <div
                          key={tool.name}
                          className="flex items-center justify-between bg-white rounded-lg p-3"
                        >
                          <div>
                            <p className="font-medium">{tool.name}</p>
                            <p className="text-xs text-gray-500">{tool.type}</p>
                            {tool.notes && (
                              <p className="text-xs text-amber-600">{tool.notes}</p>
                            )}
                          </div>
                          {tool.website && (
                            <a
                              href={tool.website}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-primary-600 hover:text-primary-700 text-sm flex items-center gap-1"
                            >
                              Learn more <ExternalLink className="w-3 h-3" />
                            </a>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {!checkerResult.canJailbreak && (
                    <p className="text-sm text-gray-600">
                      No public jailbreak tools are currently available for this device/iOS combination.
                      Check back later or consider devices on lower firmware.
                    </p>
                  )}
                </div>
              )}
            </div>

            {/* Market Data - Shows empty state */}
            <div className="card p-6">
              <h2 className="text-xl font-bold mb-4 dark:text-white">Market Data</h2>

              {loading ? (
                <div className="flex items-center justify-center py-8">
                  <Loader2 className="w-6 h-6 text-primary-600 animate-spin" />
                </div>
              ) : stats && stats.totalListings > 0 ? (
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">{stats.totalListings}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Active Listings</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-purple-600">{stats.jailbreakableCount}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Jailbreakable</p>
                  </div>
                  <div className="text-center p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <p className="text-2xl font-bold text-gray-900 dark:text-white">
                      {stats.avgPrice > 0 ? `$${stats.avgPrice}` : '-'}
                    </p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">Avg Price</p>
                  </div>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500 dark:text-gray-400">
                  <BarChart3 className="w-12 h-12 mx-auto mb-4 text-gray-300" />
                  <p className="font-medium">No market data yet</p>
                  <p className="text-sm mt-1">
                    Market insights will appear as listings are added to the platform
                  </p>
                  <Link href="/listings/new" className="btn-primary mt-4 inline-block">
                    Create First Listing
                  </Link>
                </div>
              )}
            </div>

            {/* iOS Version Guide */}
            <div className="card p-6">
              <div className="flex items-center gap-2 mb-4">
                <h2 className="text-xl font-bold dark:text-white">iOS Version Guide</h2>
                <div className="relative group">
                  <Info className="w-4 h-4 text-gray-400 cursor-help" />
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all whitespace-nowrap z-10">
                    Devices on jailbreak-compatible iOS often sell for more
                  </div>
                </div>
              </div>
              <p className="text-gray-600 dark:text-gray-400 mb-4">
                Some iOS versions are more desirable due to jailbreak compatibility.
              </p>

              <div className="space-y-3">
                <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">iOS 17.0</span>
                      <span className="ml-2 badge bg-blue-100 text-blue-800">Very Rare</span>
                    </div>
                    <span className="text-sm text-blue-700">NathanLR (A12+)</span>
                  </div>
                </div>
                <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">iOS 15.0 - 16.6.1</span>
                      <span className="ml-2 badge bg-green-100 text-green-800">High Demand</span>
                    </div>
                    <span className="text-sm text-green-700">Dopamine, NathanLR</span>
                  </div>
                </div>
                <div className="p-3 bg-amber-50 rounded-lg border border-amber-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">iOS 14.0 - 14.8.1</span>
                      <span className="ml-2 badge bg-amber-100 text-amber-800">Good Demand</span>
                    </div>
                    <span className="text-sm text-amber-700">unc0ver, Taurine</span>
                  </div>
                </div>
                <div className="p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="font-mono font-medium">checkm8 devices</span>
                      <span className="ml-2 badge bg-purple-100 text-purple-800">Any iOS</span>
                    </div>
                    <span className="text-sm text-purple-700">palera1n (iPhone X and older)</span>
                  </div>
                </div>
              </div>

              <Link
                href="/search?jailbreakStatus=JAILBREAKABLE"
                className="mt-4 text-primary-600 hover:text-primary-700 text-sm font-medium inline-flex items-center gap-1"
              >
                Browse jailbreakable devices
              </Link>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Jailbreak Tools Reference */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 dark:text-white">Jailbreak Tools</h3>
              <div className="space-y-3">
                {jailbreakTools.map((tool) => (
                  <a
                    key={tool.name}
                    href={tool.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="block p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-medium dark:text-white">{tool.name}</span>
                      <ExternalLink className="w-3 h-3 text-gray-400" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      iOS {tool.iosMin} - {tool.iosMax} | {tool.type}
                    </p>
                  </a>
                ))}
              </div>
            </div>

            {/* Quick Links */}
            <div className="card p-6">
              <h3 className="font-semibold mb-4 dark:text-white">Resources</h3>
              <div className="space-y-2">
                <a
                  href="https://ios.cfw.guide"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <span className="text-sm dark:text-gray-300">iOS CFW Guide</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
                <a
                  href="https://reddit.com/r/jailbreak"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <span className="text-sm dark:text-gray-300">r/jailbreak</span>
                  <ExternalLink className="w-3 h-3 text-gray-400" />
                </a>
                <Link
                  href="/tools/jailbreak-checker"
                  className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600"
                >
                  <span className="text-sm dark:text-gray-300">Full Compatibility Checker</span>
                  <span className="text-xs text-primary-600">View</span>
                </Link>
              </div>
            </div>

            {/* Pro CTA - only show if not Pro */}
            {!isPro && (
              <div className="card p-6 bg-gradient-to-br from-primary-600 to-accent-600 text-white">
                <h3 className="font-semibold mb-2">Unlock Full Analytics</h3>
                <p className="text-sm text-primary-100 mb-4">
                  Pro members get detailed price history, alerts, and advanced market data.
                </p>
                <Link
                  href="/subscription"
                  className="btn bg-white text-primary-700 hover:bg-primary-50 w-full justify-center"
                >
                  Upgrade to Pro
                </Link>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function MarketInsightsPage() {
  const { data: session, status } = useSession()
  const { tier, mounted } = useSubscriptionTier()
  const isPro = tier === 'PRO'

  if (status === 'loading' || !mounted) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    )
  }

  return (
    <div className="relative">
      {/* Blurred content layer for non-Pro users */}
      <div className={!isPro ? 'blur-sm pointer-events-none' : ''}>
        <MarketInsightsContent isPro={isPro} />
      </div>

      {/* Overlay for non-Pro users */}
      {!isPro && <ProUpsellOverlay />}
    </div>
  )
}
