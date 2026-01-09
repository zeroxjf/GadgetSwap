import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { stripe } from '@/lib/stripe'
import { prisma } from '@/lib/prisma'

export async function POST() {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'You must be signed in' },
        { status: 401 }
      )
    }

    // Get user's subscription ID
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { subscriptionId: true },
    })

    if (!user?.subscriptionId) {
      return NextResponse.json(
        { error: 'No active subscription found' },
        { status: 400 }
      )
    }

    // Cancel at period end (user keeps benefits until subscription ends)
    await stripe.subscriptions.update(user.subscriptionId, {
      cancel_at_period_end: true,
    })

    return NextResponse.json({
      message: 'Subscription will be canceled at the end of the billing period',
    })
  } catch (error) {
    console.error('Cancel subscription error:', error)
    return NextResponse.json(
      { error: 'Failed to cancel subscription' },
      { status: 500 }
    )
  }
}
