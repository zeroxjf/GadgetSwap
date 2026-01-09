import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * GET /api/user/sales
 * Get all sales for the current user (as seller)
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const sales = await prisma.transaction.findMany({
      where: {
        sellerId: session.user.id,
        status: {
          not: 'PENDING', // Don't show pending (payment not yet received)
        },
      },
      include: {
        listing: {
          select: {
            id: true,
            title: true,
            deviceModel: true,
            images: {
              take: 1,
              orderBy: { order: 'asc' },
            },
          },
        },
        buyer: {
          select: {
            id: true,
            name: true,
            email: true,
            image: true,
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })

    return NextResponse.json({ sales })
  } catch (error) {
    console.error('Get sales error:', error)
    return NextResponse.json({ error: 'Failed to fetch sales' }, { status: 500 })
  }
}
