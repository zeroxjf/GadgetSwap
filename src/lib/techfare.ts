/**
 * TechFare Integration
 * Fetches market values for Apple devices from techfare.com by scraping their pages
 *
 * TechFare URL format: /phones/Apple-iPhone-14-Pro-Max
 * Price data is embedded in page as: var soldDatesPricesData = JSON.parse('[...]')
 */

const TECHFARE_BASE_URL = 'https://techfare.com'

// Jailbreak premium multiplier for devices on jailbreakable iOS versions
export const JAILBREAK_PREMIUM_MULTIPLIER = 1.5

// Cache for fetched prices (deviceUrl -> { price, timestamp })
const priceCache: Map<string, { price: number; timestamp: number }> = new Map()
const CACHE_TTL = 1000 * 60 * 60 // 1 hour cache

interface SalesRecord {
  solddate: string
  soldprice: number
}

/**
 * Checks if device is supported by TechFare
 * Currently TechFare only tracks iPhones for Apple products
 */
function isSupportedDevice(deviceModel: string): boolean {
  return deviceModel.toLowerCase().includes('iphone')
}

/**
 * Maps device type to TechFare category
 */
function getCategoryForDevice(deviceModel: string): string {
  // TechFare only has iPhones under 'phones' for Apple
  return 'phones'
}

/**
 * Converts device model name to TechFare URL slug
 * "Apple iPhone 14 Pro Max" -> "Apple-iPhone-14-Pro-Max"
 */
function modelToUrlSlug(deviceModel: string): string {
  let model = deviceModel.trim()

  // Add "Apple" prefix if not present
  if (!model.toLowerCase().startsWith('apple')) {
    model = `Apple ${model}`
  }

  // Replace spaces with hyphens
  return model.replace(/\s+/g, '-')
}

/**
 * Extracts soldDatesPricesData from TechFare page HTML
 */
function extractSalesData(html: string): SalesRecord[] | null {
  try {
    // Look for: var soldDatesPricesData = JSON.parse('...')
    const regex = /var\s+soldDatesPricesData\s*=\s*JSON\.parse\s*\(\s*'(.+?)'\s*\)/
    const match = html.match(regex)

    if (!match || !match[1]) {
      // Try alternative pattern with double quotes
      const altRegex = /var\s+soldDatesPricesData\s*=\s*JSON\.parse\s*\(\s*"(.+?)"\s*\)/
      const altMatch = html.match(altRegex)
      if (!altMatch || !altMatch[1]) {
        return null
      }
      // Unescape the JSON string
      const jsonStr = altMatch[1].replace(/\\"/g, '"').replace(/\\\\/g, '\\')
      return JSON.parse(jsonStr)
    }

    // Unescape the JSON string (it's stored as escaped JSON within a string)
    const jsonStr = match[1].replace(/\\'/g, "'").replace(/\\\\/g, '\\')
    return JSON.parse(jsonStr)
  } catch (error) {
    console.error('Failed to parse TechFare sales data:', error)
    return null
  }
}

/**
 * Calculates average price from recent sales (last 90 days)
 */
function calculateAveragePrice(salesData: SalesRecord[]): number | null {
  if (!salesData || salesData.length === 0) {
    return null
  }

  const now = new Date()
  const ninetyDaysAgo = new Date(now.getTime() - 90 * 24 * 60 * 60 * 1000)

  // Filter to recent sales
  const recentSales = salesData.filter(sale => {
    const saleDate = new Date(sale.solddate)
    return saleDate >= ninetyDaysAgo
  })

  // If no recent sales, use all data
  const salesToUse = recentSales.length > 0 ? recentSales : salesData

  // Filter out obvious outliers (prices below $50 or above $5000)
  const validPrices = salesToUse
    .map(s => s.soldprice)
    .filter(p => p >= 50 && p <= 5000)

  if (validPrices.length === 0) {
    return null
  }

  // Calculate median for more robust estimate
  validPrices.sort((a, b) => a - b)
  const mid = Math.floor(validPrices.length / 2)
  const median = validPrices.length % 2 === 0
    ? (validPrices[mid - 1] + validPrices[mid]) / 2
    : validPrices[mid]

  return Math.round(median * 100) / 100
}

/**
 * Fetches the market value for a device from TechFare
 */
export async function getDeviceValue(
  deviceModel: string,
  storageGB: number
): Promise<number | null> {
  try {
    // TechFare only supports iPhones for Apple products
    if (!isSupportedDevice(deviceModel)) {
      console.log(`TechFare: ${deviceModel} is not supported (only iPhones available)`)
      return null
    }

    const category = getCategoryForDevice(deviceModel)
    const slug = modelToUrlSlug(deviceModel)
    const url = `${TECHFARE_BASE_URL}/${category}/${slug}`

    // Check cache first
    const cached = priceCache.get(url)
    if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
      return cached.price
    }

    console.log(`Fetching TechFare data from: ${url}`)

    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; GadgetSwap/1.0)',
      },
    })

    if (!response.ok) {
      console.error(`TechFare page fetch error: ${response.status} for ${url}`)
      return null
    }

    const html = await response.text()
    const salesData = extractSalesData(html)

    if (!salesData) {
      console.error('No sales data found on TechFare page')
      return null
    }

    const avgPrice = calculateAveragePrice(salesData)

    if (avgPrice !== null) {
      // Cache the result
      priceCache.set(url, { price: avgPrice, timestamp: Date.now() })
    }

    return avgPrice
  } catch (error) {
    console.error('Failed to fetch TechFare value:', error)
    return null
  }
}

/**
 * Fetches available storage options for a device model
 * Note: TechFare doesn't separate by storage, so we return empty
 * and rely on our device-models.ts for storage options
 */
export async function getStorageOptions(deviceModel: string): Promise<string[]> {
  // Storage options are now handled by device-models.ts
  return []
}

/**
 * Calculates the maximum allowed listing price based on market value
 *
 * Max listing price is always 1.5x the TechFare market value
 * This allows sellers reasonable pricing flexibility while preventing gouging
 */
export async function calculateMaxListingPrice(
  deviceModel: string,
  storageGB: number,
  isJailbreakable: boolean = false
): Promise<{ marketValue: number; maxPrice: number; multiplier: number } | null> {
  const marketValue = await getDeviceValue(deviceModel, storageGB)

  if (marketValue === null) {
    return null
  }

  // Always apply 1.5x multiplier for max listing price
  const multiplier = JAILBREAK_PREMIUM_MULTIPLIER
  const maxPrice = Math.round(marketValue * multiplier * 100) / 100

  return {
    marketValue,
    maxPrice,
    multiplier,
  }
}

/**
 * Validates if a listing price is within acceptable range
 */
export async function validateListingPrice(
  deviceModel: string,
  storageGB: number,
  isJailbreakable: boolean,
  listingPrice: number
): Promise<{
  valid: boolean
  marketValue: number | null
  maxPrice: number | null
  message?: string
}> {
  const priceData = await calculateMaxListingPrice(deviceModel, storageGB, isJailbreakable)

  if (!priceData) {
    // Can't validate without market data - allow the listing
    return {
      valid: true,
      marketValue: null,
      maxPrice: null,
      message: 'Unable to fetch market value for price validation',
    }
  }

  const { marketValue, maxPrice, multiplier } = priceData

  if (listingPrice > maxPrice) {
    return {
      valid: false,
      marketValue,
      maxPrice,
      message: `Price exceeds maximum allowed ($${maxPrice.toFixed(2)}). Market value: $${marketValue.toFixed(2)}`,
    }
  }

  return {
    valid: true,
    marketValue,
    maxPrice,
  }
}

/**
 * Device model mapping for common variations
 * Maps user input to TechFare's expected model names
 */
export const IPHONE_MODELS: Record<string, string> = {
  // iPhone 17 series
  'iphone 17 pro max': 'Apple iPhone 17 Pro Max',
  'iphone 17 pro': 'Apple iPhone 17 Pro',
  'iphone 17 plus': 'Apple iPhone 17 Plus',
  'iphone 17': 'Apple iPhone 17',

  // iPhone 16 series
  'iphone 16 pro max': 'Apple iPhone 16 Pro Max',
  'iphone 16 pro': 'Apple iPhone 16 Pro',
  'iphone 16 plus': 'Apple iPhone 16 Plus',
  'iphone 16': 'Apple iPhone 16',

  // iPhone 15 series
  'iphone 15 pro max': 'Apple iPhone 15 Pro Max',
  'iphone 15 pro': 'Apple iPhone 15 Pro',
  'iphone 15 plus': 'Apple iPhone 15 Plus',
  'iphone 15': 'Apple iPhone 15',

  // iPhone 14 series
  'iphone 14 pro max': 'Apple iPhone 14 Pro Max',
  'iphone 14 pro': 'Apple iPhone 14 Pro',
  'iphone 14 plus': 'Apple iPhone 14 Plus',
  'iphone 14': 'Apple iPhone 14',

  // iPhone 13 series
  'iphone 13 pro max': 'Apple iPhone 13 Pro Max',
  'iphone 13 pro': 'Apple iPhone 13 Pro',
  'iphone 13 mini': 'Apple iPhone 13 Mini',
  'iphone 13': 'Apple iPhone 13',

  // iPhone 12 series
  'iphone 12 pro max': 'Apple iPhone 12 Pro Max',
  'iphone 12 pro': 'Apple iPhone 12 Pro',
  'iphone 12 mini': 'Apple iPhone 12 Mini',
  'iphone 12': 'Apple iPhone 12',

  // iPhone 11 series
  'iphone 11 pro max': 'Apple iPhone 11 Pro Max',
  'iphone 11 pro': 'Apple iPhone 11 Pro',
  'iphone 11': 'Apple iPhone 11',

  // iPhone X series
  'iphone xs max': 'Apple iPhone XS Max',
  'iphone xs': 'Apple iPhone XS',
  'iphone xr': 'Apple iPhone XR',
  'iphone x': 'Apple iPhone X',

  // iPhone 8 series
  'iphone 8 plus': 'Apple iPhone 8 Plus',
  'iphone 8': 'Apple iPhone 8',

  // iPhone SE series
  'iphone se 3': 'Apple iPhone SE (3rd Gen)',
  'iphone se 2': 'Apple iPhone SE (2nd Gen)',
  'iphone se': 'Apple iPhone SE',
}

/**
 * Normalizes user input model name to TechFare format
 */
export function normalizeModelName(input: string): string {
  const normalized = input.toLowerCase().trim()

  // Check if it's in our mapping
  if (IPHONE_MODELS[normalized]) {
    return IPHONE_MODELS[normalized]
  }

  // Otherwise, just ensure it has "Apple" prefix
  let model = input.trim()
  if (!model.toLowerCase().startsWith('apple')) {
    model = `Apple ${model}`
  }
  return model
}
