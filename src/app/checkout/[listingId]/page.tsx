'use client'

import { useState, useEffect, useCallback } from 'react'
import { useParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { useSession } from 'next-auth/react'
import { loadStripe } from '@stripe/stripe-js'
import { Elements, PaymentElement, useStripe, useElements } from '@stripe/react-stripe-js'
import {
  ArrowLeft,
  Package,
  MapPin,
  CreditCard,
  Shield,
  Check,
  Plus,
  Loader2,
  AlertCircle,
  ChevronDown,
} from 'lucide-react'

// Initialize Stripe
const stripePromise = loadStripe(process.env.NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY!)

interface Listing {
  id: string
  title: string
  price: number
  condition: string
  deviceType: string
  deviceModel: string
  storageGB: number | null
  images: { url: string }[]
  seller: {
    id: string
    name: string
    username: string
    image: string | null
    rating: number
    stripeOnboardingComplete: boolean
  }
}

interface SavedAddress {
  id: string
  label: string | null
  name: string
  line1: string
  line2: string | null
  city: string
  state: string
  zipCode: string
  country: string
  phone: string | null
  isDefault: boolean
}

interface ShippingAddress {
  name: string
  line1: string
  line2: string
  city: string
  state: string
  zipCode: string
  country: string
  phone: string
}

interface PriceBreakdown {
  salePrice: number
  taxRate: number
  taxAmount: number
  shippingCost: number
  platformFee: number
  stripeFee: number
  totalAmount: number
}

// Payment form component
function CheckoutForm({
  breakdown,
  onSuccess,
}: {
  breakdown: PriceBreakdown
  onSuccess: () => void
}) {
  const stripe = useStripe()
  const elements = useElements()
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()

    if (!stripe || !elements) {
      return
    }

    setIsProcessing(true)
    setError(null)

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        return_url: `${window.location.origin}/checkout/success`,
      },
    })

    if (submitError) {
      setError(submitError.message || 'Payment failed')
      setIsProcessing(false)
    } else {
      onSuccess()
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <PaymentElement />

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 text-sm flex items-start gap-2">
          <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <span>{error}</span>
        </div>
      )}

      <button
        type="submit"
        disabled={!stripe || isProcessing}
        className="btn-primary w-full py-4 text-lg font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
      >
        {isProcessing ? (
          <span className="flex items-center justify-center gap-2">
            <Loader2 className="w-5 h-5 animate-spin" />
            Processing...
          </span>
        ) : (
          `Pay $${breakdown.totalAmount.toFixed(2)}`
        )}
      </button>

      <div className="flex items-center justify-center gap-2 text-sm text-gray-500">
        <Shield className="w-4 h-4" />
        <span>Secure payment powered by Stripe</span>
      </div>
    </form>
  )
}

export default function CheckoutPage() {
  const params = useParams()
  const router = useRouter()
  const { data: session, status: sessionStatus } = useSession()
  const listingId = params.listingId as string

  const [listing, setListing] = useState<Listing | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Saved addresses
  const [savedAddresses, setSavedAddresses] = useState<SavedAddress[]>([])
  const [selectedAddressId, setSelectedAddressId] = useState<string | null>(null)
  const [showNewAddressForm, setShowNewAddressForm] = useState(false)
  const [saveAddress, setSaveAddress] = useState(false)
  const [addressLabel, setAddressLabel] = useState('')

  // Shipping address form
  const [shippingAddress, setShippingAddress] = useState<ShippingAddress>({
    name: '',
    line1: '',
    line2: '',
    city: '',
    state: '',
    zipCode: '',
    country: 'US',
    phone: '',
  })

  // Tax and pricing
  const [taxInfo, setTaxInfo] = useState<{ taxRate: number; taxAmount: number; state: string | null } | null>(null)
  const [isCalculatingTax, setIsCalculatingTax] = useState(false)

  // Stripe
  const [clientSecret, setClientSecret] = useState<string | null>(null)
  const [breakdown, setBreakdown] = useState<PriceBreakdown | null>(null)
  const [isCreatingPayment, setIsCreatingPayment] = useState(false)

  // Fetch listing
  useEffect(() => {
    async function fetchListing() {
      try {
        const res = await fetch(`/api/listings/${listingId}`)
        if (!res.ok) throw new Error('Failed to fetch listing')
        const data = await res.json()
        setListing(data.listing)
      } catch (err: any) {
        setError(err.message)
      } finally {
        setIsLoading(false)
      }
    }

    if (listingId) {
      fetchListing()
    }
  }, [listingId])

  // Fetch saved addresses
  useEffect(() => {
    async function fetchAddresses() {
      if (!session?.user) return

      try {
        const res = await fetch('/api/addresses')
        if (res.ok) {
          const data = await res.json()
          setSavedAddresses(data.addresses)

          // Select default address if exists
          const defaultAddr = data.addresses.find((a: SavedAddress) => a.isDefault)
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id)
            setShippingAddress({
              name: defaultAddr.name,
              line1: defaultAddr.line1,
              line2: defaultAddr.line2 || '',
              city: defaultAddr.city,
              state: defaultAddr.state,
              zipCode: defaultAddr.zipCode,
              country: defaultAddr.country,
              phone: defaultAddr.phone || '',
            })
          }
        }
      } catch (err) {
        console.error('Failed to fetch addresses:', err)
      }
    }

    fetchAddresses()
  }, [session])

  // Calculate tax when ZIP changes
  const calculateTax = useCallback(async (zipCode: string, amount: number) => {
    if (!zipCode || zipCode.length < 5) {
      setTaxInfo(null)
      return
    }

    setIsCalculatingTax(true)
    try {
      const res = await fetch(`/api/tax?zipCode=${zipCode}&amount=${amount}`)
      if (res.ok) {
        const data = await res.json()
        setTaxInfo({
          taxRate: data.taxRate,
          taxAmount: data.taxAmount,
          state: data.state,
        })
      }
    } catch (err) {
      console.error('Failed to calculate tax:', err)
    } finally {
      setIsCalculatingTax(false)
    }
  }, [])

  // Debounced tax calculation
  useEffect(() => {
    if (listing && shippingAddress.zipCode.length >= 5) {
      const timer = setTimeout(() => {
        calculateTax(shippingAddress.zipCode, listing.price)
      }, 500)
      return () => clearTimeout(timer)
    }
  }, [shippingAddress.zipCode, listing, calculateTax])

  // Select saved address
  const handleSelectAddress = (address: SavedAddress) => {
    setSelectedAddressId(address.id)
    setShippingAddress({
      name: address.name,
      line1: address.line1,
      line2: address.line2 || '',
      city: address.city,
      state: address.state,
      zipCode: address.zipCode,
      country: address.country,
      phone: address.phone || '',
    })
    setShowNewAddressForm(false)
  }

  // Validate shipping address
  const isAddressValid = () => {
    return (
      shippingAddress.name.trim() &&
      shippingAddress.line1.trim() &&
      shippingAddress.city.trim() &&
      shippingAddress.state.trim() &&
      shippingAddress.zipCode.length >= 5
    )
  }

  // Create payment intent
  const handleProceedToPayment = async () => {
    if (!isAddressValid() || !listing) return

    setIsCreatingPayment(true)
    setError(null)

    try {
      // Save address if requested
      if (saveAddress && showNewAddressForm) {
        await fetch('/api/addresses', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            ...shippingAddress,
            label: addressLabel || null,
            isDefault: savedAddresses.length === 0,
          }),
        })
      }

      // Create checkout session
      const res = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          listingId: listing.id,
          shippingAddress,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        throw new Error(data.error || 'Failed to create checkout')
      }

      setClientSecret(data.clientSecret)
      setBreakdown(data.breakdown)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsCreatingPayment(false)
    }
  }

  // Handle successful payment
  const handlePaymentSuccess = () => {
    router.push('/checkout/success')
  }

  // Auth check
  if (sessionStatus === 'loading' || isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (sessionStatus === 'unauthenticated') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <h1 className="text-xl font-bold mb-4">Sign in Required</h1>
          <p className="text-gray-600 mb-6">Please sign in to complete your purchase.</p>
          <Link href={`/auth/signin?callbackUrl=/checkout/${listingId}`} className="btn-primary">
            Sign In
          </Link>
        </div>
      </div>
    )
  }

  if (error && !listing) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="card p-8 max-w-md text-center">
          <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h1 className="text-xl font-bold mb-2">Error</h1>
          <p className="text-gray-600 mb-6">{error}</p>
          <Link href="/browse" className="btn-secondary">
            Browse Listings
          </Link>
        </div>
      </div>
    )
  }

  if (!listing) return null

  const totalEstimate = listing.price + (taxInfo?.taxAmount || 0)

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href={`/listings/${listingId}`} className="inline-flex items-center gap-2 text-gray-600 hover:text-gray-900 mb-4">
            <ArrowLeft className="w-4 h-4" />
            Back to listing
          </Link>
          <h1 className="text-2xl font-bold text-gray-900">Checkout</h1>
        </div>

        <div className="grid lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Order Summary */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Package className="w-5 h-5" />
                Order Summary
              </h2>

              <div className="flex gap-4">
                <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
                  {listing.images?.[0] ? (
                    <img
                      src={listing.images[0].url}
                      alt={listing.title}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-gray-400">
                      <Package className="w-8 h-8" />
                    </div>
                  )}
                </div>

                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900">{listing.title}</h3>
                  <p className="text-sm text-gray-600">
                    {listing.deviceModel} {listing.storageGB && `${listing.storageGB}GB`}
                  </p>
                  <p className="text-sm text-gray-500">
                    Condition: {listing.condition.replace('_', ' ')}
                  </p>
                  <p className="text-sm text-gray-500">
                    Seller: {listing.seller.name || listing.seller.username}
                  </p>
                </div>

                <div className="text-right">
                  <p className="text-xl font-bold text-gray-900">${listing.price.toFixed(2)}</p>
                </div>
              </div>
            </div>

            {/* Shipping Address */}
            <div className="card p-6">
              <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <MapPin className="w-5 h-5" />
                Shipping Address
              </h2>

              {/* Saved Addresses */}
              {savedAddresses.length > 0 && !showNewAddressForm && (
                <div className="space-y-3 mb-4">
                  {savedAddresses.map((addr) => (
                    <label
                      key={addr.id}
                      className={`block p-4 border-2 rounded-lg cursor-pointer transition-colors ${
                        selectedAddressId === addr.id
                          ? 'border-primary-500 bg-primary-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-start gap-3">
                        <input
                          type="radio"
                          name="savedAddress"
                          checked={selectedAddressId === addr.id}
                          onChange={() => handleSelectAddress(addr)}
                          className="mt-1"
                        />
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">{addr.name}</span>
                            {addr.label && (
                              <span className="text-xs bg-gray-100 text-gray-600 px-2 py-0.5 rounded">
                                {addr.label}
                              </span>
                            )}
                            {addr.isDefault && (
                              <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded">
                                Default
                              </span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {addr.line1}
                            {addr.line2 && `, ${addr.line2}`}
                          </p>
                          <p className="text-sm text-gray-600">
                            {addr.city}, {addr.state} {addr.zipCode}
                          </p>
                        </div>
                      </div>
                    </label>
                  ))}

                  <button
                    onClick={() => {
                      setShowNewAddressForm(true)
                      setSelectedAddressId(null)
                      setShippingAddress({
                        name: '',
                        line1: '',
                        line2: '',
                        city: '',
                        state: '',
                        zipCode: '',
                        country: 'US',
                        phone: '',
                      })
                    }}
                    className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-600 hover:border-gray-400 hover:text-gray-700 flex items-center justify-center gap-2"
                  >
                    <Plus className="w-4 h-4" />
                    Add new address
                  </button>
                </div>
              )}

              {/* New Address Form */}
              {(showNewAddressForm || savedAddresses.length === 0) && (
                <div className="space-y-4">
                  {savedAddresses.length > 0 && (
                    <button
                      onClick={() => {
                        setShowNewAddressForm(false)
                        if (savedAddresses.length > 0) {
                          handleSelectAddress(savedAddresses[0])
                        }
                      }}
                      className="text-sm text-primary-600 hover:underline mb-2"
                    >
                      Use saved address
                    </button>
                  )}

                  <div className="grid sm:grid-cols-2 gap-4">
                    <div className="sm:col-span-2">
                      <label className="label mb-1.5 block">Full Name *</label>
                      <input
                        type="text"
                        value={shippingAddress.name}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, name: e.target.value })}
                        placeholder="John Doe"
                        className="input"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label mb-1.5 block">Address Line 1 *</label>
                      <input
                        type="text"
                        value={shippingAddress.line1}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, line1: e.target.value })}
                        placeholder="123 Main Street"
                        className="input"
                        required
                      />
                    </div>

                    <div className="sm:col-span-2">
                      <label className="label mb-1.5 block">Address Line 2</label>
                      <input
                        type="text"
                        value={shippingAddress.line2}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, line2: e.target.value })}
                        placeholder="Apt, suite, unit, etc. (optional)"
                        className="input"
                      />
                    </div>

                    <div>
                      <label className="label mb-1.5 block">City *</label>
                      <input
                        type="text"
                        value={shippingAddress.city}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, city: e.target.value })}
                        placeholder="New York"
                        className="input"
                        required
                      />
                    </div>

                    <div>
                      <label className="label mb-1.5 block">State *</label>
                      <input
                        type="text"
                        value={shippingAddress.state}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, state: e.target.value })}
                        placeholder="NY"
                        className="input"
                        maxLength={2}
                        required
                      />
                    </div>

                    <div>
                      <label className="label mb-1.5 block">ZIP Code *</label>
                      <input
                        type="text"
                        value={shippingAddress.zipCode}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, zipCode: e.target.value })}
                        placeholder="10001"
                        className="input"
                        maxLength={10}
                        required
                      />
                    </div>

                    <div>
                      <label className="label mb-1.5 block">Phone</label>
                      <input
                        type="tel"
                        value={shippingAddress.phone}
                        onChange={(e) => setShippingAddress({ ...shippingAddress, phone: e.target.value })}
                        placeholder="(555) 123-4567"
                        className="input"
                      />
                    </div>
                  </div>

                  {/* Save address option */}
                  <div className="pt-2 space-y-3">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveAddress}
                        onChange={(e) => setSaveAddress(e.target.checked)}
                        className="rounded text-primary-600"
                      />
                      <span className="text-sm text-gray-700">Save this address for future orders</span>
                    </label>

                    {saveAddress && (
                      <div>
                        <label className="label mb-1.5 block text-sm">Address Label (optional)</label>
                        <input
                          type="text"
                          value={addressLabel}
                          onChange={(e) => setAddressLabel(e.target.value)}
                          placeholder="Home, Work, etc."
                          className="input"
                        />
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Payment Section */}
            {clientSecret && breakdown ? (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>

                <Elements
                  stripe={stripePromise}
                  options={{
                    clientSecret,
                    appearance: {
                      theme: 'stripe',
                      variables: {
                        colorPrimary: '#6366f1',
                      },
                    },
                  }}
                >
                  <CheckoutForm breakdown={breakdown} onSuccess={handlePaymentSuccess} />
                </Elements>
              </div>
            ) : (
              <div className="card p-6">
                <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Payment
                </h2>

                {error && (
                  <div className="bg-red-50 border border-red-200 text-red-700 rounded-lg p-3 mb-4 text-sm">
                    {error}
                  </div>
                )}

                <button
                  onClick={handleProceedToPayment}
                  disabled={!isAddressValid() || isCreatingPayment}
                  className="btn-primary w-full py-3 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isCreatingPayment ? (
                    <span className="flex items-center justify-center gap-2">
                      <Loader2 className="w-5 h-5 animate-spin" />
                      Preparing checkout...
                    </span>
                  ) : (
                    'Continue to Payment'
                  )}
                </button>

                {!isAddressValid() && (
                  <p className="text-sm text-gray-500 mt-2 text-center">
                    Please fill in all required shipping fields
                  </p>
                )}
              </div>
            )}
          </div>

          {/* Order Summary Sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-8">
              <h2 className="text-lg font-semibold mb-4">Order Total</h2>

              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-600">Subtotal</span>
                  <span className="font-medium">${listing.price.toFixed(2)}</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">Shipping</span>
                  <span className="font-medium text-green-600">Free</span>
                </div>

                <div className="flex justify-between">
                  <span className="text-gray-600">
                    Tax {taxInfo?.state && `(${taxInfo.state})`}
                    {isCalculatingTax && (
                      <Loader2 className="w-3 h-3 inline ml-1 animate-spin" />
                    )}
                  </span>
                  <span className="font-medium">
                    {taxInfo ? `$${taxInfo.taxAmount.toFixed(2)}` : '--'}
                  </span>
                </div>

                <div className="border-t pt-3 mt-3">
                  <div className="flex justify-between text-lg font-bold">
                    <span>Total</span>
                    <span>
                      {taxInfo ? `$${totalEstimate.toFixed(2)}` : `$${listing.price.toFixed(2)}+`}
                    </span>
                  </div>
                </div>
              </div>

              {/* Buyer Protection */}
              <div className="mt-6 p-4 bg-green-50 rounded-lg">
                <div className="flex items-start gap-3">
                  <Shield className="w-5 h-5 text-green-600 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="font-semibold text-green-900">Buyer Protection</h3>
                    <p className="text-sm text-green-700 mt-1">
                      Funds are held until you confirm delivery. If there's an issue, we'll help resolve it.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
