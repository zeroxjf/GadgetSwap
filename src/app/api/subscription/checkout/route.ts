import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe, SUBSCRIPTION_PRICES } from '@/lib/stripe'

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
      console.error('Stripe prices not configured. Set STRIPE_PLUS_MONTHLY_PRICE_ID, etc. in .env')
      return NextResponse.json(
        { error: 'Subscription prices not configured. Please set up Stripe products in your dashboard and add price IDs to .env' },
        { status: 500 }
      )
    }

    // Create Stripe checkout session
    const checkoutSession = await stripe.checkout.sessions.create({
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
      customer_email: session.user.email || undefined,
      success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription?canceled=true`,
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
