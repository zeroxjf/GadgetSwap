/**
 * Package tracking integration for UPS, FedEx, USPS
 *
 * Uses carrier APIs to check delivery status automatically
 */

export type Carrier = 'ups' | 'fedex' | 'usps' | 'unknown'

export interface TrackingStatus {
  carrier: Carrier
  trackingNumber: string
  status: 'pending' | 'in_transit' | 'out_for_delivery' | 'delivered' | 'exception' | 'unknown'
  deliveredAt?: Date
  lastUpdate?: Date
  location?: string
  details?: string
  error?: string
}

/**
 * Detect carrier from tracking number format
 */
export function detectCarrier(trackingNumber: string): Carrier {
  const cleaned = trackingNumber.replace(/\s/g, '').toUpperCase()

  // UPS: 1Z followed by 16 alphanumeric characters
  if (/^1Z[A-Z0-9]{16}$/.test(cleaned)) {
    return 'ups'
  }

  // FedEx: 12, 15, 20, or 22 digits
  if (/^\d{12}$/.test(cleaned) || /^\d{15}$/.test(cleaned) ||
      /^\d{20}$/.test(cleaned) || /^\d{22}$/.test(cleaned)) {
    return 'fedex'
  }

  // USPS: 20-22 digits, or starts with specific prefixes
  if (/^\d{20,22}$/.test(cleaned) ||
      /^(94|93|92|91|94)\d{18,20}$/.test(cleaned) ||
      /^[A-Z]{2}\d{9}US$/.test(cleaned)) {
    return 'usps'
  }

  return 'unknown'
}

/**
 * Get tracking status from carrier
 */
export async function getTrackingStatus(
  trackingNumber: string,
  carrier?: Carrier
): Promise<TrackingStatus> {
  const detectedCarrier = carrier || detectCarrier(trackingNumber)

  try {
    switch (detectedCarrier) {
      case 'ups':
        return await trackUPS(trackingNumber)
      case 'fedex':
        return await trackFedEx(trackingNumber)
      case 'usps':
        return await trackUSPS(trackingNumber)
      default:
        return {
          carrier: 'unknown',
          trackingNumber,
          status: 'unknown',
          error: 'Could not detect carrier from tracking number',
        }
    }
  } catch (error: any) {
    return {
      carrier: detectedCarrier,
      trackingNumber,
      status: 'unknown',
      error: error.message,
    }
  }
}

/**
 * Track UPS package
 * Uses UPS Tracking API
 */
async function trackUPS(trackingNumber: string): Promise<TrackingStatus> {
  const clientId = process.env.UPS_CLIENT_ID
  const clientSecret = process.env.UPS_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    // Fallback: Try to scrape or return unknown
    return {
      carrier: 'ups',
      trackingNumber,
      status: 'unknown',
      error: 'UPS API credentials not configured',
    }
  }

  try {
    // Get OAuth token
    const tokenRes = await fetch('https://onlinetools.ups.com/security/v1/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
        'Authorization': `Basic ${Buffer.from(`${clientId}:${clientSecret}`).toString('base64')}`,
      },
      body: 'grant_type=client_credentials',
    })

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get tracking info
    const trackRes = await fetch(
      `https://onlinetools.ups.com/api/track/v1/details/${trackingNumber}`,
      {
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'transId': `track-${Date.now()}`,
          'transactionSrc': 'gadgetswap',
        },
      }
    )

    const trackData = await trackRes.json()
    const shipment = trackData.trackResponse?.shipment?.[0]
    const pkg = shipment?.package?.[0]
    const activity = pkg?.activity?.[0]

    if (!activity) {
      return {
        carrier: 'ups',
        trackingNumber,
        status: 'pending',
      }
    }

    const statusCode = activity.status?.type
    const isDelivered = statusCode === 'D'

    return {
      carrier: 'ups',
      trackingNumber,
      status: isDelivered ? 'delivered' : mapUPSStatus(statusCode),
      deliveredAt: isDelivered ? parseUPSDate(activity.date, activity.time) : undefined,
      lastUpdate: parseUPSDate(activity.date, activity.time),
      location: formatLocation(activity.location?.address),
      details: activity.status?.description,
    }
  } catch (error: any) {
    return {
      carrier: 'ups',
      trackingNumber,
      status: 'unknown',
      error: error.message,
    }
  }
}

/**
 * Track FedEx package
 * Uses FedEx Track API
 */
async function trackFedEx(trackingNumber: string): Promise<TrackingStatus> {
  const clientId = process.env.FEDEX_CLIENT_ID
  const clientSecret = process.env.FEDEX_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    return {
      carrier: 'fedex',
      trackingNumber,
      status: 'unknown',
      error: 'FedEx API credentials not configured',
    }
  }

  try {
    // Get OAuth token
    const tokenRes = await fetch('https://apis.fedex.com/oauth/token', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `grant_type=client_credentials&client_id=${clientId}&client_secret=${clientSecret}`,
    })

    const tokenData = await tokenRes.json()
    const accessToken = tokenData.access_token

    // Get tracking info
    const trackRes = await fetch('https://apis.fedex.com/track/v1/trackingnumbers', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        includeDetailedScans: true,
        trackingInfo: [{ trackingNumberInfo: { trackingNumber } }],
      }),
    })

    const trackData = await trackRes.json()
    const result = trackData.output?.completeTrackResults?.[0]?.trackResults?.[0]

    if (!result) {
      return {
        carrier: 'fedex',
        trackingNumber,
        status: 'pending',
      }
    }

    const latestStatus = result.latestStatusDetail
    const isDelivered = latestStatus?.code === 'DL'

    return {
      carrier: 'fedex',
      trackingNumber,
      status: isDelivered ? 'delivered' : mapFedExStatus(latestStatus?.code),
      deliveredAt: isDelivered ? new Date(result.dateAndTimes?.find((d: any) => d.type === 'ACTUAL_DELIVERY')?.dateTime) : undefined,
      lastUpdate: latestStatus?.scanLocation ? new Date() : undefined,
      location: formatLocation(latestStatus?.scanLocation),
      details: latestStatus?.description,
    }
  } catch (error: any) {
    return {
      carrier: 'fedex',
      trackingNumber,
      status: 'unknown',
      error: error.message,
    }
  }
}

/**
 * Track USPS package
 * Uses USPS Web Tools API
 */
async function trackUSPS(trackingNumber: string): Promise<TrackingStatus> {
  const userId = process.env.USPS_USER_ID

  if (!userId) {
    return {
      carrier: 'usps',
      trackingNumber,
      status: 'unknown',
      error: 'USPS API credentials not configured',
    }
  }

  try {
    const xml = `
      <TrackFieldRequest USERID="${userId}">
        <TrackID ID="${trackingNumber}"></TrackID>
      </TrackFieldRequest>
    `

    const res = await fetch(
      `https://secure.shippingapis.com/ShippingAPI.dll?API=TrackV2&XML=${encodeURIComponent(xml)}`
    )

    const text = await res.text()

    // Parse XML response (simple parsing)
    const getTag = (tag: string) => {
      const match = text.match(new RegExp(`<${tag}>([^<]*)</${tag}>`))
      return match ? match[1] : null
    }

    const eventDescription = getTag('Event') || getTag('EventDescription')
    const eventDate = getTag('EventDate')
    const eventTime = getTag('EventTime')
    const eventCity = getTag('EventCity')
    const eventState = getTag('EventState')

    const isDelivered = eventDescription?.toLowerCase().includes('delivered') ?? false

    let deliveredAt: Date | undefined
    if (isDelivered && eventDate) {
      deliveredAt = parseUSPSDate(eventDate, eventTime)
    }

    return {
      carrier: 'usps',
      trackingNumber,
      status: isDelivered ? 'delivered' : mapUSPSStatus(eventDescription),
      deliveredAt,
      lastUpdate: eventDate ? parseUSPSDate(eventDate, eventTime) : undefined,
      location: eventCity && eventState ? `${eventCity}, ${eventState}` : undefined,
      details: eventDescription || undefined,
    }
  } catch (error: any) {
    return {
      carrier: 'usps',
      trackingNumber,
      status: 'unknown',
      error: error.message,
    }
  }
}

// Helper functions
function mapUPSStatus(code: string): TrackingStatus['status'] {
  switch (code) {
    case 'D': return 'delivered'
    case 'I': return 'in_transit'
    case 'O': return 'out_for_delivery'
    case 'X': return 'exception'
    case 'P': return 'pending'
    default: return 'in_transit'
  }
}

function mapFedExStatus(code: string): TrackingStatus['status'] {
  switch (code) {
    case 'DL': return 'delivered'
    case 'IT': return 'in_transit'
    case 'OD': return 'out_for_delivery'
    case 'DE': case 'SE': return 'exception'
    case 'PU': return 'pending'
    default: return 'in_transit'
  }
}

function mapUSPSStatus(event: string | null): TrackingStatus['status'] {
  if (!event) return 'pending'
  const lower = event.toLowerCase()
  if (lower.includes('delivered')) return 'delivered'
  if (lower.includes('out for delivery')) return 'out_for_delivery'
  if (lower.includes('in transit') || lower.includes('arrived') || lower.includes('departed')) return 'in_transit'
  if (lower.includes('exception') || lower.includes('alert')) return 'exception'
  return 'in_transit'
}

function parseUPSDate(date: string, time: string): Date {
  // UPS format: YYYYMMDD, HHMMSS
  const year = date.slice(0, 4)
  const month = date.slice(4, 6)
  const day = date.slice(6, 8)
  const hour = time.slice(0, 2)
  const min = time.slice(2, 4)
  const sec = time.slice(4, 6)
  return new Date(`${year}-${month}-${day}T${hour}:${min}:${sec}`)
}

function parseUSPSDate(date: string, time: string | null): Date {
  // USPS format: Month Day, Year  Time
  try {
    return new Date(`${date} ${time || '12:00 PM'}`)
  } catch {
    return new Date()
  }
}

function formatLocation(address: any): string | undefined {
  if (!address) return undefined
  const parts = [address.city, address.stateProvince, address.country].filter(Boolean)
  return parts.length > 0 ? parts.join(', ') : undefined
}
