import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { issueRefund } from '@/lib/stripe'
import { isAdmin } from '@/lib/admin'

/**
 * POST /api/transactions/[id]/resolve
 * Resolve a disputed transaction (admin only)
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

    // Check if user is admin using database role
    if (!(await isAdmin())) {
      return NextResponse.json(
        { error: 'Only administrators can resolve disputes' },
        { status: 403 }
      )
    }

    const body = await request.json()
    const { resolution, refundAmount, notes } = body

    // Validate resolution type
    if (!['buyer', 'seller', 'split'].includes(resolution)) {
      return NextResponse.json(
        { error: 'Invalid resolution type. Must be: buyer, seller, or split' },
        { status: 400 }
      )
    }

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

    if (transaction.status !== 'DISPUTED') {
      return NextResponse.json(
        { error: 'Transaction is not in disputed status' },
        { status: 400 }
      )
    }

    if (!transaction.stripePaymentIntentId) {
      return NextResponse.json(
        { error: 'No payment found for this transaction' },
        { status: 400 }
      )
    }

    let finalStatus: 'REFUNDED' | 'COMPLETED' = 'COMPLETED'
    let disputeStatus: 'RESOLVED_BUYER' | 'RESOLVED_SELLER' = 'RESOLVED_SELLER'
    let refundedAmount = 0

    try {
      if (resolution === 'buyer') {
        // Full refund to buyer
        const refund = await issueRefund(
          transaction.stripePaymentIntentId,
          undefined, // Full refund
          'requested_by_customer'
        )
        refundedAmount = transaction.totalAmount
        finalStatus = 'REFUNDED'
        disputeStatus = 'RESOLVED_BUYER'
      } else if (resolution === 'split' && refundAmount) {
        // Partial refund - validate against salePrice (item price only, not tax/shipping)
        // This prevents platform loss on split resolutions
        if (refundAmount > Number(transaction.salePrice) || refundAmount <= 0) {
          return NextResponse.json(
            { error: `Invalid refund amount. Maximum refundable is $${Number(transaction.salePrice).toFixed(2)} (item price)` },
            { status: 400 }
          )
        }
        await issueRefund(
          transaction.stripePaymentIntentId,
          refundAmount,
          'requested_by_customer'
        )
        refundedAmount = refundAmount
        // If more than 50% of sale price refunded, consider it buyer win
        disputeStatus = refundAmount > Number(transaction.salePrice) / 2 ? 'RESOLVED_BUYER' : 'RESOLVED_SELLER'
        finalStatus = 'COMPLETED' // Partial refund means transaction still "completed"
      }
      // resolution === 'seller' means no refund, just release funds to seller
    } catch (stripeError: any) {
      console.error('Stripe refund error during resolution:', stripeError)
      return NextResponse.json(
        { error: `Failed to process refund: ${stripeError.message}` },
        { status: 500 }
      )
    }

    // Update transaction
    await prisma.transaction.update({
      where: { id },
      data: {
        status: finalStatus,
        disputeStatus,
        fundsHeld: false,
        fundsReleasedAt: resolution === 'seller' ? new Date() : null,
        completedAt: new Date(),
      },
    })

    // Prepare notification messages
    let buyerMessage = ''
    let sellerMessage = ''

    switch (resolution) {
      case 'buyer':
        buyerMessage = `Your dispute has been resolved in your favor. A full refund of $${transaction.totalAmount.toFixed(2)} has been issued.`
        sellerMessage = `The dispute for "${transaction.listing.title}" has been resolved in the buyer's favor. A refund has been issued.`
        break
      case 'seller':
        buyerMessage = `Your dispute has been resolved. The seller has been cleared and funds have been released to them.`
        sellerMessage = `The dispute for "${transaction.listing.title}" has been resolved in your favor. Funds have been released to your account.`
        break
      case 'split':
        buyerMessage = `Your dispute has been partially resolved. A refund of $${refundedAmount.toFixed(2)} has been issued.`
        sellerMessage = `The dispute for "${transaction.listing.title}" has been partially resolved. A partial refund of $${refundedAmount.toFixed(2)} was issued to the buyer.`
        break
    }

    // Notify both parties
    await prisma.notification.createMany({
      data: [
        {
          userId: transaction.buyerId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Resolved',
          message: buyerMessage,
          link: `/transactions/${transaction.id}`,
        },
        {
          userId: transaction.sellerId,
          type: 'DISPUTE_RESOLVED',
          title: 'Dispute Resolved',
          message: sellerMessage,
          link: `/transactions/${transaction.id}`,
        },
      ],
    })

    return NextResponse.json({
      success: true,
      resolution,
      disputeStatus,
      refundedAmount,
      message: `Dispute resolved: ${resolution}`,
    })
  } catch (error) {
    console.error('Dispute resolution error:', error)
    return NextResponse.json({ error: 'Failed to resolve dispute' }, { status: 500 })
  }
}
