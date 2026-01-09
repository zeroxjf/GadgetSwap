import { NextRequest, NextResponse } from 'next/server'
import { headers } from 'next/headers'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'
import { notifyNewSale, notifyPurchaseConfirmed } from '@/lib/notifications'
import Stripe from 'stripe'

const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  try {
    const body = await request.text()
    const headersList = await headers()
    const signature = headersList.get('stripe-signature')

    if (!signature || !webhookSecret) {
      return NextResponse.json(
        { error: 'Missing signature or webhook secret' },
        { status: 400 }
      )
    }

    let event: Stripe.Event

    try {
      event = stripe.webhooks.constructEvent(body, signature, webhookSecret)
    } catch (err: any) {
      console.error('Webhook signature verification failed:', err.message)
      return NextResponse.json(
        { error: 'Invalid signature' },
        { status: 400 }
      )
    }

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentSuccess(paymentIntent)
        break
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent
        await handlePaymentFailure(paymentIntent)
        break
      }

      case 'account.updated': {
        const account = event.data.object as Stripe.Account
        await handleAccountUpdate(account)
        break
      }

      case 'transfer.created': {
        const transfer = event.data.object as Stripe.Transfer
        console.log('Transfer created:', transfer.id)
        break
      }

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error) {
    console.error('Webhook error:', error)
    return NextResponse.json(
      { error: 'Webhook handler failed' },
      { status: 500 }
    )
  }
}

/**
 * Handle successful payment
 */
async function handlePaymentSuccess(paymentIntent: Stripe.PaymentIntent) {
  const { id: stripePaymentIntentId, metadata } = paymentIntent

  // Find the transaction with buyer and seller info
  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId },
    include: {
      listing: true,
      buyer: { select: { id: true, name: true, email: true } },
      seller: { select: { id: true, name: true, email: true } },
    },
  })

  if (!transaction) {
    console.error('Transaction not found for payment intent:', stripePaymentIntentId)
    return
  }

  // Update transaction status
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'PAYMENT_RECEIVED',
      stripeStatus: 'succeeded',
      stripeChargeId: paymentIntent.latest_charge as string,
    },
  })

  // Update listing status to PENDING (awaiting shipment)
  await prisma.listing.update({
    where: { id: transaction.listingId },
    data: { status: 'PENDING' },
  })

  // Update seller's total sales count
  await prisma.user.update({
    where: { id: transaction.sellerId },
    data: { totalSales: { increment: 1 } },
  })

  // Update buyer's total purchases count
  await prisma.user.update({
    where: { id: transaction.buyerId },
    data: { totalPurchases: { increment: 1 } },
  })

  // Send notification to seller about new sale
  await notifyNewSale({
    sellerId: transaction.sellerId,
    buyerName: transaction.buyer.name || 'A buyer',
    listingTitle: transaction.listing.title,
    listingId: transaction.listingId,
    transactionId: transaction.id,
    amount: transaction.salePrice,
  })

  // Send confirmation notification to buyer
  await notifyPurchaseConfirmed({
    buyerId: transaction.buyerId,
    sellerName: transaction.seller.name || 'The seller',
    listingTitle: transaction.listing.title,
    listingId: transaction.listingId,
    transactionId: transaction.id,
    amount: transaction.totalAmount,
  })

  console.log('Payment succeeded for transaction:', transaction.id)
}

/**
 * Handle failed payment
 */
async function handlePaymentFailure(paymentIntent: Stripe.PaymentIntent) {
  const { id: stripePaymentIntentId } = paymentIntent

  // Find and update the transaction
  const transaction = await prisma.transaction.findUnique({
    where: { stripePaymentIntentId },
  })

  if (!transaction) {
    console.error('Transaction not found for failed payment:', stripePaymentIntentId)
    return
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'CANCELLED',
      stripeStatus: 'failed',
    },
  })

  console.log('Payment failed for transaction:', transaction.id)
}

/**
 * Handle Stripe Connect account updates
 */
async function handleAccountUpdate(account: Stripe.Account) {
  const { id: stripeAccountId, charges_enabled, payouts_enabled, details_submitted } = account

  // Find user with this Stripe account
  const user = await prisma.user.findFirst({
    where: { stripeAccountId },
  })

  if (!user) {
    console.log('No user found for Stripe account:', stripeAccountId)
    return
  }

  // Determine account status
  const isComplete = charges_enabled && payouts_enabled
  const status = isComplete ? 'active' : details_submitted ? 'pending' : 'incomplete'

  // Update user's Stripe status
  await prisma.user.update({
    where: { id: user.id },
    data: {
      stripeAccountStatus: status,
      stripeOnboardingComplete: isComplete,
    },
  })

  console.log('Updated Stripe account status for user:', user.id, status)
}
