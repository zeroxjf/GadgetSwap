'use client'

import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'

/**
 * Dynamic Smart App Banner that passes current URL for deep linking
 * Maps web routes to iOS app deep link format: gadgetswap://[host]/[path]
 */
export function SmartAppBanner() {
  const pathname = usePathname()
  const [appArgument, setAppArgument] = useState<string | null>(null)

  useEffect(() => {
    // Map web routes to iOS app deep link format
    // App expects: gadgetswap://[type]/[id]

    // Listing detail: /listings/[id] -> gadgetswap://listing/[id]
    const listingMatch = pathname.match(/^\/listings\/([^/]+)$/)
    if (listingMatch && !pathname.includes('/edit')) {
      setAppArgument(`gadgetswap://listing/${listingMatch[1]}`)
      return
    }

    // Order detail: /orders/[id] -> gadgetswap://order/[id]
    const orderMatch = pathname.match(/^\/orders\/([^/]+)$/)
    if (orderMatch) {
      setAppArgument(`gadgetswap://order/${orderMatch[1]}`)
      return
    }

    // Search page -> gadgetswap://search
    if (pathname === '/search') {
      setAppArgument('gadgetswap://search')
      return
    }

    // Messages -> gadgetswap://messages
    if (pathname === '/messages') {
      setAppArgument('gadgetswap://messages')
      return
    }

    // Alerts -> gadgetswap://alerts
    if (pathname.startsWith('/alerts')) {
      setAppArgument('gadgetswap://alerts')
      return
    }

    // Account pages -> gadgetswap://account
    if (pathname.startsWith('/account')) {
      setAppArgument('gadgetswap://account')
      return
    }

    // Notifications -> gadgetswap://notifications
    if (pathname === '/notifications') {
      setAppArgument('gadgetswap://notifications')
      return
    }

    // Watchlist -> gadgetswap://watchlist
    if (pathname === '/watchlist') {
      setAppArgument('gadgetswap://watchlist')
      return
    }

    // Subscription -> gadgetswap://subscription
    if (pathname.startsWith('/subscription')) {
      setAppArgument('gadgetswap://subscription')
      return
    }

    // Create listing -> gadgetswap://create
    if (pathname === '/listings/new') {
      setAppArgument('gadgetswap://create')
      return
    }

    // For other routes, no deep link (app opens to home)
    setAppArgument(null)
  }, [pathname])

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
