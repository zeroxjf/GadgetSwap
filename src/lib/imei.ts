/**
 * IMEI Validation and Verification Library
 *
 * Provides local IMEI validation (Luhn checksum) and
 * integration with IMEICheck.com TAC API for device verification.
 */

// Rate limiting tracker
let lastRequestTime = 0
let requestCount = 0
const RATE_LIMIT = 30 // requests per minute
const RATE_WINDOW = 60000 // 1 minute in ms

/**
 * Validate IMEI format using Luhn algorithm
 * IMEI is 15 digits, last digit is check digit
 */
export function validateIMEIFormat(imei: string): { valid: boolean; error?: string } {
  // Remove any spaces or dashes
  const cleanIMEI = imei.replace(/[\s-]/g, '')

  // Must be exactly 15 digits
  if (!/^\d{15}$/.test(cleanIMEI)) {
    return { valid: false, error: 'IMEI must be exactly 15 digits' }
  }

  // Luhn algorithm validation
  if (!luhnCheck(cleanIMEI)) {
    return { valid: false, error: 'Invalid IMEI checksum' }
  }

  return { valid: true }
}

/**
 * Luhn algorithm (mod 10) check
 * Used to validate IMEI numbers
 */
function luhnCheck(num: string): boolean {
  let sum = 0
  let isDouble = false

  // Process from right to left
  for (let i = num.length - 1; i >= 0; i--) {
    let digit = parseInt(num[i], 10)

    if (isDouble) {
      digit *= 2
      if (digit > 9) {
        digit -= 9
      }
    }

    sum += digit
    isDouble = !isDouble
  }

  return sum % 10 === 0
}

/**
 * Extract TAC (Type Allocation Code) from IMEI
 * TAC is the first 8 digits that identify the device model
 */
export function extractTAC(imei: string): string {
  const cleanIMEI = imei.replace(/[\s-]/g, '')
  return cleanIMEI.substring(0, 8)
}

/**
 * Check if we're within rate limits
 */
function checkRateLimit(): { allowed: boolean; waitTime?: number } {
  const now = Date.now()

  // Reset counter if window has passed
  if (now - lastRequestTime > RATE_WINDOW) {
    requestCount = 0
    lastRequestTime = now
  }

  if (requestCount >= RATE_LIMIT) {
    const waitTime = Math.ceil((RATE_WINDOW - (now - lastRequestTime)) / 1000)
    return { allowed: false, waitTime }
  }

  return { allowed: true }
}

/**
 * Increment rate limit counter
 */
function incrementRateLimit() {
  const now = Date.now()
  if (now - lastRequestTime > RATE_WINDOW) {
    requestCount = 1
    lastRequestTime = now
  } else {
    requestCount++
  }
}

export interface TACLookupResult {
  success: boolean
  brand?: string
  model?: string
  modelName?: string
  deviceType?: string
  isAppleDevice?: boolean
  findMyiPhone?: boolean
  error?: string
  rateLimited?: boolean
  waitTime?: number
}

/**
 * Look up device info using IMEICheck.com API
 * Uses Find My iPhone service which returns model info
 * Cost: $0.01 per lookup
 */
export async function lookupTAC(imei: string): Promise<TACLookupResult> {
  const cleanIMEI = imei.replace(/[\s-]/g, '')
  const apiKey = process.env.IMEICHECK_API_KEY

  if (!apiKey) {
    console.error('IMEICHECK_API_KEY not configured')
    return {
      success: false,
      error: 'IMEI verification service not configured',
    }
  }

  // Check rate limit
  const rateCheck = checkRateLimit()
  if (!rateCheck.allowed) {
    return {
      success: false,
      rateLimited: true,
      waitTime: rateCheck.waitTime,
      error: `Rate limit reached. Please wait ${rateCheck.waitTime} seconds before trying again.`,
    }
  }

  try {
    // Service ID 1 = Find My iPhone (returns model info + FMI status)
    const response = await fetch(
      `https://alpha.imeicheck.com/api/php-api/create?key=${apiKey}&service=1&imei=${cleanIMEI}`,
      {
        method: 'GET',
        headers: {
          'Accept': 'application/json',
          'User-Agent': 'GadgetSwap/1.0',
        },
      }
    )

    incrementRateLimit()

    if (!response.ok) {
      const text = await response.text()
      console.error('IMEI API error response:', response.status, text.substring(0, 500))
      throw new Error(`API returned ${response.status}`)
    }

    const data = await response.json()

    // Check for errors
    if (data.status === 'error') {
      return {
        success: false,
        error: data.response || 'IMEI lookup failed',
      }
    }

    if (data.status !== 'success' || !data.object) {
      return {
        success: false,
        error: 'Device not found in database',
      }
    }

    // Parse model from response (e.g., "iPhone 17 Pro Max (A3257) [USA]")
    const fullModel = data.object.model || ''
    const modelName = fullModel.split('(')[0].trim() // "iPhone 17 Pro Max"

    // Determine device type and brand
    const modelLower = modelName.toLowerCase()
    let deviceType = 'unknown'
    let brand = ''

    if (modelLower.includes('iphone')) {
      deviceType = 'iphone'
      brand = 'Apple'
    } else if (modelLower.includes('ipad')) {
      deviceType = 'ipad'
      brand = 'Apple'
    } else if (modelLower.includes('watch')) {
      deviceType = 'apple_watch'
      brand = 'Apple'
    } else if (modelLower.includes('mac')) {
      deviceType = 'mac'
      brand = 'Apple'
    }

    const isAppleDevice = brand === 'Apple'

    return {
      success: true,
      brand,
      model: fullModel,
      modelName,
      deviceType,
      isAppleDevice,
      findMyiPhone: data.object.fmiOn || data.object.fmiON || false,
    }
  } catch (error) {
    console.error('TAC lookup error:', error)
    return {
      success: false,
      error: 'Failed to verify device. Please try again.',
    }
  }
}

/**
 * Full IMEI verification combining format validation and TAC lookup
 */
export async function verifyIMEI(imei: string): Promise<{
  valid: boolean
  verified: boolean
  brand?: string
  model?: string
  modelName?: string
  deviceType?: string
  isAppleDevice?: boolean
  error?: string
  rateLimited?: boolean
  waitTime?: number
}> {
  // Step 1: Format validation
  const formatResult = validateIMEIFormat(imei)
  if (!formatResult.valid) {
    return {
      valid: false,
      verified: false,
      error: formatResult.error,
    }
  }

  // Step 2: TAC lookup
  const tacResult = await lookupTAC(imei)

  if (tacResult.rateLimited) {
    return {
      valid: true, // Format is valid
      verified: false,
      rateLimited: true,
      waitTime: tacResult.waitTime,
      error: tacResult.error,
    }
  }

  if (!tacResult.success) {
    return {
      valid: true, // Format is valid even if lookup failed
      verified: false,
      error: tacResult.error,
    }
  }

  return {
    valid: true,
    verified: true,
    brand: tacResult.brand,
    model: tacResult.model,
    modelName: tacResult.modelName,
    deviceType: tacResult.deviceType,
    isAppleDevice: tacResult.isAppleDevice,
  }
}

/**
 * Check if device type requires IMEI verification
 */
export function requiresIMEI(deviceType: string): boolean {
  const typesRequiringIMEI = ['IPHONE', 'IPAD']
  return typesRequiringIMEI.includes(deviceType.toUpperCase())
}

/**
 * Mask IMEI for display (show first 8 and last 2 digits)
 * This protects the full IMEI while still allowing verification
 */
export function maskIMEI(imei: string): string {
  const clean = imei.replace(/[\s-]/g, '')
  if (clean.length !== 15) return '***************'
  return `${clean.substring(0, 8)}*****${clean.substring(13)}`
}
