import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isModeratorOrAdmin } from '@/lib/admin'

/**
 * GET /api/listings/[id]
 * Get a single listing by ID
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: {
          orderBy: { order: 'asc' },
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
            image: true,
            rating: true,
            ratingCount: true,
            totalSales: true,
            createdAt: true,
            stripeOnboardingComplete: true,
            role: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Check if viewer has permission to see this listing
    const auth = await getAuthenticatedUser()
    const session = auth?.user ? { user: auth.user } : null
    const isOwnListing = session?.user?.id === listing.sellerId
    // SECURITY: Check fresh role from database to prevent stale session bypass
    const isModerator = session?.user?.id ? await isModeratorOrAdmin() : false

    // Only show non-approved listings to owner or admin
    const isPubliclyVisible = listing.status === 'ACTIVE' && listing.reviewStatus === 'APPROVED'

    if (!isPubliclyVisible && !isOwnListing && !isModerator) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    // Increment view count only for approved listings viewed by non-owners
    if (isPubliclyVisible && !isOwnListing) {
      await prisma.listing.update({
        where: { id },
        data: { views: { increment: 1 } },
      })
    }

    return NextResponse.json({ listing })
  } catch (error) {
    console.error('Get listing error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

/**
 * PUT /api/listings/[id]
 * Update a listing
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const { id } = await params

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true, reviewStatus: true, price: true, verificationCode: true, verificationPhotoUrl: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'You can only edit your own listings' }, { status: 403 })
    }

    // Can't edit sold listings
    if (listing.status === 'SOLD') {
      return NextResponse.json({ error: 'Cannot edit a sold listing' }, { status: 400 })
    }

    const body = await request.json()
    const {
      title,
      description,
      price,
      condition,
      storageGB,
      color,
      carrier,
      osVersion,
      buildNumber,
      jailbreakStatus,
      batteryHealth,
      screenReplaced,
      originalParts,
      imeiClean,
      icloudUnlocked,
      images,
      status,
    } = body

    // Build update data
    const updateData: any = {}
    if (title !== undefined) updateData.title = title
    if (description !== undefined) updateData.description = description
    if (price !== undefined) updateData.price = parseFloat(price)
    if (condition !== undefined) updateData.condition = condition
    if (storageGB !== undefined) updateData.storageGB = storageGB ? parseInt(storageGB, 10) : null
    if (color !== undefined) updateData.color = color || null
    if (carrier !== undefined) updateData.carrier = carrier || null
    if (osVersion !== undefined) updateData.osVersion = osVersion || null
    if (buildNumber !== undefined) updateData.buildNumber = buildNumber || null
    if (jailbreakStatus !== undefined) updateData.jailbreakStatus = jailbreakStatus
    if (batteryHealth !== undefined) updateData.batteryHealth = batteryHealth ? parseInt(batteryHealth, 10) : null
    if (typeof screenReplaced === 'boolean') updateData.screenReplaced = screenReplaced
    if (typeof originalParts === 'boolean') updateData.originalParts = originalParts
    if (typeof imeiClean === 'boolean') updateData.imeiClean = imeiClean
    if (typeof icloudUnlocked === 'boolean') updateData.icloudUnlocked = icloudUnlocked
    // SECURITY: State machine validation for status transitions
    // Valid transitions:
    // - PENDING → DRAFT, REMOVED
    // - ACTIVE → REMOVED, DRAFT
    // - DRAFT → PENDING (must go through review)
    // - SOLD → (terminal, no transitions)
    // - REMOVED → PENDING (must go through review)
    if (status !== undefined) {
      const validTransitions: Record<string, string[]> = {
        'PENDING': ['DRAFT', 'REMOVED'],
        'ACTIVE': ['REMOVED', 'DRAFT'],
        'DRAFT': ['PENDING'],  // Cannot go directly to ACTIVE - must go through review
        'SOLD': [],  // Terminal state - no transitions allowed
        'REMOVED': ['PENDING'],  // Must go through review to reactivate
        'EXPIRED': ['PENDING'],  // Must go through review to reactivate
      }

      const currentStatus = listing.status
      const allowedTransitions = validTransitions[currentStatus] || []

      if (!allowedTransitions.includes(status)) {
        return NextResponse.json(
          { error: `Invalid status transition from ${currentStatus} to ${status}` },
          { status: 400 }
        )
      }

      updateData.status = status

      // If transitioning to PENDING, also set review status
      if (status === 'PENDING') {
        // SECURITY: Verify that verification code and photo are present when transitioning from DRAFT to PENDING
        if (currentStatus === 'DRAFT') {
          if (!listing.verificationCode || !listing.verificationPhotoUrl) {
            return NextResponse.json(
              { error: 'Verification code and photo are required to submit for review' },
              { status: 400 }
            )
          }
        }
        updateData.reviewStatus = 'PENDING_REVIEW'
      }
    }

    // If listing was rejected or needs_info, resubmit for review when edited
    if (listing.reviewStatus === 'REJECTED' || listing.reviewStatus === 'NEEDS_INFO') {
      updateData.reviewStatus = 'PENDING_REVIEW'
      updateData.status = 'PENDING'
      updateData.rejectionReason = null // Clear old rejection reason
    }

    // Update listing
    const updatedListing = await prisma.listing.update({
      where: { id },
      data: updateData,
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
    })

    // Handle image updates if provided
    if (images && Array.isArray(images)) {
      // Delete existing images
      await prisma.listingImage.deleteMany({
        where: { listingId: id },
      })

      // Create new images
      if (images.length > 0) {
        await prisma.listingImage.createMany({
          data: images.map((url: string, index: number) => ({
            listingId: id,
            url,
            order: index,
          })),
        })
      }
    }

    // Record price change if price was updated
    if (price !== undefined && parseFloat(price) !== listing.price) {
      await prisma.priceHistory.create({
        data: {
          listingId: id,
          price: parseFloat(price),
        },
      })
    }

    // Check if listing was resubmitted for review
    const wasResubmitted = listing.reviewStatus === 'REJECTED' || listing.reviewStatus === 'NEEDS_INFO'

    return NextResponse.json({
      success: true,
      listing: updatedListing,
      resubmitted: wasResubmitted,
      message: wasResubmitted
        ? 'Listing updated and resubmitted for review'
        : 'Listing updated successfully',
    })
  } catch (error) {
    console.error('Update listing error:', error)
    return NextResponse.json({ error: 'Failed to update listing' }, { status: 500 })
  }
}

/**
 * DELETE /api/listings/[id]
 * Delete or delist a listing
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const { id } = await params

    // Verify ownership
    const listing = await prisma.listing.findUnique({
      where: { id },
      select: { sellerId: true, status: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    if (listing.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'You can only delete your own listings' }, { status: 403 })
    }

    // Can't delete if there are pending transactions
    const pendingTransactions = await prisma.transaction.findFirst({
      where: {
        listingId: id,
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'SHIPPED'],
        },
      },
    })

    if (pendingTransactions) {
      return NextResponse.json({
        error: 'Cannot delete listing with pending transactions',
      }, { status: 400 })
    }

    // If listing was sold, just mark as REMOVED (keep for history)
    if (listing.status === 'SOLD') {
      await prisma.listing.update({
        where: { id },
        data: { status: 'REMOVED' },
      })

      return NextResponse.json({
        success: true,
        message: 'Listing archived (was sold)',
      })
    }

    // Otherwise, delete completely
    await prisma.$transaction(async (tx) => {
      // Delete related data
      await tx.listingImage.deleteMany({ where: { listingId: id } })
      await tx.priceHistory.deleteMany({ where: { listingId: id } })
      await tx.watchlist.deleteMany({ where: { listingId: id } })
      await tx.message.deleteMany({ where: { listingId: id } })

      // Delete the listing
      await tx.listing.delete({ where: { id } })
    })

    return NextResponse.json({
      success: true,
      message: 'Listing deleted successfully',
    })
  } catch (error) {
    console.error('Delete listing error:', error)
    return NextResponse.json({ error: 'Failed to delete listing' }, { status: 500 })
  }
}
