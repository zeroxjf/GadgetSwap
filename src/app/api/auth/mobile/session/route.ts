import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/auth/mobile/session
 * Get session for mobile apps (supports both JWT and database sessions)
 */
export async function GET() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user) {
      return NextResponse.json({ user: null })
    }

    return NextResponse.json({
      user: {
        id: auth.user.id,
        email: auth.user.email,
        name: auth.user.name,
        image: auth.user.image,
        username: auth.user.username,
        role: auth.user.role,
        subscriptionTier: auth.user.subscriptionTier,
        onboardingComplete: auth.user.onboardingComplete,
      },
      expires: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    })
  } catch (error) {
    console.error('Mobile session error:', error)
    return NextResponse.json({ user: null })
  }
}
