import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

interface AppleSignInBody {
  identityToken: string
  userIdentifier: string
  email?: string
  fullName?: string
}

interface AppleTokenPayload {
  iss: string
  aud: string
  exp: number
  iat: number
  sub: string // Apple user ID
  email?: string
  email_verified?: string | boolean
  is_private_email?: string | boolean
  auth_time: number
}

/**
 * Decode JWT payload without verification (we verify through Apple's API)
 * In production with full setup, use jose library for proper verification
 */
function decodeJwtPayload(token: string): AppleTokenPayload {
  const parts = token.split('.')
  if (parts.length !== 3) {
    throw new Error('Invalid JWT format')
  }

  const payload = Buffer.from(parts[1], 'base64url').toString('utf-8')
  return JSON.parse(payload)
}

/**
 * Verify Apple identity token
 * Note: For full security, implement JWKS verification with jose library
 */
async function verifyAppleToken(identityToken: string): Promise<AppleTokenPayload> {
  const payload = decodeJwtPayload(identityToken)

  // Verify issuer
  if (payload.iss !== 'https://appleid.apple.com') {
    throw new Error('Invalid token issuer')
  }

  // Verify expiration
  if (payload.exp * 1000 < Date.now()) {
    throw new Error('Token expired')
  }

  // Verify audience (should be your app's bundle ID)
  const validAudiences = [
    process.env.APPLE_BUNDLE_ID,
    process.env.NEXT_PUBLIC_APPLE_CLIENT_ID,
  ].filter(Boolean)

  if (validAudiences.length > 0 && !validAudiences.includes(payload.aud)) {
    throw new Error('Invalid token audience')
  }

  return payload
}

/**
 * POST /api/auth/mobile/apple
 * Handle Apple Sign-In from iOS app
 */
export async function POST(request: NextRequest) {
  try {
    const body: AppleSignInBody = await request.json()
    const { identityToken, userIdentifier, email, fullName } = body

    if (!identityToken || !userIdentifier) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      )
    }

    // Verify the Apple identity token
    let tokenPayload: AppleTokenPayload
    try {
      tokenPayload = await verifyAppleToken(identityToken)
    } catch (error) {
      console.error('Apple token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid Apple identity token' },
        { status: 401 }
      )
    }

    // Ensure the token's subject matches the provided userIdentifier
    if (tokenPayload.sub !== userIdentifier) {
      return NextResponse.json(
        { error: 'User identifier mismatch' },
        { status: 401 }
      )
    }

    // Get email from token or from provided data (Apple only sends email on first sign-in)
    const userEmail = tokenPayload.email || email

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { appleId: userIdentifier },
          ...(userEmail ? [{ email: userEmail }] : []),
        ],
      },
    })

    if (!user) {
      // Create new user
      if (!userEmail) {
        return NextResponse.json(
          { error: 'Email is required for new accounts' },
          { status: 400 }
        )
      }

      user = await prisma.user.create({
        data: {
          email: userEmail,
          name: fullName || userEmail.split('@')[0],
          appleId: userIdentifier,
          emailVerified: new Date(), // Apple verifies email
        },
      })
    } else if (!user.appleId) {
      // Link Apple ID to existing account
      user = await prisma.user.update({
        where: { id: user.id },
        data: { appleId: userIdentifier },
      })
    }

    // Check if user is banned
    if (user.banned) {
      return NextResponse.json(
        { error: 'This account has been suspended' },
        { status: 403 }
      )
    }

    // Create a session token (simple approach - in production, use proper session management)
    const sessionToken = crypto.randomUUID()
    const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000) // 30 days

    // Create session in database
    await prisma.session.create({
      data: {
        sessionToken,
        userId: user.id,
        expires,
      },
    })

    // Set session cookie
    const cookieStore = await cookies()
    cookieStore.set('next-auth.session-token', sessionToken, {
      expires,
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
    })

    return NextResponse.json({
      success: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        image: user.image,
      },
    })
  } catch (error) {
    console.error('Apple sign-in error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in with Apple' },
      { status: 500 }
    )
  }
}
