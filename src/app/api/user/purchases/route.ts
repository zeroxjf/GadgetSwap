import { NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'

/**
 * GET /api/user/purchases
 * Get current user's purchases (transactions where they are the buyer)
 */
export async function GET() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

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

    return NextResponse.json({
      purchases: purchases.map(p => ({
        ...p,
        salePrice: Number(p.salePrice),
        platformFee: Number(p.platformFee),
        stripeFee: Number(p.stripeFee),
        sellerPayout: Number(p.sellerPayout),
        totalAmount: Number(p.salePrice),
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
