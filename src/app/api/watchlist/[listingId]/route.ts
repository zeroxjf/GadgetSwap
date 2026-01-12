import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * DELETE /api/watchlist/[listingId]
 * Remove a listing from watchlist
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ listingId: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    const { listingId } = await params

    await prisma.watchlist.deleteMany({
      where: {
        userId: session.user.id,
        listingId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Remove from watchlist error:', error)
    return NextResponse.json(
      { error: 'Failed to remove from watchlist' },
      { status: 500 }
    )
  }
}
