import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/settings
 * Get current user's notification settings
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        emailNotifications: true,
        marketingEmails: true,
        priceDropAlerts: true,
        newMessageAlerts: true,
        orderUpdates: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ settings: user })
  } catch (error) {
    console.error('Get settings error:', error)
    return NextResponse.json({ error: 'Failed to get settings' }, { status: 500 })
  }
}

/**
 * PUT /api/user/settings
 * Update current user's notification settings
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const {
      emailNotifications,
      marketingEmails,
      priceDropAlerts,
      newMessageAlerts,
      orderUpdates,
    } = body

    // Build update data (only update what's provided)
    const updateData: any = {}
    if (typeof emailNotifications === 'boolean') updateData.emailNotifications = emailNotifications
    if (typeof marketingEmails === 'boolean') updateData.marketingEmails = marketingEmails
    if (typeof priceDropAlerts === 'boolean') updateData.priceDropAlerts = priceDropAlerts
    if (typeof newMessageAlerts === 'boolean') updateData.newMessageAlerts = newMessageAlerts
    if (typeof orderUpdates === 'boolean') updateData.orderUpdates = orderUpdates

    const user = await prisma.user.update({
      where: { id: session.user.id },
      data: updateData,
      select: {
        emailNotifications: true,
        marketingEmails: true,
        priceDropAlerts: true,
        newMessageAlerts: true,
        orderUpdates: true,
      },
    })

    return NextResponse.json({ settings: user, message: 'Settings saved successfully' })
  } catch (error) {
    console.error('Update settings error:', error)
    return NextResponse.json({ error: 'Failed to update settings' }, { status: 500 })
  }
}
