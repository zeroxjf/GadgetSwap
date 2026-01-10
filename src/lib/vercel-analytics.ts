/**
 * Vercel Web Analytics
 *
 * NOTE: Vercel does NOT provide a public REST API for fetching Web Analytics data.
 * The @vercel/analytics package collects data client-side which is viewable in the
 * Vercel dashboard, but there's no API to fetch it programmatically.
 *
 * See: https://community.vercel.com/t/feature-request-rest-api-endpoint-for-web-analytics-data/28422
 *
 * Options for programmatic analytics:
 * 1. View analytics directly in Vercel Dashboard
 * 2. Use Vercel's Data Drains to forward analytics to a third-party service
 * 3. Use an alternative analytics service with an API (Plausible, Fathom, PostHog, etc.)
 */

export interface VercelAnalyticsData {
  pageViews: {
    today: number
    yesterday: number
    thisWeek: number
    thisMonth: number
  }
  visitors: {
    today: number
    yesterday: number
    thisWeek: number
    thisMonth: number
  }
  topPages: Array<{ path: string; views: number; visitors: number }>
  topReferrers: Array<{ referrer: string; views: number; visitors: number }>
  timeSeries: Array<{ timestamp: number; pageViews: number; visitors: number }>
  notAvailable?: boolean
  message?: string
}

export async function getVercelAnalytics(): Promise<VercelAnalyticsData | null> {
  // Vercel Web Analytics does not have a public REST API
  // Return null to indicate analytics should be viewed in the Vercel dashboard
  return {
    pageViews: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 },
    visitors: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 },
    topPages: [],
    topReferrers: [],
    timeSeries: [],
    notAvailable: true,
    message: 'Vercel Web Analytics does not have a public REST API. View analytics in your Vercel dashboard.',
  }
}
