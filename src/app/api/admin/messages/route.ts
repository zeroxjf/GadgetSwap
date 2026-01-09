import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { isModeratorOrAdmin } from '@/lib/admin'

/**
 * GET /api/admin/messages
 * Get flagged messages for review
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isModeratorOrAdmin()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const status = searchParams.get('status') || 'all' // all, flagged, blocked, reviewed
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = parseInt(searchParams.get('offset') || '0')

    // Build where conditions
    const whereConditions: any = {}

    if (status === 'flagged') {
      whereConditions.flagged = true
      whereConditions.blocked = false
    } else if (status === 'blocked') {
      whereConditions.blocked = true
    } else if (status === 'pending') {
      whereConditions.flagged = true
      whereConditions.moderationFlags = {
        some: { reviewed: false },
      }
    } else if (status === 'reviewed') {
      whereConditions.flagged = true
      whereConditions.moderationFlags = {
        every: { reviewed: true },
      }
    } else {
      // 'all' - show all flagged or blocked
      whereConditions.OR = [{ flagged: true }, { blocked: true }]
    }

    // Get messages with full details
    const [messages, totalCount] = await Promise.all([
      prisma.message.findMany({
        where: whereConditions,
        include: {
          sender: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
              role: true,
              createdAt: true,
            },
          },
          receiver: {
            select: {
              id: true,
              name: true,
              username: true,
              email: true,
              image: true,
            },
          },
          listing: {
            select: {
              id: true,
              title: true,
              price: true,
            },
          },
          moderationFlags: {
            orderBy: { createdAt: 'desc' },
          },
        },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.message.count({ where: whereConditions }),
    ])

    // Get stats
    const [totalFlagged, totalBlocked, pendingReview] = await Promise.all([
      prisma.message.count({ where: { flagged: true } }),
      prisma.message.count({ where: { blocked: true } }),
      prisma.messageFlag.count({ where: { reviewed: false } }),
    ])

    return NextResponse.json({
      messages,
      pagination: {
        total: totalCount,
        limit,
        offset,
        hasMore: offset + messages.length < totalCount,
      },
      stats: {
        totalFlagged,
        totalBlocked,
        pendingReview,
      },
    })
  } catch (error) {
    console.error('Admin get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/messages
 * Mark flags as reviewed or take action on a message
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isModeratorOrAdmin()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { messageId, action, notes } = await request.json()

    if (!messageId || !action) {
      return NextResponse.json(
        { error: 'messageId and action are required' },
        { status: 400 }
      )
    }

    const message = await prisma.message.findUnique({
      where: { id: messageId },
      include: { sender: true },
    })

    if (!message) {
      return NextResponse.json({ error: 'Message not found' }, { status: 404 })
    }

    switch (action) {
      case 'mark_reviewed':
        // Mark all flags on this message as reviewed
        await prisma.messageFlag.updateMany({
          where: { messageId },
          data: { reviewed: true },
        })
        break

      case 'unblock':
        // Unblock a blocked message (false positive)
        await prisma.message.update({
          where: { id: messageId },
          data: {
            blocked: false,
            flagged: false,
          },
        })
        // Mark flags as reviewed
        await prisma.messageFlag.updateMany({
          where: { messageId },
          data: { reviewed: true },
        })
        break

      case 'warn_user':
        // Issue a warning to the user (log it, could add warning count to user)
        await prisma.messageFlag.updateMany({
          where: { messageId },
          data: { reviewed: true },
        })
        // TODO: Could create a UserWarning model and track warnings
        break

      case 'ban_user':
        // Ban the sender
        await prisma.user.update({
          where: { id: message.senderId },
          data: {
            banned: true,
            bannedAt: new Date(),
            bannedReason: notes || 'Off-platform transaction attempts',
          },
        })
        await prisma.messageFlag.updateMany({
          where: { messageId },
          data: { reviewed: true },
        })
        break

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }

    return NextResponse.json({ success: true, action })
  } catch (error) {
    console.error('Admin message action error:', error)
    return NextResponse.json(
      { error: 'Failed to perform action' },
      { status: 500 }
    )
  }
}
