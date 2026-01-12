import { NextRequest, NextResponse } from 'next/server'
import { handleAppStoreNotification } from '@/lib/apple-iap'

/**
 * POST /api/webhooks/apple-iap
 * Handle App Store Server Notifications V2
 *
 * Configure this URL in App Store Connect:
 * App Store Connect → Your App → App Information → App Store Server Notifications
 * URL: https://gadgetswap.tech/api/webhooks/apple-iap
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    // App Store Server Notifications V2 sends a signed payload
    const signedPayload = body.signedPayload

    if (!signedPayload) {
      console.error('No signedPayload in webhook body')
      return NextResponse.json({ error: 'Invalid payload' }, { status: 400 })
    }

    // Process the notification
    await handleAppStoreNotification(signedPayload)

    // Always return 200 to acknowledge receipt
    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Apple IAP webhook error:', error)
    // Still return 200 to prevent Apple from retrying indefinitely
    // Log the error for investigation
    return NextResponse.json({ success: true, error: 'Logged for review' })
  }
}

/**
 * GET /api/webhooks/apple-iap
 * Health check for the webhook endpoint
 */
export async function GET() {
  return NextResponse.json({
    status: 'ok',
    message: 'Apple IAP webhook endpoint is active',
  })
}
