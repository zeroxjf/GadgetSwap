import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/watchlist
 * Get user's watchlist
 */
export async function GET() {
  try {
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
                rating: true,
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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const { listingId } = await request.json()

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
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
