import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { cookies } from 'next/headers'

// Google token info endpoint
const GOOGLE_TOKEN_INFO_URL = 'https://oauth2.googleapis.com/tokeninfo'

interface GoogleSignInBody {
  idToken: string
  accessToken?: string
}

interface GoogleTokenInfo {
  iss: string
  azp: string
  aud: string
  sub: string // Google user ID
  email: string
  email_verified: string
  name?: string
  picture?: string
  given_name?: string
  family_name?: string
  exp: string
}

/**
 * Verify Google ID token
 */
async function verifyGoogleToken(idToken: string): Promise<GoogleTokenInfo> {
  const response = await fetch(`${GOOGLE_TOKEN_INFO_URL}?id_token=${idToken}`)

  if (!response.ok) {
    throw new Error('Invalid Google token')
  }

  const tokenInfo: GoogleTokenInfo = await response.json()

  // Verify the audience matches our client ID
  const validAudiences = [
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_IOS_CLIENT_ID, // iOS app client ID
  ].filter(Boolean)

  if (!validAudiences.includes(tokenInfo.aud)) {
    throw new Error('Invalid token audience')
  }

  // Verify issuer
  if (!['accounts.google.com', 'https://accounts.google.com'].includes(tokenInfo.iss)) {
    throw new Error('Invalid token issuer')
  }

  // Check expiration
  if (parseInt(tokenInfo.exp) * 1000 < Date.now()) {
    throw new Error('Token expired')
  }

  return tokenInfo
}

/**
 * POST /api/auth/mobile/google
 * Handle Google Sign-In from iOS app
 */
export async function POST(request: NextRequest) {
  try {
    const body: GoogleSignInBody = await request.json()
    const { idToken } = body

    if (!idToken) {
      return NextResponse.json(
        { error: 'Missing ID token' },
        { status: 400 }
      )
    }

    // Verify the Google ID token
    let tokenInfo: GoogleTokenInfo
    try {
      tokenInfo = await verifyGoogleToken(idToken)
    } catch (error) {
      console.error('Google token verification failed:', error)
      return NextResponse.json(
        { error: 'Invalid Google ID token' },
        { status: 401 }
      )
    }

    const { sub: googleId, email, name, picture } = tokenInfo

    // Find or create user
    let user = await prisma.user.findFirst({
      where: {
        OR: [
          { googleId },
          { email },
        ],
      },
    })

    if (!user) {
      // Create new user
      user = await prisma.user.create({
        data: {
          email,
          name: name || email.split('@')[0],
          image: picture,
          googleId,
          emailVerified: new Date(), // Google verifies email
        },
      })
    } else {
      // Update existing user with Google info if not already linked
      const updates: any = {}
      if (!user.googleId) updates.googleId = googleId
      if (!user.image && picture) updates.image = picture
      if (!user.name && name) updates.name = name

      if (Object.keys(updates).length > 0) {
        user = await prisma.user.update({
          where: { id: user.id },
          data: updates,
        })
      }
    }

    // Check if user is banned
    if (user.banned) {
      return NextResponse.json(
        { error: 'This account has been suspended' },
        { status: 403 }
      )
    }

    // Create a session token
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
    console.error('Google sign-in error:', error)
    return NextResponse.json(
      { error: 'Failed to sign in with Google' },
      { status: 500 }
    )
  }
}
