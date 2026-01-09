'use client'

import { useState, Suspense } from 'react'
import { useSession } from 'next-auth/react'
import { useRouter, useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { Check, X, Zap, Crown, Star, ArrowRight, Loader2 } from 'lucide-react'

const plans = [
  {
    name: 'Free',
    tier: 'FREE',
    price: 0,
    yearlyPrice: 0,
    description: 'Already 30% cheaper than Swappa',
    feeHighlight: '~4%',
    feeSavings: 'Save $16 per $800 sale vs Swappa',
    features: [
      { name: 'Up to 3 active listings', included: true },
      { name: '~4% total (1% + ~3% Stripe)', included: true, highlight: true },
      { name: '1 device alert', included: true },
      { name: 'Basic search filters', included: true },
      { name: 'Standard support', included: true },
      { name: 'Featured listings', included: false },
      { name: 'Advanced analytics', included: false },
      { name: 'Priority support', included: false },
      { name: 'Bulk listing tools', included: false },
    ],
    cta: 'Current Plan',
    highlighted: false,
  },
  {
    name: 'Plus',
    tier: 'PLUS',
    price: 9.99,
    yearlyPrice: 99,
    description: '0% platform fee - just Stripe',
    feeHighlight: '~3%',
    feeSavings: 'Save $24 per $800 sale vs Swappa',
    features: [
      { name: 'Up to 15 active listings', included: true },
      { name: '0% platform fee (only ~3% Stripe)', included: true, highlight: true },
      { name: '3 device alerts', included: true },
      { name: 'Advanced search filters', included: true },
      { name: 'Priority support', included: true },
      { name: '2 featured listings/month', included: true },
      { name: 'Basic analytics', included: true },
      { name: 'Bulk listing tools', included: false },
      { name: 'API access', included: false },
    ],
    cta: 'Upgrade to Plus',
    highlighted: false,
  },
  {
    name: 'Pro',
    tier: 'PRO',
    price: 29.99,
    yearlyPrice: 299,
    description: '100% cheaper - ZERO platform fees',
    feeHighlight: '0%',
    feeSavings: 'Save $48 per $800 sale vs Swappa',
    features: [
      { name: 'Unlimited active listings', included: true },
      { name: '0% platform fee (only ~3% Stripe)', included: true, highlight: true },
      { name: 'Unlimited device alerts', included: true },
      { name: 'All search filters', included: true },
      { name: 'Priority 24/7 support', included: true },
      { name: '10 featured listings/month', included: true },
      { name: 'Advanced analytics dashboard', included: true },
      { name: 'Bulk listing tools', included: true },
      { name: 'API access', included: true },
    ],
    cta: 'Go Pro',
    highlighted: true,
    badge: '0% PLATFORM FEE',
  },
]

const faqs = [
  {
    question: 'What are device alerts?',
    answer: 'Device alerts let you set specific criteria (device type, iOS version, price range, jailbreak status, etc.) and get notified instantly via email when a matching listing is posted. Perfect for finding rare iOS versions or specific configurations. Free users get 1 alert, Plus gets 3, and Pro gets unlimited.',
  },
  {
    question: 'Can I cancel my subscription anytime?',
    answer: 'Yes, you can cancel your subscription at any time. Your benefits will continue until the end of your billing period.',
  },
  {
    question: 'How does the 0% platform fee work?',
    answer: 'Plus and Pro members pay no GadgetSwap platform fee on sales. You only pay Stripe\'s processing fee (~3%). Compare that to Swappa where you\'d pay 3% + 3.5% PayPal = 6.5% total. Paid members save over $28 per $800 sale vs Swappa.',
  },
  {
    question: 'What happens to my listings if I downgrade?',
    answer: 'If you exceed your new plan\'s listing limit, your oldest listings will be paused (not deleted). You can reactivate them by upgrading again or manually removing some listings.',
  },
  {
    question: 'Do you offer refunds?',
    answer: 'We offer a 14-day money-back guarantee for new subscribers. If you\'re not satisfied, contact support for a full refund.',
  },
  {
    question: 'What payment methods do you accept?',
    answer: 'We accept all major credit cards for subscription payments, processed securely via Stripe.',
  },
  {
    question: 'What is the jailbreak pricing premium?',
    answer: 'Devices on jailbreakable iOS versions can be listed at up to 1.5x the standard market value (based on TechFare pricing). This recognizes the extra value of rare firmware while keeping prices accessible. Regular devices are capped at market value to prevent overpricing.',
  },
]

function SubscriptionContent() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const searchParams = useSearchParams()
  const canceled = searchParams.get('canceled')

  const [billingPeriod, setBillingPeriod] = useState<'monthly' | 'yearly'>('monthly')
  const [loadingTier, setLoadingTier] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const userTier = (session?.user as any)?.subscriptionTier || 'FREE'

  const handleUpgrade = async (tier: string) => {
    if (!session) {
      router.push('/auth/signin?callbackUrl=/subscription')
      return
    }

    if (tier === 'FREE' || tier === userTier) return

    setLoadingTier(tier)
    setError(null)

    try {
      const res = await fetch('/api/subscription/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tier, billingPeriod }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout session')
      }

      // Redirect to Stripe Checkout
      window.location.href = data.url
    } catch (err: any) {
      setError(err.message)
      setLoadingTier(null)
    }
  }

  const getButtonText = (plan: typeof plans[0]) => {
    if (loadingTier === plan.tier) {
      return <Loader2 className="w-5 h-5 animate-spin mx-auto" />
    }
    if (plan.tier === userTier) {
      return 'Current Plan'
    }
    if (plan.tier === 'FREE') {
      return 'Free Forever'
    }
    return plan.cta
  }

  const isButtonDisabled = (plan: typeof plans[0]) => {
    return plan.tier === 'FREE' || plan.tier === userTier || loadingTier !== null
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Canceled notice */}
      {canceled && (
        <div className="bg-yellow-50 border-b border-yellow-200 py-3">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-yellow-800">
            Checkout was canceled. You can try again whenever you're ready.
          </div>
        </div>
      )}

      {/* Error notice */}
      {error && (
        <div className="bg-red-50 border-b border-red-200 py-3">
          <div className="max-w-7xl mx-auto px-4 text-center text-sm text-red-800">
            {error}
          </div>
        </div>
      )}

      {/* Hero */}
      <section className="bg-gradient-to-br from-green-600 via-emerald-600 to-teal-600 text-white py-16">
        <div className="max-w-7xl mx-auto px-4 text-center">
          <div className="inline-flex items-center gap-3 bg-white/20 backdrop-blur px-4 py-2 rounded-full mb-6">
            <span className="text-green-200">Total seller fees:</span>
            <span className="line-through text-green-300">Swappa 6.5%</span>
            <span className="line-through text-green-300">eBay 13%</span>
            <span className="font-bold text-white bg-white/20 px-2 py-0.5 rounded">GadgetSwap ~4%</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Pay Less Than Swappa & eBay
          </h1>
          <p className="text-xl text-green-100 max-w-2xl mx-auto mb-6">
            We charge <span className="font-bold text-white">1% platform + ~3% Stripe = ~4% total</span>.<br/>
            Swappa charges 3% + 3.5% PayPal = <span className="line-through">6.5% total</span>. Go Pro for <span className="font-bold text-white">0% platform fee</span>.
          </p>
          <div className="flex flex-wrap justify-center gap-4 text-sm">
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2 border border-yellow-400/50">
              <span className="text-yellow-300 font-medium">vs Swappa:</span>
              <span className="font-bold text-white ml-1">Save $16</span>
              <span className="text-green-200 ml-1">per $800 sale</span>
            </div>
            <div className="bg-white/10 backdrop-blur rounded-lg px-4 py-2">
              <span className="text-green-200">vs eBay:</span>
              <span className="font-bold text-white ml-1">Save $70</span>
              <span className="text-green-200 ml-1">per $800 sale</span>
            </div>
          </div>
        </div>
      </section>

      {/* Billing toggle */}
      <section className="py-8">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex justify-center">
            <div className="bg-gray-100 p-1 rounded-lg inline-flex">
              <button
                onClick={() => setBillingPeriod('monthly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'monthly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Monthly
              </button>
              <button
                onClick={() => setBillingPeriod('yearly')}
                className={`px-6 py-2 rounded-md text-sm font-medium transition-colors ${
                  billingPeriod === 'yearly'
                    ? 'bg-white text-gray-900 shadow'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Yearly
                <span className="ml-2 text-xs text-green-600 font-bold">Save 17%</span>
              </button>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing cards */}
      <section className="pb-16">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-3 gap-8">
            {plans.map((plan) => (
              <div
                key={plan.tier}
                className={`card p-8 relative ${
                  plan.highlighted
                    ? 'border-2 border-primary-500 shadow-xl scale-105'
                    : ''
                } ${plan.tier === userTier ? 'ring-2 ring-green-500' : ''}`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <span className="bg-gradient-to-r from-primary-500 to-accent-500 text-white text-sm font-medium px-4 py-1 rounded-full">
                      {plan.badge}
                    </span>
                  </div>
                )}

                {plan.tier === userTier && (
                  <div className="absolute -top-3 right-4">
                    <span className="bg-green-500 text-white text-xs font-medium px-3 py-1 rounded-full">
                      Your Plan
                    </span>
                  </div>
                )}

                <div className="text-center mb-6">
                  <h2 className="text-2xl font-bold text-gray-900">{plan.name}</h2>
                  <p className="text-gray-500 mt-1">{plan.description}</p>

                  <div className="mt-4">
                    <span className="text-4xl font-bold text-gray-900">
                      ${billingPeriod === 'monthly' ? plan.price : (plan.yearlyPrice / 12).toFixed(2)}
                    </span>
                    {plan.price > 0 && (
                      <span className="text-gray-500">/month</span>
                    )}
                  </div>

                  {plan.yearlyPrice > 0 && billingPeriod === 'yearly' && (
                    <p className="text-sm text-green-600 mt-1">
                      Billed ${plan.yearlyPrice}/year (save ${(plan.price * 12 - plan.yearlyPrice).toFixed(0)})
                    </p>
                  )}
                </div>

                <ul className="space-y-3 mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature.name} className="flex items-start gap-3">
                      {feature.included ? (
                        <Check className="w-5 h-5 text-green-500 flex-shrink-0 mt-0.5" />
                      ) : (
                        <X className="w-5 h-5 text-gray-300 flex-shrink-0 mt-0.5" />
                      )}
                      <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                        {feature.name}
                      </span>
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleUpgrade(plan.tier)}
                  disabled={isButtonDisabled(plan)}
                  className={`w-full py-3 rounded-lg font-medium transition-colors ${
                    plan.tier === userTier
                      ? 'bg-green-100 text-green-700 cursor-default'
                      : plan.highlighted
                      ? 'bg-gradient-to-r from-primary-600 to-accent-600 text-white hover:from-primary-700 hover:to-accent-700 disabled:opacity-50'
                      : plan.tier === 'FREE'
                      ? 'bg-gray-100 text-gray-500 cursor-default'
                      : 'bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-50'
                  }`}
                >
                  {getButtonText(plan)}
                </button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Fee comparison */}
      <section className="py-16 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-4">
            See How Much You Save
          </h2>
          <p className="text-gray-600 text-center mb-8">
            Compare total fees across platforms (platform fee + payment processing)
          </p>

          <div className="card overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-4 text-left text-sm font-medium text-gray-500">
                    Sale Price
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-red-500">
                    eBay (13.25%)
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-yellow-600">
                    Swappa (6.5%)
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-green-600 bg-green-50">
                    GadgetSwap Free (~4%)
                  </th>
                  <th className="px-4 py-4 text-center text-sm font-medium text-primary-600 bg-primary-50">
                    Plus/Pro (~3%)
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {[500, 800, 1000, 1500].map((price) => (
                  <tr key={price}>
                    <td className="px-4 py-4 font-medium">${price}</td>
                    <td className="px-4 py-4 text-center text-red-500">
                      ${(price * 0.1325).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center text-yellow-600">
                      ${(price * 0.065).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center text-green-600 bg-green-50">
                      ${(price * 0.04).toFixed(2)}
                    </td>
                    <td className="px-4 py-4 text-center text-primary-600 bg-primary-50 font-bold">
                      ${(price * 0.03).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="mt-4 text-sm text-gray-500 text-center space-y-1">
            <p>eBay: 13.25% final value fee (includes payment processing)</p>
            <p>Swappa: 3% platform + 3.5% PayPal = 6.5% total</p>
            <p>GadgetSwap Free: 1% platform + ~3% Stripe = ~4% | Plus/Pro: 0% platform + ~3% Stripe = ~3%</p>
          </div>
        </div>
      </section>

      {/* Pro features spotlight */}
      <section className="py-16 bg-gradient-to-br from-gray-900 to-gray-800 text-white">
        <div className="max-w-7xl mx-auto px-4">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-400 to-orange-500 text-gray-900 px-4 py-1.5 rounded-full text-sm font-medium mb-4">
                <Crown className="w-4 h-4" />
                Pro Features
              </div>
              <h2 className="text-3xl font-bold mb-4">
                Built for Power Sellers
              </h2>
              <p className="text-gray-300 mb-6">
                Pro members get access to advanced tools designed for high-volume trading.
                List faster, sell more, and keep more of your profits.
              </p>

              <ul className="space-y-4">
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Zap className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Bulk Listing Tools</h3>
                    <p className="text-sm text-gray-400">
                      Upload multiple listings at once with CSV import and batch editing
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Star className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Featured Listings</h3>
                    <p className="text-sm text-gray-400">
                      Get 10 featured listing spots per month to boost visibility
                    </p>
                  </div>
                </li>
                <li className="flex items-start gap-3">
                  <div className="w-8 h-8 bg-primary-500/20 rounded-lg flex items-center justify-center flex-shrink-0">
                    <Crown className="w-4 h-4 text-primary-400" />
                  </div>
                  <div>
                    <h3 className="font-medium">Analytics Dashboard</h3>
                    <p className="text-sm text-gray-400">
                      Track views, conversion rates, and market trends for your listings
                    </p>
                  </div>
                </li>
              </ul>

              <button
                onClick={() => handleUpgrade('PRO')}
                disabled={loadingTier !== null || userTier === 'PRO'}
                className="inline-flex items-center gap-2 mt-8 bg-gradient-to-r from-primary-500 to-accent-500 px-6 py-3 rounded-lg font-medium hover:from-primary-600 hover:to-accent-600 transition-colors disabled:opacity-50"
              >
                {loadingTier === 'PRO' ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : userTier === 'PRO' ? (
                  'You\'re on Pro!'
                ) : (
                  <>
                    Upgrade to Pro
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>
            </div>

            <div className="bg-gray-800 rounded-2xl p-6">
              <div className="text-sm text-gray-400 mb-2">Pro Analytics Preview</div>
              <div className="space-y-4">
                <div className="bg-gray-700 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm">Total Views</span>
                    <span className="text-green-400 text-sm">+23%</span>
                  </div>
                  <div className="text-2xl font-bold">12,847</div>
                  <div className="h-2 bg-gray-600 rounded-full mt-2 overflow-hidden">
                    <div className="h-full w-3/4 bg-gradient-to-r from-primary-500 to-accent-500 rounded-full" />
                  </div>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Conversion</div>
                    <div className="text-xl font-bold">8.4%</div>
                  </div>
                  <div className="bg-gray-700 rounded-lg p-4">
                    <div className="text-sm text-gray-400">Avg. Sale</div>
                    <div className="text-xl font-bold">$642</div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* FAQs */}
      <section className="py-16 bg-gray-50">
        <div className="max-w-3xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8">
            Frequently Asked Questions
          </h2>

          <div className="space-y-4">
            {faqs.map((faq, i) => (
              <div key={i} className="card p-6">
                <h3 className="font-medium text-gray-900 mb-2">{faq.question}</h3>
                <p className="text-gray-600">{faq.answer}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-16 bg-white">
        <div className="max-w-4xl mx-auto px-4 text-center">
          <h2 className="text-3xl font-bold mb-4">
            Ready to Start Saving?
          </h2>
          <p className="text-gray-600 mb-8">
            Join thousands of sellers who've upgraded to Pro and saved on fees.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => handleUpgrade('PRO')}
              disabled={loadingTier !== null || userTier === 'PRO'}
              className="btn-primary px-8 py-3 text-lg disabled:opacity-50"
            >
              {loadingTier === 'PRO' ? (
                <Loader2 className="w-5 h-5 animate-spin mx-auto" />
              ) : userTier === 'PRO' ? (
                'You\'re on Pro!'
              ) : (
                'Upgrade Now'
              )}
            </button>
            <Link href="/search" className="btn-secondary px-8 py-3 text-lg">
              Browse First
            </Link>
          </div>
        </div>
      </section>
    </div>
  )
}

export default function SubscriptionPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-primary-600 animate-spin" />
      </div>
    }>
      <SubscriptionContent />
    </Suspense>
  )
}
