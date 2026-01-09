'use client'

import { useState } from 'react'
import { Shield, CheckCircle, Bell, X, Fingerprint, Clock } from 'lucide-react'

const imeiContent = {
  title: 'IMEI Verification',
  icon: Fingerprint,
  description: `Every iPhone and cellular iPad listing requires IMEI verification. We confirm the device is real, matches the model listed, and detect duplicate listings.`,
  bullets: [
    'Device authenticity verified against Apple database',
    'Model mismatch detection prevents false listings',
    'Privacy-preserving: full IMEI never stored',
  ],
}

const escrowContent = {
  title: '24-Hour Escrow Protection',
  icon: Clock,
  description: `Your payment is held securely until 24 hours after delivery. This gives you time to inspect the device and raise any concerns directly with GadgetSwap for fast resolution.`,
  bullets: [
    'Funds held until delivery + 24 hour inspection window',
    'Report issues within 24 hours for fast refunds (days, not months)',
    'After 24 hours, bank disputes required (2-3 month process)',
    'Always inspect your device immediately upon delivery',
  ],
  critical: true,
}

export function TrustBadges() {
  const [expanded, setExpanded] = useState<'imei' | 'escrow' | null>(null)

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-primary-200">
        <button
          onClick={() => setExpanded(expanded === 'imei' ? null : 'imei')}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <Shield className="w-4 h-4 text-green-400" />
          <span className="underline underline-offset-2">IMEI Verified</span>
        </button>
        <button
          onClick={() => setExpanded(expanded === 'escrow' ? null : 'escrow')}
          className="flex items-center gap-2 hover:text-white transition-colors"
        >
          <CheckCircle className="w-4 h-4 text-green-400" />
          <span className="underline underline-offset-2">24h Escrow</span>
        </button>
        <div className="flex items-center gap-2">
          <Bell className="w-4 h-4 text-yellow-400" />
          <span>Instant Alerts</span>
        </div>
      </div>

      {/* Expandable Info Bubble */}
      {expanded && (
        <div className="absolute top-full left-0 mt-3 z-50 w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${
              expanded === 'escrow' ? 'bg-yellow-50 dark:bg-yellow-900/30' : 'bg-green-50 dark:bg-green-900/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  expanded === 'escrow'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-green-100 dark:bg-green-900'
                }`}>
                  {expanded === 'imei' ? (
                    <Fingerprint className="w-5 h-5 text-green-600 dark:text-green-400" />
                  ) : (
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {expanded === 'imei' ? imeiContent.title : escrowContent.title}
                </h3>
              </div>
              <button
                onClick={() => setExpanded(null)}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full transition-colors"
              >
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            {/* Content */}
            <div className="px-5 py-4">
              {expanded === 'escrow' && (
                <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg px-4 py-3 mb-4">
                  <p className="text-sm font-semibold text-yellow-800 dark:text-yellow-200">
                    IMPORTANT: Inspect your device within 24 hours of delivery for fast, easy refunds!
                  </p>
                </div>
              )}

              <p className="text-gray-600 dark:text-gray-300 text-sm mb-4">
                {expanded === 'imei' ? imeiContent.description : escrowContent.description}
              </p>

              <ul className="space-y-2">
                {(expanded === 'imei' ? imeiContent.bullets : escrowContent.bullets).map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      expanded === 'escrow' ? 'text-yellow-500' : 'text-green-500'
                    }`} />
                    <span>{bullet}</span>
                  </li>
                ))}
              </ul>

              {expanded === 'escrow' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Learn more about disputes: {' '}
                    <a
                      href="https://support.stripe.com/topics/disputes"
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary-600 hover:underline"
                    >
                      Stripe Support
                    </a>
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
