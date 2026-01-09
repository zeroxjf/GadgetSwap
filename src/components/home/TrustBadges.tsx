'use client'

import { useState } from 'react'
import { Shield, CheckCircle, Bell, X, Fingerprint, Clock, ArrowUp } from 'lucide-react'
import Link from 'next/link'

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

const alertsContent = {
  title: 'Instant Alerts',
  icon: Bell,
  description: `Never miss a device with your exact specs. Set alerts for specific iOS versions, storage sizes, colors, and more — get notified the moment a matching device is listed.`,
  bullets: [
    'Filter by iOS version, jailbreak status, storage & color',
    'Email or push notifications within minutes',
    'Save multiple alert profiles for different searches',
    'Perfect for finding rare jailbreakable devices',
  ],
}

export function TrustBadges() {
  const [expanded, setExpanded] = useState<'imei' | 'escrow' | 'alerts' | null>(null)

  const getContent = () => {
    if (expanded === 'imei') return imeiContent
    if (expanded === 'escrow') return escrowContent
    if (expanded === 'alerts') return alertsContent
    return null
  }

  const content = getContent()

  return (
    <div className="relative">
      <div className="flex flex-wrap items-center gap-4 md:gap-6 text-sm text-primary-200">
        {/* IMEI Verified */}
        <div className="relative">
          <button
            onClick={() => setExpanded(expanded === 'imei' ? null : 'imei')}
            className="flex items-center gap-2 hover:text-white transition-colors group"
          >
            <Shield className="w-4 h-4 text-blue-400" />
            <span className="underline underline-offset-2">IMEI Verified</span>
          </button>
          <ArrowUp className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 text-blue-400 animate-bounce" />
        </div>

        {/* 24h Escrow */}
        <div className="relative">
          <button
            onClick={() => setExpanded(expanded === 'escrow' ? null : 'escrow')}
            className="flex items-center gap-2 hover:text-white transition-colors group"
          >
            <CheckCircle className="w-4 h-4 text-green-400" />
            <span className="underline underline-offset-2">24h Escrow</span>
          </button>
          <ArrowUp className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 text-green-400 animate-bounce [animation-delay:150ms]" />
        </div>

        {/* Instant Alerts */}
        <div className="relative">
          <button
            onClick={() => setExpanded(expanded === 'alerts' ? null : 'alerts')}
            className="flex items-center gap-2 hover:text-white transition-colors group"
          >
            <Bell className="w-4 h-4 text-yellow-400" />
            <span className="underline underline-offset-2">Instant Alerts</span>
          </button>
          <ArrowUp className="absolute -top-5 left-1/2 -translate-x-1/2 w-4 h-4 text-yellow-400 animate-bounce [animation-delay:300ms]" />
        </div>
      </div>

      {/* Expandable Info Bubble */}
      {expanded && content && (
        <div className="absolute top-full left-0 mt-8 z-50 w-full max-w-md animate-in fade-in slide-in-from-top-2 duration-200">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 overflow-hidden">
            {/* Header */}
            <div className={`px-5 py-4 flex items-center justify-between ${
              expanded === 'escrow'
                ? 'bg-yellow-50 dark:bg-yellow-900/30'
                : expanded === 'alerts'
                ? 'bg-yellow-50 dark:bg-yellow-900/30'
                : 'bg-blue-50 dark:bg-blue-900/30'
            }`}>
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                  expanded === 'escrow' || expanded === 'alerts'
                    ? 'bg-yellow-100 dark:bg-yellow-900'
                    : 'bg-blue-100 dark:bg-blue-900'
                }`}>
                  {expanded === 'imei' && (
                    <Fingerprint className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                  )}
                  {expanded === 'escrow' && (
                    <Clock className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                  {expanded === 'alerts' && (
                    <Bell className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
                  )}
                </div>
                <h3 className="font-semibold text-gray-900 dark:text-white">
                  {content.title}
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
                {content.description}
              </p>

              <ul className="space-y-2">
                {content.bullets.map((bullet, idx) => (
                  <li key={idx} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-300">
                    <CheckCircle className={`w-4 h-4 flex-shrink-0 mt-0.5 ${
                      expanded === 'escrow' || expanded === 'alerts' ? 'text-yellow-500' : 'text-blue-500'
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

              {expanded === 'alerts' && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <Link
                    href="/alerts/new"
                    className="inline-flex items-center gap-2 bg-yellow-400 text-yellow-900 px-4 py-2 rounded-lg text-sm font-semibold hover:bg-yellow-300 transition-colors"
                  >
                    <Bell className="w-4 h-4" />
                    Set Up Your First Alert
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
