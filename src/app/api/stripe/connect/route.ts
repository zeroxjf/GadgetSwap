import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createConnectAccount, createConnectOnboardingLink, checkConnectAccountStatus } from '@/lib/stripe'

// =============================================================================
// STRIPE CONNECT API ENDPOINTS - EXPRESS ACCOUNTS
// =============================================================================

/**
 * GET /api/stripe/connect
 * Get the current user's Stripe Connect status
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

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
 * Create a Stripe Connect Express account and return onboarding link
 *
 * Express accounts have simplified onboarding - just identity + bank account.
 * Perfect for marketplace sellers.
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id || !auth?.user?.email) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

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
        stripeOnboardingComplete: true,
        name: true,
        username: true,
      },
    })

    let stripeAccountId = user?.stripeAccountId

    // If user has an existing account that's not onboarded, try to use it
    // If it fails (e.g., V2 account), we'll create a new Express account
    if (stripeAccountId) {
      try {
        // Try to create onboarding link for existing account
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
        console.log(`Existing account ${stripeAccountId} failed, creating new Express account:`, error.message)
        // Clear the old account - we'll create a new one
        stripeAccountId = null
        await prisma.user.update({
          where: { id: session.user.id },
          data: {
            stripeAccountId: null,
            stripeAccountStatus: null,
            stripeOnboardingComplete: false,
          },
        })
      }
    }

    // Create new Express account
    const displayName = user?.name ||
                        user?.username ||
                        session.user.email.split('@')[0]

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

    // Generate onboarding link
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
