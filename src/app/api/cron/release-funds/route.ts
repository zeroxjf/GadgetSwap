import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { stripe } from '@/lib/stripe'

// Secret to verify cron requests (REQUIRED in production)
const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/release-funds
 * GET  /api/cron/release-funds (for Vercel Cron)
 *
 * Release funds for transactions where 24h escrow has passed
 *
 * Call this via:
 * - Vercel Cron (automatically authenticated)
 * - External cron service with Bearer token
 */
export async function POST(request: NextRequest) {
  try {
    // CRON_SECRET is required - reject if not configured
    if (!CRON_SECRET) {
      console.error('CRON_SECRET not configured')
      return NextResponse.json({ error: 'Server misconfiguration' }, { status: 500 })
    }

    // Verify request has valid Bearer token
    // NOTE: x-vercel-cron header can be spoofed, so we ALWAYS require the secret
    const authHeader = request.headers.get('authorization')
    const hasValidToken = authHeader === `Bearer ${CRON_SECRET}`

    if (!hasValidToken) {
      console.warn('Cron request rejected - invalid or missing authorization')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Find all transactions ready for fund release
    const readyTransactions = await prisma.transaction.findMany({
      where: {
        status: 'DELIVERED',
        fundsHeld: true,
        escrowReleaseAt: {
          lte: new Date(), // Escrow period has passed
        },
        disputeStatus: null, // No active dispute
      },
      include: {
        seller: {
          select: { id: true, stripeAccountId: true, email: true },
        },
        listing: {
          select: { id: true, title: true },
        },
      },
    })

    console.log(`Found ${readyTransactions.length} transactions ready for fund release`)

    const results = {
      processed: 0,
      succeeded: 0,
      failed: 0,
      errors: [] as string[],
    }

    for (const transaction of readyTransactions) {
      results.processed++

      try {
        if (!transaction.seller.stripeAccountId) {
          throw new Error(`Seller ${transaction.sellerId} has no Stripe account`)
        }

        if (!transaction.stripePaymentIntentId) {
          throw new Error(`Transaction ${transaction.id} has no payment intent`)
        }

        // With Stripe Connect destination charges, funds are automatically transferred
        // after the payment succeeds. The application_fee is retained by the platform.
        //
        // For manual transfer model (separate charges and transfers), we would call:
        // await stripe.transfers.create({...})
        //
        // Since we're using destination charges with automatic transfers,
        // we just need to update our records.

        // Update transaction as completed
        await prisma.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'COMPLETED',
            fundsHeld: false,
            fundsReleasedAt: new Date(),
            completedAt: new Date(),
          },
        })

        // Update listing status to SOLD
        await prisma.listing.update({
          where: { id: transaction.listingId },
          data: { status: 'SOLD' },
        })

        // Create notification for seller
        await prisma.notification.create({
          data: {
            userId: transaction.sellerId,
            type: 'TRANSACTION_UPDATE',
            title: 'Funds Released!',
            message: `$${transaction.sellerPayout.toFixed(2)} has been released for "${transaction.listing.title}"`,
            link: `/account/sales/${transaction.id}`,
          },
        })

        console.log(`Released funds for transaction ${transaction.id}`)
        results.succeeded++
      } catch (error: any) {
        console.error(`Failed to release funds for transaction ${transaction.id}:`, error)
        results.failed++
        results.errors.push(`${transaction.id}: ${error.message}`)
      }
    }

    return NextResponse.json({
      success: true,
      message: `Processed ${results.processed} transactions`,
      results,
    })
  } catch (error) {
    console.error('Release funds cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

// GET method for Vercel Cron (uses GET requests)
export async function GET(request: NextRequest) {
  return POST(request)
}
