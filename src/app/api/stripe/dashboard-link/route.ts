import { NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { createExpressDashboardLink } from '@/lib/stripe'

/**
 * POST /api/stripe/dashboard-link
 * Create a login link to the Express dashboard for the connected account
 */
export async function POST() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { stripeAccountId: true },
    })

    if (!user?.stripeAccountId) {
      return NextResponse.json(
        { error: 'No Stripe account connected' },
        { status: 400 }
      )
    }

    const url = await createExpressDashboardLink(user.stripeAccountId)

    return NextResponse.json({ url })
  } catch (error: any) {
    console.error('Create dashboard link error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create dashboard link' },
      { status: 500 }
    )
  }
}
