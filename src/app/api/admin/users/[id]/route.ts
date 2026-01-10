import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { isAdmin } from '@/lib/admin'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Only admins can change roles
    const hasAccess = await isAdmin()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params
    const body = await request.json()
    const { role, subscriptionTier, banned } = body

    const updateData: any = {}

    if (role && ['USER', 'MODERATOR', 'ADMIN'].includes(role)) {
      updateData.role = role
    }

    if (subscriptionTier && ['FREE', 'PLUS', 'PRO'].includes(subscriptionTier)) {
      updateData.subscriptionTier = subscriptionTier
      // Clear Stripe subscription info if manually setting tier
      // (they're getting it for free, not via Stripe)
      if (subscriptionTier !== 'FREE') {
        updateData.subscriptionStatus = 'active'
        updateData.subscriptionEnd = null // No end date = lifetime
      }
    }

    if (typeof banned === 'boolean') {
      updateData.banned = banned
      updateData.bannedAt = banned ? new Date() : null
    }

    const user = await prisma.user.update({
      where: { id },
      data: updateData,
      select: {
        id: true,
        email: true,
        name: true,
        role: true,
        subscriptionTier: true,
        banned: true,
      },
    })

    return NextResponse.json({ success: true, user })
  } catch (error) {
    console.error('Admin user update error:', error)
    return NextResponse.json({ error: 'Failed to update user' }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const hasAccess = await isAdmin()
    if (!hasAccess) {
      return NextResponse.json({ error: 'Admin access required' }, { status: 403 })
    }

    const { id } = await params

    // Prevent deleting yourself
    if (id === session.user.id) {
      return NextResponse.json({ error: 'Cannot delete yourself' }, { status: 400 })
    }

    // Delete user and all related data
    // Note: This cascades to delete their listings, messages, etc. based on schema
    await prisma.user.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Admin delete user error:', error)
    return NextResponse.json({ error: 'Failed to delete user' }, { status: 500 })
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        listings: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        purchases: {
          take: 10,
          orderBy: { createdAt: 'desc' },
        },
        _count: {
          select: {
            listings: true,
            purchases: true,
            sales: true,
          },
        },
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    return NextResponse.json({ user })
  } catch (error) {
    console.error('Admin get user error:', error)
    return NextResponse.json({ error: 'Failed to fetch user' }, { status: 500 })
  }
}
