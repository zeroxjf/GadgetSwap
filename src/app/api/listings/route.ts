import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { createNotification } from '@/lib/notifications'

// AI detection threshold for flagging
const AI_FLAG_THRESHOLD = 0.5

/**
 * POST /api/listings
 * Create a new listing (goes to review queue)
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
      // IMEI verification fields
      imei,
      imeiVerified,
      imeiVerifiedModel,
      // Verification code and photo (NEW)
      verificationCode,
      verificationPhotoUrl,
      // AI detection results (passed from frontend after upload)
      aiDetectionScore,
      aiDetectionResult,
      safeSearchResults,
    } = body

    // Validate required fields
    if (!title || !description || !price || !deviceType || !deviceModel || !condition) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Require verification code and photo
    if (!verificationCode || !verificationPhotoUrl) {
      return NextResponse.json(
        { error: 'Verification code and photo are required' },
        { status: 400 }
      )
    }

    // Process IMEI if provided
    let imeiData: {
      imeiLast4?: string
      imeiHash?: string
      imeiVerified?: boolean
      imeiVerifiedAt?: Date
      imeiVerifiedModel?: string
    } = {}

    if (imei && imeiVerified) {
      // Store last 4 digits for display
      const cleanIMEI = imei.replace(/\D/g, '')
      imeiData.imeiLast4 = cleanIMEI.slice(-4)

      // Hash full IMEI for duplicate detection (SHA256)
      imeiData.imeiHash = crypto.createHash('sha256').update(cleanIMEI).digest('hex')

      // Check for duplicate IMEI (same device already listed by another seller)
      // Also check pending review listings
      const existingListing = await prisma.listing.findFirst({
        where: {
          imeiHash: imeiData.imeiHash,
          OR: [
            { status: 'ACTIVE' },
            { reviewStatus: 'PENDING_REVIEW' },
          ],
          sellerId: { not: session.user.id }, // Allow same user to relist
        },
      })

      if (existingListing) {
        return NextResponse.json(
          { error: 'This device is already listed by another seller' },
          { status: 400 }
        )
      }

      imeiData.imeiVerified = true
      imeiData.imeiVerifiedAt = new Date()
      imeiData.imeiVerifiedModel = imeiVerifiedModel || null
    }

    // Determine if listing should be flagged for review
    const shouldFlag =
      (aiDetectionScore && aiDetectionScore > AI_FLAG_THRESHOLD) ||
      (safeSearchResults?.adult === 'LIKELY' || safeSearchResults?.adult === 'VERY_LIKELY') ||
      (safeSearchResults?.violence === 'LIKELY' || safeSearchResults?.violence === 'VERY_LIKELY')

    // Create the listing with PENDING status and PENDING_REVIEW reviewStatus
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
        // IMEI verification data
        ...imeiData,
        // Listing status - pending review
        status: 'PENDING',
        reviewStatus: 'PENDING_REVIEW',
        sellerId: session.user.id,
        // Verification code and photo
        verificationCode,
        verificationPhotoUrl,
        verificationStatus: 'PENDING',
        // AI detection results
        aiDetectionScore: aiDetectionScore || null,
        aiDetectionResult: aiDetectionResult || null,
        aiAnalyzedAt: aiDetectionResult ? new Date() : null,
        flaggedForReview: shouldFlag,
        // SafeSearch results
        safeSearchAdult: safeSearchResults?.adult || null,
        safeSearchViolence: safeSearchResults?.violence || null,
        safeSearchRacy: safeSearchResults?.racy || null,
        // Create images - verification photo is FIRST, then user photos
        images: {
          create: [
            // Verification photo as first image
            {
              url: verificationPhotoUrl,
              order: 0,
            },
            // Then user-uploaded images
            ...(images || []).map((url: string, index: number) => ({
              url,
              order: index + 1,
            })),
          ],
        },
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

    // Notify admins of new listing to review (especially if flagged)
    if (shouldFlag) {
      // In production, you'd notify admin users
      console.log('🚨 FLAGGED LISTING FOR REVIEW:', listing.id, {
        aiScore: aiDetectionScore,
        safeSearch: safeSearchResults,
      })
    }

    return NextResponse.json({
      success: true,
      listing,
      message: 'Your listing has been submitted for review. You will be notified once it is approved.',
      pendingReview: true,
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
 * Only shows APPROVED listings in public search (unless viewing own listings)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
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
    const includeOwn = searchParams.get('includeOwn') === 'true'

    // Sort
    const sortBy = searchParams.get('sortBy') || 'newest'

    // Build where clause
    // For public search: only show ACTIVE + APPROVED listings
    // For own listings: show all statuses if includeOwn=true and sellerId matches
    const where: any = {}

    // If viewing own listings, allow all review statuses
    if (includeOwn && sellerId && session?.user?.id === sellerId) {
      where.sellerId = sellerId
      // Don't filter by status or reviewStatus - show all their listings
    } else {
      // Public listings: must be ACTIVE, APPROVED, and seller has completed Stripe onboarding
      where.status = 'ACTIVE'
      where.reviewStatus = 'APPROVED'
      where.seller = {
        stripeOnboardingComplete: true,
      }
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

    // If sellerId provided but not using includeOwn, filter public listings by seller
    if (sellerId && !includeOwn) {
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
