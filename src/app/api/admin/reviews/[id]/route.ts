import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isModeratorOrAdmin } from '@/lib/admin'
import { createNotification } from '@/lib/notifications'

type ReviewAction = 'APPROVED' | 'REJECTED' | 'NEEDS_INFO'

/**
 * GET /api/admin/reviews/[id]
 * Get a single listing for review
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isModeratorOrAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params

    const listing = await prisma.listing.findUnique({
      where: { id },
      include: {
        images: { orderBy: { order: 'asc' } },
        seller: {
          select: {
            id: true,
            name: true,
            email: true,
            username: true,
            image: true,
            rating: true,
            totalSales: true,
            createdAt: true,
          },
        },
        listingReviews: {
          include: {
            reviewer: {
              select: {
                id: true,
                name: true,
                username: true,
              },
            },
          },
          orderBy: { createdAt: 'desc' },
        },
      },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    return NextResponse.json({
      listing: {
        ...listing,
        price: Number(listing.price),
        seller: {
          ...listing.seller,
          rating: Number(listing.seller.rating),
        },
      },
    })
  } catch (error) {
    console.error('Admin review get error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch listing' },
      { status: 500 }
    )
  }
}

/**
 * POST /api/admin/reviews/[id]
 * Take action on a listing review (approve, reject, request info)
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    if (!(await isModeratorOrAdmin())) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { action, reason, notes } = body as {
      action: ReviewAction
      reason?: string
      notes?: string
    }

    // Validate action
    if (!['APPROVED', 'REJECTED', 'NEEDS_INFO'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action. Must be APPROVED, REJECTED, or NEEDS_INFO' },
        { status: 400 }
      )
    }

    // Require reason for rejection and needs_info
    if ((action === 'REJECTED' || action === 'NEEDS_INFO') && !reason) {
      return NextResponse.json(
        { error: 'Reason is required for rejection or requesting more info' },
        { status: 400 }
      )
    }

    // Find the listing
    const listing = await prisma.listing.findUnique({
      where: { id },
      include: { seller: true },
    })

    if (!listing) {
      return NextResponse.json({ error: 'Listing not found' }, { status: 404 })
    }

    // Build update data based on action
    const updateData: any = {
      reviewedById: session.user.id,
      reviewedAt: new Date(),
      reviewNotes: notes || null,
    }

    // Set status and reviewStatus based on action
    switch (action) {
      case 'APPROVED':
        updateData.reviewStatus = 'APPROVED'
        updateData.status = 'ACTIVE'
        updateData.verificationStatus = 'VERIFIED'
        break

      case 'REJECTED':
        updateData.reviewStatus = 'REJECTED'
        updateData.status = 'REMOVED'
        updateData.rejectionReason = reason
        break

      case 'NEEDS_INFO':
        updateData.reviewStatus = 'NEEDS_INFO'
        updateData.rejectionReason = reason // Store the request in rejectionReason field
        break
    }

    // Update listing and create audit record
    const [updatedListing] = await prisma.$transaction([
      prisma.listing.update({
        where: { id },
        data: updateData,
        include: {
          seller: {
            select: { id: true, name: true, username: true },
          },
        },
      }),
      prisma.listingReview.create({
        data: {
          listingId: id,
          reviewerId: session.user.id,
          action,
          reason: reason || null,
          notes: notes || null,
        },
      }),
    ])

    // Send notification to seller
    let notificationType: 'LISTING_APPROVED' | 'LISTING_REJECTED' | 'LISTING_NEEDS_INFO'
    let notificationTitle: string
    let notificationMessage: string

    switch (action) {
      case 'APPROVED':
        notificationType = 'LISTING_APPROVED'
        notificationTitle = 'Listing Approved!'
        notificationMessage = `Your listing "${listing.title}" has been approved and is now live!`
        break

      case 'REJECTED':
        notificationType = 'LISTING_REJECTED'
        notificationTitle = 'Listing Not Approved'
        notificationMessage = `Your listing "${listing.title}" was not approved. Reason: ${reason}`
        break

      case 'NEEDS_INFO':
        notificationType = 'LISTING_NEEDS_INFO'
        notificationTitle = 'Action Required for Listing'
        notificationMessage = `Your listing "${listing.title}" needs additional information: ${reason}`
        break
    }

    await createNotification({
      userId: listing.sellerId,
      type: notificationType,
      title: notificationTitle,
      message: notificationMessage,
      link: `/listings/${id}`,
    })

    return NextResponse.json({
      success: true,
      action,
      listingId: id,
      listing: {
        ...updatedListing,
        price: Number(updatedListing.price),
      },
    })
  } catch (error) {
    console.error('Admin review action error:', error)
    return NextResponse.json(
      { error: 'Failed to process review action' },
      { status: 500 }
    )
  }
}
