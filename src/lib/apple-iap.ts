import { prisma } from './prisma'
import { SubscriptionTier } from '@prisma/client'

// Apple IAP Product IDs - must match App Store Connect
export const IAP_PRODUCTS = {
  PLUS_MONTHLY: 'com.JFTech.GadgetSwap.plus.monthly',
  PLUS_YEARLY: 'com.JFTech.GadgetSwap.plus.yearly',
  PRO_MONTHLY: 'com.JFTech.GadgetSwap.pro.monthly',
  PRO_YEARLY: 'com.JFTech.GadgetSwap.pro.yearly',
} as const

// Map product IDs to subscription tiers
export function getSubscriptionTierFromProductId(productId: string): SubscriptionTier {
  if (productId.includes('.plus.')) return 'PLUS'
  if (productId.includes('.pro.')) return 'PRO'
  return 'FREE'
}

// Apple verification URLs
const APPLE_VERIFY_RECEIPT_URL = 'https://buy.itunes.apple.com/verifyReceipt'
const APPLE_VERIFY_RECEIPT_SANDBOX_URL = 'https://sandbox.itunes.apple.com/verifyReceipt'

// App Store Server API URLs (for App Store Server Notifications V2)
const APP_STORE_API_PRODUCTION = 'https://api.storekit.itunes.apple.com'
const APP_STORE_API_SANDBOX = 'https://api.storekit-sandbox.itunes.apple.com'

interface AppleReceiptResponse {
  status: number
  environment: 'Production' | 'Sandbox'
  receipt: {
    bundle_id: string
    application_version: string
    in_app: Array<{
      product_id: string
      transaction_id: string
      original_transaction_id: string
      purchase_date_ms: string
      expires_date_ms?: string
      is_trial_period?: string
      is_in_intro_offer_period?: string
      cancellation_date_ms?: string
    }>
  }
  latest_receipt_info?: Array<{
    product_id: string
    transaction_id: string
    original_transaction_id: string
    purchase_date_ms: string
    expires_date_ms: string
    is_trial_period: string
    is_in_intro_offer_period: string
    cancellation_date_ms?: string
    expiration_intent?: string
  }>
  pending_renewal_info?: Array<{
    auto_renew_product_id: string
    auto_renew_status: string
    expiration_intent?: string
    is_in_billing_retry_period?: string
    product_id: string
    original_transaction_id: string
  }>
}

interface VerificationResult {
  isValid: boolean
  productId: string | null
  originalTransactionId: string | null
  expiresAt: Date | null
  environment: 'Production' | 'Sandbox' | null
  tier: SubscriptionTier
  error?: string
}

/**
 * Verify a receipt with Apple's servers
 */
export async function verifyReceipt(receiptData: string): Promise<VerificationResult> {
  const appSharedSecret = process.env.APPLE_IAP_SHARED_SECRET

  if (!appSharedSecret) {
    return {
      isValid: false,
      productId: null,
      originalTransactionId: null,
      expiresAt: null,
      environment: null,
      tier: 'FREE',
      error: 'Apple IAP shared secret not configured',
    }
  }

  const requestBody = {
    'receipt-data': receiptData,
    'password': appSharedSecret,
    'exclude-old-transactions': true,
  }

  // Try production first
  let response = await fetch(APPLE_VERIFY_RECEIPT_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(requestBody),
  })

  let result: AppleReceiptResponse = await response.json()

  // Status 21007 means receipt is from sandbox - retry with sandbox URL
  if (result.status === 21007) {
    response = await fetch(APPLE_VERIFY_RECEIPT_SANDBOX_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(requestBody),
    })
    result = await response.json()
  }

  // Check for errors
  if (result.status !== 0) {
    return {
      isValid: false,
      productId: null,
      originalTransactionId: null,
      expiresAt: null,
      environment: null,
      tier: 'FREE',
      error: getAppleErrorMessage(result.status),
    }
  }

  // Get the latest subscription info
  const latestInfo = result.latest_receipt_info?.[0]
  if (!latestInfo) {
    return {
      isValid: false,
      productId: null,
      originalTransactionId: null,
      expiresAt: null,
      environment: result.environment,
      tier: 'FREE',
      error: 'No subscription found in receipt',
    }
  }

  // Check if subscription is active (not expired and not cancelled)
  const expiresAt = new Date(parseInt(latestInfo.expires_date_ms))
  const isCancelled = !!latestInfo.cancellation_date_ms
  const isExpired = expiresAt < new Date()

  if (isCancelled || isExpired) {
    return {
      isValid: false,
      productId: latestInfo.product_id,
      originalTransactionId: latestInfo.original_transaction_id,
      expiresAt,
      environment: result.environment,
      tier: 'FREE',
      error: isCancelled ? 'Subscription was cancelled' : 'Subscription has expired',
    }
  }

  return {
    isValid: true,
    productId: latestInfo.product_id,
    originalTransactionId: latestInfo.original_transaction_id,
    expiresAt,
    environment: result.environment,
    tier: getSubscriptionTierFromProductId(latestInfo.product_id),
  }
}

/**
 * Update user's subscription based on IAP verification
 */
export async function updateUserSubscriptionFromIAP(
  userId: string,
  verificationResult: VerificationResult
): Promise<void> {
  if (!verificationResult.isValid) {
    // If invalid, check if we should downgrade
    const user = await prisma.user.findUnique({
      where: { id: userId },
      select: { iapOriginalTransactionId: true },
    })

    // Only downgrade if this was an IAP subscription
    if (user?.iapOriginalTransactionId === verificationResult.originalTransactionId) {
      await prisma.user.update({
        where: { id: userId },
        data: {
          subscriptionTier: 'FREE',
          iapProductId: null,
          iapExpiresAt: null,
          subscriptionStatus: 'expired',
        },
      })
    }
    return
  }

  await prisma.user.update({
    where: { id: userId },
    data: {
      subscriptionTier: verificationResult.tier,
      subscriptionStatus: 'active',
      iapOriginalTransactionId: verificationResult.originalTransactionId,
      iapProductId: verificationResult.productId,
      iapExpiresAt: verificationResult.expiresAt,
      iapEnvironment: verificationResult.environment,
    },
  })
}

/**
 * Handle App Store Server Notification V2
 */
export async function handleAppStoreNotification(signedPayload: string): Promise<void> {
  // Decode and verify the JWS payload
  // Note: In production, you should verify the signature using Apple's public key
  const parts = signedPayload.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWS format')
  }

  const payload = JSON.parse(Buffer.from(parts[1], 'base64').toString())

  const notificationType = payload.notificationType
  const data = payload.data

  // Decode the transaction info
  const signedTransactionInfo = data?.signedTransactionInfo
  if (!signedTransactionInfo) {
    console.log('No transaction info in notification')
    return
  }

  const transactionParts = signedTransactionInfo.split('.')
  const transactionInfo = JSON.parse(Buffer.from(transactionParts[1], 'base64').toString())

  const originalTransactionId = transactionInfo.originalTransactionId
  const productId = transactionInfo.productId
  const expiresDate = transactionInfo.expiresDate ? new Date(transactionInfo.expiresDate) : null
  const environment = data.environment

  // Find user by original transaction ID
  const user = await prisma.user.findFirst({
    where: { iapOriginalTransactionId: originalTransactionId },
  })

  if (!user) {
    console.log(`No user found for transaction ${originalTransactionId}`)
    return
  }

  switch (notificationType) {
    case 'SUBSCRIBED':
    case 'DID_RENEW':
    case 'DID_CHANGE_RENEWAL_STATUS':
      // Subscription is active
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: getSubscriptionTierFromProductId(productId),
          subscriptionStatus: 'active',
          iapProductId: productId,
          iapExpiresAt: expiresDate,
          iapEnvironment: environment,
        },
      })
      break

    case 'EXPIRED':
    case 'DID_FAIL_TO_RENEW':
      // Subscription ended
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'expired',
          iapExpiresAt: expiresDate,
        },
      })
      break

    case 'REFUND':
    case 'REVOKE':
      // Subscription refunded/revoked
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'refunded',
          iapProductId: null,
          iapExpiresAt: null,
          iapOriginalTransactionId: null,
        },
      })
      break

    case 'GRACE_PERIOD_EXPIRED':
      // Grace period ended without payment
      await prisma.user.update({
        where: { id: user.id },
        data: {
          subscriptionTier: 'FREE',
          subscriptionStatus: 'expired',
        },
      })
      break

    case 'DID_CHANGE_RENEWAL_PREF':
      // User changed their renewal preference (e.g., upgrading/downgrading)
      // The change takes effect at next renewal
      console.log(`User ${user.id} changed renewal preference to ${productId}`)
      break

    default:
      console.log(`Unhandled notification type: ${notificationType}`)
  }
}

/**
 * Get error message for Apple status code
 */
function getAppleErrorMessage(status: number): string {
  const errors: Record<number, string> = {
    21000: 'The App Store could not read the JSON object you provided.',
    21002: 'The data in the receipt-data property was malformed or missing.',
    21003: 'The receipt could not be authenticated.',
    21004: 'The shared secret you provided does not match the shared secret on file for your account.',
    21005: 'The receipt server is not currently available.',
    21006: 'This receipt is valid but the subscription has expired.',
    21007: 'This receipt is from the test environment.',
    21008: 'This receipt is from the production environment.',
    21009: 'Internal data access error.',
    21010: 'The user account cannot be found or has been deleted.',
  }
  return errors[status] || `Unknown error: ${status}`
}

/**
 * Get current subscription status for a user
 * Checks both Stripe and Apple IAP
 */
export async function getEffectiveSubscription(userId: string): Promise<{
  tier: SubscriptionTier
  source: 'stripe' | 'iap' | 'free'
  expiresAt: Date | null
  status: string | null
}> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      subscriptionTier: true,
      subscriptionStatus: true,
      subscriptionEnd: true,
      iapExpiresAt: true,
      iapProductId: true,
    },
  })

  if (!user) {
    return { tier: 'FREE', source: 'free', expiresAt: null, status: null }
  }

  const now = new Date()

  // Check Stripe subscription
  const stripeActive = user.subscriptionEnd && user.subscriptionEnd > now

  // Check IAP subscription
  const iapActive = user.iapExpiresAt && user.iapExpiresAt > now

  // Return whichever is active, preferring the higher tier
  if (stripeActive && iapActive) {
    // Both active - use higher tier
    const stripeTier = user.subscriptionTier
    const iapTier = user.iapProductId ? getSubscriptionTierFromProductId(user.iapProductId) : 'FREE'

    const tierOrder = { FREE: 0, PLUS: 1, PRO: 2 }
    if (tierOrder[iapTier] > tierOrder[stripeTier]) {
      return { tier: iapTier, source: 'iap', expiresAt: user.iapExpiresAt, status: 'active' }
    }
    return { tier: stripeTier, source: 'stripe', expiresAt: user.subscriptionEnd, status: user.subscriptionStatus }
  }

  if (stripeActive) {
    return { tier: user.subscriptionTier, source: 'stripe', expiresAt: user.subscriptionEnd, status: user.subscriptionStatus }
  }

  if (iapActive) {
    const iapTier = user.iapProductId ? getSubscriptionTierFromProductId(user.iapProductId) : 'FREE'
    return { tier: iapTier, source: 'iap', expiresAt: user.iapExpiresAt, status: 'active' }
  }

  return { tier: 'FREE', source: 'free', expiresAt: null, status: null }
}
