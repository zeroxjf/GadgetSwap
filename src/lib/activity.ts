import { prisma } from '@/lib/prisma'
import { ActivityType } from '@prisma/client'

interface LogActivityOptions {
  userId: string
  type: ActivityType
  description: string
  metadata?: Record<string, any>
  ipAddress?: string
  userAgent?: string
}

/**
 * Log a user activity event
 */
export async function logActivity({
  userId,
  type,
  description,
  metadata,
  ipAddress,
  userAgent,
}: LogActivityOptions) {
  try {
    await prisma.activityLog.create({
      data: {
        userId,
        type,
        description,
        metadata: metadata || undefined,
        ipAddress,
        userAgent,
      },
    })
  } catch (error) {
    // Don't throw - activity logging should never break the main flow
    console.error('Failed to log activity:', error)
  }
}

/**
 * Get activity logs for a specific user
 */
export async function getUserActivity(
  userId: string,
  options: { limit?: number; offset?: number } = {}
) {
  const { limit = 50, offset = 0 } = options

  return prisma.activityLog.findMany({
    where: { userId },
    orderBy: { createdAt: 'desc' },
    skip: offset,
    take: limit,
  })
}

/**
 * Get recent activity across all users
 */
export async function getRecentActivity(limit = 20) {
  return prisma.activityLog.findMany({
    orderBy: { createdAt: 'desc' },
    take: limit,
  })
}

/**
 * Get activity metrics for the dashboard
 */
export async function getActivityMetrics() {
  const now = new Date()
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  const [
    // Active users (unique users with activity)
    activeUsersToday,
    activeUsersWeek,
    activeUsersMonth,

    // Activity counts by type today
    loginsToday,
    listingsCreatedToday,
    purchasesToday,
    messagesSentToday,

    // Activity counts by type this week
    loginsWeek,
    listingsCreatedWeek,
    purchasesWeek,
    messagesSentWeek,

    // Total activity counts
    totalActivityToday,
    totalActivityWeek,
  ] = await Promise.all([
    // Active users
    prisma.activityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfDay } },
    }).then(r => r.length),
    prisma.activityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfWeek } },
    }).then(r => r.length),
    prisma.activityLog.groupBy({
      by: ['userId'],
      where: { createdAt: { gte: startOfMonth } },
    }).then(r => r.length),

    // Today's activity by type
    prisma.activityLog.count({ where: { type: 'LOGIN', createdAt: { gte: startOfDay } } }),
    prisma.activityLog.count({ where: { type: 'LISTING_CREATED', createdAt: { gte: startOfDay } } }),
    prisma.activityLog.count({ where: { type: 'PURCHASE', createdAt: { gte: startOfDay } } }),
    prisma.activityLog.count({ where: { type: 'MESSAGE_SENT', createdAt: { gte: startOfDay } } }),

    // Week's activity by type
    prisma.activityLog.count({ where: { type: 'LOGIN', createdAt: { gte: startOfWeek } } }),
    prisma.activityLog.count({ where: { type: 'LISTING_CREATED', createdAt: { gte: startOfWeek } } }),
    prisma.activityLog.count({ where: { type: 'PURCHASE', createdAt: { gte: startOfWeek } } }),
    prisma.activityLog.count({ where: { type: 'MESSAGE_SENT', createdAt: { gte: startOfWeek } } }),

    // Total activity
    prisma.activityLog.count({ where: { createdAt: { gte: startOfDay } } }),
    prisma.activityLog.count({ where: { createdAt: { gte: startOfWeek } } }),
  ])

  return {
    activeUsers: {
      today: activeUsersToday,
      week: activeUsersWeek,
      month: activeUsersMonth,
    },
    today: {
      logins: loginsToday,
      listingsCreated: listingsCreatedToday,
      purchases: purchasesToday,
      messagesSent: messagesSentToday,
      total: totalActivityToday,
    },
    week: {
      logins: loginsWeek,
      listingsCreated: listingsCreatedWeek,
      purchases: purchasesWeek,
      messagesSent: messagesSentWeek,
      total: totalActivityWeek,
    },
  }
}

/**
 * Clean up old activity logs (90 days retention)
 */
export async function cleanupOldActivityLogs() {
  const cutoffDate = new Date()
  cutoffDate.setDate(cutoffDate.getDate() - 90)

  const result = await prisma.activityLog.deleteMany({
    where: { createdAt: { lt: cutoffDate } },
  })

  console.log(`Cleaned up ${result.count} old activity logs`)
  return result.count
}

/**
 * Helper to extract IP and user agent from request headers
 */
export function getRequestInfo(headers: Headers) {
  return {
    ipAddress: headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
               headers.get('x-real-ip') ||
               undefined,
    userAgent: headers.get('user-agent') || undefined,
  }
}
