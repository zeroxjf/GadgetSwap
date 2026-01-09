import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Terms of Service | GadgetSwap',
  description: 'GadgetSwap Terms of Service and User Agreement',
}

export default function TermsPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="card p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Terms of Service</h1>
          <p className="text-gray-500 mb-8">Last updated: January 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
              <p className="text-gray-600 mb-4">
                By accessing or using GadgetSwap ("the Service"), you agree to be bound by these Terms of Service.
                If you do not agree to these terms, please do not use the Service.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Description of Service</h2>
              <p className="text-gray-600 mb-4">
                GadgetSwap is an online marketplace that connects buyers and sellers of Apple devices,
                with a focus on devices suitable for jailbreaking and iOS customization. We provide:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>A platform for listing and purchasing devices</li>
                <li>Secure payment processing through Stripe</li>
                <li>Escrow protection for transactions</li>
                <li>Tools for checking jailbreak compatibility</li>
                <li>Messaging between buyers and sellers</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. User Accounts</h2>
              <p className="text-gray-600 mb-4">
                To use certain features of the Service, you must create an account. You agree to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide accurate and complete registration information</li>
                <li>Maintain the security of your account credentials</li>
                <li>Promptly update any changes to your information</li>
                <li>Accept responsibility for all activities under your account</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Listing and Selling</h2>
              <p className="text-gray-600 mb-4">When listing items for sale, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Accurately describe the device condition, specifications, and iOS version</li>
                <li>Only list devices you legally own and have the right to sell</li>
                <li>Ensure devices are iCloud unlocked and activation lock removed</li>
                <li>Ship items within the stated timeframe after sale</li>
                <li>Respond to buyer inquiries in a timely manner</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Buying</h2>
              <p className="text-gray-600 mb-4">When purchasing items, you agree to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Pay the listed price plus any applicable shipping and fees</li>
                <li>Provide accurate shipping information</li>
                <li>Inspect items promptly upon delivery</li>
                <li>Report any issues within 24 hours of confirmed delivery</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Payments and Fees</h2>
              <p className="text-gray-600 mb-4">
                All payments are processed securely through Stripe. Sellers are charged a commission on successful sales:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Free accounts: 10% commission</li>
                <li>Plus subscribers: 7% commission</li>
                <li>Pro subscribers: 5% commission</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Funds are held in escrow and released 24 hours after delivery confirmation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Escrow and Buyer Protection</h2>
              <p className="text-gray-600 mb-4">
                Our escrow system protects both buyers and sellers. Payment is held until:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>The item is delivered (confirmed via tracking or manual confirmation)</li>
                <li>24 hours have passed since delivery confirmation</li>
                <li>Any disputes have been resolved</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Prohibited Items and Conduct</h2>
              <p className="text-gray-600 mb-4">The following are prohibited on GadgetSwap:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Stolen devices or devices with activation lock</li>
                <li>Counterfeit or replica products</li>
                <li>Devices with outstanding financial obligations (unpaid carrier balance)</li>
                <li>Fraudulent listings or misrepresentation</li>
                <li>Harassment of other users</li>
                <li>Circumventing the payment system</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                Apple, iPhone, iPad, and iOS are trademarks of Apple Inc. GadgetSwap is not affiliated with
                or endorsed by Apple Inc. All jailbreak tools mentioned are the property of their respective developers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                GadgetSwap provides a platform for transactions but is not responsible for:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>The quality, safety, or legality of items listed</li>
                <li>The accuracy of listings or user content</li>
                <li>The ability of sellers to sell or buyers to pay</li>
                <li>Any damages resulting from jailbreaking devices</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Termination</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to suspend or terminate accounts that violate these terms or
                engage in fraudulent activity. Users may delete their accounts at any time, subject
                to completion of any pending transactions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these terms from time to time. Continued use of the Service after
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact</h2>
              <p className="text-gray-600">
                For questions about these terms, please contact us at{' '}
                <a href="mailto:legal@gadgetswap.com" className="text-primary-600 hover:underline">
                  legal@gadgetswap.com
                </a>
              </p>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/legal/privacy" className="text-primary-600 hover:underline text-sm">
            View Privacy Policy
          </Link>
        </div>
      </div>
    </div>
  )
}
