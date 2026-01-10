import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createConnectAccount, createConnectOnboardingLink, checkConnectAccountStatus } from '@/lib/stripe'

// =============================================================================
// STRIPE CONNECT API ENDPOINTS
// =============================================================================

/**
 * GET /api/stripe/connect
 * Get the current user's Stripe Connect status
 *
 * Returns the account status directly from Stripe's V2 API,
 * including whether onboarding is complete and charges are enabled.
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

    // Get latest status from Stripe V2 API
    // Always fetch from API directly as per Stripe guidance
    const status = await checkConnectAccountStatus(user.stripeAccountId)

    // Sync status to database if changed
    if (status.chargesEnabled !== user.stripeOnboardingComplete ||
        status.status !== user.stripeAccountStatus) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: {
          stripeOnboardingComplete: status.chargesEnabled,
          stripeAccountStatus: status.status,
        },
      })
    }

    return NextResponse.json({
      hasAccount: true,
      accountId: user.stripeAccountId,
      status: status.status,
      chargesEnabled: status.chargesEnabled,
      payoutsEnabled: status.payoutsEnabled,
      onboardingComplete: status.onboardingComplete,
      requirementsStatus: status.requirementsStatus,
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
 * Create a Stripe Connect account using V2 API and return onboarding link
 *
 * V2 API uses:
 * - display_name: The seller's name (from their profile)
 * - contact_email: The seller's email
 * - dashboard: 'full' for full Stripe Dashboard access
 * - No top-level 'type' field (unlike V1 Express/Standard accounts)
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

    // Parse optional body for custom return/refresh URLs
    let returnUrl: string | undefined
    let refreshUrl: string | undefined

    try {
      const body = await request.json()
      returnUrl = body.returnUrl
      refreshUrl = body.refreshUrl
    } catch {
      // No body sent, use defaults
    }

    const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000'
    const finalReturnUrl = returnUrl || `${baseUrl}/account/payouts`
    const finalRefreshUrl = refreshUrl || `${baseUrl}/account/payouts?refresh=true`

    // Check if user already has a Stripe account
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        name: true,
        username: true,
      },
    })

    let stripeAccountId = user?.stripeAccountId

    // Create new Connect account if needed using V2 API
    if (!stripeAccountId) {
      // Use the user's name as display name, fallback to username or email prefix
      const displayName = user?.name ||
                          user?.username ||
                          session.user.email.split('@')[0]

      // V2 API: createConnectAccount(displayName, email, userId)
      const account = await createConnectAccount(
        displayName,
        session.user.email,
        session.user.id
      )

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

    // Generate onboarding link using V2 API
    // This redirects user to Stripe's hosted onboarding experience
    const onboardingUrl = await createConnectOnboardingLink(
      stripeAccountId,
      finalReturnUrl,
      finalRefreshUrl
    )

    return NextResponse.json({
      accountId: stripeAccountId,
      url: onboardingUrl,
    })
  } catch (error: any) {
    console.error('Create connect account error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create Stripe Connect account' },
      { status: 500 }
    )
  }
}
