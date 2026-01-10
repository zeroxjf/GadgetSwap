/**
 * Fetch analytics data from Vercel Web Analytics API
 * Requires VERCEL_API_TOKEN and VERCEL_PROJECT_ID env vars
 *
 * To get these:
 * 1. VERCEL_API_TOKEN: Go to Vercel Dashboard -> Settings -> Tokens -> Create
 * 2. VERCEL_PROJECT_ID: Go to your project -> Settings -> General -> Project ID
 * 3. VERCEL_TEAM_ID: Go to Team Settings -> General -> Team ID (only for team projects)
 */

const VERCEL_API_TOKEN = process.env.VERCEL_API_TOKEN
const VERCEL_TEAM_ID = process.env.VERCEL_TEAM_ID
const VERCEL_PROJECT_ID = process.env.VERCEL_PROJECT_ID

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
  debug?: {
    hasToken: boolean
    hasProjectId: boolean
    hasTeamId: boolean
    error?: string
  }
}

async function fetchVercelAPI(endpoint: string, params: Record<string, string> = {}): Promise<any> {
  if (!VERCEL_API_TOKEN || !VERCEL_PROJECT_ID) {
    console.log('Missing Vercel credentials:', {
      hasToken: !!VERCEL_API_TOKEN,
      hasProjectId: !!VERCEL_PROJECT_ID,
      hasTeamId: !!VERCEL_TEAM_ID
    })
    return { error: 'Missing credentials' }
  }

  // Build query params - teamId goes in query for team projects
  const searchParams = new URLSearchParams({
    ...params,
  })

  // Add teamId if present (required for team projects)
  if (VERCEL_TEAM_ID) {
    searchParams.set('teamId', VERCEL_TEAM_ID)
  }

  // Vercel Web Analytics API endpoint
  // Format: https://api.vercel.com/v1/web-analytics/{projectId}/{endpoint}
  const url = `https://api.vercel.com/v1/web-analytics/${VERCEL_PROJECT_ID}/${endpoint}?${searchParams}`

  console.log('Fetching Vercel Analytics:', endpoint)

  try {
    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${VERCEL_API_TOKEN}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 300 }, // Cache for 5 minutes
    })

    if (!response.ok) {
      const errorText = await response.text()
      console.error('Vercel Analytics API error:', response.status, errorText)
      return { error: `API returned ${response.status}: ${errorText.slice(0, 100)}` }
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch Vercel Analytics:', error)
    return { error: String(error) }
  }
}

export async function getVercelAnalytics(): Promise<VercelAnalyticsData | null> {
  const debug = {
    hasToken: !!VERCEL_API_TOKEN,
    hasProjectId: !!VERCEL_PROJECT_ID,
    hasTeamId: !!VERCEL_TEAM_ID,
    error: undefined as string | undefined
  }

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
    // Using the timeseries endpoint which gives us page views and visitors
    const [todayData, yesterdayData, weekData, monthData, pathsData, referrersData] = await Promise.all([
      // Today's stats
      fetchVercelAPI('timeseries', {
        from: startOfToday.getTime().toString(),
        to: now.getTime().toString(),
        environment: 'production',
      }),
      // Yesterday's stats
      fetchVercelAPI('timeseries', {
        from: startOfYesterday.getTime().toString(),
        to: startOfToday.getTime().toString(),
        environment: 'production',
      }),
      // This week's stats
      fetchVercelAPI('timeseries', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
        environment: 'production',
      }),
      // This month's stats
      fetchVercelAPI('timeseries', {
        from: startOfMonth.getTime().toString(),
        to: now.getTime().toString(),
        environment: 'production',
      }),
      // Top pages
      fetchVercelAPI('top-pages', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
        environment: 'production',
        limit: '10',
      }),
      // Top referrers
      fetchVercelAPI('top-referrers', {
        from: startOfWeek.getTime().toString(),
        to: now.getTime().toString(),
        environment: 'production',
        limit: '10',
      }),
    ])

    // Check for errors
    if (todayData?.error) {
      debug.error = todayData.error
    }

    // Sum up timeseries data
    const sumTimeseries = (data: any) => {
      if (!data?.data || !Array.isArray(data.data)) return { pageViews: 0, visitors: 0 }
      return data.data.reduce(
        (acc: { pageViews: number; visitors: number }, point: any) => ({
          pageViews: acc.pageViews + (point.pageViews || point.total || 0),
          visitors: acc.visitors + (point.visitors || point.devices || 0),
        }),
        { pageViews: 0, visitors: 0 }
      )
    }

    const todayStats = sumTimeseries(todayData)
    const yesterdayStats = sumTimeseries(yesterdayData)
    const weekStats = sumTimeseries(weekData)
    const monthStats = sumTimeseries(monthData)

    return {
      pageViews: {
        today: todayStats.pageViews,
        yesterday: yesterdayStats.pageViews,
        thisWeek: weekStats.pageViews,
        thisMonth: monthStats.pageViews,
      },
      visitors: {
        today: todayStats.visitors,
        yesterday: yesterdayStats.visitors,
        thisWeek: weekStats.visitors,
        thisMonth: monthStats.visitors,
      },
      topPages: (pathsData?.data || []).map((item: any) => ({
        path: item.key || item.path || item.page || 'Unknown',
        views: item.total || item.pageViews || item.views || 0,
        visitors: item.devices || item.visitors || 0,
      })),
      topReferrers: (referrersData?.data || []).map((item: any) => ({
        referrer: item.key || item.referrer || 'Direct',
        views: item.total || item.pageViews || item.views || 0,
        visitors: item.devices || item.visitors || 0,
      })),
      timeSeries: [],
      debug,
    }
  } catch (error) {
    console.error('Failed to get Vercel Analytics:', error)
    return {
      pageViews: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 },
      visitors: { today: 0, yesterday: 0, thisWeek: 0, thisMonth: 0 },
      topPages: [],
      topReferrers: [],
      timeSeries: [],
      debug: { ...debug, error: String(error) },
    }
  }
}
