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
 * SECURITY: Always checks database for fresh role/ban status, not stale session token
 */
export async function isAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return false
  }

  // Always fetch fresh from database to prevent stale session bypass
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  })

  // Banned users cannot have admin access
  if (user?.banned) {
    return false
  }

  return user?.role === 'ADMIN'
}

/**
 * Check if the current user is a moderator or admin
 * SECURITY: Always checks database for fresh role/ban status, not stale session token
 */
export async function isModeratorOrAdmin(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return false
  }

  // Always fetch fresh from database to prevent stale session bypass
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { role: true, banned: true },
  })

  // Banned users cannot have moderator/admin access
  if (user?.banned) {
    return false
  }

  return user?.role === 'ADMIN' || user?.role === 'MODERATOR'
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
 * Check if the current user is banned
 * Returns true if banned, false if not banned or not authenticated
 */
export async function isCurrentUserBanned(): Promise<boolean> {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return false
  }

  // Check session first (faster, usually up-to-date)
  if (session.user.banned) {
    return true
  }

  // Double-check database for fresh data
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { banned: true },
  })

  return user?.banned ?? false
}

/**
 * Require user is not banned - throws if banned
 * Use this at the start of protected API routes
 */
export async function requireNotBanned(): Promise<void> {
  const isBanned = await isCurrentUserBanned()

  if (isBanned) {
    throw new Error('Your account has been suspended')
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
 * Get flagged messages stats for admin dashboard
 */
export async function getFlaggedMessagesStats(): Promise<{
  totalFlagged: number
  totalBlocked: number
  pendingReview: number
  highRiskCount: number
}> {
  const [totalFlagged, totalBlocked, pendingReview, highRiskCount] = await Promise.all([
    prisma.message.count({
      where: { flagged: true },
    }),
    prisma.message.count({
      where: { blocked: true },
    }),
    prisma.messageFlag.count({
      where: { reviewed: false },
    }),
    prisma.message.count({
      where: { riskScore: { gte: 70 } },
    }),
  ])

  return {
    totalFlagged,
    totalBlocked,
    pendingReview,
    highRiskCount,
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
 * SECURITY: Read from ADMIN_EMAILS environment variable (comma-separated) with fallback
 */
export const ADMIN_EMAILS = process.env.ADMIN_EMAILS
  ? process.env.ADMIN_EMAILS.split(',').map(email => email.trim()).filter(Boolean)
  : ['jf.tech.team@gmail.com']

/**
 * Normalize email to prevent bypass via aliases
 * Gmail allows: user+tag@gmail.com and u.s.e.r@gmail.com
 * This normalizes to the canonical form
 */
function normalizeEmail(email: string): string {
  const lower = email.toLowerCase().trim()
  const [localPart, domain] = lower.split('@')

  if (!domain) return lower

  // For Gmail, remove dots and plus aliases
  if (domain === 'gmail.com' || domain === 'googlemail.com') {
    const normalized = localPart
      .split('+')[0]  // Remove everything after +
      .replace(/\./g, '')  // Remove dots
    return `${normalized}@gmail.com`
  }

  // For other domains, just remove plus aliases
  return `${localPart.split('+')[0]}@${domain}`
}

/**
 * Check if an email should be auto-promoted to admin
 * SECURITY: Normalizes emails to prevent bypass via aliases
 */
export function shouldAutoPromoteToAdmin(email: string): boolean {
  const normalizedInput = normalizeEmail(email)
  return ADMIN_EMAILS.some(adminEmail => normalizeEmail(adminEmail) === normalizedInput)
}
