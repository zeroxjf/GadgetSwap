import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseThinEvent, retrieveV2Event, checkConnectAccountStatus } from '@/lib/stripe'

// =============================================================================
// STRIPE CONNECT V2 WEBHOOK HANDLER - THIN EVENTS
// =============================================================================
//
// This webhook handles V2 "thin" events for connected accounts.
// Thin events contain minimal data - you must fetch the full event to get details.
//
// SETUP INSTRUCTIONS:
// 1. Go to Stripe Dashboard > Developers > Webhooks
// 2. Click "+ Add destination"
// 3. In "Events from" section, select "Connected accounts"
// 4. Click "Show advanced options" and select "Thin" payload style
// 5. Add your endpoint URL: https://yourdomain.com/api/webhooks/stripe-connect
// 6. Select these events:
//    - v2.core.account[requirements].updated
//    - v2.core.account[configuration.merchant].capability_status_updated
//
// LOCAL TESTING:
// Run the Stripe CLI with:
// stripe listen --thin-events 'v2.core.account[requirements].updated,v2.core.account[configuration.merchant].capability_status_updated' --forward-thin-to http://localhost:3000/api/webhooks/stripe-connect
//
// PLACEHOLDER: Set STRIPE_CONNECT_WEBHOOK_SECRET in your environment variables
// Get this from the Stripe Dashboard when you create the webhook endpoint
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  // Verify webhook secret is configured
  if (!webhookSecret) {
    console.error(
      '⚠️  STRIPE_CONNECT_WEBHOOK_SECRET is not set.\n' +
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

  try {
    // Parse the thin event
    // Thin events contain minimal data - we need to fetch the full event
    const thinEvent = parseThinEvent(payload, signature, webhookSecret)

    console.log(`Received thin event: ${thinEvent.type} (${thinEvent.id})`)

    // Fetch the full event data to understand what happened
    const event = await retrieveV2Event(thinEvent.id)

    // Handle different event types
    switch (event.type) {
      case 'v2.core.account[requirements].updated':
        await handleRequirementsUpdated(event)
        break

      case 'v2.core.account[configuration.merchant].capability_status_updated':
        await handleMerchantCapabilityUpdated(event)
        break

      case 'v2.core.account[configuration.customer].capability_status_updated':
        await handleCustomerCapabilityUpdated(event)
        break

      case 'v2.core.account[configuration.recipient].capability_status_updated':
        await handleRecipientCapabilityUpdated(event)
        break

      default:
        console.log(`Unhandled event type: ${event.type}`)
    }

    return NextResponse.json({ received: true })
  } catch (error: any) {
    console.error('Webhook error:', error.message)
    return NextResponse.json(
      { error: error.message },
      { status: 400 }
    )
  }
}

// =============================================================================
// EVENT HANDLERS
// =============================================================================

/**
 * Handle requirements updated event
 *
 * This is triggered when an account's requirements change, often due to:
 * - Financial regulator changes
 * - Card network requirement updates
 * - Account verification needs
 *
 * You should collect any updated requirements from the account.
 */
async function handleRequirementsUpdated(event: any) {
  const accountId = event.related_object?.id

  if (!accountId) {
    console.error('No account ID in requirements updated event')
    return
  }

  console.log(`Requirements updated for account: ${accountId}`)

  try {
    // Fetch the current account status
    const status = await checkConnectAccountStatus(accountId)

    // Update the user's onboarding status in the database
    // TODO: If requirements are now due, you may want to notify the user
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId },
      data: {
        stripeOnboardingComplete: status.onboardingComplete && status.chargesEnabled,
        stripeAccountStatus: status.status,
      },
    })

    console.log(`Updated account status for ${accountId}: ${status.status}`)

    // If there are new requirements, you might want to:
    // 1. Send an email to the user
    // 2. Show a notification in the dashboard
    // 3. Create a new onboarding link for them to complete
    if (status.requirementsStatus === 'currently_due' || status.requirementsStatus === 'past_due') {
      console.log(`Account ${accountId} has pending requirements: ${status.requirementsStatus}`)
      // TODO: Notify user about pending requirements
    }
  } catch (error) {
    console.error(`Error updating account ${accountId}:`, error)
  }
}

/**
 * Handle merchant capability status updated event
 *
 * This is triggered when an account's merchant capabilities change.
 * For example, when card_payments becomes active or is disabled.
 */
async function handleMerchantCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id

  if (!accountId) {
    console.error('No account ID in merchant capability event')
    return
  }

  console.log(`Merchant capability updated for account: ${accountId}`)

  try {
    // Fetch the current account status
    const status = await checkConnectAccountStatus(accountId)

    // Update the database
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId },
      data: {
        stripeOnboardingComplete: status.chargesEnabled,
        stripeAccountStatus: status.status,
      },
    })

    console.log(`Updated merchant status for ${accountId}: chargesEnabled=${status.chargesEnabled}`)

    // If card payments became active, the seller can now accept payments
    if (status.chargesEnabled) {
      console.log(`Account ${accountId} is now ready to accept payments!`)
      // TODO: Notify user that they can now accept payments
      // TODO: Make their listings visible (they're filtered by stripeOnboardingComplete)
    }
  } catch (error) {
    console.error(`Error updating merchant capability for ${accountId}:`, error)
  }
}

/**
 * Handle customer capability status updated event
 *
 * This is triggered when an account's customer configuration changes.
 */
async function handleCustomerCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id

  if (!accountId) {
    console.error('No account ID in customer capability event')
    return
  }

  console.log(`Customer capability updated for account: ${accountId}`)

  // Customer capabilities are typically for accounts that also act as customers
  // (e.g., for platform subscriptions). Handle based on your needs.
  // TODO: Add handling if you use customer capabilities
}

/**
 * Handle recipient capability status updated event
 *
 * This is triggered when an account's recipient configuration changes.
 */
async function handleRecipientCapabilityUpdated(event: any) {
  const accountId = event.related_object?.id

  if (!accountId) {
    console.error('No account ID in recipient capability event')
    return
  }

  console.log(`Recipient capability updated for account: ${accountId}`)

  // Recipient capabilities are for accounts that receive payouts.
  // TODO: Add handling if you use recipient capabilities
}
