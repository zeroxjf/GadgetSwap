import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'
import { checkRateLimit, rateLimitResponse, rateLimits } from '@/lib/rate-limit'

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 3 requests per IP per hour
    const rateCheck = checkRateLimit(request, rateLimits.forgotPassword)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    const { email } = await request.json()

    if (!email) {
      return NextResponse.json(
        { error: 'Email is required' },
        { status: 400 }
      )
    }

    // SECURITY: Always perform token generation to normalize timing
    // This prevents timing attacks from revealing if email exists
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 3600000) // 1 hour from now

    // Check if user exists
    const user = await prisma.user.findUnique({
      where: { email },
    })

    // Always return success to prevent email enumeration
    // But only actually store/send token if user exists with password
    if (!user || !user.passwordHash) {
      // Still perform a dummy database operation to normalize timing
      // This makes the response time consistent whether user exists or not
      await prisma.verificationToken.findFirst({
        where: { identifier: 'dummy-timing-normalization' }
      }).catch(() => {})
      return NextResponse.json({ success: true })
    }

    // Store token in database (only for valid users with password)
    await prisma.verificationToken.create({
      data: {
        identifier: email,
        token,
        expires,
      },
    })

    // In production, send email here
    // For now, log the reset link (dev only)
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}&email=${encodeURIComponent(email)}`
    console.log('Password reset link:', resetUrl)

    return NextResponse.json({ success: true })
  } catch (error: any) {
    console.error('Forgot password error:', error)
    return NextResponse.json(
      { error: 'Failed to process request' },
      { status: 500 }
    )
  }
}
