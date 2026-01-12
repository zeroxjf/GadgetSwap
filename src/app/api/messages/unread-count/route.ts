import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/messages/unread-count
 * Get total unread message count for current user
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.message.count({
      where: {
        receiverId: auth.user.id,
        read: false,
        blocked: false,
      },
    })

    return NextResponse.json({ count })
  } catch (error) {
    console.error('Get unread count error:', error)
    return NextResponse.json({ count: 0 })
  }
}
