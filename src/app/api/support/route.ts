import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/support
 * Submit a support ticket / feedback
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    const body = await request.json()
    const { type, message, email, pageUrl } = body

    if (!message || message.trim().length < 10) {
      return NextResponse.json(
        { error: 'Message must be at least 10 characters' },
        { status: 400 }
      )
    }

    // If not logged in, require email
    if (!session?.user?.id && !email) {
      return NextResponse.json(
        { error: 'Please provide an email address' },
        { status: 400 }
      )
    }

    // Get user agent
    const userAgent = request.headers.get('user-agent') || undefined

    const ticket = await prisma.supportTicket.create({
      data: {
        type: type || 'feedback',
        message: message.trim(),
        email: session?.user?.email || email,
        userId: session?.user?.id || null,
        pageUrl,
        userAgent,
        status: 'OPEN',
        priority: type === 'bug' ? 'high' : 'normal',
      },
    })

    return NextResponse.json({
      success: true,
      ticketId: ticket.id,
      message: 'Thank you for your feedback! We\'ll review it shortly.',
    })
  } catch (error) {
    console.error('Support ticket error:', error)
    return NextResponse.json(
      { error: 'Failed to submit feedback' },
      { status: 500 }
    )
  }
}
