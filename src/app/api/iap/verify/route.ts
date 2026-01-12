import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyReceipt, updateUserSubscriptionFromIAP, IAP_PRODUCTS } from '@/lib/apple-iap'

/**
 * POST /api/iap/verify
 * Verify an Apple IAP receipt and update user's subscription
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { receiptData } = await request.json()

    if (!receiptData || typeof receiptData !== 'string') {
      return NextResponse.json(
        { error: 'Receipt data is required' },
        { status: 400 }
      )
    }

    // Verify the receipt with Apple
    const verificationResult = await verifyReceipt(receiptData)

    if (!verificationResult.isValid) {
      return NextResponse.json(
        {
          error: verificationResult.error || 'Invalid receipt',
          isValid: false,
        },
        { status: 400 }
      )
    }

    // Update user's subscription in database
    await updateUserSubscriptionFromIAP(session.user.id, verificationResult)

    return NextResponse.json({
      success: true,
      isValid: true,
      subscription: {
        tier: verificationResult.tier,
        productId: verificationResult.productId,
        expiresAt: verificationResult.expiresAt?.toISOString(),
        environment: verificationResult.environment,
      },
    })
  } catch (error) {
    console.error('IAP verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify receipt' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/iap/verify
 * Get available IAP product IDs
 */
export async function GET() {
  return NextResponse.json({
    products: IAP_PRODUCTS,
  })
}
