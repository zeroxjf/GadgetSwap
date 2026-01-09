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

// =============================================================================
// STRIPE CONNECT V2 API - ACCOUNT MANAGEMENT
// =============================================================================

/**
 * Create a Stripe Connect account for a seller using V2 API
 *
 * This uses the V2 accounts API with the following configuration:
 * - dashboard: 'full' - Sellers get full Stripe Dashboard access
 * - fees_collector: 'stripe' - Stripe handles fee collection
 * - losses_collector: 'stripe' - Stripe handles loss management
 * - card_payments capability requested
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
  // Using V2 API for account creation
  // Note: Do NOT use type: 'express' or type: 'standard' - V2 API doesn't use top-level type
  const account = await stripeClient.v2.core.accounts.create({
    display_name: displayName,
    contact_email: email,
    identity: {
      country: 'us',
    },
    dashboard: 'full',
    defaults: {
      responsibilities: {
        fees_collector: 'stripe',
        losses_collector: 'stripe',
      },
    },
    configuration: {
      customer: {},
      merchant: {
        capabilities: {
          card_payments: {
            requested: true,
          },
        },
      },
    },
    metadata: {
      userId,
      platform: 'gadgetswap',
    },
  } as any) // Type assertion needed as V2 types may not be fully available

  return account
}

/**
 * Create an onboarding link for a Connect account using V2 API
 *
 * This redirects the seller to Stripe's hosted onboarding experience.
 * After onboarding, they'll be redirected to returnUrl.
 * If they need to restart, they'll be sent to refreshUrl.
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
  // Using V2 API for account links
  const accountLink = await stripeClient.v2.core.accountLinks.create({
    account: accountId,
    use_case: {
      type: 'account_onboarding',
      account_onboarding: {
        configurations: ['merchant', 'customer'],
        refresh_url: refreshUrl,
        return_url: `${returnUrl}?accountId=${accountId}`,
      },
    },
  } as any)

  return accountLink.url
}

/**
 * Check if a Connect account is fully onboarded using V2 API
 *
 * Uses the V2 accounts API with includes to get merchant configuration
 * and requirements status in a single call.
 *
 * @param accountId - The Stripe Connect account ID (acct_xxx)
 */
export async function checkConnectAccountStatus(accountId: string) {
  // Retrieve account with merchant configuration and requirements included
  const account = await stripeClient.v2.core.accounts.retrieve(accountId, {
    include: ['configuration.merchant', 'requirements'],
  } as any)

  // Check if card payments capability is active
  const readyToProcessPayments = (account as any)?.configuration
    ?.merchant?.capabilities?.card_payments?.status === 'active'

  // Check requirements status
  const requirementsStatus = (account as any).requirements?.summary?.minimum_deadline?.status
  const onboardingComplete = requirementsStatus !== 'currently_due' && requirementsStatus !== 'past_due'

  return {
    id: account.id,
    chargesEnabled: readyToProcessPayments,
    payoutsEnabled: readyToProcessPayments, // V2 combines these
    detailsSubmitted: onboardingComplete,
    onboardingComplete,
    requirementsStatus,
    status: readyToProcessPayments ? 'active' : 'pending',
  }
}

// =============================================================================
// WEBHOOK HANDLING - V2 THIN EVENTS
// =============================================================================

/**
 * Parse a thin event from Stripe webhook
 *
 * V2 accounts use "thin" events which contain minimal data.
 * You must fetch the full event data using the event ID.
 *
 * To set up webhooks for V2 accounts:
 * 1. Go to Stripe Dashboard > Developers > Webhooks
 * 2. Click "+ Add destination"
 * 3. In "Events from" section, select "Connected accounts"
 * 4. Click "Show advanced options" and select "Thin" payload style
 * 5. Search for "v2" events and select:
 *    - v2.account[requirements].updated
 *    - v2.account[configuration.merchant].capability_status_updated
 *
 * Local testing with Stripe CLI:
 * stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated' --forward-thin-to http://localhost:3000/api/webhooks/stripe-connect
 *
 * @param payload - Raw request body
 * @param signature - Stripe-Signature header
 * @param webhookSecret - Your webhook signing secret
 */
export function parseThinEvent(
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
) {
  return stripeClient.parseThinEvent(payload, signature, webhookSecret)
}

/**
 * Retrieve full event data from a thin event
 *
 * @param eventId - The event ID from the thin event
 */
export async function retrieveV2Event(eventId: string) {
  return stripeClient.v2.core.events.retrieve(eventId)
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
 * Create a subscription checkout for a connected account
 *
 * V2 accounts use customer_account instead of customer for subscriptions.
 * This allows the connected account ID to be used directly.
 *
 * @param connectedAccountId - The connected account ID (acct_xxx)
 * @param priceId - The Stripe price ID for the subscription
 */
export async function createSubscriptionCheckoutForConnectedAccount(
  connectedAccountId: string,
  priceId: string
) {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'

  // V2 accounts: use customer_account instead of customer
  const session = await stripeClient.checkout.sessions.create({
    customer_account: connectedAccountId, // V2: Use connected account ID directly
    mode: 'subscription',
    line_items: [
      {
        price: priceId,
        quantity: 1,
      },
    ],
    success_url: `${baseUrl}/subscription/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${baseUrl}/subscription/cancel`,
  } as any) // Type assertion for V2 fields

  return session
}

/**
 * Create a billing portal session for a connected account
 *
 * Allows the connected account to manage their subscription.
 *
 * @param connectedAccountId - The connected account ID
 * @param returnUrl - URL to return to after portal session
 */
export async function createBillingPortalSession(
  connectedAccountId: string,
  returnUrl: string
) {
  const session = await stripeClient.billingPortal.sessions.create({
    customer_account: connectedAccountId, // V2: Use connected account ID directly
    return_url: returnUrl,
  } as any)

  return session
}

/**
 * Legacy subscription checkout (for backward compatibility)
 *
 * @deprecated Use createSubscriptionCheckoutForConnectedAccount for V2 accounts
 */
export async function createSubscriptionCheckout(
  priceId: string,
  userId: string,
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
