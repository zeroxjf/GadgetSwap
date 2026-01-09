import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issueRefund } from '@/lib/stripe'
import { detectCarrier } from '@/lib/tracking'

/**
 * POST /api/transactions/[id]/return
 * Handle return requests and status updates
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    const { id } = await params

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { action } = body

    // Get the transaction with listing info
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: {
          select: {
            title: true,
            acceptsReturns: true,
            returnWindowDays: true,
          },
        },
        buyer: { select: { id: true, name: true } },
        seller: { select: { id: true, name: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    const isBuyer = transaction.buyerId === session.user.id
    const isSeller = transaction.sellerId === session.user.id

    switch (action) {
      case 'request_return': {
        // Only buyer can request return
        if (!isBuyer) {
          return NextResponse.json(
            { error: 'Only the buyer can request a return' },
            { status: 403 }
          )
        }

        // Check if listing accepts returns
        if (!transaction.listing.acceptsReturns) {
          return NextResponse.json(
            { error: 'This listing does not accept returns' },
            { status: 400 }
          )
        }

        // Check if within return window
        if (transaction.deliveredAt && transaction.listing.returnWindowDays) {
          const returnDeadline = new Date(transaction.deliveredAt)
          returnDeadline.setDate(returnDeadline.getDate() + transaction.listing.returnWindowDays)

          if (new Date() > returnDeadline) {
            return NextResponse.json(
              { error: `Return window of ${transaction.listing.returnWindowDays} days has expired` },
              { status: 400 }
            )
          }
        }

        // Must be in DELIVERED or COMPLETED status
        if (!['DELIVERED', 'COMPLETED'].includes(transaction.status)) {
          return NextResponse.json(
            { error: 'Returns can only be requested after delivery' },
            { status: 400 }
          )
        }

        // Already has a return in progress?
        if (transaction.returnStatus && !['REJECTED', 'REFUNDED'].includes(transaction.returnStatus)) {
          return NextResponse.json(
            { error: 'A return request is already in progress' },
            { status: 400 }
          )
        }

        const { reason } = body
        if (!reason) {
          return NextResponse.json({ error: 'Return reason is required' }, { status: 400 })
        }

        // Create return request
        const updated = await prisma.transaction.update({
          where: { id },
          data: {
            returnStatus: 'REQUESTED',
            returnReason: reason,
            returnRequestedAt: new Date(),
            // Pause fund release if not already released
            escrowReleaseAt: null,
          },
        })

        // Notify seller
        await prisma.notification.create({
          data: {
            userId: transaction.sellerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Return Requested',
            message: `${transaction.buyer.name || 'The buyer'} has requested a return for "${transaction.listing.title}". Reason: ${reason}`,
            link: `/transactions/${transaction.id}`,
          },
        })

        return NextResponse.json({
          success: true,
          returnStatus: 'REQUESTED',
          message: 'Return request submitted. The seller will review your request.',
        })
      }

      case 'approve_return': {
        // Only seller can approve
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can approve returns' },
            { status: 403 }
          )
        }

        if (transaction.returnStatus !== 'REQUESTED') {
          return NextResponse.json(
            { error: 'No pending return request to approve' },
            { status: 400 }
          )
        }

        const updated = await prisma.transaction.update({
          where: { id },
          data: {
            returnStatus: 'APPROVED',
            returnApprovedAt: new Date(),
          },
        })

        // Notify buyer
        await prisma.notification.create({
          data: {
            userId: transaction.buyerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Return Approved',
            message: `Your return request for "${transaction.listing.title}" has been approved. Please ship the item back.`,
            link: `/transactions/${transaction.id}`,
          },
        })

        return NextResponse.json({
          success: true,
          returnStatus: 'APPROVED',
          message: 'Return approved. Buyer has been notified to ship the item back.',
        })
      }

      case 'reject_return': {
        // Only seller can reject
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can reject returns' },
            { status: 403 }
          )
        }

        if (transaction.returnStatus !== 'REQUESTED') {
          return NextResponse.json(
            { error: 'No pending return request to reject' },
            { status: 400 }
          )
        }

        const { rejectionReason } = body

        const updated = await prisma.transaction.update({
          where: { id },
          data: {
            returnStatus: 'REJECTED',
            returnRejectedAt: new Date(),
            returnRejectionReason: rejectionReason || 'Return request denied by seller',
          },
        })

        // Notify buyer
        await prisma.notification.create({
          data: {
            userId: transaction.buyerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Return Rejected',
            message: `Your return request for "${transaction.listing.title}" was not approved. ${rejectionReason || ''}`,
            link: `/transactions/${transaction.id}`,
          },
        })

        return NextResponse.json({
          success: true,
          returnStatus: 'REJECTED',
          message: 'Return request rejected.',
        })
      }

      case 'ship_return': {
        // Only buyer can ship return
        if (!isBuyer) {
          return NextResponse.json(
            { error: 'Only the buyer can ship the return' },
            { status: 403 }
          )
        }

        if (transaction.returnStatus !== 'APPROVED') {
          return NextResponse.json(
            { error: 'Return must be approved before shipping' },
            { status: 400 }
          )
        }

        const { trackingNumber, carrier } = body
        if (!trackingNumber) {
          return NextResponse.json({ error: 'Tracking number is required' }, { status: 400 })
        }

        // Auto-detect carrier if not provided
        const detectedCarrier = carrier || detectCarrier(trackingNumber)

        const updated = await prisma.transaction.update({
          where: { id },
          data: {
            returnStatus: 'SHIPPED',
            returnTrackingNumber: trackingNumber,
            returnCarrier: detectedCarrier !== 'unknown' ? detectedCarrier.toUpperCase() : null,
            returnShippedAt: new Date(),
          },
        })

        // Notify seller
        await prisma.notification.create({
          data: {
            userId: transaction.sellerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Return Shipped',
            message: `The return for "${transaction.listing.title}" has been shipped. Tracking: ${trackingNumber}`,
            link: `/transactions/${transaction.id}`,
          },
        })

        return NextResponse.json({
          success: true,
          returnStatus: 'SHIPPED',
          trackingNumber,
          carrier: detectedCarrier,
          message: 'Return shipment recorded. Seller has been notified.',
        })
      }

      case 'confirm_return_received': {
        // Only seller can confirm receipt
        if (!isSeller) {
          return NextResponse.json(
            { error: 'Only the seller can confirm return receipt' },
            { status: 403 }
          )
        }

        if (transaction.returnStatus !== 'SHIPPED') {
          return NextResponse.json(
            { error: 'Return must be shipped before confirming receipt' },
            { status: 400 }
          )
        }

        // Update status to received
        await prisma.transaction.update({
          where: { id },
          data: {
            returnStatus: 'RECEIVED',
            returnReceivedAt: new Date(),
          },
        })

        // Process refund
        if (transaction.stripePaymentIntentId) {
          try {
            await issueRefund(
              transaction.stripePaymentIntentId,
              undefined, // Full refund
              'requested_by_customer'
            )

            // Update to refunded
            await prisma.transaction.update({
              where: { id },
              data: {
                returnStatus: 'REFUNDED',
                returnRefundedAt: new Date(),
                status: 'REFUNDED',
                fundsHeld: false,
              },
            })

            // Notify buyer
            await prisma.notification.create({
              data: {
                userId: transaction.buyerId,
                type: 'TRANSACTION_UPDATE',
                title: 'Return Complete - Refund Issued',
                message: `Your return for "${transaction.listing.title}" is complete. A refund of $${transaction.totalAmount.toFixed(2)} has been issued.`,
                link: `/transactions/${transaction.id}`,
              },
            })

            return NextResponse.json({
              success: true,
              returnStatus: 'REFUNDED',
              message: 'Return received and refund issued to buyer.',
            })
          } catch (refundError: any) {
            console.error('Refund error:', refundError)
            return NextResponse.json(
              { error: `Return received but refund failed: ${refundError.message}` },
              { status: 500 }
            )
          }
        } else {
          return NextResponse.json(
            { error: 'No payment found to refund' },
            { status: 400 }
          )
        }
      }

      default:
        return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
    }
  } catch (error) {
    console.error('Return request error:', error)
    return NextResponse.json({ error: 'Failed to process return request' }, { status: 500 })
  }
}

/**
 * GET /api/transactions/[id]/return
 * Get return status for a transaction
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
      select: {
        buyerId: true,
        sellerId: true,
        returnStatus: true,
        returnReason: true,
        returnRequestedAt: true,
        returnApprovedAt: true,
        returnRejectedAt: true,
        returnRejectionReason: true,
        returnTrackingNumber: true,
        returnCarrier: true,
        returnShippedAt: true,
        returnReceivedAt: true,
        returnRefundedAt: true,
        listing: {
          select: {
            acceptsReturns: true,
            returnWindowDays: true,
          },
        },
        deliveredAt: true,
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Only buyer or seller can view
    if (transaction.buyerId !== session.user.id && transaction.sellerId !== session.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    // Calculate if return is still possible
    let canRequestReturn = false
    let returnDeadline: Date | null = null

    if (
      transaction.listing.acceptsReturns &&
      transaction.listing.returnWindowDays &&
      transaction.deliveredAt &&
      !transaction.returnStatus
    ) {
      returnDeadline = new Date(transaction.deliveredAt)
      returnDeadline.setDate(returnDeadline.getDate() + transaction.listing.returnWindowDays)
      canRequestReturn = new Date() <= returnDeadline
    }

    return NextResponse.json({
      returnStatus: transaction.returnStatus,
      returnReason: transaction.returnReason,
      returnRequestedAt: transaction.returnRequestedAt,
      returnApprovedAt: transaction.returnApprovedAt,
      returnRejectedAt: transaction.returnRejectedAt,
      returnRejectionReason: transaction.returnRejectionReason,
      returnTrackingNumber: transaction.returnTrackingNumber,
      returnCarrier: transaction.returnCarrier,
      returnShippedAt: transaction.returnShippedAt,
      returnReceivedAt: transaction.returnReceivedAt,
      returnRefundedAt: transaction.returnRefundedAt,
      acceptsReturns: transaction.listing.acceptsReturns,
      returnWindowDays: transaction.listing.returnWindowDays,
      canRequestReturn,
      returnDeadline,
    })
  } catch (error) {
    console.error('Get return status error:', error)
    return NextResponse.json({ error: 'Failed to get return status' }, { status: 500 })
  }
}
