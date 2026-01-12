import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isCurrentUserBanned } from '@/lib/admin'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Rate limit config: 50 requests per minute for POST, 100 for GET
const watchlistRateLimit = { limit: 50, windowMs: 60 * 1000, keyPrefix: 'watchlist' }
const watchlistGetRateLimit = { limit: 100, windowMs: 60 * 1000, keyPrefix: 'watchlist-get' }

/**
 * GET /api/watchlist
 * Get user's watchlist
 */
export async function GET(request: NextRequest) {
  try {
    // Rate limit: 100 requests per minute
    const rateCheck = checkRateLimit(request, watchlistGetRateLimit)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const watchlist = await prisma.watchlist.findMany({
      where: { userId: session.user.id },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
            seller: {
              select: {
                id: true,
                name: true,
                username: true,
                image: true,
                rating: true,
                ratingCount: true,
                totalSales: true,
              },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ watchlist })
  } catch (error) {
    console.error('Get watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch watchlist' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/watchlist
 * Add a listing to watchlist
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 50 requests per minute
    const rateCheck = checkRateLimit(request, watchlistRateLimit)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    // Check if user is banned
    if (await isCurrentUserBanned()) {
      return NextResponse.json(
        { error: 'Your account has been suspended' },
        { status: 403 }
      )
    }

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    // Verify listing exists
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      select: { id: true },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if already in watchlist
    const existing = await prisma.watchlist.findUnique({
      where: {
        userId_listingId: {
          userId: session.user.id,
          listingId,
        },
      },
    })

    if (existing) {
      return NextResponse.json(
        { error: 'Already in watchlist' },
        { status: 400 }
      )
    }

    const watchlistItem = await prisma.watchlist.create({
      data: {
        userId: session.user.id,
        listingId,
      },
    })

    return NextResponse.json({ success: true, watchlistItem })
  } catch (error) {
    console.error('Add to watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to add to watchlist' },
      { status: 500 }
    )
  }
}
