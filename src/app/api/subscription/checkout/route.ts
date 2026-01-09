import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripeClient, SUBSCRIPTION_PRICES, createSubscriptionCheckoutForConnectedAccount } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

// =============================================================================
// SUBSCRIPTION CHECKOUT API
// =============================================================================

/**
 * POST /api/subscription/checkout
 * Create a subscription checkout session
 *
 * For V2 accounts with Stripe Connect, uses customer_account to allow the
 * connected account ID to be used directly for subscriptions.
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
    // PLACEHOLDER: Create products/prices in Stripe Dashboard and add IDs to .env
    if (priceId.startsWith('price_plus_') || priceId.startsWith('price_pro_')) {
      console.error(
        '⚠️  Stripe prices not configured.\n' +
        '   Set STRIPE_PLUS_MONTHLY_PRICE_ID, STRIPE_PLUS_YEARLY_PRICE_ID,\n' +
        '   STRIPE_PRO_MONTHLY_PRICE_ID, STRIPE_PRO_YEARLY_PRICE_ID in your .env file.\n' +
        '   Create prices at: https://dashboard.stripe.com/products'
      )
      return NextResponse.json(
        { error: 'Subscription prices not configured. Please set up Stripe products in your dashboard and add price IDs to .env' },
        { status: 500 }
      )
    }

    // Get user's Stripe account ID (V2) or email (legacy)
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        stripeAccountId: true,
        email: true,
      },
    })

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

    // V2 accounts: Use the connected account ID directly with customer_account
    // This allows using one ID for both Connect and subscriptions
    if (user?.stripeAccountId) {
      const checkoutSession = await createSubscriptionCheckoutForConnectedAccount(
        user.stripeAccountId,
        priceId
      )
      return NextResponse.json({ url: checkoutSession.url })
    }

    // Legacy: Create checkout session with customer_email
    const checkoutSession = await stripeClient.checkout.sessions.create({
      mode: 'subscription',
      payment_method_types: ['card'],
      line_items: [
        {
          price: priceId,
          quantity: 1,
        },
      ],
      metadata: {
        userId: session.user.id,
        tier,
        billingPeriod,
      },
      customer_email: user?.email || session.user.email || undefined,
      success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/subscription?canceled=true`,
      subscription_data: {
        metadata: {
          userId: session.user.id,
          tier,
        },
      },
    })

    return NextResponse.json({ url: checkoutSession.url })
  } catch (error) {
    console.error('Subscription checkout error:', error)
    return NextResponse.json(
      { error: 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
