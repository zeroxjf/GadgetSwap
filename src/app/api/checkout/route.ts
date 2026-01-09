import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { stripe, calculateFees, STRIPE_FEE_PERCENT, STRIPE_FEE_FIXED, PLATFORM_FEES } from '@/lib/stripe'
import { calculateTax } from '@/lib/tax'
import { getDefaultShippingCost, qualifiesForFreeShipping } from '@/lib/shipping'

/**
 * POST /api/checkout
 * Create a payment intent for purchasing a listing
 */
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { error: 'Please sign in to make a purchase' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { listingId, shippingAddress } = body

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

    // Check if seller has completed Stripe onboarding
    if (!listing.seller.stripeAccountId || !listing.seller.stripeOnboardingComplete) {
      return NextResponse.json(
        { error: 'Seller has not set up payment processing yet' },
        { status: 400 }
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
    const stripeFee = Math.round((totalAmount * STRIPE_FEE_PERCENT + STRIPE_FEE_FIXED) * 100) / 100

    // What seller receives (sale price minus fees)
    const sellerPayout = Math.round((salePrice - platformFee - stripeFee) * 100) / 100

    // Create payment intent with Stripe Connect
    const paymentIntent = await stripe.paymentIntents.create({
      amount: Math.round(totalAmount * 100), // Stripe uses cents
      currency: 'usd',
      automatic_payment_methods: {
        enabled: true,
      },
      transfer_data: {
        destination: listing.seller.stripeAccountId,
      },
      application_fee_amount: Math.round((platformFee + stripeFee) * 100), // Platform keeps platform fee + stripe fee
      metadata: {
        listingId: listing.id,
        buyerId: session.user.id,
        sellerId: listing.sellerId,
        salePrice: salePrice.toString(),
        taxAmount: taxAmount.toString(),
        shippingCost: shippingCost.toString(),
        platformFee: platformFee.toString(),
        stripeFee: stripeFee.toString(),
      },
    })

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
        stripeFee,
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
        stripeFee,
        sellerPayout,
        totalAmount,
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
