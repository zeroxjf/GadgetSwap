/**
 * Shipping cost calculation
 *
 * In production, integrate with USPS, UPS, or FedEx APIs for accurate rates.
 * This provides reasonable estimates based on device type and weight.
 */

type DeviceType =
  | 'IPHONE'
  | 'IPAD'
  | 'MACBOOK'
  | 'MAC_MINI'
  | 'MAC_STUDIO'
  | 'MAC_PRO'
  | 'IMAC'
  | 'APPLE_WATCH'
  | 'APPLE_TV'
  | 'AIRPODS'
  | 'HOMEPOD'
  | 'OTHER'

// Estimated weights in pounds for shipping calculation
const DEVICE_WEIGHTS: Record<DeviceType, number> = {
  IPHONE: 0.5,
  IPAD: 1.5,
  MACBOOK: 5,
  MAC_MINI: 3,
  MAC_STUDIO: 6,
  MAC_PRO: 40, // Heavy!
  IMAC: 15,
  APPLE_WATCH: 0.3,
  APPLE_TV: 1,
  AIRPODS: 0.2,
  HOMEPOD: 6,
  OTHER: 2,
}

// Base shipping rates (USPS Priority Mail estimates)
const BASE_RATES = {
  SMALL: 8.99,    // Under 1 lb
  MEDIUM: 12.99,  // 1-5 lbs
  LARGE: 19.99,   // 5-15 lbs
  HEAVY: 29.99,   // 15-40 lbs
  FREIGHT: 49.99, // Over 40 lbs
}

// Insurance based on item value
const INSURANCE_RATES = {
  LOW: { maxValue: 100, rate: 2.99 },
  MEDIUM: { maxValue: 500, rate: 4.99 },
  HIGH: { maxValue: 2000, rate: 9.99 },
  PREMIUM: { maxValue: 10000, rate: 19.99 },
}

export interface ShippingOptions {
  standard: ShippingOption
  expedited: ShippingOption
  overnight: ShippingOption
}

export interface ShippingOption {
  name: string
  price: number
  estimatedDays: string
  carrier: string
  includesInsurance: boolean
  insuranceValue: number
}

/**
 * Calculate shipping costs for a listing
 */
export function calculateShipping(params: {
  deviceType: string
  price: number
  sellerZip?: string
  buyerZip?: string
  includeInsurance?: boolean
}): ShippingOptions {
  const { deviceType, price, includeInsurance = true } = params

  // Get device weight
  const weight = DEVICE_WEIGHTS[deviceType as DeviceType] || DEVICE_WEIGHTS.OTHER

  // Calculate base rate based on weight
  let baseRate: number
  if (weight < 1) {
    baseRate = BASE_RATES.SMALL
  } else if (weight < 5) {
    baseRate = BASE_RATES.MEDIUM
  } else if (weight < 15) {
    baseRate = BASE_RATES.LARGE
  } else if (weight < 40) {
    baseRate = BASE_RATES.HEAVY
  } else {
    baseRate = BASE_RATES.FREIGHT
  }

  // Calculate insurance cost if needed
  let insuranceCost = 0
  if (includeInsurance) {
    if (price <= 100) {
      insuranceCost = INSURANCE_RATES.LOW.rate
    } else if (price <= 500) {
      insuranceCost = INSURANCE_RATES.MEDIUM.rate
    } else if (price <= 2000) {
      insuranceCost = INSURANCE_RATES.HIGH.rate
    } else {
      insuranceCost = INSURANCE_RATES.PREMIUM.rate
    }
  }

  // Standard shipping
  const standardPrice = Math.round((baseRate + insuranceCost) * 100) / 100

  // Expedited (2-3 day) - ~40% more
  const expeditedPrice = Math.round((baseRate * 1.4 + insuranceCost) * 100) / 100

  // Overnight - ~100% more
  const overnightPrice = Math.round((baseRate * 2 + insuranceCost) * 100) / 100

  return {
    standard: {
      name: 'Standard Shipping',
      price: standardPrice,
      estimatedDays: '5-7 business days',
      carrier: 'USPS Priority Mail',
      includesInsurance: includeInsurance,
      insuranceValue: includeInsurance ? price : 0,
    },
    expedited: {
      name: 'Expedited Shipping',
      price: expeditedPrice,
      estimatedDays: '2-3 business days',
      carrier: 'USPS Priority Mail Express',
      includesInsurance: includeInsurance,
      insuranceValue: includeInsurance ? price : 0,
    },
    overnight: {
      name: 'Overnight Shipping',
      price: overnightPrice,
      estimatedDays: '1 business day',
      carrier: 'UPS Next Day Air',
      includesInsurance: includeInsurance,
      insuranceValue: includeInsurance ? price : 0,
    },
  }
}

/**
 * Get default shipping cost (standard with insurance)
 * Used when buyer doesn't select a specific option
 */
export function getDefaultShippingCost(deviceType: string, price: number): number {
  const options = calculateShipping({ deviceType, price })
  return options.standard.price
}

/**
 * Check if free shipping threshold is met
 * Some sellers might offer free shipping for high-value items
 */
export function qualifiesForFreeShipping(price: number, threshold = 500): boolean {
  return price >= threshold
}

/**
 * Calculate total with shipping
 */
export function calculateTotalWithShipping(params: {
  salePrice: number
  deviceType: string
  shippingOption?: 'standard' | 'expedited' | 'overnight'
  freeShippingThreshold?: number
}): {
  salePrice: number
  shippingCost: number
  freeShipping: boolean
  total: number
} {
  const {
    salePrice,
    deviceType,
    shippingOption = 'standard',
    freeShippingThreshold = 500,
  } = params

  const freeShipping = qualifiesForFreeShipping(salePrice, freeShippingThreshold)

  let shippingCost = 0
  if (!freeShipping) {
    const options = calculateShipping({ deviceType, price: salePrice })
    shippingCost = options[shippingOption].price
  }

  return {
    salePrice,
    shippingCost,
    freeShipping,
    total: salePrice + shippingCost,
  }
}
