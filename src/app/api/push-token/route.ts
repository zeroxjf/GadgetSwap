import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/push-token
 * Register or update a push notification token for the current user
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token, platform = 'ios' } = await request.json()

    if (!token || typeof token !== 'string') {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Upsert the token - create if new, update if exists
    const pushToken = await prisma.pushToken.upsert({
      where: { token },
      update: {
        userId: session.user.id,
        platform,
        updatedAt: new Date(),
      },
      create: {
        userId: session.user.id,
        token,
        platform,
      },
    })

    return NextResponse.json({ success: true, pushToken })
  } catch (error) {
    console.error('Push token registration error:', error)
    return NextResponse.json(
      { error: 'Failed to register push token' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/push-token
 * Remove a push token (e.g., on sign out)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { token } = await request.json()

    if (!token) {
      return NextResponse.json(
        { error: 'Token is required' },
        { status: 400 }
      )
    }

    // Only delete if it belongs to the current user
    await prisma.pushToken.deleteMany({
      where: {
        token,
        userId: session.user.id,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Push token deletion error:', error)
    return NextResponse.json(
      { error: 'Failed to delete push token' },
      { status: 500 }
    )
  }
}
