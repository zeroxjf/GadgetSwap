'use client'

import { useState } from 'react'
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

const faqs: Record<string, Array<{ q: string; a: string }>> = {
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
      q: 'What payment methods are accepted?',
      a: 'We accept all major credit/debit cards (Visa, Mastercard, Amex, Discover) and Apple Pay through our secure Stripe payment system.',
    },
    {
      q: 'How does escrow protection work?',
      a: 'When you buy, payment is held securely by Stripe. After delivery is confirmed (either manually or via tracking), funds are held for 24 hours before being released to the seller.',
    },
    {
      q: 'Can I get a refund?',
      a: 'If the item doesn\'t match the description, you can open a dispute within 24 hours of delivery. Our team will review and process refunds for valid claims.',
    },
    {
      q: 'Is my payment information secure?',
      a: 'Absolutely. We use Stripe for all payments - we never store your card details. All transactions are encrypted and PCI-compliant.',
    },
  ],
}

export default function HelpPage() {
  const [activeCategory, setActiveCategory] = useState('buying')
  const [expandedFaq, setExpandedFaq] = useState<string | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

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
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-primary-100 rounded-full mb-4">
            <HelpCircle className="w-8 h-8 text-primary-600" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900">Help Center</h1>
          <p className="text-gray-600 mt-2">Find answers to common questions</p>
        </div>

        {/* Search */}
        <div className="relative mb-8">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search for help..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-12 pr-4 py-3 rounded-xl border border-gray-200 focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          />
        </div>

        {/* Search Results */}
        {filteredFaqs && (
          <div className="mb-8">
            <h2 className="text-lg font-semibold text-gray-900 mb-4">
              Search Results ({filteredFaqs.length})
            </h2>
            {filteredFaqs.length === 0 ? (
              <p className="text-gray-500">No results found. Try a different search term.</p>
            ) : (
              <div className="space-y-3">
                {filteredFaqs.map((faq, index) => (
                  <div key={index} className="card p-4">
                    <p className="font-medium text-gray-900">{faq.q}</p>
                    <p className="text-sm text-gray-600 mt-2">{faq.a}</p>
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
                  <h3 className="font-semibold text-gray-900">{cat.title}</h3>
                  <p className="text-xs text-gray-500 mt-1">{cat.description}</p>
                </button>
              ))}
            </div>

            {/* FAQs */}
            <div className="card divide-y divide-gray-100">
              <div className="p-4 bg-gray-50 rounded-t-xl">
                <h2 className="font-semibold text-gray-900">
                  {categories.find((c) => c.id === activeCategory)?.title} FAQ
                </h2>
              </div>
              {faqs[activeCategory]?.map((faq, index) => (
                <div key={index} className="p-4">
                  <button
                    onClick={() => setExpandedFaq(expandedFaq === `${activeCategory}-${index}` ? null : `${activeCategory}-${index}`)}
                    className="w-full flex items-center justify-between text-left"
                  >
                    <span className="font-medium text-gray-900 pr-4">{faq.q}</span>
                    {expandedFaq === `${activeCategory}-${index}` ? (
                      <ChevronDown className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    ) : (
                      <ChevronRight className="w-5 h-5 text-gray-400 flex-shrink-0" />
                    )}
                  </button>
                  {expandedFaq === `${activeCategory}-${index}` && (
                    <p className="text-gray-600 mt-3 text-sm">{faq.a}</p>
                  )}
                </div>
              ))}
            </div>
          </>
        )}

        {/* Quick Links */}
        <div className="mt-8 grid md:grid-cols-2 gap-4">
          <Link href="/tools/jailbreak-checker" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center">
              <Search className="w-6 h-6 text-primary-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Jailbreak Checker</h3>
              <p className="text-sm text-gray-500">Check device compatibility</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>

          <Link href="/market-insights" className="card p-4 hover:shadow-md transition-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <ExternalLink className="w-6 h-6 text-green-600" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-gray-900">Market Insights</h3>
              <p className="text-sm text-gray-500">Pricing and trends</p>
            </div>
            <ChevronRight className="w-5 h-5 text-gray-400" />
          </Link>
        </div>

        {/* Contact */}
        <div className="mt-8 card p-6 text-center">
          <MessageCircle className="w-10 h-10 text-primary-600 mx-auto mb-3" />
          <h2 className="text-xl font-semibold text-gray-900">Still need help?</h2>
          <p className="text-gray-600 mt-2 mb-4">
            Our support team is here to help you with any questions.
          </p>
          <a
            href="mailto:support@gadgetswap.com"
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
