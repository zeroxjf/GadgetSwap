import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import Script from 'next/script'
import { Suspense } from 'react'
import './globals.css'
import { Header } from '@/components/layout/Header'
import { Footer } from '@/components/layout/Footer'
import { Providers } from '@/components/Providers'
import { FeedbackWidget } from '@/components/FeedbackWidget'
import { ThemeToggle } from '@/components/ThemeToggle'
import { SimulationBanner } from '@/components/admin/SimulationBanner'
import { SmartAppBanner } from '@/components/SmartAppBanner'
import { Analytics } from '@vercel/analytics/react'

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
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Smart App Banner with deep linking support */}
        <Suspense fallback={<meta name="apple-itunes-app" content="app-id=6757683814" />}>
          <SmartAppBanner />
        </Suspense>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                var pref = localStorage.getItem('theme-preference');
                if (!pref) pref = 'light';
                if (pref === 'dark') {
                  document.documentElement.classList.add('dark');
                }
              })();
            `,
          }}
        />
        <Script
          src="https://www.googletagmanager.com/gtag/js?id=AW-17866343153"
          strategy="afterInteractive"
        />
        <Script id="google-ads" strategy="afterInteractive">
          {`
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'AW-17866343153');
          `}
        </Script>
        {/* Google AdSense */}
        <script
          async
          src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=ca-pub-6127966897486098"
          crossOrigin="anonymous"
        />
      </head>
      <body className={inter.className}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
              {children}
            </main>
            <Footer />
          </div>
          <FeedbackWidget />
          <ThemeToggle />
          <SimulationBanner />
        </Providers>
        <Analytics />
      </body>
    </html>
  )
}
