'use client'

import { useState, useEffect } from 'react'
import { X, Rocket, PartyPopper } from 'lucide-react'
import Link from 'next/link'

export function WelcomeBanner() {
  const [isVisible, setIsVisible] = useState(false)
  const [isDismissed, setIsDismissed] = useState(false)

  useEffect(() => {
    // Check if user has dismissed the banner before
    const dismissed = localStorage.getItem('welcomeBannerDismissed')
    if (!dismissed) {
      setIsVisible(true)
    }
  }, [])

  const handleDismiss = () => {
    setIsDismissed(true)
    localStorage.setItem('welcomeBannerDismissed', 'true')
    // Animate out then hide
    setTimeout(() => setIsVisible(false), 300)
  }

  if (!isVisible) return null

  return (
    <div
      className={`relative bg-gradient-to-r from-primary-600 via-accent-600 to-primary-600 text-white transition-all duration-300 ${
        isDismissed ? 'opacity-0 -translate-y-full' : 'opacity-100'
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 py-4 sm:py-5">
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 text-center sm:text-left">
          <div className="flex items-center gap-2">
            <Rocket className="w-5 h-5 flex-shrink-0" />
            <span className="font-semibold">We just launched!</span>
          </div>

          <div className="text-sm sm:text-base text-white/90">
            <span className="hidden sm:inline">Yes, it looks like a ghost town in here. </span>
            <span className="sm:hidden">Empty? That's because </span>
            you're early - like, making-history early.
            <PartyPopper className="w-4 h-4 inline ml-1 -mt-0.5" />
          </div>

          <Link
            href="/listings/new"
            className="inline-flex items-center gap-2 bg-white text-primary-700 px-4 py-1.5 rounded-full text-sm font-medium hover:bg-white/90 transition-colors whitespace-nowrap"
          >
            Create the first listing
          </Link>
        </div>

        <button
          onClick={handleDismiss}
          className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-white/70 hover:text-white hover:bg-white/10 rounded-full transition-colors"
          aria-label="Dismiss banner"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  )
}
