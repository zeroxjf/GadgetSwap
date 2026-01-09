import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/listings/last-sold
 *
 * Fetches the last sold price for a device with matching model and storage on GadgetSwap
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const deviceModel = searchParams.get('deviceModel')
    const storageGB = searchParams.get('storageGB')

    if (!deviceModel) {
      return NextResponse.json(
        { error: 'deviceModel is required' },
        { status: 400 }
      )
    }

    // Build the query conditions
    const whereConditions: any = {
      listing: {
        deviceModel: {
          contains: deviceModel,
          mode: 'insensitive',
        },
        status: 'SOLD',
      },
      status: 'COMPLETED',
    }

    // Add storage filter if provided
    if (storageGB) {
      const storage = parseInt(storageGB, 10)
      if (!isNaN(storage)) {
        whereConditions.listing.storageGB = storage
      }
    }

    // Find the most recent completed transaction for this device
    const lastSale = await prisma.transaction.findFirst({
      where: whereConditions,
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        salePrice: true,
        createdAt: true,
        listing: {
          select: {
            deviceModel: true,
            storageGB: true,
            condition: true,
          },
        },
      },
    })

    if (!lastSale) {
      return NextResponse.json({
        found: false,
        lastSoldPrice: null,
        message: 'No previous sales found for this device',
      })
    }

    return NextResponse.json({
      found: true,
      lastSoldPrice: lastSale.salePrice,
      soldAt: lastSale.createdAt,
      condition: lastSale.listing.condition,
      deviceModel: lastSale.listing.deviceModel,
      storageGB: lastSale.listing.storageGB,
    })
  } catch (error) {
    console.error('Last sold lookup error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch last sold price' },
      { status: 500 }
    )
  }
}
