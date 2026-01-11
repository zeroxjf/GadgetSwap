import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createUniqueVerificationCode } from '@/lib/verification'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

// Rate limit config: 10 requests per minute
const verificationCodeRateLimit = { limit: 10, windowMs: 60 * 1000, keyPrefix: 'verification-code' }

export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 requests per minute
    const rateCheck = checkRateLimit(request, verificationCodeRateLimit)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate a unique verification code with user binding and 1-hour expiration
    // SECURITY: Code is tied to this user and expires after 1 hour
    const code = await createUniqueVerificationCode(session.user.id)

    return NextResponse.json({
      code,
      expiresIn: 3600, // 1 hour in seconds
      message: 'Code expires in 1 hour',
    })
  } catch (error) {
    console.error('Failed to generate verification code:', error)
    return NextResponse.json(
      { error: 'Failed to generate verification code' },
      { status: 500 }
    )
  }
}
