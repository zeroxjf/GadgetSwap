import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

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
    const messages = await prisma.message.findMany({
      where: {
        OR: [
          { senderId: userId },
          { receiverId: userId },
        ],
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
 * Send a new message
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

    const message = await prisma.message.create({
      data: {
        senderId: session.user.id,
        receiverId,
        content,
        listingId: listingId || null,
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

    return NextResponse.json({ success: true, message })
  } catch (error) {
    console.error('Send message error:', error)
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    )
  }
}
