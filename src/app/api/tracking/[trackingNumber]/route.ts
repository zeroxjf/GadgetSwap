import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { getTrackingStatus, detectCarrier } from '@/lib/tracking'

/**
 * GET /api/tracking/[trackingNumber]
 * Get tracking status for a package
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ trackingNumber: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const { trackingNumber } = await params
    const searchParams = request.nextUrl.searchParams
    const carrier = searchParams.get('carrier') as any

    const status = await getTrackingStatus(trackingNumber, carrier)

    return NextResponse.json({
      ...status,
      detectedCarrier: detectCarrier(trackingNumber),
    })
  } catch (error) {
    console.error('Tracking error:', error)
    return NextResponse.json({ error: 'Failed to get tracking status' }, { status: 500 })
  }
}
