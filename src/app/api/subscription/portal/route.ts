import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { stripeClient, createBillingPortalSession } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// =============================================================================
// BILLING PORTAL API
// =============================================================================

/**
 * POST /api/subscription/portal
 * Create a billing portal session for the user to manage their subscription
 *
 * For V2 accounts, uses customer_account (the connected account ID) instead of
 * a separate customer ID. This allows using one ID for both Connect and billing.
 */
export async function POST() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    // Get user's Stripe account ID (V2) or customer ID (legacy)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,     // V2 Connect account ID
        stripeCustomerId: true,    // Legacy customer ID
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'
    const returnUrl = `${baseUrl}/account`

    // V2 accounts: Use the connected account ID directly with customer_account
    if (user?.stripeAccountId) {
      const portalSession = await createBillingPortalSession(
        user.stripeAccountId,
        returnUrl
      )
      return NextResponse.json({ url: portalSession.url })
    }

    // Legacy: Fall back to customer ID if no Connect account
    if (user?.stripeCustomerId) {
      const portalSession = await stripeClient.billingPortal.sessions.create({
        customer: user.stripeCustomerId,
        return_url: returnUrl,
      })
      return NextResponse.json({ url: portalSession.url })
    }

    return NextResponse.json(
      { error: 'No billing account found. Please set up your seller account first.' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Billing portal error:', error)
    return NextResponse.json(
      { error: 'Failed to create billing portal session' },
      { status: 500 }
    )
  }
}
