'use client'

import { useSession } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import Link from 'next/link'
import {
  ChevronLeft,
  CreditCard,
  Plus,
  Trash2,
  Loader2,
  CheckCircle,
  AlertCircle,
} from 'lucide-react'

interface PaymentMethod {
  id: string
  brand: string
  last4: string
  expMonth: number
  expYear: number
  isDefault: boolean
}

export default function PaymentsPage() {
  const { data: session, status } = useSession()
  const router = useRouter()
  const [loading, setLoading] = useState(true)
  const [paymentMethods, setPaymentMethods] = useState<PaymentMethod[]>([])
  const [addingCard, setAddingCard] = useState(false)
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null)

  useEffect(() => {
    if (status === 'unauthenticated') {
      router.push('/auth/signin?callbackUrl=/account/payments')
    }
  }, [status, router])

  useEffect(() => {
    if (session?.user?.id) {
      fetchPaymentMethods()
    }
  }, [session?.user?.id])

  const fetchPaymentMethods = async () => {
    try {
      const response = await fetch('/api/payments/methods')
      if (response.ok) {
        const data = await response.json()
        setPaymentMethods(data.paymentMethods || [])
      }
    } catch (error) {
      console.error('Error fetching payment methods:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAddCard = async () => {
    setAddingCard(true)
    setMessage(null)

    try {
      const response = await fetch('/api/payments/setup-intent', {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to create setup intent')
      }

      const { url } = await response.json()
      if (url) {
        window.location.href = url
      }
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to add payment method. Please try again.' })
      setAddingCard(false)
    }
  }

  const handleRemoveCard = async (paymentMethodId: string) => {
    const confirmed = confirm('Are you sure you want to remove this payment method?')
    if (!confirmed) return

    try {
      const response = await fetch(`/api/payments/methods/${paymentMethodId}`, {
        method: 'DELETE',
      })

      if (!response.ok) {
        throw new Error('Failed to remove payment method')
      }

      setPaymentMethods(paymentMethods.filter((pm) => pm.id !== paymentMethodId))
      setMessage({ type: 'success', text: 'Payment method removed successfully.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to remove payment method.' })
    }
  }

  const handleSetDefault = async (paymentMethodId: string) => {
    try {
      const response = await fetch(`/api/payments/methods/${paymentMethodId}/default`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error('Failed to set default payment method')
      }

      setPaymentMethods(
        paymentMethods.map((pm) => ({
          ...pm,
          isDefault: pm.id === paymentMethodId,
        }))
      )
      setMessage({ type: 'success', text: 'Default payment method updated.' })
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to update default payment method.' })
    }
  }

  const getCardIcon = (brand: string) => {
    const brandColors: Record<string, string> = {
      visa: 'text-blue-600',
      mastercard: 'text-orange-500',
      amex: 'text-blue-500',
      discover: 'text-orange-600',
    }
    return brandColors[brand.toLowerCase()] || 'text-gray-600'
  }

  if (status === 'loading' || loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
      </div>
    )
  }

  if (!session?.user) {
    return null
  }

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-2xl mx-auto px-4">
        {/* Header */}
        <div className="mb-8">
          <Link href="/account/settings" className="text-gray-500 hover:text-gray-700 text-sm mb-2 inline-flex items-center gap-1">
            <ChevronLeft className="w-4 h-4" />
            Back to Settings
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Payment Methods</h1>
          <p className="text-gray-600">Manage your saved payment methods for purchases</p>
        </div>

        {/* Message */}
        {message && (
          <div className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            message.type === 'success' ? 'bg-green-50 text-green-700' : 'bg-red-50 text-red-700'
          }`}>
            {message.type === 'success' ? (
              <CheckCircle className="w-5 h-5 flex-shrink-0" />
            ) : (
              <AlertCircle className="w-5 h-5 flex-shrink-0" />
            )}
            {message.text}
          </div>
        )}

        {/* Payment Methods */}
        <div className="space-y-4">
          {paymentMethods.length === 0 ? (
            <div className="card p-8 text-center">
              <CreditCard className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <h2 className="text-lg font-semibold text-gray-900 mb-2">No payment methods</h2>
              <p className="text-gray-500 mb-6">
                Add a card to make purchases faster and easier.
              </p>
              <button
                onClick={handleAddCard}
                disabled={addingCard}
                className="btn-primary inline-flex items-center gap-2"
              >
                {addingCard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Payment Method
              </button>
            </div>
          ) : (
            <>
              {paymentMethods.map((method) => (
                <div key={method.id} className="card p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className={`p-2 bg-gray-100 rounded-lg ${getCardIcon(method.brand)}`}>
                      <CreditCard className="w-6 h-6" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-medium text-gray-900 capitalize">
                          {method.brand} ending in {method.last4}
                        </p>
                        {method.isDefault && (
                          <span className="text-xs bg-primary-100 text-primary-700 px-2 py-0.5 rounded-full">
                            Default
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-500">
                        Expires {method.expMonth.toString().padStart(2, '0')}/{method.expYear}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {!method.isDefault && (
                      <button
                        onClick={() => handleSetDefault(method.id)}
                        className="text-sm text-primary-600 hover:text-primary-700"
                      >
                        Set as default
                      </button>
                    )}
                    <button
                      onClick={() => handleRemoveCard(method.id)}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Remove card"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}

              <button
                onClick={handleAddCard}
                disabled={addingCard}
                className="card p-4 w-full flex items-center justify-center gap-2 text-gray-600 hover:text-gray-900 hover:border-gray-300 transition-colors"
              >
                {addingCard ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <Plus className="w-4 h-4" />
                )}
                Add Another Card
              </button>
            </>
          )}
        </div>

        {/* Info */}
        <div className="mt-8 p-4 bg-blue-50 rounded-lg">
          <h3 className="font-medium text-blue-900 mb-2">Secure Payments</h3>
          <p className="text-sm text-blue-700">
            Your payment information is securely processed by Stripe. We never store your
            full card details on our servers. All transactions are encrypted and PCI-compliant.
          </p>
        </div>
      </div>
    </div>
  )
}
