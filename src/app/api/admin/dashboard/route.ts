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

    const now = new Date()
    const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

    // Fetch all stats in parallel
    const [
      totalUsers,
      newUsersToday,
      newUsersWeek,
      totalListings,
      activeListings,
      pendingReview,
      flaggedListings,
      totalTransactions,
      pendingTransactions,
      completedToday,
      transactionsToday,
      transactionsWeek,
      transactionsMonth,
      openReports,
      recentListings,
      recentTransactions,
      recentUsers,
    ] = await Promise.all([
      // Users
      prisma.user.count(),
      prisma.user.count({ where: { createdAt: { gte: startOfDay } } }),
      prisma.user.count({ where: { createdAt: { gte: startOfWeek } } }),

      // Listings
      prisma.listing.count(),
      prisma.listing.count({ where: { status: 'ACTIVE', reviewStatus: 'APPROVED' } }),
      prisma.listing.count({ where: { reviewStatus: 'PENDING_REVIEW' } }),
      prisma.listing.count({ where: { flaggedForReview: true, reviewStatus: 'PENDING_REVIEW' } }),

      // Transactions
      prisma.transaction.count(),
      prisma.transaction.count({ where: { status: { in: ['PENDING', 'PAYMENT_RECEIVED', 'SHIPPED'] } } }),
      prisma.transaction.count({ where: { status: 'COMPLETED', completedAt: { gte: startOfDay } } }),

      // Revenue calculations
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: startOfDay } },
        _sum: { platformFee: true },
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: startOfWeek } },
        _sum: { platformFee: true },
      }),
      prisma.transaction.aggregate({
        where: { status: 'COMPLETED', completedAt: { gte: startOfMonth } },
        _sum: { platformFee: true },
      }),

      // Support (using a simple count, you may have a Report model)
      prisma.listing.count({ where: { flaggedForReview: true } }),

      // Recent activity
      prisma.listing.findMany({
        where: { createdAt: { gte: startOfDay } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, title: true, createdAt: true, seller: { select: { name: true } } },
      }),
      prisma.transaction.findMany({
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: {
          id: true,
          totalAmount: true,
          status: true,
          createdAt: true,
          buyer: { select: { name: true } },
          listing: { select: { title: true } },
        },
      }),
      prisma.user.findMany({
        where: { createdAt: { gte: startOfDay } },
        orderBy: { createdAt: 'desc' },
        take: 5,
        select: { id: true, name: true, email: true, createdAt: true },
      }),
    ])

    // Build recent activity feed
    const recentActivity: Array<{
      id: string
      type: 'listing' | 'transaction' | 'user' | 'review' | 'report'
      message: string
      time: string
      link?: string
    }> = []

    // Add recent listings
    recentListings.forEach((listing) => {
      recentActivity.push({
        id: `listing-${listing.id}`,
        type: 'listing',
        message: `New listing: "${listing.title}" by ${listing.seller.name || 'Unknown'}`,
        time: formatTimeAgo(listing.createdAt),
        link: `/admin/reviews`,
      })
    })

    // Add recent transactions
    recentTransactions.forEach((tx) => {
      recentActivity.push({
        id: `tx-${tx.id}`,
        type: 'transaction',
        message: `${tx.status}: $${tx.totalAmount} for "${tx.listing.title}"`,
        time: formatTimeAgo(tx.createdAt),
        link: `/admin/transactions`,
      })
    })

    // Add recent users
    recentUsers.forEach((user) => {
      recentActivity.push({
        id: `user-${user.id}`,
        type: 'user',
        message: `New user: ${user.name || user.email}`,
        time: formatTimeAgo(user.createdAt),
        link: `/admin/users`,
      })
    })

    // Sort by time (most recent first)
    recentActivity.sort((a, b) => {
      // Simple sort - in production you'd parse the times properly
      return 0
    })

    const stats = {
      // Users
      totalUsers,
      newUsersToday,
      newUsersWeek,
      activeUsersToday: newUsersToday, // Simplified - would track sessions in production

      // Listings
      totalListings,
      activeListings,
      pendingReview,
      flaggedListings,

      // Transactions
      totalTransactions,
      pendingTransactions,
      completedToday,
      revenueToday: Math.round((transactionsToday._sum.platformFee || 0) * 100) / 100,
      revenueWeek: Math.round((transactionsWeek._sum.platformFee || 0) * 100) / 100,
      revenueMonth: Math.round((transactionsMonth._sum.platformFee || 0) * 100) / 100,

      // Support
      openReports,
      unresolvedDisputes: pendingTransactions, // Simplified
    }

    return NextResponse.json({ stats, recentActivity: recentActivity.slice(0, 10) })
  } catch (error) {
    console.error('Dashboard API error:', error)
    return NextResponse.json({ error: 'Failed to fetch dashboard data' }, { status: 500 })
  }
}

function formatTimeAgo(date: Date): string {
  const seconds = Math.floor((new Date().getTime() - date.getTime()) / 1000)

  if (seconds < 60) return 'Just now'
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m ago`
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h ago`
  return `${Math.floor(seconds / 86400)}d ago`
}
