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
      await sendEmail({ to: testEmail, subject, html })
      return NextResponse.json({
        success: true,
        message: `Test email sent to ${testEmail}`,
        stats: { success: 1, failed: 0 },
      })
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

    // Send emails
    const results = await sendBulkEmail(emails, subject, html)

    // Log the email send
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
 * Get email stats/recipient counts
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
    })
  } catch (error) {
    console.error('Get email stats error:', error)
    return NextResponse.json(
      { error: 'Failed to get stats' },
      { status: 500 }
    )
  }
}
