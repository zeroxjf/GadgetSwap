import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createSubscriptionCheckout, SUBSCRIPTION_PRICES } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// =============================================================================
// SUBSCRIPTION CHECKOUT API
// =============================================================================

/**
 * POST /api/subscription/checkout
 * Create a subscription checkout session for GadgetSwap Plus or Pro
 *
 * Platform subscriptions (Plus/Pro) are handled on the platform's Stripe account.
 * These are separate from the seller's Connect Express account (used for payouts).
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to subscribe' },
        { status: 401 }
      )
    }

    const { tier, billingPeriod } = await request.json()

    // Validate tier
    if (!['PLUS', 'PRO'].includes(tier)) {
      return NextResponse.json(
        { error: 'Invalid subscription tier' },
        { status: 400 }
      )
    }

    // Validate billing period
    if (!['monthly', 'yearly'].includes(billingPeriod)) {
      return NextResponse.json(
        { error: 'Invalid billing period' },
        { status: 400 }
      )
    }

    // Get the price ID based on tier and billing period
    const priceKey = `${tier}_${billingPeriod.toUpperCase()}` as keyof typeof SUBSCRIPTION_PRICES
    const priceId = SUBSCRIPTION_PRICES[priceKey]

    if (!priceId) {
      return NextResponse.json(
        { error: 'Price not found for selected plan' },
        { status: 400 }
      )
    }

    // Check if using placeholder price IDs (not real Stripe prices)
    if (priceId.startsWith('price_plus_') || priceId.startsWith('price_pro_')) {
      console.error(
        'Stripe prices not configured. ' +
        'Set STRIPE_PLUS_MONTHLY_PRICE_ID, STRIPE_PLUS_YEARLY_PRICE_ID, ' +
        'STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID in your .env file.'
      )
      return NextResponse.json(
        { error: 'Subscription prices not configured. Please set up Stripe products.' },
        { status: 500 }
      )
    }

    // Get user's email
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { email: true },
    })

    const customerEmail = user?.email || session.user.email || undefined

    // Create checkout session on the platform's Stripe account
    const checkoutSession = await createSubscriptionCheckout(
      priceId,
      session.user.id,
      customerEmail
    )

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
