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

    // Map simplified osVersion to min/max range (e.g., "16" -> "16.0" to "16.99")
    let osVersionMin = legacyMin
    let osVersionMax = legacyMax
    let osVersionExact = legacyExact

    if (osVersion && !osVersionMin && !osVersionMax && !osVersionExact) {
      osVersionMin = `${osVersion}.0`
      osVersionMax = osVersion === '13' ? '13.99' : `${osVersion}.99`
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
