import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, calculateFees, STRIPE_FEE_PERCENT, STRIPE_FEE_FIXED, PLATFORM_FEES } from '@/lib/stripe'
import { calculateTax } from '@/lib/tax'
import { getDefaultShippingCost, qualifiesForFreeShipping } from '@/lib/shipping'
import { checkRateLimit, rateLimitResponse, rateLimits } from '@/lib/rate-limit'
import { isCurrentUserBanned } from '@/lib/admin'

/**
 * POST /api/checkout
 * Create a payment intent for purchasing a listing
 */
export async function POST(request: NextRequest) {
  try {
    // Rate limit: 10 checkout attempts per minute
    const rateCheck = checkRateLimit(request, rateLimits.checkout)
    if (!rateCheck.success) {
      return rateLimitResponse(rateCheck.resetIn)
    }

    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to make a purchase' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    // SECURITY: Check if user is banned
    if (await isCurrentUserBanned()) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 })
    }

    const body = await request.json()
    const { listingId, shippingAddress, expectedPrice } = body

    if (!listingId) {
      return NextResponse.json(
        { error: 'Listing ID is required' },
        { status: 400 }
      )
    }

    if (!shippingAddress || !shippingAddress.zipCode) {
      return NextResponse.json(
        { error: 'Shipping address with ZIP code is required' },
        { status: 400 }
      )
    }

    // Require expectedPrice for security - prevents price manipulation
    if (typeof expectedPrice !== 'number' || expectedPrice <= 0) {
      return NextResponse.json(
        { error: 'Expected price is required' },
        { status: 400 }
      )
    }

    // Fetch the listing with seller info
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        seller: {
          select: {
            id: true,
            email: true,
            name: true,
            stripeAccountId: true,
            stripeOnboardingComplete: true,
            subscriptionTier: true,
            role: true,
          },
        },
      },
    })

    if (!listing) {
      return NextResponse.json(
        { error: 'Listing not found' },
        { status: 404 }
      )
    }

    if (listing.status !== 'ACTIVE') {
      return NextResponse.json(
        { error: 'This listing is no longer available' },
        { status: 400 }
      )
    }

    if (listing.sellerId === session.user.id) {
      return NextResponse.json(
        { error: 'You cannot purchase your own listing' },
        { status: 400 }
      )
    }

    // Check if seller has completed Stripe onboarding (admins bypass this)
    const isAdminSeller = listing.seller.role === 'ADMIN'
    if (!isAdminSeller && (!listing.seller.stripeAccountId || !listing.seller.stripeOnboardingComplete)) {
      return NextResponse.json(
        { error: 'Seller has not set up payment processing yet' },
        { status: 400 }
      )
    }

    // SECURITY: Verify the price hasn't changed since buyer viewed the listing
    // This prevents checkout with stale prices if seller updated the listing
    const currentPrice = Number(listing.price)
    if (Math.abs(currentPrice - expectedPrice) > 0.01) {
      return NextResponse.json(
        {
          error: 'Price has changed since you viewed this listing. Please refresh and try again.',
          currentPrice,
          expectedPrice,
        },
        { status: 409 } // Conflict
      )
    }

    // Calculate pricing
    const salePrice = listing.price
    const { taxRate, taxAmount } = calculateTax(salePrice, shippingAddress.zipCode)

    // Calculate shipping cost based on device type and price
    // Free shipping for items $500+, otherwise calculate based on device weight
    const freeShipping = qualifiesForFreeShipping(salePrice)
    const shippingCost = freeShipping
      ? 0
      : getDefaultShippingCost(listing.deviceType, salePrice)

    // Calculate fees based on seller's subscription tier
    const subscriptionTier = listing.seller.subscriptionTier || 'FREE'
    const platformFeeRate = PLATFORM_FEES[subscriptionTier as keyof typeof PLATFORM_FEES]
    const platformFee = Math.round(salePrice * platformFeeRate * 100) / 100

    // Total amount to charge buyer
    const totalAmount = Math.round((salePrice + taxAmount + shippingCost) * 100) / 100

    // Stripe fee (calculated on total)
    const rawStripeFee = Math.round((totalAmount * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED) * 100) / 100

    // Only PRO sellers have Stripe fees covered by GadgetSwap
    // FREE: 1% platform + Stripe fees
    // PLUS: 0% platform, seller pays Stripe fees
    // PRO: 0% platform, GadgetSwap covers Stripe fees
    const isProTier = subscriptionTier === 'PRO'
    const sellerStripeFee = isProTier ? 0 : rawStripeFee

    // What seller receives (sale price minus fees)
    const sellerPayout = Math.round((salePrice - platformFee - sellerStripeFee) * 100) / 100

    // Application fee breakdown:
    // FREE: platform fee (1%) + Stripe fee passed to seller
    // PLUS: 0% platform fee, Stripe fee passed to seller
    // PRO: 0% platform fee, we absorb Stripe fee (no application fee)
    const applicationFee = isProTier ? 0 : platformFee

    // Create payment intent - use Stripe Connect for regular sellers, direct payment for admin sellers
    const paymentIntentParams: any = {
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      metadata: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        salePrice: salePrice.toString(),
        taxAmount: taxAmount.toString(),
        shippingCost: shippingCost.toString(),
        platformFee: platformFee.toString(),
        stripeFee: sellerStripeFee.toString(),
        isAdminSeller: isAdminSeller.toString(),
      },
    }

    // Only add transfer_data for non-admin sellers with Stripe accounts
    if (!isAdminSeller && listing.seller.stripeAccountId) {
      paymentIntentParams.transfer_data = {
        destination: listing.seller.stripeAccountId,
      }
      paymentIntentParams.application_fee_amount = Math.round(applicationFee * 100) // Platform fee (+ stripe fee for FREE tier)
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams)

    // Create pending transaction record
    const transaction = await prisma.transaction.create({
      data: {
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        listingId: listing.id,
        salePrice,
        taxAmount,
        taxRate,
        shippingCost,
        platformFee,
        stripeFee: sellerStripeFee,
        sellerPayout,
        totalAmount,
        stripePaymentIntentId: paymentIntent.id,
        stripeStatus: 'pending',
        status: 'PENDING',
        fundsHeld: true,
        // Shipping address
        shippingName: shippingAddress.name,
        shippingLine1: shippingAddress.line1,
        shippingLine2: shippingAddress.line2,
        shippingCity: shippingAddress.city,
        shippingState: shippingAddress.state,
        shippingZip: shippingAddress.zipCode,
        shippingCountry: shippingAddress.country || 'US',
        shippingPhone: shippingAddress.phone,
      },
    })

    return NextResponse.json({
      clientSecret: paymentIntent.client_secret,
      transactionId: transaction.id,
      breakdown: {
        salePrice,
        taxRate,
        taxAmount,
        shippingCost,
        freeShipping,
        platformFee,
        stripeFee: sellerStripeFee,
        sellerPayout,
        totalAmount,
        zeroPlatformFees: subscriptionTier !== 'FREE',
        zeroTotalFees: isProTier,
      },
    })
  } catch (error: any) {
    console.error('Checkout error:', error)
    return NextResponse.json(
      { error: error.message || 'Failed to create checkout session' },
      { status: 500 }
    )
  }
}
