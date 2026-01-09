import { getServerSession } from 'next-auth'
import { authOptions } from './auth'
import { prisma } from './prisma'

export type UserRole = 'USER' | 'MODERATOR' | 'ADMIN'

/**
 * Get the current user's role from the database
 * Returns null if not authenticated
 */
export async function getCurrentUserRole(): Promise<UserRole | null> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return null
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true },
  })

  return (user?.role as UserRole) || null
}

/**
 * Check if the current user is an admin
 */
export async function isAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'ADMIN'
}

/**
 * Check if the current user is a moderator or admin
 */
export async function isModeratorOrAdmin(): Promise<boolean> {
  const role = await getCurrentUserRole()
  return role === 'ADMIN' || role === 'MODERATOR'
}

/**
 * Check if a specific user is an admin
 */
export async function isUserAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === 'ADMIN'
}

/**
 * Check if a specific user is a moderator or admin
 */
export async function isUserModeratorOrAdmin(userId: string): Promise<boolean> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { role: true },
  })

  return user?.role === 'ADMIN' || user?.role === 'MODERATOR'
}

/**
 * Require admin access - throws if not admin
 */
export async function requireAdmin(): Promise<void> {
  const isAdminUser = await isAdmin()

  if (!isAdminUser) {
    throw new Error('Admin access required')
  }
}

/**
 * Require moderator or admin access - throws if neither
 */
export async function requireModeratorOrAdmin(): Promise<void> {
  const hasAccess = await isModeratorOrAdmin()

  if (!hasAccess) {
    throw new Error('Moderator or admin access required')
  }
}

/**
 * Get admin statistics for dashboard
 */
export async function getAdminStats(): Promise<{
  pendingReviews: number
  flaggedListings: number
  totalListings: number
  totalUsers: number
  recentTransactions: number
}> {
  const [
    pendingReviews,
    flaggedListings,
    totalListings,
    totalUsers,
    recentTransactions,
  ] = await Promise.all([
    prisma.listing.count({
      where: { reviewStatus: 'PENDING_REVIEW' },
    }),
    prisma.listing.count({
      where: { flaggedForReview: true, reviewStatus: 'PENDING_REVIEW' },
    }),
    prisma.listing.count({
      where: { status: 'ACTIVE' },
    }),
    prisma.user.count(),
    prisma.transaction.count({
      where: {
        createdAt: {
          gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
        },
      },
    }),
  ])

  return {
    pendingReviews,
    flaggedListings,
    totalListings,
    totalUsers,
    recentTransactions,
  }
}

/**
 * Set a user's role (admin only operation)
 */
export async function setUserRole(
  userId: string,
  newRole: UserRole
): Promise<void> {
  await requireAdmin()

  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })
}

/**
 * List of admin email addresses for initial setup
 * These users will automatically be granted admin role on first login
 */
export const ADMIN_EMAILS = [
  'jf.tech.team@gmail.com',
]

/**
 * Check if an email should be auto-promoted to admin
 */
export function shouldAutoPromoteToAdmin(email: string): boolean {
  return ADMIN_EMAILS.includes(email.toLowerCase())
}
