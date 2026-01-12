import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Early adopter lifetime Pro offer - ENDED
// Offer ran during launch period and has now concluded
const EARLY_ADOPTER_ENABLED = false

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    // Check if early adopter offer is still active
    if (!EARLY_ADOPTER_ENABLED) {
      return NextResponse.json({ error: 'Early adopter offer has ended' }, { status: 400 })
    }

    // Get current user
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, createdAt: true },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if already Pro
    if (user.subscriptionTier === 'PRO') {
      return NextResponse.json({ error: 'Already have Pro', alreadyPro: true }, { status: 400 })
    }

    // Upgrade to lifetime Pro
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        subscriptionTier: 'PRO',
        subscriptionStatus: 'active',
        subscriptionEnd: null, // null = lifetime, no expiry
      },
    })

    return NextResponse.json({
      success: true,
      message: 'Congratulations! You now have lifetime Pro access.'
    })
  } catch (error) {
    console.error('Claim Pro error:', error)
    return NextResponse.json({ error: 'Failed to claim Pro' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true },
    })

    return NextResponse.json({
      enabled: EARLY_ADOPTER_ENABLED,
      alreadyPro: user?.subscriptionTier === 'PRO',
    })
  } catch (error) {
    return NextResponse.json({ error: 'Failed to check status' }, { status: 500 })
  }
}
