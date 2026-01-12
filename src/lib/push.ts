import { prisma } from './prisma'
import http2 from 'http2'
import jwt from 'jsonwebtoken'

// APNs configuration from environment variables
const APNS_KEY_ID = process.env.APNS_KEY_ID
const APNS_TEAM_ID = process.env.APNS_TEAM_ID
const APNS_BUNDLE_ID = process.env.APPLE_BUNDLE_ID || 'com.JFTech.GadgetSwap'
const APNS_KEY = process.env.APNS_KEY // Base64 encoded .p8 key content

// APNs endpoints
const APNS_HOST = process.env.NODE_ENV === 'production'
  ? 'api.push.apple.com'
  : 'api.sandbox.push.apple.com'

interface PushPayload {
  title: string
  body: string
  data?: Record<string, string>
  badge?: number
  sound?: string
  category?: string
}

/**
 * Generate JWT token for APNs authentication
 */
function generateAPNsToken(): string {
  if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
    throw new Error('APNs credentials not configured')
  }

  // Decode base64 key
  const key = Buffer.from(APNS_KEY, 'base64').toString('utf-8')

  const token = jwt.sign({}, key, {
    algorithm: 'ES256',
    keyid: APNS_KEY_ID,
    issuer: APNS_TEAM_ID,
    expiresIn: '1h',
  })

  return token
}

/**
 * Send push notification to a single device
 */
async function sendToDevice(
  deviceToken: string,
  payload: PushPayload
): Promise<{ success: boolean; error?: string }> {
  return new Promise((resolve) => {
    try {
      const token = generateAPNsToken()

      const client = http2.connect(`https://${APNS_HOST}`)

      const apnsPayload = {
        aps: {
          alert: {
            title: payload.title,
            body: payload.body,
          },
          badge: payload.badge,
          sound: payload.sound || 'default',
          category: payload.category,
        },
        ...payload.data,
      }

      const req = client.request({
        ':method': 'POST',
        ':path': `/3/device/${deviceToken}`,
        'authorization': `bearer ${token}`,
        'apns-topic': APNS_BUNDLE_ID,
        'apns-push-type': 'alert',
        'apns-priority': '10',
        'content-type': 'application/json',
      })

      req.setEncoding('utf8')

      let responseData = ''
      let statusCode: number

      req.on('response', (headers) => {
        statusCode = headers[':status'] as number
      })

      req.on('data', (chunk) => {
        responseData += chunk
      })

      req.on('end', () => {
        client.close()

        if (statusCode === 200) {
          resolve({ success: true })
        } else {
          const error = responseData ? JSON.parse(responseData) : { reason: 'Unknown error' }
          console.error(`APNs error for ${deviceToken}:`, error)

          // If token is invalid, remove it from database
          if (error.reason === 'BadDeviceToken' || error.reason === 'Unregistered') {
            prisma.pushToken.delete({ where: { token: deviceToken } }).catch(() => {})
          }

          resolve({ success: false, error: error.reason })
        }
      })

      req.on('error', (err) => {
        client.close()
        console.error('APNs request error:', err)
        resolve({ success: false, error: err.message })
      })

      req.write(JSON.stringify(apnsPayload))
      req.end()
    } catch (error) {
      console.error('APNs send error:', error)
      resolve({ success: false, error: error instanceof Error ? error.message : 'Unknown error' })
    }
  })
}

/**
 * Send push notification to a user (all their devices)
 */
export async function sendPushToUser(
  userId: string,
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  // Check if APNs is configured
  if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
    console.log('APNs not configured, skipping push notification')
    return { sent: 0, failed: 0 }
  }

  const tokens = await prisma.pushToken.findMany({
    where: { userId },
    select: { token: true },
  })

  if (tokens.length === 0) {
    return { sent: 0, failed: 0 }
  }

  const results = await Promise.all(
    tokens.map((t) => sendToDevice(t.token, payload))
  )

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  }
}

/**
 * Send push notification to multiple users
 */
export async function sendPushToUsers(
  userIds: string[],
  payload: PushPayload
): Promise<{ sent: number; failed: number }> {
  if (!APNS_KEY || !APNS_KEY_ID || !APNS_TEAM_ID) {
    console.log('APNs not configured, skipping push notifications')
    return { sent: 0, failed: 0 }
  }

  const tokens = await prisma.pushToken.findMany({
    where: { userId: { in: userIds } },
    select: { token: true },
  })

  if (tokens.length === 0) {
    return { sent: 0, failed: 0 }
  }

  const results = await Promise.all(
    tokens.map((t) => sendToDevice(t.token, payload))
  )

  return {
    sent: results.filter((r) => r.success).length,
    failed: results.filter((r) => !r.success).length,
  }
}

/**
 * Send alert match notification
 */
export async function sendAlertMatchPush(
  userId: string,
  alertName: string,
  listingTitle: string,
  price: number,
  listingId: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: `Match Found: ${alertName}`,
    body: `${listingTitle} - $${price.toFixed(0)}`,
    data: {
      type: 'ALERT_MATCH',
      listingId,
    },
    sound: 'default',
  })
}

/**
 * Send transaction update notification
 */
export async function sendTransactionPush(
  userId: string,
  title: string,
  body: string,
  transactionId: string
): Promise<void> {
  await sendPushToUser(userId, {
    title,
    body,
    data: {
      type: 'TRANSACTION',
      transactionId,
    },
    sound: 'default',
  })
}

/**
 * Send new message notification
 */
export async function sendMessagePush(
  userId: string,
  senderName: string,
  messagePreview: string,
  conversationId: string
): Promise<void> {
  await sendPushToUser(userId, {
    title: senderName,
    body: messagePreview.length > 100 ? messagePreview.slice(0, 100) + '...' : messagePreview,
    data: {
      type: 'MESSAGE',
      conversationId,
    },
    sound: 'default',
  })
}

/**
 * Send listing review notification
 */
export async function sendListingReviewPush(
  userId: string,
  status: 'APPROVED' | 'REJECTED' | 'NEEDS_INFO',
  listingTitle: string,
  listingId: string,
  reason?: string
): Promise<void> {
  const titles: Record<string, string> = {
    APPROVED: 'Listing Approved!',
    REJECTED: 'Listing Not Approved',
    NEEDS_INFO: 'More Info Needed',
  }

  const bodies: Record<string, string> = {
    APPROVED: `"${listingTitle}" is now live and visible to buyers.`,
    REJECTED: reason || `"${listingTitle}" was not approved.`,
    NEEDS_INFO: `Please update "${listingTitle}" with additional information.`,
  }

  await sendPushToUser(userId, {
    title: titles[status],
    body: bodies[status],
    data: {
      type: `LISTING_${status}`,
      listingId,
    },
    sound: 'default',
  })
}
