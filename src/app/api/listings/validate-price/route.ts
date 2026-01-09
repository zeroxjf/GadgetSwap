import { NextRequest, NextResponse } from 'next/server'
import {
  validateListingPrice,
  calculateMaxListingPrice,
  normalizeModelName,
  JAILBREAK_PREMIUM_MULTIPLIER,
} from '@/lib/techfare'

/**
 * POST /api/listings/validate-price
 *
 * Validates a listing price against TechFare market values
 * Allows 1.5x premium for jailbreakable devices
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { deviceModel, storageGB, price, jailbreakStatus, osVersion } = body

    if (!deviceModel || !storageGB) {
      return NextResponse.json(
        { error: 'deviceModel and storageGB are required' },
        { status: 400 }
      )
    }

    // Determine if device is jailbreakable
    const isJailbreakable =
      jailbreakStatus === 'JAILBREAKABLE' ||
      jailbreakStatus === 'JAILBROKEN' ||
      jailbreakStatus === 'ROOTLESS_JB' ||
      jailbreakStatus === 'ROOTFUL_JB'

    const normalizedModel = normalizeModelName(deviceModel)

    // If price is provided, validate it
    if (price !== undefined) {
      const validation = await validateListingPrice(
        normalizedModel,
        storageGB,
        isJailbreakable,
        price
      )

      return NextResponse.json({
        ...validation,
        isJailbreakable,
        jailbreakPremium: isJailbreakable ? JAILBREAK_PREMIUM_MULTIPLIER : 1.0,
        model: normalizedModel,
      })
    }

    // If no price provided, just return max price info
    const priceData = await calculateMaxListingPrice(
      normalizedModel,
      storageGB,
      isJailbreakable
    )

    if (!priceData) {
      return NextResponse.json({
        success: true,
        marketValue: null,
        maxPrice: null,
        isJailbreakable,
        message: 'Unable to fetch market value - no price limit applied',
        model: normalizedModel,
      })
    }

    return NextResponse.json({
      success: true,
      marketValue: priceData.marketValue,
      maxPrice: priceData.maxPrice,
      isJailbreakable,
      jailbreakPremium: priceData.multiplier,
      model: normalizedModel,
      message: isJailbreakable
        ? `Jailbreakable device: max price is $${priceData.maxPrice.toFixed(2)} (1.5x market value of $${priceData.marketValue.toFixed(2)})`
        : `Max price is $${priceData.maxPrice.toFixed(2)} (market value)`,
    })
  } catch (error) {
    console.error('Price validation error:', error)
    return NextResponse.json(
      { error: 'Failed to validate price' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings/validate-price
 *
 * Get market value and max price for a device
 * Query params: deviceModel, storageGB, jailbreakable (optional)
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceModel = searchParams.get('deviceModel')
    const storageGB = searchParams.get('storageGB')
    const jailbreakable = searchParams.get('jailbreakable') === 'true'

    if (!deviceModel || !storageGB) {
      return NextResponse.json(
        { error: 'deviceModel and storageGB query params are required' },
        { status: 400 }
      )
    }

    const normalizedModel = normalizeModelName(deviceModel)
    const storage = parseInt(storageGB, 10)

    if (isNaN(storage)) {
      return NextResponse.json(
        { error: 'storageGB must be a number' },
        { status: 400 }
      )
    }

    const priceData = await calculateMaxListingPrice(
      normalizedModel,
      storage,
      jailbreakable
    )

    if (!priceData) {
      return NextResponse.json({
        success: true,
        marketValue: null,
        maxPrice: null,
        isJailbreakable: jailbreakable,
        message: 'Unable to fetch market value for this device',
        model: normalizedModel,
      })
    }

    return NextResponse.json({
      success: true,
      marketValue: priceData.marketValue,
      maxPrice: priceData.maxPrice,
      isJailbreakable: jailbreakable,
      jailbreakPremium: priceData.multiplier,
      model: normalizedModel,
    })
  } catch (error) {
    console.error('Price lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch price data' },
      { status: 500 }
    )
  }
}
