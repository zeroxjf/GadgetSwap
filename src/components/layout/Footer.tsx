import Link from 'next/link'

const footerLinks = {
  browse: [
    { name: 'All Devices', href: '/search' },
    { name: 'iPhones', href: '/search?deviceType=IPHONE' },
    { name: 'iPads', href: '/search?deviceType=IPAD' },
    { name: 'MacBooks', href: '/search?deviceType=MACBOOK' },
    { name: 'Jailbreakable', href: '/search?jailbreakStatus=JAILBREAKABLE' },
  ],
  features: [
    { name: 'Device Alerts', href: '/alerts', highlight: true },
    { name: 'Jailbreak Checker', href: '/tools/jailbreak-checker' },
    { name: 'Start Selling', href: '/listings/new' },
    { name: 'Subscription Plans', href: '/subscription' },
  ],
  support: [
    { name: 'Help Center', href: '/help' },
    { name: 'Buyer Protection', href: '/help?category=payments&faq=buyer-protection' },
    { name: 'Terms of Service', href: '/legal/terms' },
    { name: 'Privacy Policy', href: '/legal/privacy' },
  ],
}

export function Footer() {
  return (
    <footer className="bg-gray-900 text-gray-300">
      <div className="max-w-7xl mx-auto px-4 py-12">
        {/* Main footer content */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-8 mb-8">
          <div>
            <h3 className="text-white font-semibold mb-4">Browse</h3>
            <ul className="space-y-2">
              {footerLinks.browse.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Features</h3>
            <ul className="space-y-2">
              {footerLinks.features.map((link) => (
                <li key={link.name}>
                  <Link
                    href={link.href}
                    className={`hover:text-white transition-colors text-sm ${
                      link.highlight ? 'text-yellow-400 font-medium' : ''
                    }`}
                  >
                    {link.name}
                    {link.highlight && <span className="ml-1 text-xs">★</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <h3 className="text-white font-semibold mb-4">Support</h3>
            <ul className="space-y-2">
              {footerLinks.support.map((link) => (
                <li key={link.name}>
                  <Link href={link.href} className="hover:text-white transition-colors text-sm">
                    {link.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Fee comparison highlight - Swappa & eBay focus */}
        <div className="border-t border-gray-800 pt-8 mb-8">
          <div className="text-center mb-6">
            <h3 className="text-white font-semibold mb-2">Lower Fees Than Swappa & eBay</h3>
            <p className="text-sm text-gray-400">Total seller fees comparison (all-in)</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center max-w-2xl mx-auto">
            <div className="opacity-60">
              <div className="text-xl font-bold text-red-400 line-through">13.25%</div>
              <div className="text-xs text-gray-500">eBay</div>
              <div className="text-xs text-gray-600">incl. processing</div>
            </div>
            <div className="opacity-60 border border-yellow-500/30 rounded-lg py-2">
              <div className="text-xl font-bold text-yellow-400 line-through">6.5%</div>
              <div className="text-xs text-yellow-500">Swappa</div>
              <div className="text-xs text-gray-600">3% + 3.5% PayPal</div>
            </div>
            <div className="bg-green-900/30 rounded-lg py-2">
              <div className="text-xl font-bold text-green-400">~4%</div>
              <div className="text-xs text-green-300">GadgetSwap</div>
              <div className="text-xs text-green-600">1% + ~3% Stripe</div>
            </div>
            <div className="bg-green-900/50 rounded-lg py-2 ring-2 ring-green-500">
              <div className="text-xl font-bold text-green-300">0%</div>
              <div className="text-xs text-green-200">Pro Plan</div>
              <div className="text-xs text-green-600">we cover Stripe</div>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <img src="/logo.png" alt="GadgetSwap" className="w-8 h-8 rounded-lg" />
            <span className="text-white font-semibold">GadgetSwap</span>
          </div>

          <p className="text-sm text-gray-500">
            © {new Date().getFullYear()} GadgetSwap. All rights reserved.
          </p>

          <div className="flex items-center gap-4">
            <span className="text-sm text-gray-500">Payments secured by</span>
            <span className="text-white font-semibold">Stripe</span>
          </div>
        </div>
      </div>
    </footer>
  )
}
