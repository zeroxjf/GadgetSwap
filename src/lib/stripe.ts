import Stripe from 'stripe'

// =============================================================================
// STRIPE CLIENT INITIALIZATION
// =============================================================================
// Create a Stripe client instance. The API version is automatically set by the SDK.
// PLACEHOLDER: Set your Stripe secret key in the STRIPE_SECRET_KEY environment variable
// You can find this in your Stripe Dashboard: https://dashboard.stripe.com/apikeys
const stripeSecretKey = process.env.STRIPE_SECRET_KEY

if (!stripeSecretKey) {
  console.error(
    '⚠️  STRIPE_SECRET_KEY is not set. Please add it to your .env file.\n' +
    '   Get your API key from: https://dashboard.stripe.com/apikeys'
  )
}

// Initialize Stripe client - used for all Stripe requests
export const stripeClient = new Stripe(stripeSecretKey || '', {
  typescript: true,
})

// Legacy export for backward compatibility
export const stripe = stripeClient

// =============================================================================
// PLATFORM CONFIGURATION
// =============================================================================

// Platform fee percentages based on subscription tier
export const PLATFORM_FEES = {
  FREE: 0.01,    // 1%
  PLUS: 0,       // 0%
  PRO: 0,        // 0%
}

// Stripe fee: 2.9% + $0.30
export const STRIPE_FEE_PERCENT = 0.029
export const STRIPE_FEE_FIXED = 0.30

// Stripe subscription price IDs (create in Stripe Dashboard)
// PLACEHOLDER: Set these in your environment variables after creating prices in Stripe
export const SUBSCRIPTION_PRICES = {
  PLUS_MONTHLY: process.env.STRIPE_PLUS_MONTHLY_PRICE_ID || 'price_plus_monthly',
  PLUS_YEARLY: process.env.STRIPE_PLUS_YEARLY_PRICE_ID || 'price_plus_yearly',
  PRO_MONTHLY: process.env.STRIPE_PRO_MONTHLY_PRICE_ID || 'price_pro_monthly',
  PRO_YEARLY: process.env.STRIPE_PRO_YEARLY_PRICE_ID || 'price_pro_yearly',
}

// =============================================================================
// FEE CALCULATION UTILITIES
// =============================================================================

/**
 * Calculate fees for a transaction
 * - FREE: 1% platform fee + Stripe fees (~3%)
 * - PLUS: 0% platform fee, seller pays Stripe fees (~3%)
 * - PRO: 0% platform fee, GadgetSwap covers Stripe fees (0% total)
 */
export function calculateFees(
  salePrice: number,
  subscriptionTier: 'FREE' | 'PLUS' | 'PRO' = 'FREE'
) {
  const platformFeeRate = PLATFORM_FEES[subscriptionTier]
  const platformFee = Math.round(salePrice * platformFeeRate * 100) / 100

  // Stripe fee is calculated on the total amount charged
  const rawStripeFee = Math.round((salePrice * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED) * 100) / 100

  // Only PRO members have Stripe fees covered by GadgetSwap
  // FREE and PLUS sellers pay Stripe fees
  const gadgetSwapCoversStripeFee = subscriptionTier === 'PRO'
  const stripeFee = gadgetSwapCoversStripeFee ? 0 : rawStripeFee

  // Seller receives: sale price - platform fee - stripe fee (if applicable)
  const sellerPayout = Math.round((salePrice - platformFee - stripeFee) * 100) / 100

  return {
    salePrice,
    platformFee,
    stripeFee,
    sellerPayout,
    gadgetSwapCoversStripeFee,
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

// =============================================================================
// STRIPE CONNECT - EXPRESS ACCOUNTS (Simple Marketplace Onboarding)
// =============================================================================

/**
 * Create a Stripe Connect Express account for a seller
 *
 * Express accounts have simplified onboarding - sellers only need to:
 * - Verify identity (basic info)
 * - Add bank account for payouts
 *
 * Much simpler than Standard or full accounts - perfect for marketplaces.
 *
 * @param displayName - The seller's display name
 * @param email - The seller's email address
 * @param userId - Your internal user ID (stored in metadata for reference)
 */
export async function createConnectAccount(
  displayName: string,
  email: string,
  userId: string
) {
  const account = await stripeClient.accounts.create({
    type: 'express',
    country: 'US',
    email: email,
    capabilities: {
      card_payments: { requested: true },
      transfers: { requested: true },
    },
    business_type: 'individual',
    business_profile: {
      name: displayName,
      product_description: 'Selling electronics on GadgetSwap marketplace',
    },
    metadata: {
      userId,
      platform: 'gadgetswap',
    },
  })

  return account
}

/**
 * Create an onboarding link for a Connect Express account
 *
 * This redirects the seller to Stripe's hosted Express onboarding.
 * Simple flow: verify identity -> add bank account -> done!
 *
 * @param accountId - The Stripe Connect account ID (acct_xxx)
 * @param returnUrl - URL to redirect to after successful onboarding
 * @param refreshUrl - URL to redirect to if onboarding needs to be restarted
 */
export async function createConnectOnboardingLink(
  accountId: string,
  returnUrl: string,
  refreshUrl: string
) {
  const accountLink = await stripeClient.accountLinks.create({
    account: accountId,
    refresh_url: refreshUrl,
    return_url: returnUrl,
    type: 'account_onboarding',
  })

  return accountLink.url
}

/**
 * Check if a Connect Express account is fully onboarded
 *
 * @param accountId - The Stripe Connect account ID (acct_xxx)
 */
export async function checkConnectAccountStatus(accountId: string) {
  const account = await stripeClient.accounts.retrieve(accountId)

  return {
    id: account.id,
    chargesEnabled: account.charges_enabled,
    payoutsEnabled: account.payouts_enabled,
    detailsSubmitted: account.details_submitted,
    onboardingComplete: account.charges_enabled && account.details_submitted,
    requirementsStatus: account.requirements?.currently_due?.length === 0 ? 'complete' : 'pending',
    status: account.charges_enabled ? 'active' : 'pending',
  }
}

/**
 * Create an Express dashboard login link for a connected account
 *
 * Allows sellers to access their Express dashboard to view payouts, etc.
 *
 * @param accountId - The Stripe Connect account ID
 */
export async function createExpressDashboardLink(accountId: string) {
  const loginLink = await stripeClient.accounts.createLoginLink(accountId)
  return loginLink.url
}

// =============================================================================
// WEBHOOK HANDLING - EXPRESS ACCOUNT EVENTS
// =============================================================================

/**
 * Verify and parse a Stripe webhook event
 *
 * For Express accounts, listen for these events:
 * - account.updated (onboarding status changes)
 * - account.application.authorized
 * - account.application.deauthorized
 *
 * Local testing with Stripe CLI:
 * stripe listen --forward-to localhost:3000/api/webhooks/stripe-connect
 *
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header
 * @param webhookSecret - Your webhook signing secret
 */
export function parseWebhookEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripeClient.webhooks.constructEvent(payload, signature, webhookSecret)
}

// =============================================================================
// PAYMENTS - DIRECT CHARGES WITH APPLICATION FEE
// =============================================================================

/**
 * Create a payment intent for a purchase (Direct Charge model)
 *
 * Uses direct charges where the payment is made directly to the connected account,
 * with an application fee collected by the platform.
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

  // Create payment intent on the connected account (direct charge)
  const paymentIntent = await stripeClient.paymentIntents.create(
    {
      amount: amountCents,
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      application_fee_amount: platformFeeCents,
      metadata,
    },
    {
      stripeAccount: sellerStripeAccountId, // Direct charge to connected account
    }
  )

  return paymentIntent
}

/**
 * Create a checkout session for a listing purchase using Direct Charges
 *
 * This creates a hosted checkout session on the connected account.
 * The platform collects an application fee from the transaction.
 *
 * @param listingId - Your listing ID
 * @param listingTitle - Display title for the checkout
 * @param amount - Amount in dollars
 * @param sellerId - Your internal seller ID
 * @param buyerId - Your internal buyer ID
 * @param sellerStripeAccountId - The seller's Stripe Connect account ID
 * @param platformFee - Platform fee in dollars
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

  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // Create checkout session on the connected account (direct charge)
  const session = await stripeClient.checkout.sessions.create(
    {
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
      },
      metadata: {
        listingId,
        buyerId,
        sellerId,
      },
      success_url: `${baseUrl}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${baseUrl}/checkout/cancel`,
    },
    {
      stripeAccount: sellerStripeAccountId, // Direct charge to connected account
    }
  )

  return session
}

// =============================================================================
// PRODUCTS - CONNECTED ACCOUNT PRODUCTS
// =============================================================================

/**
 * Create a product on a connected account
 *
 * Uses the Stripe-Account header to create products on the connected account's behalf.
 *
 * @param name - Product name
 * @param description - Product description
 * @param priceInCents - Price in cents
 * @param currency - Currency code (default: 'usd')
 * @param accountId - Connected account ID
 */
export async function createProductOnConnectedAccount(
  name: string,
  description: string,
  priceInCents: number,
  currency: string = 'usd',
  accountId: string
) {
  const product = await stripeClient.products.create(
    {
      name,
      description,
      default_price_data: {
        unit_amount: priceInCents,
        currency,
      },
    },
    {
      stripeAccount: accountId,
    }
  )

  return product
}

/**
 * List products on a connected account
 *
 * @param accountId - Connected account ID
 * @param limit - Maximum number of products to return
 */
export async function listProductsOnConnectedAccount(
  accountId: string,
  limit: number = 20
) {
  const products = await stripeClient.products.list(
    {
      limit,
      active: true,
      expand: ['data.default_price'],
    },
    {
      stripeAccount: accountId,
    }
  )

  return products
}

// =============================================================================
// SUBSCRIPTIONS - PLATFORM SUBSCRIPTIONS FOR CONNECTED ACCOUNTS
// =============================================================================

/**
 * Create a subscription checkout session for platform subscriptions (Plus/Pro)
 *
 * This is for users subscribing to GadgetSwap Plus or Pro plans.
 * The subscription is on the platform's Stripe account, not the connected account.
 *
 * @param priceId - The Stripe price ID for the subscription
 * @param userId - Your internal user ID
 * @param tier - The subscription tier (PLUS or PRO)
 * @param customerEmail - Customer's email for prefilling
 */
export async function createSubscriptionCheckout(
  priceId: string,
  userId: string,
  tier: 'PLUS' | 'PRO',
  customerEmail?: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  const session = await stripeClient.checkout.sessions.create({
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    metadata: {
      userId,
      tier,
    },
    customer_email: customerEmail,
    success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/subscription/cancel`,
  })

  return session
}

/**
 * Cancel a subscription
 */
export async function cancelSubscription(subscriptionId: string) {
  return stripeClient.subscriptions.cancel(subscriptionId)
}

/**
 * Create a billing portal session for managing subscriptions
 *
 * @param customerId - The Stripe customer ID
 * @param returnUrl - URL to return to after portal session
 */
export async function createBillingPortalSession(
  customerId: string,
  returnUrl: string
) {
  const session = await stripeClient.billingPortal.sessions.create({
    customer: customerId,
    return_url: returnUrl,
  })

  return session
}

// =============================================================================
// REFUNDS
// =============================================================================

/**
 * Issue a refund for a payment
 *
 * @param paymentIntentId - The payment intent ID to refund
 * @param amount - Optional amount in dollars for partial refund
 * @param reason - Optional reason for the refund
 */
export async function issueRefund(
  paymentIntentId: string,
  amount?: number,
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

  return stripeClient.refunds.create(refundParams)
}

// =============================================================================
// TRANSFERS (for manual fund release)
// =============================================================================

/**
 * Transfer held funds to seller (after delivery confirmed)
 *
 * Note: For direct charges, funds are automatically transferred.
 * This function is for manual transfer scenarios.
 */
export async function releaseFundsToSeller(
  paymentIntentId: string,
  sellerStripeAccountId: string,
  amount: number
) {
  const transfer = await stripeClient.transfers.create({
    amount: Math.round(amount * 100),
    currency: 'usd',
    destination: sellerStripeAccountId,
    source_transaction: paymentIntentId,
  })

  return transfer
}
