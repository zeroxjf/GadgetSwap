/**
 * Fetch analytics data from Vercel Web Analytics API
 * Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID env vars
 */

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

interface AnalyticsDataPoint {
  key: string
  total: number
  devices: number
}

interface TimeSeriesPoint {
  timestamp: number
  pageViews: number
  visitors: number
}

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
  timeSeries: TimeSeriesPoint[]
}

async function fetchVercelAPI(endpoint: string, params: Record<string, string> = {}) {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    return null
  }

  const searchParams = new URLSearchParams({
    projectId: VERCEL_PROJECT_ID,
    ...(VERCEL_TEAM_ID ? { teamId: VERCEL_TEAM_ID } : {}),
    ...params,
  })

  const url = `https://vercel.com/api/web/insights/${endpoint}?${searchParams}`

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      console.error('Vercel Analytics API error:', response.status, await response.text())
      return null
    }

    return response.json()
  } catch (error) {
    console.error('Failed to fetch Vercel Analytics:', error)
    return null
  }
}

export async function getVercelAnalytics(): Promise<VercelAnalyticsData | null> {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('Vercel Analytics API not configured (missing VERCEL_API_TOKEN or VERCEL_PROJECT_ID)')
    return null
  }

  const now = new Date()
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  const startOfYesterday = new Date(startOfToday.getTime() - 24 * 60 * 60 * 1000)
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)

  try {
    // Fetch data for different time periods in parallel
    const [todayData, yesterdayData, weekData, monthData, topPages, topReferrers] = await Promise.all([
      // Today
      fetchVercelAPI('stats', {
        from: startOfToday.getTime().toString(),
        to: now.getTime().toString(),
      }),
      // Yesterday
      fetchVercelAPI('stats', {
        from: startOfYesterday.getTime().toString(),
        to: startOfToday.getTime().toString(),
      }),
      // This week
      fetchVercelAPI('stats', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
      }),
      // This month
      fetchVercelAPI('stats', {
        from: startOfMonth.getTime().toString(),
        to: now.getTime().toString(),
      }),
      // Top pages
      fetchVercelAPI('path', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
        limit: '10',
      }),
      // Top referrers
      fetchVercelAPI('referrer', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
        limit: '10',
      }),
    ])

    return {
      pageViews: {
        today: todayData?.pageViews || 0,
        yesterday: yesterdayData?.pageViews || 0,
        thisWeek: weekData?.pageViews || 0,
        thisMonth: monthData?.pageViews || 0,
      },
      visitors: {
        today: todayData?.visitors || 0,
        yesterday: yesterdayData?.visitors || 0,
        thisWeek: weekData?.visitors || 0,
        thisMonth: monthData?.visitors || 0,
      },
      topPages: (topPages?.data || []).map((item: any) => ({
        path: item.key,
        views: item.total,
        visitors: item.devices,
      })),
      topReferrers: (topReferrers?.data || []).map((item: any) => ({
        referrer: item.key || 'Direct',
        views: item.total,
        visitors: item.devices,
      })),
      timeSeries: [],
    }
  } catch (error) {
    console.error('Failed to get Vercel Analytics:', error)
    return null
  }
}
