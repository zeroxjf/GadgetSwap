import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'

/**
 * PUT /api/user/email
 * Change user's email address
 * Requires current password for security
 */
export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { newEmail, currentPassword } = body

    if (!newEmail) {
      return NextResponse.json({ error: 'New email is required' }, { status: 400 })
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
    if (!emailRegex.test(newEmail)) {
      return NextResponse.json({ error: 'Invalid email format' }, { status: 400 })
    }

    // Get current user with password hash
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: {
        email: true,
        passwordHash: true,
        accounts: {
          select: { provider: true }
        }
      },
    })

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 })
    }

    // Check if new email is same as current
    if (user.email.toLowerCase() === newEmail.toLowerCase()) {
      return NextResponse.json({ error: 'New email must be different from current email' }, { status: 400 })
    }

    // Check if email is already in use
    const existingUser = await prisma.user.findUnique({
      where: { email: newEmail.toLowerCase() },
    })

    if (existingUser) {
      return NextResponse.json({ error: 'Email is already in use' }, { status: 400 })
    }

    // For users with password (credentials auth), verify password
    if (user.passwordHash) {
      if (!currentPassword) {
        return NextResponse.json({ error: 'Current password is required' }, { status: 400 })
      }

      const isPasswordValid = await bcrypt.compare(currentPassword, user.passwordHash)
      if (!isPasswordValid) {
        return NextResponse.json({ error: 'Current password is incorrect' }, { status: 400 })
      }
    }

    // For OAuth users without password, we'll allow the change
    // In production, you might want to send a verification email

    // Update email
    await prisma.user.update({
      where: { id: session.user.id },
      data: {
        email: newEmail.toLowerCase(),
        emailVerified: null, // Reset verification status
      },
    })

    // In production, send verification email here
    // await sendVerificationEmail(newEmail)

    return NextResponse.json({
      success: true,
      message: 'Email updated successfully. Please sign in again with your new email.',
      requiresReauth: true,
    })
  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json({ error: 'Failed to change email' }, { status: 500 })
  }
}
