import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * POST /api/listings
 * Create a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to create a listing' },
        { status: 401 }
      )
    }

    const body = await request.json()

    const {
      title,
      description,
      price,
      deviceType,
      deviceModel,
      condition,
      storageGB,
      color,
      carrier,
      osVersion,
      buildNumber,
      jailbreakStatus,
      jailbreakTool,
      bootromExploit,
      batteryHealth,
      screenReplaced,
      originalParts,
      imeiClean,
      icloudUnlocked,
      acceptsReturns,
      returnWindowDays,
      images,
    } = body

    // Validate required fields
    if (!title || !description || !price || !deviceType || !deviceModel || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Create the listing
    const listing = await prisma.listing.create({
      data: {
        title,
        description,
        price: parseFloat(price),
        deviceType,
        deviceModel,
        condition,
        storageGB: storageGB ? parseInt(storageGB, 10) : null,
        color: color || null,
        carrier: carrier || null,
        osVersion: osVersion || null,
        buildNumber: buildNumber || null,
        jailbreakStatus: jailbreakStatus || 'UNKNOWN',
        jailbreakTool: jailbreakTool || null,
        bootromExploit: bootromExploit || false,
        batteryHealth: batteryHealth ? parseInt(batteryHealth, 10) : null,
        screenReplaced: screenReplaced || false,
        originalParts: originalParts ?? true,
        imeiClean: imeiClean ?? true,
        icloudUnlocked: icloudUnlocked ?? true,
        acceptsReturns: acceptsReturns ?? false,
        returnWindowDays: acceptsReturns ? (returnWindowDays || 14) : null,
        status: 'ACTIVE',
        sellerId: session.user.id,
        // Create images if provided
        images: images && images.length > 0 ? {
          create: images.map((url: string, index: number) => ({
            url,
            order: index,
          })),
        } : undefined,
      },
      include: {
        images: true,
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    return NextResponse.json({
      success: true,
      listing,
    })
  } catch (error) {
    console.error('Create listing error:', error)
    return NextResponse.json(
      { error: 'Failed to create listing' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings
 * Get listings with optional filters
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams

    // Pagination
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const offset = parseInt(searchParams.get('offset') || '0', 10)

    // Filters
    const q = searchParams.get('q')
    const featured = searchParams.get('featured') === 'true'
    const deviceType = searchParams.get('deviceType')
    const deviceModel = searchParams.get('deviceModel')
    const osVersion = searchParams.get('osVersion')
    const jailbreakStatus = searchParams.get('jailbreakStatus')
    const condition = searchParams.get('condition')
    const priceMin = searchParams.get('priceMin')
    const priceMax = searchParams.get('priceMax')
    const storageMin = searchParams.get('storageMin')
    const storageMax = searchParams.get('storageMax')
    const bootromExploit = searchParams.get('bootromExploit')
    const sellerId = searchParams.get('sellerId')

    // Sort
    const sortBy = searchParams.get('sortBy') || 'newest'

    const where: any = {
      status: 'ACTIVE',
    }

    // Text search
    if (q) {
      where.OR = [
        { title: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { deviceModel: { contains: q, mode: 'insensitive' } },
      ]
    }

    if (featured) {
      where.featured = true
    }

    if (deviceType) {
      where.deviceType = deviceType
    }

    if (deviceModel) {
      where.deviceModel = { contains: deviceModel, mode: 'insensitive' }
    }

    if (osVersion) {
      where.osVersion = osVersion
    }

    if (jailbreakStatus) {
      where.jailbreakStatus = jailbreakStatus
    }

    if (condition) {
      where.condition = condition
    }

    if (priceMin || priceMax) {
      where.price = {}
      if (priceMin) where.price.gte = parseFloat(priceMin)
      if (priceMax) where.price.lte = parseFloat(priceMax)
    }

    if (storageMin || storageMax) {
      where.storageGB = {}
      if (storageMin) where.storageGB.gte = parseInt(storageMin, 10)
      if (storageMax) where.storageGB.lte = parseInt(storageMax, 10)
    }

    if (bootromExploit === 'true') {
      where.bootromExploit = true
    }

    if (sellerId) {
      where.sellerId = sellerId
    }

    // Determine sort order
    let orderBy: any = [{ featured: 'desc' }, { createdAt: 'desc' }]
    switch (sortBy) {
      case 'oldest':
        orderBy = [{ createdAt: 'asc' }]
        break
      case 'price_asc':
        orderBy = [{ price: 'asc' }]
        break
      case 'price_desc':
        orderBy = [{ price: 'desc' }]
        break
      case 'popular':
        orderBy = [{ views: 'desc' }, { createdAt: 'desc' }]
        break
      default:
        orderBy = [{ featured: 'desc' }, { createdAt: 'desc' }]
    }

    const [listings, total] = await Promise.all([
      prisma.listing.findMany({
        where,
        include: {
          images: {
            orderBy: { order: 'asc' },
            take: 1,
          },
          seller: {
            select: {
              id: true,
              name: true,
              username: true,
              image: true,
              rating: true,
              totalSales: true,
            },
          },
        },
        orderBy,
        take: limit,
        skip: offset,
      }),
      prisma.listing.count({ where }),
    ])

    return NextResponse.json({
      listings,
      total,
      hasMore: offset + listings.length < total,
    })
  } catch (error) {
    console.error('Get listings error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listings' },
      { status: 500 }
    )
  }
}
