import Link from 'next/link'
import { ChevronLeft } from 'lucide-react'

export const metadata = {
  title: 'Privacy Policy | GadgetSwap',
  description: 'GadgetSwap Privacy Policy - How we collect, use, and protect your data',
}

export default function PrivacyPage() {
  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-3xl mx-auto px-4">
        <Link href="/" className="text-gray-500 hover:text-gray-700 text-sm mb-4 inline-flex items-center gap-1">
          <ChevronLeft className="w-4 h-4" />
          Back to Home
        </Link>

        <div className="card p-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Privacy Policy</h1>
          <p className="text-gray-500 mb-8">Last updated: January 11, 2025</p>

          <div className="prose prose-gray max-w-none">
            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">1. Introduction</h2>
              <p className="text-gray-600 mb-4">
                GadgetSwap ("we", "our", or "us") is committed to protecting your privacy. This Privacy Policy
                explains how we collect, use, disclose, and safeguard your information when you use our marketplace platform.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">2. Information We Collect</h2>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Account Information</h3>
              <p className="text-gray-600 mb-4">When you create an account, we collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Name and email address</li>
                <li>Username and profile information (bio, location)</li>
                <li>Profile photo (optional)</li>
                <li>Authentication data from Google Sign-In or Apple Sign-In (if used)</li>
                <li>Notification preferences</li>
                <li>Anonymous device tokens for push notifications (iOS app)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Listing Information</h3>
              <p className="text-gray-600 mb-4">When you create a listing, we collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Device details (model, storage, condition, iOS/macOS version)</li>
                <li>IMEI number (hashed for security, last 4 digits stored for display)</li>
                <li>Photos of your device (stored on Cloudinary)</li>
                <li>Verification photo with handwritten code</li>
                <li>Pricing and return policy preferences</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Transaction &amp; Payment Information</h3>
              <p className="text-gray-600 mb-4">For purchases and sales, we collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Shipping addresses and phone numbers</li>
                <li>Payment information (processed securely by Stripe - we never store card details)</li>
                <li>Stripe Connect account information for sellers receiving payouts</li>
                <li>Purchase and sale history</li>
                <li>Shipping tracking numbers</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Communication &amp; Activity</h3>
              <p className="text-gray-600 mb-4">We also collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Messages between buyers and sellers</li>
                <li>Reviews and ratings</li>
                <li>Device alerts and watchlist items</li>
                <li>Listing view counts</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Security &amp; Fraud Prevention Data</h3>
              <p className="text-gray-600 mb-4">To protect our users and prevent fraud, we collect:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>IP address hashes (cryptographically hashed for privacy - we do not store raw IP addresses)</li>
                <li>Login timestamps and activity logs</li>
                <li>Device/browser information for session management</li>
              </ul>
              <p className="text-gray-600 mt-4">
                IP addresses are immediately converted to irreversible SHA-256 hashes before storage.
                This allows us to detect and prevent abuse while protecting your privacy - we cannot
                recover the original IP address from the stored hash.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">3. How We Use Your Information</h2>
              <p className="text-gray-600 mb-4">We use your information to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Provide and maintain our marketplace services</li>
                <li>Process transactions and send related notifications</li>
                <li>Verify your identity and prevent fraud</li>
                <li>Send service updates and marketing communications (with your consent)</li>
                <li>Improve our platform and develop new features</li>
                <li>Respond to your inquiries and provide customer support</li>
                <li>Enforce our Terms of Service and protect users</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">4. Information Sharing</h2>
              <p className="text-gray-600 mb-4">We may share your information with:</p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Other Users</h3>
              <p className="text-gray-600 mb-4">
                When you buy or sell, relevant information is shared with the other party (e.g.,
                shipping address with sellers, seller profile info with buyers).
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Service Providers</h3>
              <p className="text-gray-600 mb-4">We use the following third-party services:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Stripe</strong> - Payment processing and seller payouts (PCI-DSS compliant)</li>
                <li><strong>Cloudinary</strong> - Image hosting and storage for listing photos</li>
                <li><strong>Google OAuth</strong> - Optional sign-in with Google</li>
                <li><strong>Apple Sign-In</strong> - Optional sign-in with Apple</li>
                <li><strong>Apple Push Notification service (APNs)</strong> - Push notifications for the iOS app</li>
                <li><strong>Shipping carriers</strong> (UPS, FedEx, USPS) - Package tracking via their APIs</li>
                <li><strong>Vercel</strong> - Website hosting and analytics</li>
                <li><strong>PostgreSQL database</strong> - Data storage (hosted securely)</li>
              </ul>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">IMEI Verification</h3>
              <p className="text-gray-600 mb-4">
                For iPhone and iPad listings, we verify IMEI numbers using third-party services to confirm
                device legitimacy. We store only a hash of the full IMEI and the last 4 digits for display.
              </p>

              <h3 className="text-lg font-medium text-gray-900 mt-4 mb-2">Legal Requirements</h3>
              <p className="text-gray-600 mb-4">
                We may disclose information when required by law, court order, or to protect our rights and safety.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">5. Data Security</h2>
              <p className="text-gray-600 mb-4">
                We implement industry-standard security measures to protect your data:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>SSL/TLS encryption for all data transmission</li>
                <li>Secure payment processing through Stripe (PCI-DSS compliant)</li>
                <li>Cryptographic hashing for sensitive identifiers (IP addresses, IMEI numbers)</li>
                <li>Regular security audits and monitoring</li>
                <li>Access controls and authentication requirements</li>
                <li>Activity logging for abuse detection (retained for 90 days)</li>
              </ul>
              <p className="text-gray-600 mt-4">
                While we strive to protect your information, no method of transmission over the Internet
                is 100% secure. We cannot guarantee absolute security.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">6. Your Rights and Choices</h2>
              <p className="text-gray-600 mb-4">You have the right to:</p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Access and download your personal data</li>
                <li>Update or correct your information</li>
                <li>Delete your account and associated data</li>
                <li>Opt out of marketing communications</li>
                <li>Disable cookies through your browser settings</li>
              </ul>
              <p className="text-gray-600 mt-4">
                To exercise these rights, visit your Account Settings or contact us at{' '}
                <a href="mailto:privacy@gadgetswap.com" className="text-primary-600 hover:underline">
                  privacy@gadgetswap.com
                </a>
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">7. Mobile App</h2>
              <p className="text-gray-600 mb-4">
                When you use our iOS app, we collect additional information:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li><strong>Device tokens</strong> - Anonymous identifiers assigned by Apple for sending push notifications (these do not personally identify you)</li>
                <li><strong>App usage data</strong> - Listing views, app interactions, and feature usage</li>
                <li><strong>In-App Purchase data</strong> - Subscription status and transaction IDs (processed by Apple)</li>
              </ul>
              <p className="text-gray-600 mt-4">
                Push notification tokens are stored on our servers and used solely for delivering notifications
                you have opted into. You can disable push notifications in your device settings at any time.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">8. Cookies and Tracking</h2>
              <p className="text-gray-600 mb-4">
                We use cookies and similar technologies to:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2">
                <li>Keep you signed in (session cookies via NextAuth)</li>
                <li>Remember your preferences (theme, dismissed banners)</li>
                <li>Track listing view counts</li>
              </ul>
              <p className="text-gray-600 mt-4">
                We use Vercel Analytics to understand how visitors use our site. This collects anonymous,
                aggregated data about page views and does not track individual users or use cookies.
                You can control cookies through your browser settings, though signing in requires session cookies.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">9. Data Retention</h2>
              <p className="text-gray-600 mb-4">
                We retain your information for as long as your account is active or as needed to provide services.
                After account deletion, we may retain certain information as required by law or for legitimate
                business purposes (e.g., transaction records for tax purposes).
              </p>
              <p className="text-gray-600 mt-4">
                Specific retention periods:
              </p>
              <ul className="list-disc pl-6 text-gray-600 space-y-2 mt-2">
                <li>Activity logs (login history, actions): 90 days</li>
                <li>Transaction records: 7 years (tax/legal requirements)</li>
                <li>Messages between users: Duration of account plus 30 days</li>
                <li>IP address hashes: Duration of account (used for abuse prevention)</li>
              </ul>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">10. Children's Privacy</h2>
              <p className="text-gray-600 mb-4">
                GadgetSwap is not intended for users under 18 years of age. We do not knowingly collect
                information from children under 18. If you believe a child has provided us with personal
                information, please contact us immediately.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">11. International Users</h2>
              <p className="text-gray-600 mb-4">
                GadgetSwap is based in the United States. If you access our services from outside the US,
                your information may be transferred to and processed in the US, where data protection laws
                may differ from your country.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">12. Changes to This Policy</h2>
              <p className="text-gray-600 mb-4">
                We may update this Privacy Policy from time to time. We will notify you of significant
                changes by email or through the Service. Your continued use after changes indicates
                acceptance of the updated policy.
              </p>
            </section>

            <section className="mb-8">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">13. Contact Us</h2>
              <p className="text-gray-600">
                For questions or concerns about this Privacy Policy or our data practices, contact us at:
              </p>
              <ul className="list-none mt-4 text-gray-600 space-y-2">
                <li>
                  Email:{' '}
                  <a href="mailto:privacy@gadgetswap.com" className="text-primary-600 hover:underline">
                    privacy@gadgetswap.com
                  </a>
                </li>
              </ul>
            </section>
          </div>
        </div>

        <div className="mt-6 text-center">
          <Link href="/legal/terms" className="text-primary-600 hover:underline text-sm">
            View Terms of Service
          </Link>
        </div>
      </div>
    </div>
  )
}
