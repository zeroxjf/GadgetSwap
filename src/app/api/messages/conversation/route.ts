import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/messages/conversation?userId=xxx&listingId=xxx
 * Get message history for a specific conversation
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

    const searchParams = request.nextUrl.searchParams
    const otherUserId = searchParams.get('userId')
    const listingId = searchParams.get('listingId')
    const limit = parseInt(searchParams.get('limit') || '50')
    const before = searchParams.get('before')  // For pagination

    if (!otherUserId) {
      return NextResponse.json(
        { error: 'userId is required' },
        { status: 400 }
      )
    }

    const currentUserId = session.user.id

    // Build query conditions
    const whereConditions: any = {
      OR: [
        { senderId: currentUserId, receiverId: otherUserId },
        { senderId: otherUserId, receiverId: currentUserId },
      ],
      blocked: false,  // Don't show blocked messages
    }

    // Filter by listing if provided
    if (listingId && listingId !== 'general') {
      whereConditions.listingId = listingId
    } else if (listingId === 'general') {
      whereConditions.listingId = null
    }

    // Pagination - get messages before a certain ID
    if (before) {
      whereConditions.createdAt = {
        lt: new Date(before),
      }
    }

    // Get messages for this conversation
    const messages = await prisma.message.findMany({
      where: whereConditions,
      include: {
        sender: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })

    // Mark messages as read
    await prisma.message.updateMany({
      where: {
        senderId: otherUserId,
        receiverId: currentUserId,
        read: false,
        ...(listingId && listingId !== 'general' ? { listingId } : {}),
        ...(listingId === 'general' ? { listingId: null } : {}),
      },
      data: { read: true },
    })

    // Reverse to get chronological order
    const sortedMessages = messages.reverse()

    // Get conversation partner info
    const otherUser = await prisma.user.findUnique({
      where: { id: otherUserId },
      select: {
        id: true,
        name: true,
        username: true,
        image: true,
        rating: true,
        totalSales: true,
      },
    })

    // Get listing info if applicable
    let listing = null
    if (listingId && listingId !== 'general') {
      listing = await prisma.listing.findUnique({
        where: { id: listingId },
        select: {
          id: true,
          title: true,
          price: true,
          status: true,
          images: {
            take: 1,
            orderBy: { order: 'asc' },
          },
        },
      })
    }

    return NextResponse.json({
      messages: sortedMessages,
      otherUser,
      listing,
      hasMore: messages.length === limit,
    })
  } catch (error) {
    console.error('Get conversation error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch conversation' },
      { status: 500 }
    )
  }
}
