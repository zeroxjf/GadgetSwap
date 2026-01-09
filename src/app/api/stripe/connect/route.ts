import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, createConnectAccount, createConnectOnboardingLink, checkConnectAccountStatus } from '@/lib/stripe'

/**
 * GET /api/stripe/connect
 * Get the current user's Stripe Connect status
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        stripeAccountStatus: true,
        stripeOnboardingComplete: true,
      },
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json({
        hasAccount: false,
        status: null,
        onboardingComplete: false,
      })
    }

    // Get latest status from Stripe
    const status = await checkConnectAccountStatus(user.stripeAccountId)

    return NextResponse.json({
      hasAccount: true,
      accountId: user.stripeAccountId,
      status: status.status,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      onboardingComplete: user.stripeOnboardingComplete,
    })
  } catch (error) {
    console.error('Get connect status error:', error)
    return NextResponse.json(
      { error: 'Failed to get Stripe Connect status' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/stripe/connect
 * Create a Stripe Connect account and return onboarding link
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id || !session?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { returnUrl, refreshUrl } = body

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const finalReturnUrl = returnUrl || `${baseUrl}/account/seller`
    const finalRefreshUrl = refreshUrl || `${baseUrl}/account/seller?refresh=true`

    // Check if user already has a Stripe account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    })

    let stripeAccountId = user?.stripeAccountId

    // Create new Connect account if needed
    if (!stripeAccountId) {
      const account = await createConnectAccount(session.user.email, session.user.id)
      stripeAccountId = account.id

      // Save to database
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeAccountId,
          stripeAccountStatus: 'pending',
          stripeOnboardingComplete: false,
        },
      })
    }

    // Generate onboarding link
    const onboardingUrl = await createConnectOnboardingLink(
      stripeAccountId,
      finalReturnUrl,
      finalRefreshUrl
    )

    return NextResponse.json({
      accountId: stripeAccountId,
      onboardingUrl,
    })
  } catch (error: any) {
    console.error('Create connect account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}
