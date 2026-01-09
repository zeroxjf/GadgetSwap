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

      // Chargeback/Dispute handling
      case 'charge.dispute.created': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeCreated(dispute)
        break
      }

      case 'charge.dispute.updated': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeUpdated(dispute)
        break
      }

      case 'charge.dispute.closed': {
        const dispute = event.data.object as Stripe.Dispute
        await handleDisputeClosed(dispute)
        break
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge
        await handleChargeRefunded(charge)
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

/**
 * Handle Stripe dispute/chargeback created
 */
async function handleDisputeCreated(dispute: Stripe.Dispute) {
  const chargeId = typeof dispute.charge === 'string' ? dispute.charge : dispute.charge?.id

  if (!chargeId) {
    console.error('No charge ID in dispute:', dispute.id)
    return
  }

  // Find transaction by charge ID
  const transaction = await prisma.transaction.findFirst({
    where: { stripeChargeId: chargeId },
    include: {
      listing: { select: { title: true } },
      buyer: { select: { id: true, name: true } },
      seller: { select: { id: true, name: true } },
    },
  })

  if (!transaction) {
    console.error('Transaction not found for charge:', chargeId)
    return
  }

  // Update transaction with dispute info
  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: 'DISPUTED',
      disputeId: dispute.id,
      disputeStatus: 'OPEN',
      disputeReason: `Stripe chargeback: ${dispute.reason}`,
      escrowReleaseAt: null, // Pause any pending fund release
      fundsHeld: true,
    },
  })

  // Notify both parties
  await prisma.notification.createMany({
    data: [
      {
        userId: transaction.buyerId,
        type: 'DISPUTE_OPENED',
        title: 'Chargeback Filed',
        message: `A chargeback has been filed for "${transaction.listing.title}". We are reviewing the case.`,
        link: `/transactions/${transaction.id}`,
      },
      {
        userId: transaction.sellerId,
        type: 'DISPUTE_OPENED',
        title: 'Chargeback Alert',
        message: `A chargeback has been filed for "${transaction.listing.title}". Funds are on hold pending resolution.`,
        link: `/transactions/${transaction.id}`,
      },
    ],
  })

  console.log('Dispute created for transaction:', transaction.id, 'Reason:', dispute.reason)
}

/**
 * Handle Stripe dispute updated
 */
async function handleDisputeUpdated(dispute: Stripe.Dispute) {
  // Find transaction by dispute ID
  const transaction = await prisma.transaction.findFirst({
    where: { disputeId: dispute.id },
  })

  if (!transaction) {
    console.log('No transaction found for dispute:', dispute.id)
    return
  }

  // Map Stripe dispute status to our status
  let disputeStatus: 'OPEN' | 'UNDER_REVIEW' | 'ESCALATED' = 'OPEN'
  if (dispute.status === 'warning_needs_response' || dispute.status === 'needs_response') {
    disputeStatus = 'UNDER_REVIEW'
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: { disputeStatus },
  })

  console.log('Dispute updated for transaction:', transaction.id, 'Status:', dispute.status)
}

/**
 * Handle Stripe dispute closed
 */
async function handleDisputeClosed(dispute: Stripe.Dispute) {
  const transaction = await prisma.transaction.findFirst({
    where: { disputeId: dispute.id },
    include: {
      listing: { select: { title: true } },
    },
  })

  if (!transaction) {
    console.log('No transaction found for dispute:', dispute.id)
    return
  }

  // Determine outcome
  const buyerWon = dispute.status === 'lost' // From platform's perspective, 'lost' means buyer won
  const sellerWon = dispute.status === 'won'

  let newStatus: 'REFUNDED' | 'COMPLETED' | 'DISPUTED' = 'DISPUTED'
  let disputeStatus: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' | 'UNDER_REVIEW' = 'UNDER_REVIEW'

  if (buyerWon) {
    newStatus = 'REFUNDED'
    disputeStatus = 'RESOLVED_BUYER'
  } else if (sellerWon) {
    newStatus = 'COMPLETED'
    disputeStatus = 'RESOLVED_SELLER'
  }

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: newStatus,
      disputeStatus,
      fundsHeld: false,
      fundsReleasedAt: sellerWon ? new Date() : null,
    },
  })

  // Notify both parties
  const resultMessage = buyerWon
    ? 'The chargeback was resolved in the buyer\'s favor. A refund has been issued.'
    : sellerWon
    ? 'The chargeback was resolved in the seller\'s favor. Funds have been released.'
    : 'The chargeback review is complete.'

  await prisma.notification.createMany({
    data: [
      {
        userId: transaction.buyerId,
        type: 'DISPUTE_RESOLVED',
        title: 'Chargeback Resolved',
        message: `${resultMessage} Order: "${transaction.listing.title}"`,
        link: `/transactions/${transaction.id}`,
      },
      {
        userId: transaction.sellerId,
        type: 'DISPUTE_RESOLVED',
        title: 'Chargeback Resolved',
        message: `${resultMessage} Order: "${transaction.listing.title}"`,
        link: `/transactions/${transaction.id}`,
      },
    ],
  })

  console.log('Dispute closed for transaction:', transaction.id, 'Status:', dispute.status)
}

/**
 * Handle charge refunded (partial or full)
 */
async function handleChargeRefunded(charge: Stripe.Charge) {
  // Find transaction by charge ID
  const transaction = await prisma.transaction.findFirst({
    where: { stripeChargeId: charge.id },
    include: {
      listing: { select: { title: true } },
    },
  })

  if (!transaction) {
    console.log('No transaction found for refunded charge:', charge.id)
    return
  }

  const refundedAmount = charge.amount_refunded / 100 // Convert from cents

  // Check if full refund
  const isFullRefund = charge.refunded

  await prisma.transaction.update({
    where: { id: transaction.id },
    data: {
      status: isFullRefund ? 'REFUNDED' : transaction.status,
      fundsHeld: false,
    },
  })

  // Notify buyer
  await prisma.notification.create({
    data: {
      userId: transaction.buyerId,
      type: 'TRANSACTION_UPDATE',
      title: isFullRefund ? 'Full Refund Issued' : 'Partial Refund Issued',
      message: `A refund of $${refundedAmount.toFixed(2)} has been issued for "${transaction.listing.title}".`,
      link: `/transactions/${transaction.id}`,
    },
  })

  console.log('Refund processed for transaction:', transaction.id, 'Amount:', refundedAmount)
}
