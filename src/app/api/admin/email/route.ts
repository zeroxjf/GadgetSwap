import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { sendBulkEmail, wrapEmailTemplate } from '@/lib/email'

/**
 * POST /api/admin/email
 * Send email to users
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Check if user is admin
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const body = await request.json()
    const { subject, content, recipientType, testEmail } = body

    if (!subject || !content) {
      return NextResponse.json(
        { error: 'Subject and content are required' },
        { status: 400 }
      )
    }

    // If test mode, just send to the test email
    if (testEmail) {
      const html = wrapEmailTemplate(content)
      const { sendEmail } = await import('@/lib/email')

      // Create log entry for test email
      const emailLog = await prisma.emailLog.create({
        data: {
          subject,
          recipientType: 'test',
          recipientCount: 1,
          sentById: session.user.id,
          sentByEmail: session.user.email || 'unknown',
          contentPreview: content.replace(/<[^>]*>/g, '').substring(0, 200),
          status: 'sending',
        },
      })

      try {
        await sendEmail({ to: testEmail, subject, html })

        // Update log as completed
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'completed',
            successCount: 1,
            completedAt: new Date(),
          },
        })

        return NextResponse.json({
          success: true,
          message: `Test email sent to ${testEmail}`,
          stats: { success: 1, failed: 0 },
        })
      } catch (error: any) {
        await prisma.emailLog.update({
          where: { id: emailLog.id },
          data: {
            status: 'failed',
            failedCount: 1,
            errorMessage: error.message,
            completedAt: new Date(),
          },
        })
        throw error
      }
    }

    // Build recipient query based on type
    let whereClause: any = {
      emailNotifications: true, // Respect email preferences
      banned: false,
    }

    switch (recipientType) {
      case 'all':
        // All users with email notifications enabled
        break
      case 'marketing':
        // Only users who opted into marketing
        whereClause.marketingEmails = true
        break
      case 'sellers':
        // Users with at least one listing
        whereClause.listings = { some: {} }
        break
      case 'buyers':
        // Users with at least one purchase
        whereClause.purchases = { some: {} }
        break
      case 'pro':
        // Pro subscribers
        whereClause.subscriptionTier = 'PRO'
        break
      case 'plus':
        // Plus subscribers
        whereClause.subscriptionTier = 'PLUS'
        break
      case 'free':
        // Free tier users
        whereClause.subscriptionTier = 'FREE'
        break
      default:
        break
    }

    // Get recipient emails
    const recipients = await prisma.user.findMany({
      where: whereClause,
      select: { email: true },
    })

    if (recipients.length === 0) {
      return NextResponse.json(
        { error: 'No recipients found matching criteria' },
        { status: 400 }
      )
    }

    const emails = recipients.map((r) => r.email)
    const html = wrapEmailTemplate(content)

    // Create log entry
    const emailLog = await prisma.emailLog.create({
      data: {
        subject,
        recipientType: recipientType || 'all',
        recipientCount: emails.length,
        sentById: session.user.id,
        sentByEmail: session.user.email || 'unknown',
        contentPreview: content.replace(/<[^>]*>/g, '').substring(0, 200),
        status: 'sending',
      },
    })

    // Send emails
    const results = await sendBulkEmail(emails, subject, html)

    // Update log with results
    await prisma.emailLog.update({
      where: { id: emailLog.id },
      data: {
        status: results.failed === emails.length ? 'failed' : 'completed',
        successCount: results.success,
        failedCount: results.failed,
        errorMessage: results.errors.length > 0 ? results.errors.slice(0, 5).join('; ') : null,
        completedAt: new Date(),
      },
    })

    // Console log for debugging
    console.log(`[ADMIN EMAIL] Sent by ${session.user.email}:`, {
      subject,
      recipientType,
      totalRecipients: emails.length,
      success: results.success,
      failed: results.failed,
    })

    return NextResponse.json({
      success: true,
      message: `Email sent to ${results.success} users`,
      stats: {
        total: emails.length,
        success: results.success,
        failed: results.failed,
      },
      errors: results.errors.length > 0 ? results.errors.slice(0, 10) : undefined,
    })
  } catch (error) {
    console.error('Admin email error:', error)
    return NextResponse.json(
      { error: 'Failed to send emails' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/admin/email
 * Get email stats/recipient counts and sent email history
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { role: true },
    })

    if (user?.role !== 'ADMIN') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const includeHistory = searchParams.get('history') === 'true'
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)

    // Get counts for each recipient type
    const [
      allCount,
      marketingCount,
      sellersCount,
      buyersCount,
      proCount,
      plusCount,
      freeCount,
    ] = await Promise.all([
      prisma.user.count({
        where: { emailNotifications: true, banned: false },
      }),
      prisma.user.count({
        where: { marketingEmails: true, banned: false },
      }),
      prisma.user.count({
        where: { emailNotifications: true, banned: false, listings: { some: {} } },
      }),
      prisma.user.count({
        where: { emailNotifications: true, banned: false, purchases: { some: {} } },
      }),
      prisma.user.count({
        where: { emailNotifications: true, banned: false, subscriptionTier: 'PRO' },
      }),
      prisma.user.count({
        where: { emailNotifications: true, banned: false, subscriptionTier: 'PLUS' },
      }),
      prisma.user.count({
        where: { emailNotifications: true, banned: false, subscriptionTier: 'FREE' },
      }),
    ])

    // Optionally include email history
    let emailLogs = null
    let totalLogs = 0

    if (includeHistory) {
      [emailLogs, totalLogs] = await Promise.all([
        prisma.emailLog.findMany({
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * limit,
          take: limit,
        }),
        prisma.emailLog.count(),
      ])
    }

    return NextResponse.json({
      recipientCounts: {
        all: allCount,
        marketing: marketingCount,
        sellers: sellersCount,
        buyers: buyersCount,
        pro: proCount,
        plus: plusCount,
        free: freeCount,
      },
      ...(includeHistory && {
        emailLogs,
        totalLogs,
        page,
        totalPages: Math.ceil(totalLogs / limit),
      }),
    })
  } catch (error) {
    console.error('Get email stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
