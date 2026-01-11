import { prisma } from '@/lib/prisma'
import { sendEmail, wrapEmailTemplate } from '@/lib/email'
import { createNotification } from '@/lib/notifications'

/**
 * Parse a version string into numeric components
 * "16.1.2" -> [16, 1, 2]
 * "16" -> [16]
 */
function parseVersion(version: string): number[] {
  return version.split('.').map(part => parseInt(part, 10) || 0)
}

/**
 * Compare two version strings numerically
 * Returns: -1 if a < b, 0 if a == b, 1 if a > b
 */
function compareVersions(a: string, b: string): number {
  const partsA = parseVersion(a)
  const partsB = parseVersion(b)
  const maxLength = Math.max(partsA.length, partsB.length)

  for (let i = 0; i < maxLength; i++) {
    const numA = partsA[i] || 0
    const numB = partsB[i] || 0
    if (numA < numB) return -1
    if (numA > numB) return 1
  }
  return 0
}

interface ListingForMatching {
  id: string
  title: string
  price: number
  deviceType: string
  deviceModel: string
  osVersion: string | null
  jailbreakStatus: string
  bootromExploit: boolean | null
  storageGB: number | null
  images: { url: string }[]
  seller: {
    name: string | null
  }
}

/**
 * Check if a listing matches an alert's criteria
 */
function doesListingMatchAlert(
  listing: ListingForMatching,
  alert: {
    deviceType: string | null
    deviceModel: string | null
    osVersionMin: string | null
    osVersionMax: string | null
    osVersionExact: string | null
    jailbreakStatus: string | null
    bootromExploitOnly: boolean | null
    storageMinGB: number | null
    storageMaxGB: number | null
    priceMin: number | null
    priceMax: number | null
  }
): boolean {
  // Device type check
  if (alert.deviceType && alert.deviceType !== listing.deviceType) {
    return false
  }

  // Device model check (partial match)
  if (alert.deviceModel) {
    const alertModel = alert.deviceModel.toLowerCase()
    const listingModel = listing.deviceModel.toLowerCase()
    if (!listingModel.includes(alertModel) && !alertModel.includes(listingModel)) {
      return false
    }
  }

  // iOS version check
  if (listing.osVersion) {
    const listingMajorVersion = listing.osVersion.split('.')[0]

    // Exact version match
    if (alert.osVersionExact && listing.osVersion !== alert.osVersionExact) {
      return false
    }

    // Major version match (osVersionMin stores the major version like "16")
    if (alert.osVersionMin && !alert.osVersionMax) {
      // Simplified matching: "16" should match "16", "16.1", "16.1.2", etc.
      if (listingMajorVersion !== alert.osVersionMin) {
        return false
      }
    }

    // Range matching (if both min and max are set) - use numeric comparison
    if (alert.osVersionMin && alert.osVersionMax) {
      const minCompare = compareVersions(listing.osVersion, alert.osVersionMin)
      const maxCompare = compareVersions(listing.osVersion, alert.osVersionMax)
      // Listing version must be >= min and <= max
      if (minCompare < 0 || maxCompare > 0) {
        return false
      }
    }
  } else if (alert.osVersionMin || alert.osVersionExact) {
    // Alert requires iOS version but listing doesn't have one
    return false
  }

  // Jailbreak status check
  if (alert.jailbreakStatus) {
    const jailbreakableStatuses = ['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB']
    const alertWantsJailbreakable = alert.jailbreakStatus === 'JAILBREAKABLE'
    const listingIsJailbreakable = jailbreakableStatuses.includes(listing.jailbreakStatus)

    if (alertWantsJailbreakable && !listingIsJailbreakable) {
      return false
    }
    if (alert.jailbreakStatus === 'NOT_JAILBROKEN' && listingIsJailbreakable) {
      return false
    }
  }

  // Bootrom exploit check
  if (alert.bootromExploitOnly && !listing.bootromExploit) {
    return false
  }

  // Storage check
  if (listing.storageGB) {
    if (alert.storageMinGB && listing.storageGB < alert.storageMinGB) {
      return false
    }
    if (alert.storageMaxGB && listing.storageGB > alert.storageMaxGB) {
      return false
    }
  } else if (alert.storageMinGB) {
    // Alert requires storage but listing doesn't have it
    return false
  }

  // Price check
  if (alert.priceMin && listing.price < alert.priceMin) {
    return false
  }
  if (alert.priceMax && listing.price > alert.priceMax) {
    return false
  }

  return true
}

/**
 * Generate alert notification email HTML
 */
function generateAlertEmailHtml(
  listing: ListingForMatching,
  alertName: string
): string {
  const imageUrl = listing.images[0]?.url || ''
  const listingUrl = `https://gadgetswap.tech/listings/${listing.id}`

  const content = `
    <h2 style="margin:0 0 16px;color:#111827;font-size:20px;">
      New Match for "${alertName}"
    </h2>

    <p style="margin:0 0 24px;color:#4b5563;font-size:14px;">
      A device matching your alert criteria has just been listed!
    </p>

    <div style="border:1px solid #e5e7eb;border-radius:12px;overflow:hidden;margin-bottom:24px;">
      ${imageUrl ? `
        <div style="background:#f3f4f6;padding:16px;text-align:center;">
          <img src="${imageUrl}" alt="${listing.title}" style="max-width:200px;max-height:200px;border-radius:8px;" />
        </div>
      ` : ''}

      <div style="padding:16px;">
        <h3 style="margin:0 0 8px;color:#111827;font-size:16px;">${listing.title}</h3>

        <p style="margin:0 0 12px;color:#7c3aed;font-size:24px;font-weight:bold;">
          $${listing.price.toLocaleString()}
        </p>

        <div style="display:flex;gap:8px;flex-wrap:wrap;margin-bottom:12px;">
          ${listing.osVersion ? `
            <span style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:12px;color:#374151;">
              iOS ${listing.osVersion}
            </span>
          ` : ''}
          ${listing.storageGB ? `
            <span style="background:#f3f4f6;padding:4px 8px;border-radius:4px;font-size:12px;color:#374151;">
              ${listing.storageGB}GB
            </span>
          ` : ''}
          ${['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'].includes(listing.jailbreakStatus) ? `
            <span style="background:#f3e8ff;padding:4px 8px;border-radius:4px;font-size:12px;color:#7c3aed;">
              Jailbreakable
            </span>
          ` : ''}
        </div>

        <p style="margin:0;color:#6b7280;font-size:12px;">
          Listed by ${listing.seller.name || 'Anonymous'}
        </p>
      </div>
    </div>

    <a href="${listingUrl}" style="display:block;background:linear-gradient(135deg,#4f46e5,#7c3aed);color:#fff;text-decoration:none;padding:14px 24px;border-radius:8px;text-align:center;font-weight:600;font-size:14px;">
      View Listing
    </a>

    <p style="margin:24px 0 0;color:#9ca3af;font-size:12px;text-align:center;">
      You're receiving this because you set up an alert on GadgetSwap.
      <br />
      <a href="https://gadgetswap.tech/alerts" style="color:#6b7280;">Manage your alerts</a>
    </p>
  `

  return wrapEmailTemplate(content, `New listing matches your "${alertName}" alert`)
}

/**
 * Find and notify users whose alerts match a newly approved listing
 */
export async function matchAndNotifyAlerts(listingId: string): Promise<{
  matchedAlerts: number
  notificationsSent: number
  errors: string[]
}> {
  const results = {
    matchedAlerts: 0,
    notificationsSent: 0,
    errors: [] as string[],
  }

  try {
    // Get the listing with all relevant data
    const listing = await prisma.listing.findUnique({
      where: { id: listingId },
      include: {
        images: { select: { url: true }, orderBy: { order: 'asc' }, take: 1 },
        seller: { select: { name: true } },
      },
    })

    if (!listing) {
      results.errors.push('Listing not found')
      return results
    }

    // Find all active alerts that could potentially match
    const alerts = await prisma.deviceAlert.findMany({
      where: {
        active: true,
        emailNotify: true,
        // Exclude alerts from the listing's seller
        userId: { not: listing.sellerId },
      },
      include: {
        user: { select: { email: true, name: true } },
      },
    })

    // Check each alert against the listing
    for (const alert of alerts) {
      const matches = doesListingMatchAlert(
        {
          id: listing.id,
          title: listing.title,
          price: listing.price,
          deviceType: listing.deviceType,
          deviceModel: listing.deviceModel,
          osVersion: listing.osVersion,
          jailbreakStatus: listing.jailbreakStatus,
          bootromExploit: listing.bootromExploit,
          storageGB: listing.storageGB,
          images: listing.images,
          seller: listing.seller,
        },
        alert
      )

      if (matches) {
        results.matchedAlerts++

        // Update alert stats
        await prisma.deviceAlert.update({
          where: { id: alert.id },
          data: {
            matchCount: { increment: 1 },
            lastMatchAt: new Date(),
          },
        })

        // Create in-app notification
        await createNotification({
          userId: alert.userId,
          type: 'ALERT_MATCH',
          title: `Match found: ${alert.name}`,
          message: `${listing.title} - $${listing.price.toLocaleString()}`,
          link: `/listings/${listing.id}`,
        })

        // Send email notification
        if (alert.user.email) {
          try {
            await sendEmail({
              to: alert.user.email,
              subject: `New listing matches your "${alert.name}" alert`,
              html: generateAlertEmailHtml(
                {
                  id: listing.id,
                  title: listing.title,
                  price: listing.price,
                  deviceType: listing.deviceType,
                  deviceModel: listing.deviceModel,
                  osVersion: listing.osVersion,
                  jailbreakStatus: listing.jailbreakStatus,
                  bootromExploit: listing.bootromExploit,
                  storageGB: listing.storageGB,
                  images: listing.images,
                  seller: listing.seller,
                },
                alert.name
              ),
            })
            results.notificationsSent++
          } catch (emailError: any) {
            results.errors.push(`Failed to email ${alert.user.email}: ${emailError.message}`)
          }
        }
      }
    }

    return results
  } catch (error: any) {
    results.errors.push(`Alert matching error: ${error.message}`)
    return results
  }
}
