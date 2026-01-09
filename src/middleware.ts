import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Redirect www to non-www for consistent cookies
  if (host.startsWith('www.gadgetswap.tech')) {
    const newUrl = `https://gadgetswap.tech${request.nextUrl.pathname}${request.nextUrl.search}`
    return NextResponse.redirect(newUrl, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Only match page routes, not API or static files
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
}
