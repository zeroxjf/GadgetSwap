import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { verifyIMEI, validateIMEIFormat, requiresIMEI } from '@/lib/imei'

/**
 * POST /api/imei/verify
 * Verify an IMEI number for listing creation
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { imei, deviceType } = body

    if (!imei) {
      return NextResponse.json({ error: 'IMEI is required' }, { status: 400 })
    }

    // Check if this device type requires IMEI
    if (deviceType && !requiresIMEI(deviceType)) {
      return NextResponse.json({
        success: true,
        required: false,
        message: 'IMEI verification not required for this device type',
      })
    }

    // Quick format validation first
    const formatCheck = validateIMEIFormat(imei)
    if (!formatCheck.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: formatCheck.error,
      })
    }

    // Full verification with TAC lookup
    const result = await verifyIMEI(imei)

    if (result.rateLimited) {
      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          waitTime: result.waitTime,
          error: `Too many verification requests. Please wait ${result.waitTime} seconds and try again.`,
        },
        { status: 429 }
      )
    }

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: result.error,
      })
    }

    // Check if it matches expected device type
    if (deviceType && result.isAppleDevice) {
      const expectedType = deviceType.toUpperCase()
      const actualType = result.deviceType?.toUpperCase()

      if (expectedType === 'IPHONE' && actualType !== 'IPHONE') {
        return NextResponse.json({
          success: false,
          valid: true,
          verified: false,
          error: `This IMEI belongs to ${result.modelName || result.model || 'a different device'}, not an iPhone`,
          detectedDevice: result.modelName || result.model,
        })
      }

      if (expectedType === 'IPAD' && actualType !== 'IPAD') {
        return NextResponse.json({
          success: false,
          valid: true,
          verified: false,
          error: `This IMEI belongs to ${result.modelName || result.model || 'a different device'}, not an iPad`,
          detectedDevice: result.modelName || result.model,
        })
      }
    }

    // Warn if not an Apple device
    if (!result.isAppleDevice && result.brand) {
      return NextResponse.json({
        success: false,
        valid: true,
        verified: false,
        error: `This IMEI belongs to a ${result.brand} device, not an Apple device`,
        detectedBrand: result.brand,
        detectedModel: result.model,
      })
    }

    return NextResponse.json({
      success: true,
      valid: true,
      verified: result.verified,
      brand: result.brand,
      model: result.model,
      modelName: result.modelName,
      deviceType: result.deviceType,
      isAppleDevice: result.isAppleDevice,
    })
  } catch (error) {
    console.error('IMEI verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify IMEI' },
      { status: 500 }
    )
  }
}
