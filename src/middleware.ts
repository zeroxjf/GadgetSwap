import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const host = request.headers.get('host') || ''

  // Redirect www to non-www for consistent cookies
  if (host.startsWith('www.')) {
    const newHost = host.replace('www.', '')
    const url = request.nextUrl.clone()
    url.host = newHost
    return NextResponse.redirect(url, 301)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    // Match all paths except static files and api routes that need www support
    '/((?!_next/static|_next/image|favicon.ico).*)',
  ],
}
