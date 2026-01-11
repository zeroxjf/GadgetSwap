import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/alerts
 * Get user's device alerts
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const alerts = await prisma.deviceAlert.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ alerts })
  } catch (error) {
    console.error('Get alerts error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch alerts' },
      { status: 500 }
    )
  }
}

// Alert limits by subscription tier
const ALERT_LIMITS = {
  FREE: 1,
  PLUS: 3,
  PRO: Infinity,
}

/**
 * POST /api/alerts
 * Create a new device alert
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

    // Check subscription tier alert limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    })

    const subscriptionTier = (user?.subscriptionTier || 'FREE') as keyof typeof ALERT_LIMITS
    const alertLimit = ALERT_LIMITS[subscriptionTier]

    const existingAlertCount = await prisma.deviceAlert.count({
      where: { userId: session.user.id },
    })

    if (existingAlertCount >= alertLimit) {
      const upgradeMessage = subscriptionTier === 'FREE'
        ? 'Upgrade to Plus for 3 alerts or Pro for unlimited alerts.'
        : subscriptionTier === 'PLUS'
        ? 'Upgrade to Pro for unlimited alerts.'
        : ''

      return NextResponse.json(
        { error: `You've reached your limit of ${alertLimit} alert${alertLimit === 1 ? '' : 's'}. ${upgradeMessage}` },
        { status: 403 }
      )
    }

    const body = await request.json()

    const {
      name,
      deviceType,
      deviceModel,
      osVersion, // Simplified: major version like "16", "17", etc.
      osVersionMin: legacyMin,
      osVersionMax: legacyMax,
      osVersionExact: legacyExact,
      jailbreakStatus,
      bootromExploitOnly,
      storageMinGB,
      storageMaxGB,
      priceMin,
      priceMax,
      emailNotify,
    } = body

    // Store simplified osVersion directly (e.g., "16", "17")
    // For matching, we'll use prefix matching: "16" matches "16.0", "16.1.2", etc.
    let osVersionMin = legacyMin
    let osVersionMax = legacyMax
    let osVersionExact = legacyExact

    if (osVersion && !osVersionMin && !osVersionMax && !osVersionExact) {
      // Store as osVersionMin for simplified queries
      // Value like "16" will match listings starting with "16"
      osVersionMin = osVersion
      osVersionMax = null // Not using range anymore
    }

    if (!name) {
      return NextResponse.json(
        { error: 'Alert name is required' },
        { status: 400 }
      )
    }

    const alert = await prisma.deviceAlert.create({
      data: {
        userId: session.user.id,
        name,
        deviceType: deviceType || null,
        deviceModel: deviceModel || null,
        osVersionMin: osVersionMin || null,
        osVersionMax: osVersionMax || null,
        osVersionExact: osVersionExact || null,
        jailbreakStatus: jailbreakStatus || null,
        bootromExploitOnly: bootromExploitOnly || false,
        storageMinGB: storageMinGB || null,
        storageMaxGB: storageMaxGB || null,
        priceMin: priceMin || null,
        priceMax: priceMax || null,
        emailNotify: emailNotify ?? true,
      },
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error('Create alert error:', error)
    return NextResponse.json(
      { error: 'Failed to create alert' },
      { status: 500 }
    )
  }
}
