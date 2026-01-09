import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getTrackingStatus, detectCarrier } from '@/lib/tracking'

const CRON_SECRET = process.env.CRON_SECRET

/**
 * POST /api/cron/check-deliveries
 * Check tracking status for shipped packages and auto-confirm delivery
 *
 * When carrier confirms delivery:
 * - Update transaction status to DELIVERED
 * - Set escrowReleaseAt to 24 hours from carrier delivery time
 */
export async function POST(request: NextRequest) {
  try {
    // Verify cron secret if set
    if (CRON_SECRET) {
      const authHeader = request.headers.get('authorization')
      if (authHeader !== `Bearer ${CRON_SECRET}`) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
      }
    }

    // Find all shipped transactions with tracking numbers
    const shippedTransactions = await prisma.transaction.findMany({
      where: {
        status: 'SHIPPED',
        trackingNumber: { not: null },
      },
      select: {
        id: true,
        trackingNumber: true,
        shippingCarrier: true,
        buyerId: true,
        sellerId: true,
        listingId: true,
        listing: {
          select: { title: true },
        },
      },
    })

    console.log(`Checking ${shippedTransactions.length} shipped packages`)

    const results = {
      checked: 0,
      delivered: 0,
      inTransit: 0,
      errors: 0,
      details: [] as any[],
    }

    for (const transaction of shippedTransactions) {
      results.checked++

      if (!transaction.trackingNumber) continue

      try {
        // Detect or use stored carrier
        const carrier = transaction.shippingCarrier?.toLowerCase() as any ||
          detectCarrier(transaction.trackingNumber)

        // Get tracking status from carrier
        const status = await getTrackingStatus(transaction.trackingNumber, carrier)

        results.details.push({
          id: transaction.id,
          tracking: transaction.trackingNumber,
          carrier: status.carrier,
          status: status.status,
          deliveredAt: status.deliveredAt,
        })

        if (status.status === 'delivered' && status.deliveredAt) {
          // Package delivered! Start 24h escrow countdown
          const escrowReleaseAt = new Date(status.deliveredAt)
          escrowReleaseAt.setHours(escrowReleaseAt.getHours() + 24)

          await prisma.transaction.update({
            where: { id: transaction.id },
            data: {
              status: 'DELIVERED',
              deliveredAt: status.deliveredAt,
              escrowReleaseAt,
            },
          })

          // Notify buyer that package was delivered
          await prisma.notification.create({
            data: {
              userId: transaction.buyerId,
              type: 'TRANSACTION_UPDATE',
              title: 'Package Delivered!',
              message: `Your "${transaction.listing.title}" has been delivered. You have 24 hours to report any issues.`,
              link: `/account/purchases/${transaction.id}`,
            },
          })

          // Notify seller that delivery was confirmed
          await prisma.notification.create({
            data: {
              userId: transaction.sellerId,
              type: 'TRANSACTION_UPDATE',
              title: 'Delivery Confirmed',
              message: `"${transaction.listing.title}" was delivered. Funds will be released in 24 hours.`,
              link: `/account/sales/${transaction.id}`,
            },
          })

          console.log(`Transaction ${transaction.id} delivered at ${status.deliveredAt}`)
          results.delivered++
        } else {
          results.inTransit++
        }
      } catch (error: any) {
        console.error(`Error checking tracking for ${transaction.id}:`, error.message)
        results.errors++
      }

      // Rate limit: wait 500ms between API calls to avoid hitting carrier limits
      await new Promise(resolve => setTimeout(resolve, 500))
    }

    return NextResponse.json({
      success: true,
      message: `Checked ${results.checked} packages, ${results.delivered} delivered`,
      results,
    })
  } catch (error) {
    console.error('Check deliveries cron error:', error)
    return NextResponse.json({ error: 'Cron job failed' }, { status: 500 })
  }
}

export async function GET(request: NextRequest) {
  return POST(request)
}
