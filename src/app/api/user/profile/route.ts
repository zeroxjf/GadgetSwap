import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/profile
 * Get current user's profile data
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        location: true,
        createdAt: true,
        subscriptionTier: true,
        totalSales: true,
        totalPurchases: true,
        rating: true,
        ratingCount: true,
        stripeAccountId: true,
        stripeOnboardingComplete: true,
        onboardingComplete: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Get profile error:', error)
    return NextResponse.json({ error: 'Failed to get profile' }, { status: 500 })
  }
}

/**
 * PUT /api/user/profile
 * Update current user's profile
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, username, bio, location, image } = body

    // Validate username if provided
    if (username !== undefined) {
      // Check username format
      if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
        return NextResponse.json({
          error: 'Username must be 3-20 characters and contain only letters, numbers, and underscores',
        }, { status: 400 })
      }

      // Check if username is taken (by another user)
      if (username) {
        const existingUser = await prisma.user.findFirst({
          where: {
            username,
            NOT: { id: session.user.id },
          },
        })

        if (existingUser) {
          return NextResponse.json({ error: 'Username is already taken' }, { status: 400 })
        }
      }
    }

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (username !== undefined) updateData.username = username || null
    if (bio !== undefined) updateData.bio = bio || null
    if (location !== undefined) updateData.location = location || null
    if (image !== undefined) updateData.image = image || null

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        username: true,
        image: true,
        bio: true,
        location: true,
      },
    })

    return NextResponse.json({ user, message: 'Profile updated successfully' })
  } catch (error) {
    console.error('Update profile error:', error)
    return NextResponse.json({ error: 'Failed to update profile' }, { status: 500 })
  }
}
