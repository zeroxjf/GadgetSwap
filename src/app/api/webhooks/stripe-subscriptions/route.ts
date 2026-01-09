import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripeClient } from '@/lib/stripe'
import Stripe from 'stripe'

// =============================================================================
// STRIPE SUBSCRIPTION WEBHOOK HANDLER
// =============================================================================
//
// This webhook handles subscription lifecycle events for platform subscriptions.
// These are REGULAR events (not thin events) - they contain full event data.
//
// SETUP INSTRUCTIONS:
// 1. Go to Stripe Dashboard > Developers > Webhooks
// 2. Click "+ Add destination"
// 3. Add your endpoint URL: https://yourdomain.com/api/webhooks/stripe-subscriptions
// 4. Select these events:
//    - customer.subscription.created
//    - customer.subscription.updated
//    - customer.subscription.deleted
//    - invoice.paid
//    - invoice.payment_failed
//    - payment_method.attached
//    - payment_method.detached
//    - customer.updated
//
// LOCAL TESTING:
// Run the Stripe CLI with:
// stripe listen --forward-to http://localhost:3000/api/webhooks/stripe-subscriptions
//
// PLACEHOLDER: Set STRIPE_SUBSCRIPTION_WEBHOOK_SECRET in your environment variables
// Get this from the Stripe Dashboard when you create the webhook endpoint
const webhookSecret = process.env.STRIPE_SUBSCRIPTION_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Verify webhook secret is configured
  if (!webhookSecret) {
    console.error(
      '⚠️  STRIPE_SUBSCRIPTION_WEBHOOK_SECRET is not set.\n' +
      '   Get this from: https://dashboard.stripe.com/webhooks'
    )
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  // Get the raw body and signature
  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  let event: Stripe.Event

  try {
    // Verify and construct the event
    event = stripeClient.webhooks.constructEvent(payload, signature, webhookSecret)
  } catch (error: any) {
    console.error('Webhook signature verification failed:', error.message)
    return NextResponse.json(
      { error: 'Invalid signature' },
      { status: 400 }
    )
  }

  console.log(`Received subscription event: ${event.type}`)

  try {
    // Handle different event types
    switch (event.type) {
      case 'customer.subscription.created':
        await handleSubscriptionCreated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.updated':
        await handleSubscriptionUpdated(event.data.object as Stripe.Subscription)
        break

      case 'customer.subscription.deleted':
        await handleSubscriptionDeleted(event.data.object as Stripe.Subscription)
        break

      case 'invoice.paid':
        await handleInvoicePaid(event.data.object as Stripe.Invoice)
        break

      case 'invoice.payment_failed':
        await handleInvoicePaymentFailed(event.data.object as Stripe.Invoice)
        break

      case 'payment_method.attached':
        await handlePaymentMethodAttached(event.data.object as Stripe.PaymentMethod)
        break

      case 'payment_method.detached':
        await handlePaymentMethodDetached(event.data.object as Stripe.PaymentMethod)
        break

      case 'customer.updated':
        await handleCustomerUpdated(event.data.object as Stripe.Customer)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook handler error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 500 }
    )
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle subscription created
 *
 * Called when a new subscription is created.
 * For V2 accounts, use customer_account instead of customer.
 */
async function handleSubscriptionCreated(subscription: Stripe.Subscription) {
  // V2 accounts: Get account ID from customer_account field
  // Note: subscription.customer_account has shape acct_xxx
  const accountId = (subscription as any).customer_account || subscription.customer

  console.log(`Subscription created for: ${accountId}`)
  console.log(`Subscription ID: ${subscription.id}`)
  console.log(`Status: ${subscription.status}`)

  // Get the price/product to determine subscription tier
  const priceId = subscription.items.data[0]?.price?.id
  const tier = getTierFromPriceId(priceId)

  // TODO: Update user subscription in database
  // Find user by Stripe account ID and update their subscription tier
  try {
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId as string },
      data: {
        subscriptionTier: tier,
        subscriptionId: subscription.id,
        subscriptionStatus: subscription.status,
      },
    })
    console.log(`Updated user subscription tier to: ${tier}`)
  } catch (error) {
    console.error('Error updating user subscription:', error)
  }
}

/**
 * Handle subscription updated
 *
 * Called when a subscription is upgraded, downgraded, paused, or resumed.
 * Check subscription.items.data[0].price to determine the new tier.
 * Check cancel_at_period_end to see if subscription will cancel.
 * Check pause_collection for paused subscriptions.
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const accountId = (subscription as any).customer_account || subscription.customer

  console.log(`Subscription updated for: ${accountId}`)
  console.log(`Status: ${subscription.status}`)
  console.log(`Cancel at period end: ${subscription.cancel_at_period_end}`)

  const priceId = subscription.items.data[0]?.price?.id
  const tier = getTierFromPriceId(priceId)

  // Check if subscription is paused
  const isPaused = !!(subscription as any).pause_collection

  // TODO: Update user subscription in database
  try {
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId as string },
      data: {
        subscriptionTier: subscription.cancel_at_period_end ? 'FREE' : tier,
        subscriptionStatus: subscription.status,
        // If cancel_at_period_end is true, user will downgrade at end of period
        // You might want to show a warning in the UI
      },
    })

    if (subscription.cancel_at_period_end) {
      console.log(`Subscription will cancel at end of period for: ${accountId}`)
      // TODO: Send email notification about upcoming cancellation
    }

    if (isPaused) {
      console.log(`Subscription is paused for: ${accountId}`)
      // TODO: Handle paused subscription (restrict access, etc.)
    }
  } catch (error) {
    console.error('Error updating subscription:', error)
  }
}

/**
 * Handle subscription deleted/canceled
 *
 * Called when a subscription is fully canceled.
 * Revoke access to premium features.
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const accountId = (subscription as any).customer_account || subscription.customer

  console.log(`Subscription deleted for: ${accountId}`)

  // TODO: Update user subscription in database - revert to FREE tier
  try {
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId as string },
      data: {
        subscriptionTier: 'FREE',
        subscriptionId: null,
        subscriptionStatus: 'canceled',
      },
    })
    console.log(`Reverted user to FREE tier: ${accountId}`)
    // TODO: Send email notification about subscription cancellation
  } catch (error) {
    console.error('Error handling subscription deletion:', error)
  }
}

/**
 * Handle invoice paid
 *
 * Called when an invoice is successfully paid.
 * Good time to send a receipt or confirm service access.
 */
async function handleInvoicePaid(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account || invoice.customer

  console.log(`Invoice paid for: ${accountId}`)
  console.log(`Amount: $${(invoice.amount_paid / 100).toFixed(2)}`)
  console.log(`Invoice ID: ${invoice.id}`)

  // TODO: Log payment, send receipt, etc.
}

/**
 * Handle invoice payment failed
 *
 * Called when a subscription payment fails.
 * Notify the user to update their payment method.
 */
async function handleInvoicePaymentFailed(invoice: Stripe.Invoice) {
  const accountId = (invoice as any).customer_account || invoice.customer

  console.log(`Invoice payment failed for: ${accountId}`)
  console.log(`Amount: $${(invoice.amount_due / 100).toFixed(2)}`)

  // TODO: Send email notification about failed payment
  // TODO: You might want to create a notification in the app
  // The user should update their payment method via billing portal
}

/**
 * Handle payment method attached
 *
 * Called when a customer adds a new payment method.
 */
async function handlePaymentMethodAttached(paymentMethod: Stripe.PaymentMethod) {
  const customerId = paymentMethod.customer

  console.log(`Payment method attached for customer: ${customerId}`)
  console.log(`Type: ${paymentMethod.type}`)

  // TODO: Update payment method info in your database if needed
}

/**
 * Handle payment method detached
 *
 * Called when a customer removes a payment method.
 */
async function handlePaymentMethodDetached(paymentMethod: Stripe.PaymentMethod) {
  console.log(`Payment method detached: ${paymentMethod.id}`)

  // TODO: Update payment method info in your database if needed
}

/**
 * Handle customer updated
 *
 * Called when customer billing info is updated.
 * Note: Only treat this as billing information changes.
 * Do NOT use customer email as a login credential.
 */
async function handleCustomerUpdated(customer: Stripe.Customer) {
  console.log(`Customer updated: ${customer.id}`)

  // Check if default payment method changed
  const defaultPaymentMethod = customer.invoice_settings?.default_payment_method

  if (defaultPaymentMethod) {
    console.log(`Default payment method: ${defaultPaymentMethod}`)
  }

  // TODO: Update billing info in your database if needed
  // IMPORTANT: This is only billing info - don't use it for authentication
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Determine subscription tier from Stripe price ID
 *
 * PLACEHOLDER: Update these price IDs to match your Stripe Dashboard
 */
function getTierFromPriceId(priceId: string | undefined): 'FREE' | 'PLUS' | 'PRO' {
  if (!priceId) return 'FREE'

  // Match against your price IDs
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
