import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isModeratorOrAdmin } from '@/lib/admin'

/**
 * GET /api/admin/reviews
 * Get listings pending review (admin/moderator only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Check admin/moderator role
    if (!(await isModeratorOrAdmin())) {
      return NextResponse.json(
        { error: 'Forbidden' },
        { status: 403 }
      )
    }

    const searchParams = request.nextUrl.searchParams

    // Filters
    const status = searchParams.get('status') || 'PENDING_REVIEW'
    const flaggedOnly = searchParams.get('flagged') === 'true'
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Build where clause
    const where: any = {
      reviewStatus: status,
    }

    if (flaggedOnly) {
      where.flaggedForReview = true
    }

    // Fetch listings
    const [listings, total, stats] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: {
            orderBy: { order: 'asc' },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
              username: true,
              image: true,
              rating: true,
              totalSales: true,
              createdAt: true,
            },
          },
        },
        orderBy: [
          { flaggedForReview: 'desc' }, // Flagged items first
          { createdAt: 'asc' }, // FIFO - oldest first
        ],
        take: limit,
        skip: offset,
      }),
      prisma.listing.count({ where }),
      // Get stats for dashboard
      Promise.all([
        prisma.listing.count({ where: { reviewStatus: 'PENDING_REVIEW' } }),
        prisma.listing.count({
          where: { reviewStatus: 'PENDING_REVIEW', flaggedForReview: true },
        }),
        prisma.listing.count({
          where: {
            reviewStatus: 'APPROVED',
            reviewedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            },
          },
        }),
        prisma.listing.count({
          where: {
            reviewStatus: 'REJECTED',
            reviewedAt: {
              gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24h
            },
          },
        }),
      ]),
    ])

    const [pendingCount, flaggedCount, approvedToday, rejectedToday] = stats

    return NextResponse.json({
      listings: listings.map((listing) => ({
        ...listing,
        price: Number(listing.price),
        seller: {
          ...listing.seller,
          rating: Number(listing.seller.rating),
        },
      })),
      total,
      hasMore: offset + listings.length < total,
      stats: {
        pending: pendingCount,
        flagged: flaggedCount,
        approvedToday,
        rejectedToday,
      },
    })
  } catch (error) {
    console.error('Admin reviews error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch review queue' },
      { status: 500 }
    )
  }
}
