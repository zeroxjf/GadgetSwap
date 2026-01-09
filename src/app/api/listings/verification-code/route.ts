import { NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { createUniqueVerificationCode } from '@/lib/verification'

export async function POST() {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    // Generate a unique verification code
    const code = await createUniqueVerificationCode()

    return NextResponse.json({ code })
  } catch (error) {
    console.error('Failed to generate verification code:', error)
    return NextResponse.json(
      { error: 'Failed to generate verification code' },
      { status: 500 }
    )
  }
}
