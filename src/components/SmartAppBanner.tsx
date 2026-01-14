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
    if (listingMatch) {
      setAppArgument(`gadgetswap://listing/${listingMatch[1]}`)
      return
    }

    // Order detail: /orders/[id] -> gadgetswap://order/[id]
    const orderMatch = pathname.match(/^\/orders\/([^/]+)$/)
    if (orderMatch) {
      setAppArgument(`gadgetswap://order/${orderMatch[1]}`)
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
