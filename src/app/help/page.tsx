'use client'

import { useState, useEffect, Suspense } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import {
  HelpCircle,
  Search,
  ShoppingBag,
  CreditCard,
  Truck,
  Shield,
  MessageCircle,
  ChevronDown,
  ChevronRight,
  Mail,
  ExternalLink,
  Loader2,
} from 'lucide-react'

const categories = [
  {
    id: 'buying',
    icon: ShoppingBag,
    title: 'Buying',
    description: 'How to purchase devices safely',
    color: 'bg-blue-100 text-blue-600',
  },
  {
    id: 'selling',
    icon: CreditCard,
    title: 'Selling',
    description: 'List and sell your devices',
    color: 'bg-green-100 text-green-600',
  },
  {
    id: 'shipping',
    icon: Truck,
    title: 'Shipping',
    description: 'Shipping and tracking info',
    color: 'bg-purple-100 text-purple-600',
  },
  {
    id: 'payments',
    icon: Shield,
    title: 'Payments & Security',
    description: 'Payment methods and protection',
    color: 'bg-yellow-100 text-yellow-600',
  },
]

const faqs: Record<string, Array<{ q: string; a: string; id?: string }>> = {
  buying: [
    {
      q: 'How do I know if a device is jailbreakable?',
      a: 'Each listing shows the iOS version and jailbreak status. You can also use our Jailbreak Checker tool to verify compatibility with specific jailbreak tools like checkm8, Dopamine, or NathanLR.',
    },
    {
      q: 'What does the condition rating mean?',
      a: 'Mint: Like new, no visible wear. Excellent: Minor signs of use. Good: Normal wear, fully functional. Fair: Noticeable wear but works perfectly.',
    },
    {
      q: 'Is there buyer protection?',
      a: 'Yes! All purchases include our Buyer Protection. Payments are held in escrow for 24 hours after delivery confirmation, giving you time to verify the device matches the description.',
    },
    {
      q: 'Can I message the seller before buying?',
      a: 'Yes, you can message any seller directly from the listing page to ask questions about the device before making a purchase.',
    },
  ],
  selling: [
    {
      q: 'How do I create a listing?',
      a: 'Click "Sell" in the navigation, fill out the device details including model, iOS version, storage, and condition. Add clear photos and set your price. Pro tip: Listings with accurate jailbreak info sell faster!',
    },
    {
      q: 'What fees does GadgetSwap charge?',
      a: 'Free accounts pay 10% on sales. Plus subscribers pay 7%, and Pro subscribers pay only 5%. There are no listing fees.',
    },
    {
      q: 'How do I get paid?',
      a: 'Connect your bank account or debit card in Payout Settings. Funds are released 24 hours after the buyer confirms delivery. Payouts typically arrive within 2-3 business days.',
    },
    {
      q: 'Can I edit or remove my listing?',
      a: 'Yes, you can edit active listings anytime from your dashboard. You can also pause or delete listings that haven\'t sold.',
    },
  ],
  shipping: [
    {
      q: 'Who pays for shipping?',
      a: 'Sellers set their own shipping policies. Some include free shipping in the price, while others charge separately. Check the listing for details.',
    },
    {
      q: 'How do I track my package?',
      a: 'Once shipped, you\'ll receive the tracking number via email and in your order details. We support UPS, FedEx, and USPS tracking.',
    },
    {
      q: 'What if my package is lost or damaged?',
      a: 'Our escrow system protects you. If a package is lost, funds will be returned. For damaged items, contact support within 24 hours of delivery with photos.',
    },
    {
      q: 'How should I package devices for shipping?',
      a: 'Use a sturdy box with bubble wrap or padding. Remove SIM cards and sign out of iCloud before shipping. Include the original box if available.',
    },
  ],
  payments: [
    {
      q: 'How does GadgetSwap protect my purchase?',
      a: 'GadgetSwap uses a multi-layer protection system to keep your transactions safe:\n\n1. **24-Hour Escrow Window**: When you pay, funds are held securely — not released to the seller immediately. After delivery is confirmed, you have **24 hours to inspect the device**. During this window, if you raise any concerns, GadgetSwap can directly review and facilitate a refund — no need to involve banks or file disputes.\n\n2. **Direct Resolution (First 24 Hours)**: If something is wrong with your order, contact us immediately. While funds are still in escrow, our team can quickly review photos/evidence and process refunds directly. This is the fastest and easiest path to resolution.\n\n3. **Bank Dispute Protection (After 24 Hours)**: Once the 24-hour window closes, funds are released to the seller. If issues arise after this point, you can file a chargeback dispute with your bank/card issuer. When a dispute is filed, the funds are automatically debited from the seller and held while your bank investigates. Note: The dispute process typically takes 2-3 months for final resolution, and your bank makes the final decision.\n\n4. **Automatic Delivery Tracking**: We monitor carrier tracking (UPS, FedEx, USPS) automatically. Once delivery is confirmed, the 24-hour inspection window begins — no action needed from you.\n\n**Bottom line:** Inspect your device right away and report issues within 24 hours for the smoothest refund process (usually resolved in days). After 24 hours, bank disputes are your recourse but take much longer.\n\nLearn more about the dispute process: https://support.stripe.com/topics/disputes',
      id: 'buyer-protection',
    },
    {
      q: 'What is IMEI verification and why does GadgetSwap require it?',
      a: 'IMEI (International Mobile Equipment Identity) verification is a critical safety feature for iPhones and cellular iPads:\n\n**What is an IMEI?**\nEvery iPhone and cellular iPad has a unique 15-digit IMEI number — think of it like a serial number that identifies the specific device. You can find it in Settings > General > About, or by dialing *#06#.\n\n**Why we verify IMEIs:**\n1. **Device Authentication**: We verify the IMEI belongs to a genuine Apple device and matches the model being listed (e.g., if you\'re selling an iPhone 14 Pro, the IMEI must match an iPhone 14 Pro).\n\n2. **Duplicate Prevention**: We hash each IMEI to detect if the same device is listed multiple times by different sellers — preventing scams where someone tries to sell a device they don\'t own.\n\n3. **Buyer Confidence**: When you see "IMEI Verified" on a listing, you know the seller has proven they have the actual device in hand.\n\n**Privacy Protection:**\nWe never store full IMEIs. Instead, we store only the last 4 digits (for display) and a secure hash (for duplicate detection). Sellers\' full IMEI numbers remain private.\n\n**Note:** IMEI verification confirms the device is real and matches the listing — it does not check carrier blacklist status. For additional peace of mind, you can verify the IMEI with your carrier before purchasing.',
      id: 'imei-verification',
    },
    {
      q: 'What payment methods are accepted?',
      a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex, Discover) and Apple Pay through our secure Stripe payment system.',
    },
    {
      q: 'How does escrow protection work?',
      a: 'When you buy, payment is held securely — not sent to the seller immediately. After delivery is confirmed (via carrier tracking or your manual confirmation), funds are held for an additional **24 hours** before being released to the seller.\n\nDuring this 24-hour window, you can inspect the device and contact GadgetSwap if there are any issues. Our team can review and process refunds directly while funds are still in escrow — this is much faster than filing a bank dispute later.',
      id: 'escrow',
    },
    {
      q: 'Can I get a refund?',
      a: '**Within 24 hours of delivery (Recommended):**\nContact GadgetSwap directly — this is the fastest path to resolution. During this window, funds are still held in escrow and our team can review your case and facilitate a full refund if the item doesn\'t match the description. Resolution typically takes just a few days.\n\n**After 24 hours:**\nOnce the inspection window closes, funds are released to the seller. At this point, you\'ll need to file a chargeback dispute with your bank or card issuer. Here\'s what to expect:\n\n• Your bank will investigate the claim and may request evidence\n• The disputed funds are automatically held from the seller during review\n• The process typically takes **2-3 months** for final resolution\n• Your bank makes the final decision on the outcome\n• Chargeback win rates average around 20-40% depending on the case\n\n**We strongly recommend** inspecting your device immediately upon delivery and reporting any issues within the 24-hour window.\n\nLearn more: https://support.stripe.com/topics/disputes',
      id: 'refunds',
    },
    {
      q: 'Is my payment information secure?',
      a: 'Absolutely. We use Stripe for all payments - we never store your card details. All transactions are encrypted and PCI-compliant.',
    },
  ],
}

function HelpContent() {
  const searchParams = useSearchParams()
  const [activeCategory, setActiveCategory] = useState('buying')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // Handle URL parameters for direct linking to specific FAQs
  useEffect(() => {
    const category = searchParams.get('category')
    const faqId = searchParams.get('faq')

    if (category && faqs[category]) {
      setActiveCategory(category)

      if (faqId) {
        // Find the FAQ by id
        const faqIndex = faqs[category].findIndex(f => f.id === faqId)
        if (faqIndex !== -1) {
          setExpandedFaq(`${category}-${faqIndex}`)
          // Scroll to the FAQ section after a short delay
          setTimeout(() => {
            document.getElementById(`faq-${category}-${faqIndex}`)?.scrollIntoView({ behavior: 'smooth', block: 'center' })
          }, 100)
        }
      }
    }
  }, [searchParams])

  const filteredFaqs = searchQuery
    ? Object.entries(faqs).flatMap(([category, items]) =>
        items
          .filter(
            (faq) =>
              faq.q.toLowerCase().includes(searchQuery.toLowerCase()) ||
              faq.a.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((faq) => ({ ...faq, category }))
      )
    : null

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 dark:bg-primary-900 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Help Center</h1>
          <p className="text-gray-600 dark:text-gray-400 mt-2">Find answers to common questions</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {filteredFaqs && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              Search Results ({filteredFaqs.length})
            </h2>
            {filteredFaqs.length === 0 ? (
              <p className="text-gray-500 dark:text-gray-400">No results found. Try a different search term.</p>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="card p-4">
                    <p className="font-medium text-gray-900 dark:text-white">{faq.q}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">{faq.a}</p>
                    <p className="text-xs text-gray-400 mt-2 capitalize">Category: {faq.category}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Categories */}
        {!searchQuery && (
          <>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
              {categories.map((cat) => (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`card p-4 text-left transition-all ${
                    activeCategory === cat.id
                      ? 'ring-2 ring-primary-500 border-transparent'
                      : 'hover:shadow-md'
                  }`}
                >
                  <div className={`w-10 h-10 rounded-lg ${cat.color} flex items-center justify-center mb-3`}>
                    <cat.icon className="w-5 h-5" />
                  </div>
                  <h3 className="font-semibold text-gray-900 dark:text-white">{cat.title}</h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{cat.description}</p>
                </button>
              ))}
            </div>

            {/* FAQs */}
            <div className="card divide-y divide-gray-100 dark:divide-gray-700">
              <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-t-xl">
                <h2 className="font-semibold text-gray-900 dark:text-white">
                  {categories.find((c) => c.id === activeCategory)?.title} FAQ
                </h2>
              </div>
              {faqs[activeCategory]?.map((faq, index) => (
                <div key={index} id={`faq-${activeCategory}-${index}`} className="p-4">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === `${activeCategory}-${index}` ? null : `${activeCategory}-${index}`)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-gray-900 dark:text-white pr-4">{faq.q}</span>
                    {expandedFaq === `${activeCategory}-${index}` ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === `${activeCategory}-${index}` && (
                    <div className="text-gray-600 dark:text-gray-400 mt-3 text-sm whitespace-pre-line">
                      {faq.a.split('\n').map((line, i) => {
                        // Handle markdown-style bold
                        const parts = line.split(/\*\*(.*?)\*\*/g)
                        return (
                          <p key={i} className={line === '' ? 'h-2' : ''}>
                            {parts.map((part, j) =>
                              j % 2 === 1 ? <strong key={j}>{part}</strong> : part
                            )}
                          </p>
                        )
                      })}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/tools/jailbreak-checker" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 dark:bg-primary-900 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Jailbreak Checker</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Check device compatibility</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link href="/market-insights" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900 dark:text-white">Market Insights</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">Pricing and trends</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Contact */}
        <div className="mt-8 card p-6 text-center">
          <MessageCircle className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900 dark:text-white">Still need help?</h2>
          <p className="text-gray-600 dark:text-gray-400 mt-2 mb-4">
            Our support team is here to help you with any questions.
          </p>
          <a
            href="mailto:jf.tech.team@gmail.com"
            className="btn-primary inline-flex items-center gap-2"
          >
            <Mail className="w-4 h-4" />
            Contact Support
          </a>
        </div>
      </div>
    </div>
  )
}

function HelpLoading() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8 flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-primary-600" />
    </div>
  )
}

export default function HelpPage() {
  return (
    <Suspense fallback={<HelpLoading />}>
      <HelpContent />
    </Suspense>
  )
}
