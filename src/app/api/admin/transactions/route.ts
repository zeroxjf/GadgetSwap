import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isModeratorOrAdmin } from '@/lib/admin'

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isModeratorOrAdmin()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const searchParams = request.nextUrl.searchParams
    const page = parseInt(searchParams.get('page') || '1', 10)
    const limit = parseInt(searchParams.get('limit') || '20', 10)
    const status = searchParams.get('status')
    const search = searchParams.get('search') || ''

    const where: any = {}

    if (status && status !== 'all') {
      where.status = status
    }

    if (search) {
      where.OR = [
        { listing: { title: { contains: search, mode: 'insensitive' } } },
        { buyer: { email: { contains: search, mode: 'insensitive' } } },
        { buyer: { name: { contains: search, mode: 'insensitive' } } },
        { seller: { email: { contains: search, mode: 'insensitive' } } },
        { seller: { name: { contains: search, mode: 'insensitive' } } },
      ]
    }

    const [transactions, total, stats] = await Promise.all([
      prisma.transaction.findMany({
        where,
        include: {
          listing: {
            select: {
              id: true,
              title: true,
              deviceModel: true,
            },
          },
          buyer: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          seller: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * limit,
        take: limit,
      }),
      prisma.transaction.count({ where }),
      Promise.all([
        prisma.transaction.count(),
        prisma.transaction.count({ where: { status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'SHIPPED'] } } }),
        prisma.transaction.count({ where: { status: 'COMPLETED' } }),
        prisma.transaction.count({ where: { status: 'DISPUTED' } }),
        prisma.transaction.aggregate({
          where: { status: 'COMPLETED' },
          _sum: { platformFee: true },
        }),
      ]),
    ])

    return NextResponse.json({
      transactions,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      stats: {
        total: stats[0],
        pending: stats[1],
        completed: stats[2],
        disputed: stats[3],
        totalRevenue: Math.round((stats[4]._sum.platformFee || 0) * 100) / 100,
      },
    })
  } catch (error) {
    console.error('Admin transactions API error:', error)
    return NextResponse.json({ error: 'Failed to fetch transactions' }, { status: 500 })
  }
}
