import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/messages/unread-count
 * Get total unread message count for current user
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ count: 0 })
    }

    const count = await prisma.message.count({
      where: {
        receiverId: session.user.id,
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
