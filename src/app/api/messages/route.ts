import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { moderateMessage, getFlagExplanation } from '@/lib/message-moderation'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'

/**
 * GET /api/messages
 * Get conversations for current user
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

    // Get all messages where user is sender or receiver, grouped by conversation
    // Exclude blocked messages from the conversation list
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
        blocked: false,  // Don't show blocked messages
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
        listing: {
          select: {
            id: true,
            title: true,
            price: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // Group messages into conversations
    const conversationsMap = new Map<string, any>()

    for (const message of messages) {
      const otherUserId = message.senderId === userId ? message.receiverId : message.senderId
      const otherUser = message.senderId === userId ? message.receiver : message.sender
      const conversationKey = `${[userId, otherUserId].sort().join('-')}-${message.listingId || 'general'}`

      if (!conversationsMap.has(conversationKey)) {
        conversationsMap.set(conversationKey, {
          id: conversationKey,
          otherUser,
          listing: message.listing,
          lastMessage: {
            content: message.content,
            timestamp: message.createdAt,
            isRead: message.read,
            fromMe: message.senderId === userId,
          },
          unreadCount: 0,
        })
      }

      // Count unread messages
      if (!message.read && message.receiverId === userId) {
        const conv = conversationsMap.get(conversationKey)
        conv.unreadCount++
      }
    }

    const conversations = Array.from(conversationsMap.values())

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
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
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
