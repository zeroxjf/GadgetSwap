import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * DELETE /api/user
 * Delete current user's account and all associated data
 */
export async function DELETE() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const userId = session.user.id

    // Check for active transactions (can't delete if pending sales/purchases)
    const activeTransactions = await prisma.transaction.findFirst({
      where: {
        OR: [
          { buyerId: userId },
          { sellerId: userId },
        ],
        status: {
          in: ['PENDING', 'PAYMENT_RECEIVED', 'SHIPPED'],
        },
      },
    })

    if (activeTransactions) {
      return NextResponse.json({
        error: 'Cannot delete account with active transactions. Please complete or cancel pending orders first.',
      }, { status: 400 })
    }

    // Delete user and cascade will handle related data
    // Note: Some relations have onDelete: Cascade in schema
    // For others, we need to handle manually

    // Delete in order to respect foreign key constraints
    await prisma.$transaction(async (tx) => {
      // Delete user's listings images
      await tx.listingImage.deleteMany({
        where: {
          listing: {
            sellerId: userId,
          },
        },
      })

      // Delete price history for user's listings
      await tx.priceHistory.deleteMany({
        where: {
          listing: {
            sellerId: userId,
          },
        },
      })

      // Delete watchlist entries for user's listings
      await tx.watchlist.deleteMany({
        where: {
          listing: {
            sellerId: userId,
          },
        },
      })

      // Delete messages related to user's listings
      await tx.message.deleteMany({
        where: {
          listing: {
            sellerId: userId,
          },
        },
      })

      // Delete user's listings
      await tx.listing.deleteMany({
        where: { sellerId: userId },
      })

      // Delete sent and received messages
      await tx.message.deleteMany({
        where: {
          OR: [
            { senderId: userId },
            { receiverId: userId },
          ],
        },
      })

      // Delete reviews (authored and received)
      await tx.review.deleteMany({
        where: {
          OR: [
            { authorId: userId },
            { targetId: userId },
          ],
        },
      })

      // Update transactions to remove user reference (keep for records)
      // We don't delete transactions for accounting purposes
      await tx.transaction.updateMany({
        where: { buyerId: userId },
        data: { buyerId: 'deleted_user' },
      })
      await tx.transaction.updateMany({
        where: { sellerId: userId },
        data: { sellerId: 'deleted_user' },
      })

      // Delete user (cascades: accounts, sessions, watchlist, notifications, deviceAlerts, savedAddresses)
      await tx.user.delete({
        where: { id: userId },
      })
    })

    return NextResponse.json({ message: 'Account deleted successfully' })
  } catch (error) {
    console.error('Delete account error:', error)
    return NextResponse.json({ error: 'Failed to delete account' }, { status: 500 })
  }
}
