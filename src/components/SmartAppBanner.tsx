'use client'

import { usePathname, useSearchParams } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Dynamic Smart App Banner that passes current URL for deep linking
 * Maps web routes to iOS app screens where applicable
 */
export function SmartAppBanner() {
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const [appArgument, setAppArgument] = useState<string | null>(null)

  useEffect(() => {
    // Build the full URL path with query params
    const query = searchParams.toString()
    const fullPath = query ? `${pathname}?${query}` : pathname

    // Map web routes to app-supported deep links
    // Only include routes that exist in the iOS app
    const supportedRoutes = [
      '/listings/',      // Listing detail: /listings/[id]
      '/search',         // Search page
      '/messages',       // Messages
      '/notifications',  // Notifications
      '/watchlist',      // Watchlist
      '/account',        // Account settings
      '/orders/',        // Order detail: /orders/[id]
      '/profile',        // User profile
      '/subscription',   // Subscription page
      '/alerts',         // Price alerts
    ]

    const isSupported = supportedRoutes.some(route => pathname.startsWith(route))

    if (isSupported) {
      // Pass the path as app-argument for deep linking
      setAppArgument(`gadgetswap:/${fullPath}`)
    } else {
      // For unsupported routes, just open the app to home
      setAppArgument(null)
    }
  }, [pathname, searchParams])

  return (
    <meta
      name="apple-itunes-app"
      content={appArgument
        ? `app-id=6757683814, app-argument=${appArgument}`
        : 'app-id=6757683814'
      }
    />
  )
}
