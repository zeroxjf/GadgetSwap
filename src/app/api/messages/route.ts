import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderateMessage, getFlagExplanation } from '@/lib/message-moderation'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { checkRateLimit, rateLimitResponse, rateLimits } from '@/lib/rate-limit'
import { isCurrentUserBanned } from '@/lib/admin'

/**
 * GET /api/messages
 * Get conversations for current user
 *
 * Optimized to:
 * 1. Limit messages fetched (latest 500 per user max)
 * 2. Use distinct to get unique conversations first
 * 3. Only fetch detailed data for active conversations
 *
 * NOTE: Current implementation uses take: 500 limit which is acceptable for
 * moderate load. For production scale with high-volume users, implement
 * cursor-based pagination:
 * - Add `cursor` and `limit` query params
 * - Return `nextCursor` in response for infinite scroll
 * - Example: GET /api/messages?cursor=<lastMessageId>&limit=50
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const userId = session.user.id

    // Step 1: Get distinct conversation partners with latest message timestamp
    // This is more efficient than loading all messages
    const recentMessages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        blocked: false,
      },
      select: {
        id: true,
        senderId: true,
        receiverId: true,
        listingId: true,
        content: true,
        read: true,
        createdAt: true,
      },
      orderBy: { createdAt: 'desc' },
      take: 500, // Limit to last 500 messages to prevent memory issues
    })

    // Group to find unique conversations and their latest message
    const conversationLatest = new Map<string, typeof recentMessages[0]>()
    const unreadCounts = new Map<string, number>()

    for (const msg of recentMessages) {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId
      const conversationKey = `${[userId, otherUserId].sort().join('-')}-${msg.listingId || 'general'}`

      // Track latest message per conversation
      if (!conversationLatest.has(conversationKey)) {
        conversationLatest.set(conversationKey, msg)
        unreadCounts.set(conversationKey, 0)
      }

      // Count unread
      if (!msg.read && msg.receiverId === userId) {
        unreadCounts.set(conversationKey, (unreadCounts.get(conversationKey) || 0) + 1)
      }
    }

    // Step 2: Fetch user and listing details only for unique conversations
    const conversationKeys = Array.from(conversationLatest.keys())
    const otherUserIds = new Set<string>()
    const listingIds = new Set<string>()

    for (const msg of conversationLatest.values()) {
      otherUserIds.add(msg.senderId === userId ? msg.receiverId : msg.senderId)
      if (msg.listingId) listingIds.add(msg.listingId)
    }

    // Batch fetch users and listings (2 queries instead of N)
    const [users, listings] = await Promise.all([
      prisma.user.findMany({
        where: { id: { in: Array.from(otherUserIds) } },
        select: {
          id: true,
          name: true,
          username: true,
          image: true,
        },
      }),
      prisma.listing.findMany({
        where: { id: { in: Array.from(listingIds) } },
        select: {
          id: true,
          title: true,
          price: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' },
          },
        },
      }),
    ])

    // Build lookup maps
    const userMap = new Map(users.map(u => [u.id, u]))
    const listingMap = new Map(listings.map(l => [l.id, l]))

    // Step 3: Build final conversation list
    const conversations = Array.from(conversationLatest.entries()).map(([key, msg]) => {
      const otherUserId = msg.senderId === userId ? msg.receiverId : msg.senderId
      return {
        id: key,
        otherUser: userMap.get(otherUserId) || null,
        listing: msg.listingId ? listingMap.get(msg.listingId) || null : null,
        lastMessage: {
          content: msg.content,
          timestamp: msg.createdAt,
          isRead: msg.read,
          fromMe: msg.senderId === userId,
        },
        unreadCount: unreadCounts.get(key) || 0,
      }
    })

    // Sort by most recent first
    conversations.sort((a, b) =>
      new Date(b.lastMessage.timestamp).getTime() - new Date(a.lastMessage.timestamp).getTime()
    )

    return NextResponse.json({ conversations })
  } catch (error) {
    console.error('Get messages error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/messages
 * Send a new message with content moderation
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 30 messages per minute
    const rateCheck = checkRateLimit(request, rateLimits.messages)
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

    // SECURITY: Check if user is banned
    if (await isCurrentUserBanned()) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 })
    }

    const { receiverId, content, listingId } = await request.json()

    if (!receiverId || !content) {
      return NextResponse.json(
        { error: 'Receiver and content are required' },
        { status: 400 }
      )
    }

    // Prevent messaging yourself
    if (receiverId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot message yourself' },
        { status: 400 }
      )
    }

    // Check if receiver exists
    const receiver = await prisma.user.findUnique({
      where: { id: receiverId },
      select: { id: true, name: true },
    })

    if (!receiver) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 404 }
      )
    }

    // ===========================================
    // CONTENT MODERATION
    // ===========================================
    const moderation = moderateMessage(content)

    // If blocked, return error to user
    if (moderation.blocked) {
      // Still create the message for admin review, but mark as blocked
      const blockedMessage = await prisma.message.create({
        data: {
          senderId: session.user.id,
          receiverId,
          content,
          listingId: listingId || null,
          flagged: true,
          blocked: true,
          riskScore: moderation.riskScore,
          moderationFlags: {
            create: moderation.flags.map(flag => ({
              type: flag.type,
              severity: flag.severity,
              match: flag.match,
              context: flag.context,
            })),
          },
        },
      })

      // Create admin notification for blocked message
      await notifyAdminsOfFlaggedMessage(blockedMessage.id, moderation.riskScore)

      return NextResponse.json(
        {
          error: moderation.message || 'Message blocked',
          blocked: true,
          reason: 'off_platform_attempt',
        },
        { status: 400 }
      )
    }

    // Create the message
    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        listingId: listingId || null,
        flagged: moderation.flagged,
        blocked: false,
        riskScore: moderation.riskScore,
        // Create flag records if flagged
        moderationFlags: moderation.flagged ? {
          create: moderation.flags.map(flag => ({
            type: flag.type,
            severity: flag.severity,
            match: flag.match,
            context: flag.context,
          })),
        } : undefined,
      },
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
        receiver: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
    })

    // If flagged but not blocked, still notify admins
    if (moderation.flagged) {
      await notifyAdminsOfFlaggedMessage(message.id, moderation.riskScore)
    }

    // Create notification for receiver
    await createNotification({
      userId: receiverId,
      type: 'NEW_MESSAGE',
      title: 'New Message',
      message: `${session.user.name || 'Someone'} sent you a message`,
      link: '/messages',
    })

    // Log activity
    await logActivity({
      userId: session.user.id,
      type: 'MESSAGE_SENT',
      description: `Sent a message to ${receiver.name || 'a user'}`,
      metadata: { receiverId, listingId: listingId || null },
    })

    return NextResponse.json({
      success: true,
      message,
      warning: moderation.flagged ? moderation.message : undefined,
    })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}

/**
 * Notify admins of a flagged message
 */
async function notifyAdminsOfFlaggedMessage(messageId: string, riskScore: number) {
  try {
    // Get admin users
    const admins = await prisma.user.findMany({
      where: {
        role: { in: ['ADMIN', 'MODERATOR'] },
      },
      select: { id: true },
    })

    // Create notification for each admin
    for (const admin of admins) {
      await createNotification({
        userId: admin.id,
        type: 'ADMIN_NEW_REVIEW',
        title: 'Flagged Message',
        message: `A message was flagged for potential off-platform transaction (Risk: ${riskScore}%)`,
        link: '/admin/messages',
      })
    }
  } catch (error) {
    console.error('Error notifying admins:', error)
  }
}
