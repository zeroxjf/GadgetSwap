import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { parseWebhookEvent, checkConnectAccountStatus } from '@/lib/stripe'

// =============================================================================
// STRIPE CONNECT WEBHOOK HANDLER - EXPRESS ACCOUNTS
// =============================================================================
//
// This webhook handles events for Express connected accounts.
//
// SETUP INSTRUCTIONS:
// 1. Go to Stripe Dashboard > Developers > Webhooks
// 2. Click "+ Add endpoint"
// 3. Add your endpoint URL: https://yourdomain.com/api/webhooks/stripe-connect
// 4. Select "Connect" to listen for events from connected accounts
// 5. Select these events:
//    - account.updated
//    - account.application.authorized
//    - account.application.deauthorized
//
// LOCAL TESTING:
// stripe listen --forward-connect-to localhost:3000/api/webhooks/stripe-connect
//
const webhookSecret = process.env.STRIPE_CONNECT_WEBHOOK_SECRET

export async function POST(request: NextRequest) {
  if (!webhookSecret) {
    console.error('STRIPE_CONNECT_WEBHOOK_SECRET is not set')
    return NextResponse.json(
      { error: 'Webhook secret not configured' },
      { status: 500 }
    )
  }

  const payload = await request.text()
  const signature = request.headers.get('stripe-signature')

  if (!signature) {
    return NextResponse.json(
      { error: 'Missing stripe-signature header' },
      { status: 400 }
    )
  }

  try {
    const event = parseWebhookEvent(payload, signature, webhookSecret)

    console.log(`Received Connect event: ${event.type}`)

    switch (event.type) {
      case 'account.updated':
        await handleAccountUpdated(event.data.object as any)
        break

      case 'account.application.authorized':
        console.log('Account authorized:', (event.data.object as any).id)
        break

      case 'account.application.deauthorized':
        await handleAccountDeauthorized(event.data.object as any)
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

/**
 * Handle account.updated event
 *
 * This fires when any account details change, including:
 * - Onboarding completion
 * - Capabilities becoming active
 * - Requirements changing
 */
async function handleAccountUpdated(account: any) {
  const accountId = account.id

  console.log(`Account updated: ${accountId}`, {
    charges_enabled: account.charges_enabled,
    payouts_enabled: account.payouts_enabled,
    details_submitted: account.details_submitted,
  })

  try {
    // Update the user's onboarding status
    const result = await prisma.user.updateMany({
      where: { stripeAccountId: accountId },
      data: {
        stripeOnboardingComplete: account.charges_enabled && account.details_submitted,
        stripeAccountStatus: account.charges_enabled ? 'active' : 'pending',
      },
    })

    if (result.count > 0) {
      console.log(`Updated user with Stripe account ${accountId}`)

      // If onboarding just completed, their listings will now be visible
      if (account.charges_enabled && account.details_submitted) {
        console.log(`Account ${accountId} is now fully onboarded and can accept payments!`)
      }
    }
  } catch (error) {
    console.error(`Error updating account ${accountId}:`, error)
  }
}

/**
 * Handle account.application.deauthorized event
 *
 * This fires when a user disconnects your platform from their Stripe account.
 */
async function handleAccountDeauthorized(account: any) {
  const accountId = account.id

  console.log(`Account deauthorized: ${accountId}`)

  try {
    // Clear the Stripe account from the user
    await prisma.user.updateMany({
      where: { stripeAccountId: accountId },
      data: {
        stripeAccountId: null,
        stripeOnboardingComplete: false,
        stripeAccountStatus: null,
      },
    })

    console.log(`Cleared Stripe account for ${accountId}`)
  } catch (error) {
    console.error(`Error handling deauthorization for ${accountId}:`, error)
  }
}
