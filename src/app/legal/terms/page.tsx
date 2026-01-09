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
          <p className="text-gray-500 mb-8">Last updated: January 9, 2025</p>

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
                All payments are processed exclusively through Stripe, a third-party payment processor.
                By using GadgetSwap, you agree to Stripe&apos;s{' '}
                <a href="https://stripe.com/legal/consumer" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Terms of Service
                </a>
                {' '}and{' '}
                <a href="https://stripe.com/privacy" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                  Privacy Policy
                </a>.
              </p>
              <p className="text-gray-600 mb-4">Platform fees on successful sales:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Free accounts: 1% platform fee + ~3% Stripe processing fee</li>
                <li>Plus/Pro subscribers: 0% platform fee (GadgetSwap covers Stripe fees)</li>
              </ul>
              <p className="text-gray-600 mt-4">
                <strong>Important:</strong> GadgetSwap does not process, store, or have access to your payment
                card information. All payment data is handled directly by Stripe in accordance with PCI-DSS standards.
                Funds are held by Stripe and released to sellers 24 hours after delivery confirmation.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Escrow and Buyer Protection</h2>
              <p className="text-gray-600 mb-4">
                Our escrow system provides a holding period for payments. Funds are held by Stripe until:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>The item is delivered (confirmed via tracking or manual confirmation)</li>
                <li>24 hours have passed since delivery confirmation</li>
                <li>Any disputes have been resolved</li>
              </ul>
              <p className="text-gray-600 mt-4">
                This escrow period is a courtesy service. Ultimate payment protection is provided by Stripe
                and your card issuer, not GadgetSwap.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Disputes, Chargebacks, and Refunds</h2>
              <p className="text-gray-600 mb-4">
                <strong>Payment disputes and chargebacks are handled by Stripe.</strong> GadgetSwap is a marketplace
                platform that facilitates transactions between buyers and sellers, but we are not a party to the
                payment transaction itself.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Dispute Resolution Process</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  <strong>Step 1:</strong> Buyers and sellers should first attempt to resolve issues directly
                  through our messaging system.
                </li>
                <li>
                  <strong>Step 2:</strong> If unresolved, buyers may file a dispute through Stripe or their
                  card issuer. Stripe will manage the dispute process according to their policies and card
                  network rules (Visa, Mastercard, etc.).
                </li>
                <li>
                  <strong>Step 3:</strong> GadgetSwap may provide transaction records to Stripe upon request
                  to assist in dispute resolution, but the final decision rests with Stripe and/or the card networks.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Important Disclaimers</h3>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>
                  GadgetSwap does not guarantee the outcome of any dispute. Dispute decisions are made solely
                  by Stripe, card networks, or issuing banks.
                </li>
                <li>
                  Sellers are responsible for responding to Stripe disputes with appropriate evidence
                  (shipping tracking, delivery confirmation, communication records).
                </li>
                <li>
                  Chargebacks and dispute fees assessed by Stripe or card networks are the responsibility
                  of the seller, not GadgetSwap.
                </li>
                <li>
                  For buyer protection details, refer to{' '}
                  <a href="https://stripe.com/docs/disputes" className="text-primary-600 hover:underline" target="_blank" rel="noopener noreferrer">
                    Stripe&apos;s Dispute Documentation
                  </a>
                  {' '}and your card issuer&apos;s policies.
                </li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Refunds</h3>
              <p className="text-gray-600 mb-4">
                Refunds for eligible transactions are processed through Stripe. Refund timing depends on
                your card issuer and may take 5-10 business days to appear. GadgetSwap may facilitate refund
                requests but does not directly control refund processing.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Prohibited Items and Conduct</h2>
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
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Intellectual Property</h2>
              <p className="text-gray-600 mb-4">
                Apple, iPhone, iPad, and iOS are trademarks of Apple Inc. GadgetSwap is not affiliated with
                or endorsed by Apple Inc. All jailbreak tools mentioned are the property of their respective developers.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. Limitation of Liability</h2>
              <p className="text-gray-600 mb-4">
                <strong>GadgetSwap is a marketplace platform only.</strong> We facilitate connections between
                buyers and sellers but are not a party to transactions. To the maximum extent permitted by law:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>GadgetSwap is not responsible for the quality, safety, legality, or accuracy of any listing</li>
                <li>GadgetSwap is not responsible for the ability of sellers to sell or buyers to pay</li>
                <li>GadgetSwap is not responsible for any damages resulting from transactions, including
                    items not received, items not as described, or defective items</li>
                <li>GadgetSwap is not responsible for any damages resulting from jailbreaking devices</li>
                <li>GadgetSwap is not responsible for payment disputes, chargebacks, or their outcomes -
                    these are governed by Stripe&apos;s policies and card network rules</li>
                <li>GadgetSwap&apos;s total liability for any claim shall not exceed the platform fees you paid
                    to GadgetSwap in the 12 months preceding the claim</li>
              </ul>
              <p className="text-gray-600 mt-4">
                <strong>Payment protection is provided by Stripe and your card issuer, not GadgetSwap.</strong>{' '}
                By using our platform, you acknowledge that any recourse for payment issues must be pursued
                through Stripe&apos;s dispute process or your card issuer&apos;s chargeback process.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Indemnification</h2>
              <p className="text-gray-600 mb-4">
                You agree to indemnify and hold harmless GadgetSwap, its officers, directors, employees, and
                agents from any claims, damages, losses, or expenses (including reasonable attorney fees)
                arising from:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Your use of the Service</li>
                <li>Your violation of these Terms</li>
                <li>Your violation of any rights of another party</li>
                <li>Any dispute between you and another user</li>
                <li>Any dispute related to payments processed through Stripe</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Disclaimer of Warranties</h2>
              <p className="text-gray-600 mb-4">
                THE SERVICE IS PROVIDED &quot;AS IS&quot; AND &quot;AS AVAILABLE&quot; WITHOUT WARRANTIES OF ANY KIND,
                EXPRESS OR IMPLIED. GADGETSWAP DISCLAIMS ALL WARRANTIES, INCLUDING IMPLIED WARRANTIES OF
                MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE, AND NON-INFRINGEMENT.
              </p>
              <p className="text-gray-600 mb-4">
                We do not warrant that the Service will be uninterrupted, secure, or error-free. We do not
                warrant the accuracy of listings, user content, or jailbreak compatibility information.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">14. Termination</h2>
              <p className="text-gray-600 mb-4">
                We reserve the right to suspend or terminate accounts that violate these terms or
                engage in fraudulent activity. Users may delete their accounts at any time, subject
                to completion of any pending transactions.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">15. Governing Law</h2>
              <p className="text-gray-600 mb-4">
                These Terms shall be governed by and construed in accordance with the laws of the
                United States. Any disputes arising from these Terms or your use of the Service
                shall be resolved through binding arbitration, except where prohibited by law.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">16. Changes to Terms</h2>
              <p className="text-gray-600 mb-4">
                We may update these terms from time to time. Continued use of the Service after
                changes constitutes acceptance of the new terms.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">17. Contact</h2>
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
