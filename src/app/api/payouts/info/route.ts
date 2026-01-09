import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { checkConnectAccountStatus } from '@/lib/stripe'

/**
 * GET /api/payouts/info
 * Get current user's payout information and Stripe Connect status
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
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // If no Stripe account, return basic info
    if (!user.stripeAccountId) {
      return NextResponse.json({
        stripeConnected: false,
        stripeOnboardingComplete: false,
        payoutsEnabled: false,
        pendingBalance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        nextPayoutDate: null,
      })
    }

    // Check actual status from Stripe and update if different
    try {
      const stripeStatus = await checkConnectAccountStatus(user.stripeAccountId)

      const isComplete = stripeStatus.chargesEnabled && stripeStatus.payoutsEnabled

      // Update database if status has changed
      if (isComplete !== user.stripeOnboardingComplete || stripeStatus.status !== user.stripeAccountStatus) {
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            stripeOnboardingComplete: isComplete,
            stripeAccountStatus: stripeStatus.status,
          },
        })
      }

      return NextResponse.json({
        stripeConnected: true,
        stripeOnboardingComplete: isComplete,
        payoutsEnabled: stripeStatus.payoutsEnabled,
        chargesEnabled: stripeStatus.chargesEnabled,
        detailsSubmitted: stripeStatus.detailsSubmitted,
        pendingBalance: 0, // TODO: Fetch from Stripe Balance API
        availableBalance: 0, // TODO: Fetch from Stripe Balance API
        totalEarnings: 0, // TODO: Calculate from transactions
        nextPayoutDate: null,
      })
    } catch (stripeError) {
      console.error('Error checking Stripe account:', stripeError)

      // Return cached status if Stripe API fails
      return NextResponse.json({
        stripeConnected: true,
        stripeOnboardingComplete: user.stripeOnboardingComplete,
        payoutsEnabled: user.stripeOnboardingComplete,
        pendingBalance: 0,
        availableBalance: 0,
        totalEarnings: 0,
        nextPayoutDate: null,
      })
    }
  } catch (error) {
    console.error('Get payout info error:', error)
    return NextResponse.json({ error: 'Failed to get payout info' }, { status: 500 })
  }
}
