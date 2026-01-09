import Link from 'next/link'
import { TrendingUp, Shield, Zap, CheckCircle, AlertTriangle, ArrowRight } from 'lucide-react'

export default function JailbreakPricingPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-12">
      <div className="max-w-3xl mx-auto px-4">
        {/* Breadcrumb */}
        <div className="mb-8">
          <Link href="/help" className="text-gray-500 hover:text-gray-700 text-sm">
            ← Back to Help Center
          </Link>
        </div>

        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-purple-100 rounded-2xl mb-4">
            <TrendingUp className="w-8 h-8 text-purple-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Jailbreak Pricing Premium
          </h1>
          <p className="text-lg text-gray-600 max-w-xl mx-auto">
            How we balance fair value for sellers with accessible prices for buyers
          </p>
        </div>

        {/* Main content */}
        <div className="space-y-8">
          {/* The 1.5x Rule */}
          <section className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              The 1.5x Rule
            </h2>
            <p className="text-gray-600 mb-4">
              Devices on jailbreakable iOS versions can be listed at up to <strong>1.5x the standard market value</strong>.
              This means if a regular iPhone 14 Pro 256GB is worth $800 on TechFare, a jailbreakable version
              can be listed for up to $1,200.
            </p>
            <div className="bg-purple-50 rounded-lg p-4 border border-purple-200">
              <div className="grid grid-cols-2 gap-4 text-center">
                <div>
                  <p className="text-sm text-gray-500 mb-1">Regular Device</p>
                  <p className="text-2xl font-bold text-gray-900">$800</p>
                  <p className="text-xs text-gray-400">max price = market value</p>
                </div>
                <div>
                  <p className="text-sm text-purple-600 mb-1">Jailbreakable Device</p>
                  <p className="text-2xl font-bold text-purple-700">$1,200</p>
                  <p className="text-xs text-purple-500">max price = 1.5x market value</p>
                </div>
              </div>
            </div>
          </section>

          {/* Why This Exists */}
          <section className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">Why We Have This System</h2>

            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Rewards Sellers for Preserving Firmware</h3>
                  <p className="text-sm text-gray-600">
                    Keeping a device on a jailbreakable iOS version requires effort — resisting updates,
                    being careful with settings. Sellers deserve extra compensation for this.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <CheckCircle className="w-5 h-5 text-green-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Recognizes Genuine Scarcity</h3>
                  <p className="text-sm text-gray-600">
                    Devices on older, jailbreakable iOS versions are genuinely rare. Apple stops signing
                    older firmware, making these devices valuable to enthusiasts.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Prevents Extreme Price Gouging</h3>
                  <p className="text-sm text-gray-600">
                    Without a cap, sellers could charge 3x, 5x, or even 10x market value. The 1.5x limit
                    keeps prices reasonable while still recognizing the premium.
                  </p>
                </div>
              </div>

              <div className="flex items-start gap-3">
                <Shield className="w-5 h-5 text-blue-500 flex-shrink-0 mt-1" />
                <div>
                  <h3 className="font-medium text-gray-900">Keeps Devices Accessible</h3>
                  <p className="text-sm text-gray-600">
                    We want the jailbreak community to thrive. That means devices need to be obtainable
                    by regular enthusiasts, not just those with deep pockets.
                  </p>
                </div>
              </div>
            </div>
          </section>

          {/* How It Works */}
          <section className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">How It Works</h2>

            <ol className="space-y-4">
              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">1</span>
                <div>
                  <h3 className="font-medium text-gray-900">We fetch market value from TechFare</h3>
                  <p className="text-sm text-gray-600">
                    When you create a listing, we automatically look up your device's current market value
                    based on model and storage capacity.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">2</span>
                <div>
                  <h3 className="font-medium text-gray-900">We check if the device is jailbreakable</h3>
                  <p className="text-sm text-gray-600">
                    If you select "Jailbreakable" or "Currently Jailbroken" as the status, you unlock
                    the premium pricing tier.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">3</span>
                <div>
                  <h3 className="font-medium text-gray-900">We calculate your max price</h3>
                  <p className="text-sm text-gray-600">
                    Regular devices: max = market value. Jailbreakable devices: max = market value × 1.5.
                    You can price anywhere below this limit.
                  </p>
                </div>
              </li>

              <li className="flex items-start gap-3">
                <span className="w-6 h-6 rounded-full bg-primary-100 text-primary-700 flex items-center justify-center text-sm font-bold flex-shrink-0">4</span>
                <div>
                  <h3 className="font-medium text-gray-900">Validation happens in real-time</h3>
                  <p className="text-sm text-gray-600">
                    As you set your price, we show you the max allowed and validate instantly. If your
                    price is too high, you'll know immediately.
                  </p>
                </div>
              </li>
            </ol>
          </section>

          {/* What Qualifies */}
          <section className="card p-8">
            <h2 className="text-xl font-bold text-gray-900 mb-4">What Qualifies for the Premium?</h2>

            <div className="grid md:grid-cols-2 gap-4">
              <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                <h3 className="font-medium text-green-800 mb-2 flex items-center gap-2">
                  <CheckCircle className="w-4 h-4" />
                  Qualifies (1.5x allowed)
                </h3>
                <ul className="text-sm text-green-700 space-y-1">
                  <li>• Jailbreakable status</li>
                  <li>• Currently Jailbroken</li>
                  <li>• Rootless Jailbreak</li>
                  <li>• Rootful Jailbreak</li>
                </ul>
              </div>

              <div className="bg-gray-50 rounded-lg p-4 border border-gray-200">
                <h3 className="font-medium text-gray-700 mb-2 flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4" />
                  Standard Pricing (1x max)
                </h3>
                <ul className="text-sm text-gray-600 space-y-1">
                  <li>• Not Jailbroken</li>
                  <li>• Unknown status</li>
                  <li>• Devices not supported</li>
                </ul>
              </div>
            </div>
          </section>

          {/* CTA */}
          <div className="text-center py-8">
            <p className="text-gray-600 mb-4">Ready to list your device?</p>
            <Link
              href="/listings/new"
              className="btn-primary inline-flex items-center gap-2 px-6 py-3"
            >
              Create a Listing
              <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
