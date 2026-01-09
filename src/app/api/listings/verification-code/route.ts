import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { createUniqueVerificationCode, isValidCodeFormat } from '@/lib/verification'

/**
 * POST /api/listings/verification-code
 * Generate a unique verification code for a new listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Generate a unique verification code
    const code = await createUniqueVerificationCode()

    return NextResponse.json({
      success: true,
      verificationCode: code,
    })
  } catch (error) {
    console.error('Verification code generation error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to generate verification code' },
      { status: 500 }
    )
  }
}

/**
 * GET /api/listings/verification-code
 * Validate a verification code format
 */
export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const code = searchParams.get('code')

  if (!code) {
    return NextResponse.json(
      { valid: false, error: 'No code provided' },
      { status: 400 }
    )
  }

  const isValid = isValidCodeFormat(code)

  return NextResponse.json({
    valid: isValid,
    code: code.toUpperCase(),
  })
}
