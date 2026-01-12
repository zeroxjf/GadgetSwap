import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * POST /api/user/onboarding
 * Mark user's onboarding as complete
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const body = await request.json()
    const { complete } = body

    await prisma.user.update({
      where: { id: session.user.id },
      data: { onboardingComplete: complete ?? true },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Onboarding update error:', error)
    return NextResponse.json({ error: 'Failed to update onboarding status' }, { status: 500 })
  }
}
