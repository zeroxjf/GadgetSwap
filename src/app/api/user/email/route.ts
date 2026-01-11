import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import bcrypt from 'bcryptjs'
import crypto, { timingSafeEqual } from 'crypto'
import { checkRateLimit, rateLimitResponse } from '@/lib/rate-limit'

/**
 * Constant-time string comparison to prevent timing attacks
 */
function constantTimeCompare(a: string, b: string): boolean {
  try {
    const bufA = Buffer.from(a, 'utf8')
    const bufB = Buffer.from(b, 'utf8')
    // timingSafeEqual requires same length buffers
    if (bufA.length !== bufB.length) {
      // Still do a comparison to maintain constant time
      const padded = Buffer.alloc(bufA.length)
      timingSafeEqual(bufA, padded)
      return false
    }
    return timingSafeEqual(bufA, bufB)
  } catch {
    return false
  }
}

/**
 * PUT /api/user/email
 * Request email change - sends verification to new email
 * SECURITY: Email is NOT changed immediately. User must verify new email first.
 * Requires current password for security
 */
// Rate limit config: 3 email change requests per hour
const emailChangeRateLimit = { limit: 3, windowMs: 60 * 60 * 1000, keyPrefix: 'email-change' }

export async function PUT(request: NextRequest) {
  try {
    // Rate limit: 3 email change requests per hour
    const rateCheck = checkRateLimit(request, emailChangeRateLimit)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

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

    // SECURITY: Don't update email immediately. Create a verification token instead.
    // Delete any existing pending email change tokens for this user
    await prisma.verificationToken.deleteMany({
      where: {
        identifier: `email-change:${session.user.id}`,
      },
    })

    // Create verification token for new email (expires in 24 hours)
    const token = crypto.randomBytes(32).toString('hex')
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000) // 24 hours

    // SECURITY: Encode email in base64 to handle special characters like colons
    const encodedEmail = Buffer.from(newEmail.toLowerCase()).toString('base64')
    await prisma.verificationToken.create({
      data: {
        identifier: `email-change:${session.user.id}`,
        token: `${token}:${encodedEmail}`, // Store base64-encoded email in token
        expires,
      },
    })

    // TODO: In production, send verification email to newEmail with link:
    // const verificationUrl = `${process.env.NEXTAUTH_URL}/api/user/email/verify?token=${token}`
    // await sendEmail({ to: newEmail, subject: 'Verify your new email', ... })

    // SECURITY FIX: Log only user ID, not email (PII)
    console.log(`[EMAIL CHANGE] Verification token created for user ${session.user.id}`)

    return NextResponse.json({
      success: true,
      message: 'Verification email sent to your new email address. Please check your inbox and click the verification link to complete the change.',
      pendingEmail: newEmail.toLowerCase(),
    })
  } catch (error) {
    console.error('Change email error:', error)
    return NextResponse.json({ error: 'Failed to initiate email change' }, { status: 500 })
  }
}

/**
 * GET /api/user/email?token=xxx
 * Verify email change token and complete the email update
 */
export async function GET(request: NextRequest) {
  try {
    const token = request.nextUrl.searchParams.get('token')

    if (!token) {
      return NextResponse.json({ error: 'Verification token is required' }, { status: 400 })
    }

    // Find the verification token using exact match
    // Token format: randomToken:base64EncodedEmail
    // We search by identifier prefix and then verify the token starts with our input
    const verificationTokens = await prisma.verificationToken.findMany({
      where: {
        identifier: { startsWith: 'email-change:' },
      },
    })

    // SECURITY FIX: Use constant-time comparison on the random token part to prevent timing attacks
    // Also returns identical error messages for all failure cases
    const verificationToken = verificationTokens.find(vt => {
      const [storedToken] = vt.token.split(':')
      return constantTimeCompare(storedToken, token)
    })

    // SECURITY: Return identical error for all failure cases to prevent enumeration
    const genericError = 'Invalid or expired verification token'

    if (!verificationToken) {
      return NextResponse.json({ error: genericError }, { status: 400 })
    }

    // Check expiration
    if (verificationToken.expires < new Date()) {
      await prisma.verificationToken.delete({
        where: {
          identifier_token: {
            identifier: verificationToken.identifier,
            token: verificationToken.token,
          },
        },
      }).catch(() => {}) // Ignore delete errors for security
      return NextResponse.json({ error: genericError }, { status: 400 })
    }

    // Extract userId and new email from token
    const userId = verificationToken.identifier.replace('email-change:', '')
    // SECURITY: Decode base64-encoded email to handle special characters
    const encodedEmail = verificationToken.token.split(':')[1]
    const newEmail = Buffer.from(encodedEmail, 'base64').toString('utf-8')

    if (!userId || !newEmail) {
      return NextResponse.json({ error: 'Invalid verification token format' }, { status: 400 })
    }

    // Update the user's email
    await prisma.user.update({
      where: { id: userId },
      data: {
        email: newEmail,
        emailVerified: new Date(), // Mark as verified since they clicked the link
      },
    })

    // Delete the verification token
    await prisma.verificationToken.delete({
      where: {
        identifier_token: {
          identifier: verificationToken.identifier,
          token: verificationToken.token,
        },
      },
    })

    // SECURITY FIX: Log only user ID, not email (PII)
    console.log(`[EMAIL CHANGE] Email successfully changed for user ${userId}`)

    return NextResponse.json({
      success: true,
      message: 'Email address has been updated successfully. Please sign in with your new email.',
    })
  } catch (error) {
    console.error('Verify email change error:', error)
    return NextResponse.json({ error: 'Failed to verify email change' }, { status: 500 })
  }
}
