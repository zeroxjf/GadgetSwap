import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { detectCarrier } from '@/lib/tracking'
import {
  notifyItemShipped,
  notifyDeliveryConfirmed,
  notifyDispute,
  notifyAdminDispute,
} from '@/lib/notifications'

/**
 * GET /api/transactions/[id]
 * Get transaction details
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: {
          include: {
            images: { orderBy: { order: 'asc' }, take: 1 },
          },
        },
        buyer: {
          select: { id: true, name: true, email: true, image: true },
        },
        seller: {
          select: { id: true, name: true, email: true, image: true },
        },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Only buyer or seller can view
    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ transaction })
  } catch (error) {
    console.error('Get transaction error:', error)
    return NextResponse.json({ error: 'Failed to get transaction' }, { status: 500 })
  }
}

/**
 * PATCH /api/transactions/[id]
 * Update transaction (shipping, delivery confirmation, etc.)
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true } },
        seller: { select: { id: true, name: true, stripeAccountId: true } },
        buyer: { select: { id: true, name: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const body = await request.json()
    const { action, trackingNumber, shippingCarrier } = body

    // Handle different actions
    switch (action) {
      case 'ship': {
        // Only seller can mark as shipped
        if (transaction.sellerId !== session.user.id) {
          return NextResponse.json({ error: 'Only seller can mark as shipped' }, { status: 403 })
        }

        if (transaction.status !== 'PAYMENT_RECEIVED') {
          return NextResponse.json({ error: 'Invalid transaction status for shipping' }, { status: 400 })
        }

        if (!trackingNumber) {
          return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
        }

        // Auto-detect carrier from tracking number if not provided
        const detectedCarrier = shippingCarrier || detectCarrier(trackingNumber)
        if (detectedCarrier === 'unknown') {
          return NextResponse.json({
            error: 'Could not detect carrier. Please specify carrier (ups, fedex, or usps)',
          }, { status: 400 })
        }

        // SECURITY FIX: Use optimistic locking - verify current status in WHERE clause
        const updateResult = await prisma.transaction.updateMany({
          where: {
            id,
            status: 'PAYMENT_RECEIVED', // Only update if still in expected state
          },
          data: {
            status: 'SHIPPED',
            trackingNumber,
            shippingCarrier: detectedCarrier.toUpperCase(),
            shippedAt: new Date(),
          },
        })

        if (updateResult.count === 0) {
          return NextResponse.json({ error: 'Transaction status has changed. Please refresh and try again.' }, { status: 409 })
        }

        // Fetch the updated transaction for the response
        const updated = await prisma.transaction.findUnique({
          where: { id },
        })

        // Notify buyer of shipment
        await notifyItemShipped({
          buyerId: transaction.buyerId,
          sellerName: transaction.seller.name || 'The seller',
          listingTitle: transaction.listing.title,
          transactionId: transaction.id,
          trackingNumber,
          carrier: detectedCarrier.toUpperCase(),
        })

        return NextResponse.json({
          transaction: updated,
          message: `Shipped via ${detectedCarrier.toUpperCase()}. Delivery will be tracked automatically.`,
        })
      }

      case 'confirm_delivery': {
        // Only buyer can confirm delivery
        if (transaction.buyerId !== session.user.id) {
          return NextResponse.json({ error: 'Only buyer can confirm delivery' }, { status: 403 })
        }

        if (transaction.status !== 'SHIPPED') {
          return NextResponse.json({ error: 'Invalid transaction status for delivery confirmation' }, { status: 400 })
        }

        // Set escrow release time to 24 hours from now
        const escrowReleaseAt = new Date()
        escrowReleaseAt.setHours(escrowReleaseAt.getHours() + 24)

        // SECURITY FIX: Use optimistic locking - verify current status in WHERE clause
        const deliveryUpdateResult = await prisma.transaction.updateMany({
          where: {
            id,
            status: 'SHIPPED', // Only update if still in expected state
          },
          data: {
            status: 'DELIVERED',
            deliveredAt: new Date(),
            escrowReleaseAt,
          },
        })

        if (deliveryUpdateResult.count === 0) {
          return NextResponse.json({ error: 'Transaction status has changed. Please refresh and try again.' }, { status: 409 })
        }

        // Fetch the updated transaction for the response
        const updated = await prisma.transaction.findUnique({
          where: { id },
        })

        // Notify seller of delivery confirmation
        await notifyDeliveryConfirmed({
          sellerId: transaction.sellerId,
          buyerName: transaction.buyer.name || 'The buyer',
          listingTitle: transaction.listing.title,
          transactionId: transaction.id,
          escrowReleaseAt,
        })

        // Fund release is handled by the cron job at /api/cron/release-funds

        return NextResponse.json({
          transaction: updated,
          message: 'Delivery confirmed. Funds will be released to seller in 24 hours.',
          escrowReleaseAt,
        })
      }

      case 'dispute': {
        // Either party can open a dispute before funds are released
        if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
          return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
        }

        if (transaction.fundsHeld === false) {
          return NextResponse.json({ error: 'Cannot dispute after funds have been released' }, { status: 400 })
        }

        const { reason } = body
        if (!reason) {
          return NextResponse.json({ error: 'Dispute reason is required' }, { status: 400 })
        }

        // SECURITY FIX: Use optimistic locking - verify funds are still held in WHERE clause
        const disputeUpdateResult = await prisma.transaction.updateMany({
          where: {
            id,
            fundsHeld: true, // Only update if funds are still held
            status: { notIn: ['DISPUTED', 'REFUNDED', 'COMPLETED'] }, // Not already disputed/resolved
          },
          data: {
            status: 'DISPUTED',
            disputeStatus: 'OPEN',
            disputeReason: reason,
            escrowReleaseAt: null, // Pause escrow release
          },
        })

        if (disputeUpdateResult.count === 0) {
          return NextResponse.json({ error: 'Transaction state has changed. Please refresh and try again.' }, { status: 409 })
        }

        // Fetch the updated transaction for the response
        const updated = await prisma.transaction.findUnique({
          where: { id },
        })

        // Determine who opened the dispute
        const isOpenerBuyer = session.user.id === transaction.buyerId
        const openerName = isOpenerBuyer
          ? (transaction.buyer.name || 'The buyer')
          : (transaction.seller.name || 'The seller')
        const otherPartyId = isOpenerBuyer ? transaction.sellerId : transaction.buyerId

        // Notify the person who opened the dispute
        await notifyDispute({
          userId: session.user.id,
          openerName,
          listingTitle: transaction.listing.title,
          transactionId: transaction.id,
          reason,
          isOpener: true,
        })

        // Notify the other party
        await notifyDispute({
          userId: otherPartyId,
          openerName,
          listingTitle: transaction.listing.title,
          transactionId: transaction.id,
          reason,
          isOpener: false,
        })

        // Notify admin
        await notifyAdminDispute({
          transactionId: transaction.id,
          buyerId: transaction.buyerId,
          sellerId: transaction.sellerId,
          listingTitle: transaction.listing.title,
          reason,
          amount: transaction.salePrice,
        })

        return NextResponse.json({
          transaction: updated,
          message: 'Dispute opened. Our team will review and contact both parties.',
        })
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Update transaction error:', error)
    return NextResponse.json({ error: 'Failed to update transaction' }, { status: 500 })
  }
}
