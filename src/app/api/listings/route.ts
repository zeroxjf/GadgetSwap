import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import crypto from 'crypto'
import { createNotification } from '@/lib/notifications'
import { logActivity } from '@/lib/activity'
import { validateVerificationCode } from '@/lib/verification'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// AI detection threshold for flagging
const AI_FLAG_THRESHOLD = 0.5

// Active listing limits by subscription tier
const LISTING_LIMITS = {
  FREE: 3,
  PLUS: 15,
  PRO: Infinity,
}

/**
 * POST /api/listings
 * Create a new listing (goes to review queue)
 */
// Rate limit config: 10 listings per minute
const listingsRateLimit = { limit: 10, windowMs: 60 * 1000, keyPrefix: 'listings' }

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 listings per minute
    const rateCheck = checkRateLimit(request, listingsRateLimit)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in to create a listing' },
        { status: 401 }
      )
    }

    // Check subscription tier listing limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionTier: true, role: true },
    })

    // Admins bypass listing limits
    if (user?.role !== 'ADMIN') {
      const subscriptionTier = (user?.subscriptionTier || 'FREE') as keyof typeof LISTING_LIMITS
      const listingLimit = LISTING_LIMITS[subscriptionTier]

      const activeListingCount = await prisma.listing.count({
        where: {
          sellerId: session.user.id,
          status: { in: ['ACTIVE', 'PENDING'] },
        },
      })

      if (activeListingCount >= listingLimit) {
        const upgradeMessage = subscriptionTier === 'FREE'
          ? 'Upgrade to Plus for 15 listings or Pro for unlimited.'
          : subscriptionTier === 'PLUS'
          ? 'Upgrade to Pro for unlimited listings.'
          : ''

        return NextResponse.json(
          { error: `You've reached your limit of ${listingLimit} active listing${listingLimit === 1 ? '' : 's'}. ${upgradeMessage}` },
          { status: 403 }
        )
      }
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

    // Validate returnWindowDays if acceptsReturns is true
    let parsedReturnWindowDays: number | null = null
    if (acceptsReturns) {
      const windowDays = parseInt(returnWindowDays, 10)
      if (isNaN(windowDays) || !Number.isInteger(windowDays) || windowDays < 1 || windowDays > 90) {
        return NextResponse.json(
          { error: 'Return window must be an integer between 1 and 90 days' },
          { status: 400 }
        )
      }
      parsedReturnWindowDays = windowDays
    }

    // Validate storageGB if provided
    if (storageGB !== undefined && storageGB !== null && storageGB !== '') {
      const parsedStorageGB = parseInt(storageGB, 10)
      if (isNaN(parsedStorageGB) || !Number.isInteger(parsedStorageGB) || parsedStorageGB < 1 || parsedStorageGB > 2048) {
        return NextResponse.json(
          { error: 'Storage must be an integer between 1 and 2048 GB' },
          { status: 400 }
        )
      }
    }

    // Validate batteryHealth if provided
    if (batteryHealth !== undefined && batteryHealth !== null && batteryHealth !== '') {
      const parsedBatteryHealth = parseInt(batteryHealth, 10)
      if (isNaN(parsedBatteryHealth) || !Number.isInteger(parsedBatteryHealth) || parsedBatteryHealth < 0 || parsedBatteryHealth > 100) {
        return NextResponse.json(
          { error: 'Battery health must be an integer between 0 and 100' },
          { status: 400 }
        )
      }
    }

    // Require verification code and photo
    if (!verificationCode || !verificationPhotoUrl) {
      return NextResponse.json(
        { error: 'Verification code and photo are required' },
        { status: 400 }
      )
    }

    // SECURITY: Validate verification code belongs to this user and hasn't expired
    if (!validateVerificationCode(verificationCode, session.user.id)) {
      return NextResponse.json(
        { error: 'Invalid or expired verification code. Please generate a new code.' },
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
    // Uses unique constraint on imeiHash to prevent race conditions
    let listing
    try {
      listing = await prisma.listing.create({
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
        returnWindowDays: acceptsReturns ? parsedReturnWindowDays : null,
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
    } catch (createError: any) {
      // Handle unique constraint violation on imeiHash (race condition)
      if (createError.code === 'P2002' && createError.meta?.target?.includes('imeiHash')) {
        return NextResponse.json(
          { error: 'This device is already listed. Another listing with the same IMEI was just created.' },
          { status: 409 }
        )
      }
      throw createError // Re-throw other errors
    }

    // Notify admins of new listing to review (especially if flagged)
    if (shouldFlag) {
      // In production, you'd notify admin users
      console.log('🚨 FLAGGED LISTING FOR REVIEW:', listing.id, {
        aiScore: aiDetectionScore,
        safeSearch: safeSearchResults,
      })
    }

    // Log activity
    await logActivity({
      userId: session.user.id,
      type: 'LISTING_CREATED',
      description: `Created listing "${title}"`,
      metadata: { listingId: listing.id, deviceType, deviceModel, price },
    })

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
      // Public listings: must be ACTIVE, APPROVED, and either:
      // - Seller has completed Stripe onboarding, OR
      // - Seller is an admin (bypasses payout requirement)
      where.status = 'ACTIVE'
      where.reviewStatus = 'APPROVED'
      where.seller = {
        OR: [
          { stripeOnboardingComplete: true },
          { role: 'ADMIN' },
        ],
      }
    }

    // Text search
    // SECURITY: Limit search query length to prevent ReDoS attacks
    if (q) {
      const sanitizedQuery = q.slice(0, 100)

      // Smart iOS version detection
      // Matches: "iOS 17.3", "ios17.3", "17.3", "iOS 17", "17.3.1", etc.
      const iosVersionMatch = sanitizedQuery.match(/(?:ios\s*)?(\d{1,2}(?:\.\d{1,2}){0,2})/i)
      const extractedVersion = iosVersionMatch ? iosVersionMatch[1] : null

      // Build search conditions
      const searchConditions: any[] = [
        { title: { contains: sanitizedQuery, mode: 'insensitive' } },
        { description: { contains: sanitizedQuery, mode: 'insensitive' } },
        { deviceModel: { contains: sanitizedQuery, mode: 'insensitive' } },
      ]

      // If we detected an iOS version pattern, also search osVersion field
      if (extractedVersion) {
        searchConditions.push(
          { osVersion: { startsWith: extractedVersion, mode: 'insensitive' } }
        )
      }

      // Also do a direct osVersion contains search for the raw query
      // This handles searches like "17.3" directly
      searchConditions.push(
        { osVersion: { contains: sanitizedQuery.replace(/ios\s*/i, '').trim(), mode: 'insensitive' } }
      )

      where.OR = searchConditions
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
      // Map filter values to database values
      // JAILBREAKABLE -> JAILBROKEN, JAILBREAKABLE, ROOTLESS_JB, ROOTFUL_JB
      // STOCK -> NOT_JAILBROKEN
      if (jailbreakStatus === 'JAILBREAKABLE') {
        where.jailbreakStatus = { in: ['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'] }
      } else if (jailbreakStatus === 'STOCK') {
        where.jailbreakStatus = 'NOT_JAILBROKEN'
      } else {
        where.jailbreakStatus = jailbreakStatus
      }
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
