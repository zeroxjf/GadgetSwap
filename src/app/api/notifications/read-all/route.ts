import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/notifications/read-all
 * Mark all notifications as read for the current user
 */
export async function POST() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    // Mark all unread notifications as read
    const result = await prisma.notification.updateMany({
      where: {
        userId: session.user.id,
        read: false,
      },
      data: { read: true },
    })

    return NextResponse.json({
      success: true,
      count: result.count,
      message: `Marked ${result.count} notifications as read`,
    })
  } catch (error) {
    console.error('Mark all notifications read error:', error)
    return NextResponse.json({ error: 'Failed to mark notifications as read' }, { status: 500 })
  }
}
