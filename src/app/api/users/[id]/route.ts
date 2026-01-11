import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/users/[id]
 * Get public profile for any user by ID
 * This endpoint is public and returns only public user information
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    if (!id) {
      return NextResponse.json({ error: 'User ID is required' }, { status: 400 })
    }

    const user = await prisma.user.findUnique({
      where: { id },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        createdAt: true,
        rating: true,
        ratingCount: true,
        totalSales: true,
        // Include active listings count
        _count: {
          select: {
            listings: {
              where: {
                status: 'ACTIVE',
                reviewStatus: 'APPROVED',
              },
            },
            receivedReviews: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Format the response
    const publicProfile = {
      id: user.id,
      name: user.name,
      username: user.username,
      image: user.image,
      bio: user.bio,
      location: user.location,
      createdAt: user.createdAt,
      rating: user.rating,
      ratingCount: user.ratingCount,
      totalSales: user.totalSales,
      activeListings: user._count.listings,
      totalReviews: user._count.receivedReviews,
    }

    return NextResponse.json(publicProfile)
  } catch (error) {
    console.error('Get user profile error:', error)
    return NextResponse.json({ error: 'Failed to get user profile' }, { status: 500 })
  }
}
