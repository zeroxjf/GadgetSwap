import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendEmail, wrapEmailTemplate } from '@/lib/email'

// Admin email to CC on all support responses
const ADMIN_CC_EMAIL = 'jf.tech.team@gmail.com'

/**
 * GET /api/admin/support
 * Fetch all support tickets (admin only)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const limit = parseInt(searchParams.get('limit') || '50')

    const where: any = {}
    if (status && status !== 'all') {
      where.status = status
    }

    const tickets = await prisma.supportTicket.findMany({
      where,
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: [
        { status: 'asc' }, // OPEN first
        { createdAt: 'desc' },
      ],
      take: limit,
    })

    // Get stats
    const stats = await prisma.supportTicket.groupBy({
      by: ['status'],
      _count: { id: true },
    })

    const statsMap = stats.reduce((acc, s) => {
      acc[s.status] = s._count.id
      return acc
    }, {} as Record<string, number>)

    return NextResponse.json({
      tickets,
      stats: {
        open: statsMap['OPEN'] || 0,
        inProgress: statsMap['IN_PROGRESS'] || 0,
        resolved: statsMap['RESOLVED'] || 0,
        closed: statsMap['CLOSED'] || 0,
      },
    })
  } catch (error) {
    console.error('Admin support fetch error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch tickets' },
      { status: 500 }
    )
  }
}

/**
 * PATCH /api/admin/support
 * Update a support ticket (admin only)
 */
export async function PATCH(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check admin role
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN' && user?.role !== 'MODERATOR') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { ticketId, status, priority, adminResponse } = body

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID required' }, { status: 400 })
    }

    const updateData: any = { updatedAt: new Date() }

    if (status) {
      updateData.status = status
    }

    if (priority) {
      // Validate priority value
      const validPriorities = ['low', 'normal', 'high', 'urgent']
      if (!validPriorities.includes(priority)) {
        return NextResponse.json({ error: 'Invalid priority value' }, { status: 400 })
      }
      updateData.priority = priority
    }

    if (adminResponse) {
      updateData.adminResponse = adminResponse
      updateData.respondedById = session.user.id
      updateData.respondedAt = new Date()
    }

    // Get the ticket first to find recipient email
    const existingTicket = await prisma.supportTicket.findUnique({
      where: { id: ticketId },
      include: {
        user: { select: { email: true, name: true } },
      },
    })

    if (!existingTicket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 })
    }

    const ticket = await prisma.supportTicket.update({
      where: { id: ticketId },
      data: updateData,
    })

    // Send email notification if admin provided a response
    let emailSent = false
    let emailRecipient: string | null = null
    let emailError: string | null = null

    if (adminResponse) {
      // Determine recipient email - prefer user email, fall back to ticket email
      const recipientEmail = existingTicket.user?.email || existingTicket.email
      const recipientName = existingTicket.user?.name || 'there'

      if (recipientEmail) {
        emailRecipient = recipientEmail

        try {
          const emailContent = wrapEmailTemplate(`
            <h2 style="color:#1f2937;margin:0 0 16px;">Support Ticket Update</h2>
            <p style="color:#4b5563;margin:0 0 16px;">Hi ${recipientName},</p>
            <p style="color:#4b5563;margin:0 0 16px;">We've responded to your support ticket.</p>

            <div style="background:#f9fafb;border-left:4px solid #4f46e5;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
              <p style="color:#6b7280;margin:0 0 8px;font-size:12px;text-transform:uppercase;">Your Message:</p>
              <p style="color:#374151;margin:0;white-space:pre-wrap;">${existingTicket.message.slice(0, 200)}${existingTicket.message.length > 200 ? '...' : ''}</p>
            </div>

            <div style="background:#ecfdf5;border-left:4px solid #10b981;padding:16px;margin:16px 0;border-radius:0 8px 8px 0;">
              <p style="color:#059669;margin:0 0 8px;font-size:12px;text-transform:uppercase;">Our Response:</p>
              <p style="color:#374151;margin:0;white-space:pre-wrap;">${adminResponse}</p>
            </div>

            <p style="color:#4b5563;margin:24px 0 0;">If you have any more questions, feel free to reply to this email or submit a new support request.</p>
            <p style="color:#4b5563;margin:16px 0 0;">Best regards,<br>The GadgetSwap Team</p>
          `, 'Your support ticket has been answered')

          await sendEmail({
            to: recipientEmail,
            subject: `Re: Your GadgetSwap Support Request`,
            html: emailContent,
            cc: ADMIN_CC_EMAIL,
            replyTo: ADMIN_CC_EMAIL,
          })

          emailSent = true
        } catch (err: any) {
          console.error('Failed to send support response email:', err)
          emailError = err.message || 'Failed to send email'
        }
      } else {
        emailError = 'No email address available for user'
      }
    }

    return NextResponse.json({
      success: true,
      ticket,
      emailSent,
      emailRecipient,
      emailError,
      emailCc: emailSent ? ADMIN_CC_EMAIL : null,
    })
  } catch (error) {
    console.error('Admin support update error:', error)
    return NextResponse.json(
      { error: 'Failed to update ticket' },
      { status: 500 }
    )
  }
}
