import Link from 'next/link'
import { XCircle, ArrowLeft, HelpCircle } from 'lucide-react'

export default function SubscriptionCancelPage() {
  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center py-12 px-4">
      <div className="max-w-md w-full text-center">
        <div className="card p-8">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <XCircle className="w-10 h-10 text-gray-400" />
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-2">
            Subscription Canceled
          </h1>
          <p className="text-gray-600 mb-6">
            No worries! You can upgrade anytime when you're ready.
          </p>

          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
            <h3 className="font-medium text-blue-800 mb-2">Did you know?</h3>
            <p className="text-sm text-blue-700">
              GadgetSwap's free tier already offers the lowest fees in the market at ~4% total.
              That's 40% less than Swappa and 70% less than eBay!
            </p>
          </div>

          <div className="space-y-3">
            <Link
              href="/subscription"
              className="btn-primary w-full flex items-center justify-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              View Plans Again
            </Link>
            <Link
              href="/search"
              className="btn-secondary w-full"
            >
              Browse Devices
            </Link>
          </div>
        </div>

        <div className="mt-6">
          <Link
            href="/help"
            className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-gray-700"
          >
            <HelpCircle className="w-4 h-4" />
            Have questions? Contact support
          </Link>
        </div>
      </div>
    </div>
  )
}
