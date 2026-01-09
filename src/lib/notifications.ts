import { prisma } from '@/lib/prisma'
import { NotificationType } from '@prisma/client'

interface NotificationData {
  userId: string
  type: NotificationType
  title: string
  message: string
  link?: string
}

/**
 * Create a notification for a user
 */
export async function createNotification(data: NotificationData) {
  try {
    const notification = await prisma.notification.create({
      data: {
        userId: data.userId,
        type: data.type,
        title: data.title,
        message: data.message,
        link: data.link,
      },
    })

    // Check if user has email notifications enabled and send email
    const user = await prisma.user.findUnique({
      where: { id: data.userId },
      select: {
        email: true,
        emailNotifications: true,
        orderUpdates: true,
        newMessageAlerts: true,
        priceDropAlerts: true,
      },
    })

    if (user?.emailNotifications) {
      // Determine if this notification type should send an email
      const shouldSendEmail = shouldSendEmailForType(data.type, user)
      if (shouldSendEmail) {
        await sendNotificationEmail(user.email, data.title, data.message, data.link)
      }
    }

    return notification
  } catch (error) {
    console.error('Failed to create notification:', error)
    throw error
  }
}

/**
 * Create multiple notifications at once (e.g., for both buyer and seller)
 */
export async function createNotifications(notifications: NotificationData[]) {
  const results = await Promise.allSettled(
    notifications.map((n) => createNotification(n))
  )
  return results
}

/**
 * Determine if an email should be sent for this notification type based on user preferences
 */
function shouldSendEmailForType(
  type: NotificationType,
  preferences: {
    orderUpdates: boolean
    newMessageAlerts: boolean
    priceDropAlerts: boolean
  }
): boolean {
  switch (type) {
    case 'NEW_SALE':
    case 'PURCHASE_CONFIRMED':
    case 'ITEM_SHIPPED':
    case 'DELIVERY_CONFIRMED':
    case 'FUNDS_RELEASED':
    case 'DISPUTE_OPENED':
    case 'DISPUTE_RESOLVED':
      return preferences.orderUpdates

    case 'NEW_MESSAGE':
      return preferences.newMessageAlerts

    case 'PRICE_DROP':
    case 'ALERT_MATCH':
      return preferences.priceDropAlerts

    default:
      return true
  }
}

/**
 * Send notification email
 * In production, integrate with SendGrid, Resend, or similar
 */
async function sendNotificationEmail(
  email: string,
  subject: string,
  message: string,
  link?: string
) {
  // For now, just log the email that would be sent
  // In production, integrate with an email service
  console.log('📧 Email notification:', {
    to: email,
    subject,
    message,
    link,
  })

  // Example integration with SendGrid or Resend:
  // await sendgrid.send({
  //   to: email,
  //   from: 'noreply@gadgetswap.com',
  //   subject: `GadgetSwap: ${subject}`,
  //   html: generateEmailTemplate(subject, message, link),
  // })
}

// ============================================
// CONVENIENCE FUNCTIONS FOR COMMON NOTIFICATIONS
// ============================================

/**
 * Notify seller of a new sale
 */
export async function notifyNewSale(params: {
  sellerId: string
  buyerName: string
  listingTitle: string
  listingId: string
  transactionId: string
  amount: number
}) {
  return createNotification({
    userId: params.sellerId,
    type: 'NEW_SALE',
    title: 'New Sale!',
    message: `${params.buyerName} purchased "${params.listingTitle}" for $${params.amount.toFixed(2)}`,
    link: `/account/sales/${params.transactionId}`,
  })
}

/**
 * Notify buyer of purchase confirmation
 */
export async function notifyPurchaseConfirmed(params: {
  buyerId: string
  sellerName: string
  listingTitle: string
  listingId: string
  transactionId: string
  amount: number
}) {
  return createNotification({
    userId: params.buyerId,
    type: 'PURCHASE_CONFIRMED',
    title: 'Purchase Confirmed',
    message: `Your purchase of "${params.listingTitle}" for $${params.amount.toFixed(2)} is confirmed. Waiting for ${params.sellerName} to ship.`,
    link: `/account/purchases/${params.transactionId}`,
  })
}

/**
 * Notify buyer that item has shipped
 */
export async function notifyItemShipped(params: {
  buyerId: string
  sellerName: string
  listingTitle: string
  transactionId: string
  trackingNumber: string
  carrier: string
}) {
  return createNotification({
    userId: params.buyerId,
    type: 'ITEM_SHIPPED',
    title: 'Your Item Has Shipped!',
    message: `${params.sellerName} shipped "${params.listingTitle}" via ${params.carrier}. Tracking: ${params.trackingNumber}`,
    link: `/account/purchases/${params.transactionId}`,
  })
}

/**
 * Notify seller of delivery confirmation
 */
export async function notifyDeliveryConfirmed(params: {
  sellerId: string
  buyerName: string
  listingTitle: string
  transactionId: string
  escrowReleaseAt: Date
}) {
  const releaseTime = params.escrowReleaseAt.toLocaleString()
  return createNotification({
    userId: params.sellerId,
    type: 'DELIVERY_CONFIRMED',
    title: 'Delivery Confirmed',
    message: `${params.buyerName} confirmed delivery of "${params.listingTitle}". Funds will be released around ${releaseTime}.`,
    link: `/account/sales/${params.transactionId}`,
  })
}

/**
 * Notify seller that funds have been released
 */
export async function notifyFundsReleased(params: {
  sellerId: string
  listingTitle: string
  transactionId: string
  amount: number
}) {
  return createNotification({
    userId: params.sellerId,
    type: 'FUNDS_RELEASED',
    title: 'Funds Released!',
    message: `$${params.amount.toFixed(2)} from "${params.listingTitle}" has been released to your account.`,
    link: `/account/sales/${params.transactionId}`,
  })
}

/**
 * Notify user of a dispute
 */
export async function notifyDispute(params: {
  userId: string
  openerName: string
  listingTitle: string
  transactionId: string
  reason: string
  isOpener: boolean
}) {
  return createNotification({
    userId: params.userId,
    type: 'DISPUTE_OPENED',
    title: params.isOpener ? 'Dispute Opened' : 'Dispute Filed Against Your Transaction',
    message: params.isOpener
      ? `Your dispute for "${params.listingTitle}" has been opened. Our team will review it shortly.`
      : `${params.openerName} opened a dispute for "${params.listingTitle}". Reason: ${params.reason}`,
    link: `/account/disputes/${params.transactionId}`,
  })
}

/**
 * Notify admin of a new dispute (for internal tracking)
 */
export async function notifyAdminDispute(params: {
  transactionId: string
  buyerId: string
  sellerId: string
  listingTitle: string
  reason: string
  amount: number
}) {
  // In production, this would notify admin users or send to a support queue
  console.log('🚨 ADMIN ALERT - New Dispute:', {
    transactionId: params.transactionId,
    buyerId: params.buyerId,
    sellerId: params.sellerId,
    listingTitle: params.listingTitle,
    reason: params.reason,
    amount: params.amount,
  })

  // Could also create a ticket in a support system, send to Slack, etc.
}
