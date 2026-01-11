import { NextResponse } from 'next/server'
import bcrypt from 'bcryptjs'
import { prisma } from '@/lib/prisma'

export async function POST(request: Request) {
  try {
    const { token, email, password } = await request.json()

    if (!token || !email || !password) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    if (password.length < 8) {
      return NextResponse.json(
        { error: 'Password must be at least 8 characters' },
        { status: 400 }
      )
    }

    // SECURITY FIX: Atomic token consumption to prevent race conditions
    // Delete the token first - if it doesn't exist or is already deleted,
    // the deleteMany will return count: 0
    const deleteResult = await prisma.verificationToken.deleteMany({
      where: {
        identifier: email,
        token,
        expires: { gte: new Date() } // Only delete if not expired
      },
    })

    // If no token was deleted, it either didn't exist, was already used, or expired
    if (deleteResult.count === 0) {
      return NextResponse.json(
        { error: 'Invalid or expired reset link' },
        { status: 400 }
      )
    }

    // Find user
    const user = await prisma.user.findUnique({
      where: { email },
    })

    if (!user) {
      return NextResponse.json(
        { error: 'User not found' },
        { status: 400 }
      )
    }

    // Hash new password
    const passwordHash = await bcrypt.hash(password, 12)

    // Update user password
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash },
    })

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Reset password error:', error)
    return NextResponse.json(
      { error: 'Failed to reset password' },
      { status: 500 }
    )
  }
}
