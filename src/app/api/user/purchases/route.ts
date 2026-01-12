import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/user/purchases
 * Get current user's purchases (transactions where they are the buyer)
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    const purchases = await prisma.transaction.findMany({
      where: { buyerId: session.user.id },
      include: {
        listing: {
          include: {
            images: {
              orderBy: { order: 'asc' },
              take: 1,
            },
          },
        },
        seller: {
          select: {
            id: true,
            name: true,
            username: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    // SECURITY: Only expose buyer-relevant fields
    // stripeFee, platformFee, and sellerPayout are internal financial metrics
    return NextResponse.json({
      purchases: purchases.map(p => ({
        id: p.id,
        status: p.status,
        salePrice: Number(p.salePrice),
        totalAmount: Number(p.totalAmount),
        taxAmount: Number(p.taxAmount),
        shippingCost: Number(p.shippingCost),
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
        completedAt: p.completedAt,
        shippedAt: p.shippedAt,
        deliveredAt: p.deliveredAt,
        trackingNumber: p.trackingNumber,
        shippingCarrier: p.shippingCarrier,
        listing: p.listing,
        seller: p.seller,
        disputeStatus: p.disputeStatus,
        returnStatus: p.returnStatus,
      })),
    })
  } catch (error) {
    console.error('Get user purchases error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch purchases' },
      { status: 500 }
    )
  }
}
