import { NextRequest, NextResponse } from 'next/server'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import Stripe from 'stripe'

// Disable body parsing - we need the raw body for webhook verification
export const runtime = 'nodejs'

export async function POST(request: NextRequest) {
  const body = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    event = stripe.webhooks.constructEvent(
      body,
      signature,
      process.env.STRIPE_WEBHOOK_SECRET!
    )
  } catch (err: any) {
    console.error('Webhook signature verification failed:', err.message)
    return NextResponse.json(
      { error: `Webhook Error: ${err.message}` },
      { status: 400 }
    )
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed': {
        const session = event.data.object as Stripe.Checkout.Session

        if (session.mode === 'subscription' && session.subscription) {
          const userId = session.metadata?.userId
          const tier = session.metadata?.tier as 'PLUS' | 'PRO'

          if (userId && tier) {
            // Retrieve the subscription to get the current period end
            const subscription = await stripe.subscriptions.retrieve(
              session.subscription as string
            ) as Stripe.Subscription

            const periodEnd = (subscription as any).current_period_end

            await prisma.user.update({
              where: { id: userId },
              data: {
                subscriptionTier: tier,
                subscriptionId: subscription.id,
                subscriptionEnd: periodEnd ? new Date(periodEnd * 1000) : null,
                stripeCustomerId: session.customer as string,
              },
            })

            console.log(`User ${userId} subscribed to ${tier}`)
          }
        }
        break
      }

      case 'customer.subscription.updated': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string
        const periodEnd = (subscription as any).current_period_end
        const priceId = subscription.items.data[0]?.price?.id
        const newTier = getTierFromPriceId(priceId)

        // SECURITY: Always look up by stripeCustomerId first (verified by Stripe)
        // Never trust metadata alone as it could be manipulated
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: subscription.cancel_at_period_end ? user.subscriptionTier : newTier,
              subscriptionEnd: periodEnd ? new Date(periodEnd * 1000) : null,
              subscriptionStatus: subscription.status,
            },
          })
          console.log(`Updated subscription for user ${user.id}: tier=${newTier}, status=${subscription.status}`)
        } else {
          console.warn(`No user found for Stripe customer ${customerId}`)
        }
        break
      }

      case 'customer.subscription.deleted': {
        const subscription = event.data.object as Stripe.Subscription
        const customerId = subscription.customer as string

        // SECURITY: Always look up by stripeCustomerId (verified by Stripe)
        const user = await prisma.user.findFirst({
          where: { stripeCustomerId: customerId },
        })

        if (user) {
          await prisma.user.update({
            where: { id: user.id },
            data: {
              subscriptionTier: 'FREE',
              subscriptionId: null,
              subscriptionEnd: null,
              subscriptionStatus: 'canceled',
            },
          })

          console.log(`User ${user.id} subscription canceled, reverted to FREE`)
        } else {
          console.warn(`No user found for Stripe customer ${customerId} (subscription deleted)`)
        }
        break
      }

      case 'invoice.payment_failed': {
        const invoice = event.data.object as Stripe.Invoice
        // Handle failed payment - could send notification, etc.
        console.log('Payment failed for invoice:', invoice.id)
        break
      }
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook handler error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Determine subscription tier from Stripe price ID
 */
function getTierFromPriceId(priceId: string | undefined): 'FREE' | 'PLUS' | 'PRO' {
  if (!priceId) return 'FREE'

  const plusPriceIds = [
    process.env.STRIPE_PLUS_MONTHLY_PRICE_ID,
    process.env.STRIPE_PLUS_YEARLY_PRICE_ID,
  ]

  const proPriceIds = [
    process.env.STRIPE_PRO_MONTHLY_PRICE_ID,
    process.env.STRIPE_PRO_YEARLY_PRICE_ID,
  ]

  if (plusPriceIds.includes(priceId)) return 'PLUS'
  if (proPriceIds.includes(priceId)) return 'PRO'

  return 'FREE'
}
