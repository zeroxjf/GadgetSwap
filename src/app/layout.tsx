import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/Providers'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'GadgetSwap - Buy & Sell Apple Devices | Jailbreak Marketplace',
  description: 'The premier marketplace for buying and selling iPhones, iPads, MacBooks, and more. Specialized in jailbreak-friendly devices with iOS version search, market insights, and low fees.',
  keywords: ['iPhone', 'iPad', 'MacBook', 'Apple', 'jailbreak', 'iOS', 'buy', 'sell', 'marketplace', 'used Apple devices'],
  icons: {
    icon: '/logo.png',
    apple: '/logo.png',
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
        </Providers>
      </body>
    </html>
  )
}
