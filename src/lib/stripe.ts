import Stripe from 'stripe'

// Initialize Stripe - will throw if used without key set
export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || '', {
  typescript: true,
})

// Platform fee percentages based on subscription tier
export const PLATFORM_FEES = {
  FREE: 0.01,    // 1%
  PLUS: 0,       // 0%
  PRO: 0,        // 0%
}

// Stripe fee: 2.9% + $0.30
export const STRIPE_FEE_PERCENT = 0.029
export const STRIPE_FEE_FIXED = 0.30

/**
 * Calculate fees for a transaction
 * Plus and Pro sellers pay 0% fees - GadgetSwap covers Stripe fees
 */
export function calculateFees(
  salePrice: number,
  subscriptionTier: 'FREE' | 'PLUS' | 'PRO' = 'FREE'
) {
  const platformFeeRate = PLATFORM_FEES[subscriptionTier]
  const platformFee = Math.round(salePrice * platformFeeRate * 100) / 100

  // Stripe fee is calculated on the total amount charged
  const rawStripeFee = Math.round((salePrice * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED) * 100) / 100

  // Plus and Pro members pay ZERO fees - GadgetSwap covers Stripe fees
  const sellerPaysStripeFee = subscriptionTier === 'FREE'
  const stripeFee = sellerPaysStripeFee ? rawStripeFee : 0

  // Seller receives: sale price - platform fee - stripe fee (if applicable)
  const sellerPayout = Math.round((salePrice - platformFee - stripeFee) * 100) / 100

  return {
    salePrice,
    platformFee,
    stripeFee,
    sellerPayout,
    gadgetSwapCoversStripeFee: !sellerPaysStripeFee,
  }
}

/**
 * Calculate total with tax and shipping
 */
export function calculateTotal(
  salePrice: number,
  taxRate: number,
  shippingCost: number = 0
) {
  const taxAmount = Math.round(salePrice * taxRate * 100) / 100
  const totalAmount = Math.round((salePrice + taxAmount + shippingCost) * 100) / 100

  return {
    salePrice,
    taxRate,
    taxAmount,
    shippingCost,
    totalAmount,
  }
}

/**
 * Create a Stripe Connect account for a seller
 */
export async function createConnectAccount(email: string, userId: string) {
  const account = await stripe.accounts.create({
    type: 'express',
    email,
    metadata: {
      userId,
    },
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
  })

  return account
}

/**
 * Create an onboarding link for a Connect account
 */
export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const accountLink = await stripe.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink.url
}

/**
 * Check if a Connect account is fully onboarded
 */
export async function checkConnectAccountStatus(accountId: string) {
  const account = await stripe.accounts.retrieve(accountId)

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    status: account.charges_enabled && account.payouts_enabled ? 'active' : 'pending',
  }
}

/**
 * Create a payment intent for a purchase
 */
export async function createPaymentIntent(
  amount: number, // in dollars
  sellerId: string,
  sellerStripeAccountId: string,
  platformFee: number,
  metadata: Record<string, string>
) {
  // Convert to cents for Stripe
  const amountCents = Math.round(amount * 100)
  const platformFeeCents = Math.round(platformFee * 100)

  const paymentIntent = await stripe.paymentIntents.create({
    amount: amountCents,
    currency: 'usd',
    automatic_payment_methods: {
      enabled: true,
    },
    // Transfer to seller's Connect account after successful payment
    transfer_data: {
      destination: sellerStripeAccountId,
    },
    // Our platform fee
    application_fee_amount: platformFeeCents,
    metadata,
  })

  return paymentIntent
}

/**
 * Transfer held funds to seller (after delivery confirmed)
 */
export async function releaseFundsToSeller(
  paymentIntentId: string,
  sellerStripeAccountId: string,
  amount: number
) {
  // For Connect with destination charges, funds are automatically transferred
  // This function is for manual transfer if using separate charges and transfers
  const transfer = await stripe.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: sellerStripeAccountId,
    source_transaction: paymentIntentId,
  })

  return transfer
}

// Stripe subscription price IDs (create in Stripe Dashboard)
export const SUBSCRIPTION_PRICES = {
  PLUS_MONTHLY: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_plus_monthly',
  PLUS_YEARLY: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || 'price_plus_yearly',
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
}

/**
 * Create a checkout session for subscription
 */
export async function createSubscriptionCheckout(
  priceId: string,
  userId: string,
  customerEmail?: string
) {
  const session = await stripe.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
    },
    customer_email: customerEmail,
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/subscription/cancel`,
  })

  return session
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripe.subscriptions.cancel(subscriptionId)
}

/**
 * Issue a refund for a payment
 */
export async function issueRefund(
  paymentIntentId: string,
  amount?: number, // in dollars, optional for partial refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer'
) {
  const refundParams: Stripe.RefundCreateParams = {
    payment_intent: paymentIntentId,
  }

  if (amount) {
    refundParams.amount = Math.round(amount * 100)
  }

  if (reason) {
    refundParams.reason = reason
  }

  return stripe.refunds.create(refundParams)
}

/**
 * Create a checkout session for a listing purchase
 */
export async function createPurchaseCheckout(
  listingId: string,
  listingTitle: string,
  amount: number,
  sellerId: string,
  buyerId: string,
  sellerStripeAccountId: string,
  platformFee: number
) {
  const amountCents = Math.round(amount * 100)
  const platformFeeCents = Math.round(platformFee * 100)

  const session = await stripe.checkout.sessions.create({
    mode: 'payment',
    line_items: [
      {
        price_data: {
          currency: 'usd',
          product_data: {
            name: listingTitle,
            description: `GadgetSwap Purchase - Listing ${listingId}`,
          },
          unit_amount: amountCents,
        },
        quantity: 1,
      },
    ],
    payment_intent_data: {
      application_fee_amount: platformFeeCents,
      transfer_data: {
        destination: sellerStripeAccountId,
      },
    },
    metadata: {
      listingId,
      buyerId,
      sellerId,
    },
    success_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${process.env.NEXT_PUBLIC_APP_URL}/checkout/cancel`,
  })

  return session
}
