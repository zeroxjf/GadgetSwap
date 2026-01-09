import { NextRequest, NextResponse } from 'next/server'
import { calculateTax, getStateFromZip } from '@/lib/tax'

/**
 * GET /api/tax?zipCode=12345&amount=100
 * Calculate tax for a given ZIP code and amount
 */
export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const zipCode = searchParams.get('zipCode')
    const amountStr = searchParams.get('amount')

    if (!zipCode) {
      return NextResponse.json(
        { error: 'zipCode is required' },
        { status: 400 }
      )
    }

    // Validate ZIP code format
    if (!/^\d{5}(-\d{4})?$/.test(zipCode)) {
      return NextResponse.json(
        { error: 'Invalid ZIP code format' },
        { status: 400 }
      )
    }

    const state = getStateFromZip(zipCode)

    if (!state) {
      return NextResponse.json({
        zipCode,
        state: null,
        taxRate: 0,
        taxAmount: 0,
        message: 'Could not determine state from ZIP code',
      })
    }

    // If amount provided, calculate tax
    if (amountStr) {
      const amount = parseFloat(amountStr)
      if (isNaN(amount) || amount < 0) {
        return NextResponse.json(
          { error: 'Invalid amount' },
          { status: 400 }
        )
      }

      const { taxRate, taxAmount } = calculateTax(amount, zipCode)

      return NextResponse.json({
        zipCode,
        state,
        taxRate,
        taxRatePercent: (taxRate * 100).toFixed(2) + '%',
        amount,
        taxAmount,
        total: Math.round((amount + taxAmount) * 100) / 100,
      })
    }

    // Just return the tax rate
    const { taxRate } = calculateTax(0, zipCode)

    return NextResponse.json({
      zipCode,
      state,
      taxRate,
      taxRatePercent: (taxRate * 100).toFixed(2) + '%',
    })
  } catch (error) {
    console.error('Tax calculation error:', error)
    return NextResponse.json(
      { error: 'Failed to calculate tax' },
      { status: 500 }
    )
  }
}
