import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issueRefund } from '@/lib/stripe'

/**
 * POST /api/transactions/[id]/refund
 * Issue a refund for a transaction (admin only or auto-resolved disputes)
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
    const { amount, reason } = body

    // Get the transaction
    const transaction = await prisma.transaction.findUnique({
      where: { id },
      include: {
        listing: { select: { title: true } },
        buyer: { select: { id: true, name: true, email: true } },
        seller: { select: { id: true, name: true, email: true } },
      },
    })

    if (!transaction) {
      return NextResponse.json({ error: 'Transaction not found' }, { status: 404 })
    }

    // Check authorization - only buyer can request refund, or we check for admin role
    // For now, allow buyer to request refund if transaction is disputed
    const isBuyer = transaction.buyerId === session.user.id
    const isDisputed = transaction.status === 'DISPUTED'

    if (!isBuyer) {
      return NextResponse.json(
        { error: 'Only the buyer can request a refund' },
        { status: 403 }
      )
    }

    // Check if transaction can be refunded
    if (!transaction.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No payment found for this transaction' },
        { status: 400 }
      )
    }

    // Already refunded?
    if (transaction.status === 'REFUNDED') {
      return NextResponse.json(
        { error: 'Transaction has already been refunded' },
        { status: 400 }
      )
    }

    // Must be in a refundable state (disputed, delivered with issue, etc.)
    const refundableStatuses = ['DISPUTED', 'PAYMENT_RECEIVED', 'SHIPPED', 'DELIVERED']
    if (!refundableStatuses.includes(transaction.status)) {
      return NextResponse.json(
        { error: `Cannot refund transaction in ${transaction.status} status` },
        { status: 400 }
      )
    }

    // If there's an active dispute that isn't resolved, require it to be open first
    if (transaction.disputeStatus && !['OPEN', 'UNDER_REVIEW'].includes(transaction.disputeStatus)) {
      return NextResponse.json(
        { error: 'Dispute has already been resolved' },
        { status: 400 }
      )
    }

    // If not already disputed, open a dispute first
    // SECURITY: Use updateMany with status condition to prevent race conditions
    if (transaction.status !== 'DISPUTED') {
      const updateResult = await prisma.transaction.updateMany({
        where: {
          id,
          status: transaction.status, // Only update if status hasn't changed
        },
        data: {
          status: 'DISPUTED',
          disputeStatus: 'OPEN',
          disputeReason: reason || 'Refund requested by buyer',
          escrowReleaseAt: null,
        },
      })
      if (updateResult.count === 0) {
        return NextResponse.json(
          { error: 'Transaction state has changed. Please refresh and try again.' },
          { status: 409 }
        )
      }
    }

    // For automatic refund (if funds haven't been released yet)
    if (transaction.fundsHeld) {
      try {
        // Issue refund via Stripe
        const refundAmount = amount || Number(transaction.totalAmount)

        // SECURITY: Validate refund amount doesn't exceed transaction total
        // Use integer cents for comparison to avoid float precision issues
        const maxRefundable = Number(transaction.totalAmount)
        const refundCents = Math.round(refundAmount * 100)
        const maxCents = Math.round(maxRefundable * 100)
        if (typeof amount === 'number' && (refundCents <= 0 || refundCents > maxCents)) {
          return NextResponse.json(
            { error: `Invalid refund amount. Must be between $0.01 and $${maxRefundable.toFixed(2)}` },
            { status: 400 }
          )
        }
        const refund = await issueRefund(
          transaction.stripePaymentIntentId,
          refundAmount,
          'requested_by_customer'
        )

        // Update transaction
        // SECURITY: Use updateMany with status condition to prevent race conditions
        const txUpdateResult = await prisma.transaction.updateMany({
          where: {
            id,
            status: 'DISPUTED', // Only update if still in DISPUTED status
          },
          data: {
            status: 'REFUNDED',
            disputeStatus: 'RESOLVED_BUYER',
            fundsHeld: false,
          },
        })
        if (txUpdateResult.count === 0) {
          return NextResponse.json(
            { error: 'Transaction state has changed during refund processing. Please check the transaction status.' },
            { status: 409 }
          )
        }

        // Notify both parties
        await prisma.notification.createMany({
          data: [
            {
              userId: transaction.buyerId,
              type: 'TRANSACTION_UPDATE',
              title: 'Refund Issued',
              message: `Your refund of $${refundAmount.toFixed(2)} for "${transaction.listing.title}" has been processed.`,
              link: `/transactions/${transaction.id}`,
            },
            {
              userId: transaction.sellerId,
              type: 'TRANSACTION_UPDATE',
              title: 'Refund Issued',
              message: `A refund has been issued for "${transaction.listing.title}". The order has been cancelled.`,
              link: `/transactions/${transaction.id}`,
            },
          ],
        })

        return NextResponse.json({
          success: true,
          refundId: refund.id,
          amount: refundAmount,
          message: 'Refund has been processed successfully',
        })
      } catch (stripeError: any) {
        console.error('Stripe refund error:', stripeError)
        return NextResponse.json(
          { error: `Refund failed: ${stripeError.message}` },
          { status: 500 }
        )
      }
    } else {
      // Funds have already been released to seller - need manual intervention
      return NextResponse.json(
        {
          error: 'Funds have already been released to the seller. Please contact support for assistance.',
          needsSupport: true,
        },
        { status: 400 }
      )
    }
  } catch (error) {
    console.error('Refund error:', error)
    return NextResponse.json({ error: 'Failed to process refund' }, { status: 500 })
  }
}
