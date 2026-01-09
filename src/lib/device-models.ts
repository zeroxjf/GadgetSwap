/**
 * Device models for GadgetSwap listing form
 * Uses data from apple-devices.ts comprehensive database
 */

import { IPHONE_DEVICES, IPOD_TOUCH_DEVICES, IPAD_DEVICES, AppleDevice } from './apple-devices'

export interface DeviceModel {
  value: string       // Internal value (with Apple prefix for TechFare)
  label: string       // Display label
  storageOptions: number[]  // Available storage sizes in GB
}

/**
 * Convert AppleDevice to DeviceModel format
 */
function toDeviceModel(device: AppleDevice): DeviceModel {
  return {
    value: `Apple ${device.name}`,
    label: device.name,
    storageOptions: device.storageOptions,
  }
}

/**
 * Get variant priority for sorting (Pro Max > Pro > Plus > base > mini > SE)
 */
function getVariantPriority(name: string): number {
  const lower = name.toLowerCase()
  if (lower.includes('pro max') || lower.includes('ultra')) return 0
  if (lower.includes('pro')) return 1
  if (lower.includes('plus')) return 2
  if (lower.includes('mini')) return 4
  if (lower.includes('se')) return 5
  return 3 // base model
}

/**
 * Extract model line number (e.g., "iPhone 16" -> 16, "iPad Pro 11-inch" -> 11)
 */
function getModelNumber(name: string): number {
  // Match iPhone/iPad followed by a number
  const match = name.match(/(?:iPhone|iPad)\s+(\d+)/i)
  if (match) return parseInt(match[1], 10)
  return 0
}

/**
 * Sort devices by release year (newest first), then by model line, then by variant
 */
function sortByReleaseYear(devices: AppleDevice[]): AppleDevice[] {
  return [...devices].sort((a, b) => {
    // Sort by release year descending (newest first)
    if (b.releaseYear !== a.releaseYear) {
      return b.releaseYear - a.releaseYear
    }

    // Within same year, sort by model number descending (iPhone 16 before iPhone 15)
    const aNum = getModelNumber(a.name)
    const bNum = getModelNumber(b.name)
    if (aNum !== bNum) {
      return bNum - aNum
    }

    // Within same model line, sort by variant (Pro Max > Pro > Plus > base > mini)
    return getVariantPriority(a.name) - getVariantPriority(b.name)
  })
}

// ===========================================
// IPHONE MODELS (sorted by release year, newest first)
// ===========================================

export const IPHONE_MODELS: DeviceModel[] = sortByReleaseYear(IPHONE_DEVICES).map(toDeviceModel)

// ===========================================
// IPOD TOUCH MODELS (sorted by release year, newest first)
// ===========================================

export const IPOD_TOUCH_MODELS: DeviceModel[] = sortByReleaseYear(IPOD_TOUCH_DEVICES).map(toDeviceModel)

// ===========================================
// IPAD MODELS (sorted by release year, newest first)
// ===========================================

export const IPAD_MODELS: DeviceModel[] = sortByReleaseYear(IPAD_DEVICES).map(toDeviceModel)

// ===========================================
// MAC MODELS (kept separate as they don't have jailbreak data)
// ===========================================

export const MACBOOK_MODELS: DeviceModel[] = [
  // MacBook Pro 2024
  { value: 'Apple MacBook Pro 16-inch (M4 Max)', label: 'MacBook Pro 16" (M4 Max, 2024)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 16-inch (M4 Pro)', label: 'MacBook Pro 16" (M4 Pro, 2024)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M4 Max)', label: 'MacBook Pro 14" (M4 Max, 2024)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 14-inch (M4 Pro)', label: 'MacBook Pro 14" (M4 Pro, 2024)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M4)', label: 'MacBook Pro 14" (M4, 2024)', storageOptions: [512, 1024, 2048] },

  // MacBook Pro 2023
  { value: 'Apple MacBook Pro 16-inch (M3 Max)', label: 'MacBook Pro 16" (M3 Max, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 16-inch (M3 Pro)', label: 'MacBook Pro 16" (M3 Pro, 2023)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M3 Max)', label: 'MacBook Pro 14" (M3 Max, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 14-inch (M3 Pro)', label: 'MacBook Pro 14" (M3 Pro, 2023)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M3)', label: 'MacBook Pro 14" (M3, 2023)', storageOptions: [512, 1024, 2048] },

  // MacBook Pro 2021-2022
  { value: 'Apple MacBook Pro 16-inch (M2 Max)', label: 'MacBook Pro 16" (M2 Max, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 16-inch (M2 Pro)', label: 'MacBook Pro 16" (M2 Pro, 2023)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M2 Max)', label: 'MacBook Pro 14" (M2 Max, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 14-inch (M2 Pro)', label: 'MacBook Pro 14" (M2 Pro, 2023)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 16-inch (M1 Max)', label: 'MacBook Pro 16" (M1 Max, 2021)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 16-inch (M1 Pro)', label: 'MacBook Pro 16" (M1 Pro, 2021)', storageOptions: [512, 1024, 2048] },
  { value: 'Apple MacBook Pro 14-inch (M1 Max)', label: 'MacBook Pro 14" (M1 Max, 2021)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 14-inch (M1 Pro)', label: 'MacBook Pro 14" (M1 Pro, 2021)', storageOptions: [512, 1024, 2048] },

  // MacBook Pro 13"
  { value: 'Apple MacBook Pro 13-inch (M2)', label: 'MacBook Pro 13" (M2, 2022)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple MacBook Pro 13-inch (M1)', label: 'MacBook Pro 13" (M1, 2020)', storageOptions: [256, 512, 1024, 2048] },

  // MacBook Air
  { value: 'Apple MacBook Air 15-inch (M3)', label: 'MacBook Air 15" (M3, 2024)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple MacBook Air 13-inch (M3)', label: 'MacBook Air 13" (M3, 2024)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple MacBook Air 15-inch (M2)', label: 'MacBook Air 15" (M2, 2023)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple MacBook Air 13-inch (M2)', label: 'MacBook Air 13" (M2, 2022)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple MacBook Air 13-inch (M1)', label: 'MacBook Air 13" (M1, 2020)', storageOptions: [256, 512, 1024, 2048] },

  // Legacy Intel MacBooks
  { value: 'Apple MacBook Pro 16-inch (2019)', label: 'MacBook Pro 16" (2019, Intel)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple MacBook Pro 15-inch (2019)', label: 'MacBook Pro 15" (2019, Intel)', storageOptions: [256, 512, 1024, 2048, 4096] },
  { value: 'Apple MacBook Pro 13-inch (2020 Intel)', label: 'MacBook Pro 13" (2020, Intel)', storageOptions: [256, 512, 1024, 2048, 4096] },
  { value: 'Apple MacBook Air 13-inch (2020 Intel)', label: 'MacBook Air 13" (2020, Intel)', storageOptions: [256, 512, 1024, 2048] },
]

export const IMAC_MODELS: DeviceModel[] = [
  { value: 'Apple iMac 24-inch (M3)', label: 'iMac 24" (M3, 2023)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple iMac 24-inch (M1)', label: 'iMac 24" (M1, 2021)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple iMac 27-inch (2020)', label: 'iMac 27" (2020, Intel)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple iMac 27-inch (2019)', label: 'iMac 27" (2019, Intel)', storageOptions: [1024, 2048, 3072] },
  { value: 'Apple iMac 21.5-inch (2019)', label: 'iMac 21.5" (2019, Intel)', storageOptions: [1024, 256, 512] },
]

export const MAC_MINI_MODELS: DeviceModel[] = [
  { value: 'Apple Mac Mini (M4 Pro)', label: 'Mac Mini (M4 Pro, 2024)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Mini (M4)', label: 'Mac Mini (M4, 2024)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple Mac Mini (M2 Pro)', label: 'Mac Mini (M2 Pro, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Mini (M2)', label: 'Mac Mini (M2, 2023)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple Mac Mini (M1)', label: 'Mac Mini (M1, 2020)', storageOptions: [256, 512, 1024, 2048] },
  { value: 'Apple Mac Mini (2018)', label: 'Mac Mini (2018, Intel)', storageOptions: [128, 256, 512, 1024, 2048] },
]

export const MAC_STUDIO_MODELS: DeviceModel[] = [
  { value: 'Apple Mac Studio (M2 Ultra)', label: 'Mac Studio (M2 Ultra, 2023)', storageOptions: [1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Studio (M2 Max)', label: 'Mac Studio (M2 Max, 2023)', storageOptions: [512, 1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Studio (M1 Ultra)', label: 'Mac Studio (M1 Ultra, 2022)', storageOptions: [1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Studio (M1 Max)', label: 'Mac Studio (M1 Max, 2022)', storageOptions: [512, 1024, 2048, 4096, 8192] },
]

export const MAC_PRO_MODELS: DeviceModel[] = [
  { value: 'Apple Mac Pro (M2 Ultra)', label: 'Mac Pro (M2 Ultra, 2023)', storageOptions: [1024, 2048, 4096, 8192] },
  { value: 'Apple Mac Pro (2019)', label: 'Mac Pro (2019, Intel)', storageOptions: [256, 1024, 2048, 4096, 8192] },
]

export const APPLE_WATCH_MODELS: DeviceModel[] = [
  { value: 'Apple Watch Ultra 2', label: 'Apple Watch Ultra 2', storageOptions: [64] },
  { value: 'Apple Watch Series 10', label: 'Apple Watch Series 10', storageOptions: [64] },
  { value: 'Apple Watch Series 9', label: 'Apple Watch Series 9', storageOptions: [64] },
  { value: 'Apple Watch Ultra', label: 'Apple Watch Ultra', storageOptions: [64] },
  { value: 'Apple Watch Series 8', label: 'Apple Watch Series 8', storageOptions: [32] },
  { value: 'Apple Watch SE (2nd Gen)', label: 'Apple Watch SE (2nd Gen)', storageOptions: [32] },
  { value: 'Apple Watch Series 7', label: 'Apple Watch Series 7', storageOptions: [32] },
  { value: 'Apple Watch Series 6', label: 'Apple Watch Series 6', storageOptions: [32] },
  { value: 'Apple Watch SE', label: 'Apple Watch SE', storageOptions: [32] },
  { value: 'Apple Watch Series 5', label: 'Apple Watch Series 5', storageOptions: [32] },
  { value: 'Apple Watch Series 4', label: 'Apple Watch Series 4', storageOptions: [16] },
  { value: 'Apple Watch Series 3', label: 'Apple Watch Series 3', storageOptions: [8, 16] },
  { value: 'Apple Watch Series 2', label: 'Apple Watch Series 2', storageOptions: [8] },
  { value: 'Apple Watch Series 1', label: 'Apple Watch Series 1', storageOptions: [8] },
  { value: 'Apple Watch (1st Gen)', label: 'Apple Watch (1st Gen)', storageOptions: [8] },
]

export const AIRPODS_MODELS: DeviceModel[] = [
  { value: 'Apple AirPods Pro (2nd Gen)', label: 'AirPods Pro (2nd Gen)', storageOptions: [] },
  { value: 'Apple AirPods Pro', label: 'AirPods Pro (1st Gen)', storageOptions: [] },
  { value: 'Apple AirPods (3rd Gen)', label: 'AirPods (3rd Gen)', storageOptions: [] },
  { value: 'Apple AirPods (2nd Gen)', label: 'AirPods (2nd Gen)', storageOptions: [] },
  { value: 'Apple AirPods (1st Gen)', label: 'AirPods (1st Gen)', storageOptions: [] },
  { value: 'Apple AirPods Max', label: 'AirPods Max', storageOptions: [] },
]

export const APPLE_TV_MODELS: DeviceModel[] = [
  { value: 'Apple TV 4K (3rd Gen)', label: 'Apple TV 4K (3rd Gen, 2022)', storageOptions: [64, 128] },
  { value: 'Apple TV 4K (2nd Gen)', label: 'Apple TV 4K (2nd Gen, 2021)', storageOptions: [32, 64] },
  { value: 'Apple TV HD', label: 'Apple TV HD', storageOptions: [32] },
  { value: 'Apple TV (4th Gen)', label: 'Apple TV (4th Gen)', storageOptions: [32, 64] },
  { value: 'Apple TV (3rd Gen)', label: 'Apple TV (3rd Gen)', storageOptions: [8] },
  { value: 'Apple TV (2nd Gen)', label: 'Apple TV (2nd Gen)', storageOptions: [8] },
]

/**
 * Get models for a specific device type
 */
export function getModelsForDeviceType(deviceType: string): DeviceModel[] {
  switch (deviceType) {
    case 'IPHONE':
      return IPHONE_MODELS
    case 'IPOD_TOUCH':
      return IPOD_TOUCH_MODELS
    case 'IPAD':
      return IPAD_MODELS
    case 'MACBOOK':
      return MACBOOK_MODELS
    case 'IMAC':
      return IMAC_MODELS
    case 'MAC_MINI':
      return MAC_MINI_MODELS
    case 'MAC_STUDIO':
      return MAC_STUDIO_MODELS
    case 'MAC_PRO':
      return MAC_PRO_MODELS
    case 'APPLE_WATCH':
      return APPLE_WATCH_MODELS
    case 'AIRPODS':
      return AIRPODS_MODELS
    case 'APPLE_TV':
      return APPLE_TV_MODELS
    default:
      return []
  }
}

/**
 * Get storage options for a specific model
 */
export function getStorageForModel(deviceType: string, modelValue: string): number[] {
  const models = getModelsForDeviceType(deviceType)
  const model = models.find(m => m.value === modelValue)
  return model?.storageOptions || []
}

/**
 * Search all models by name
 */
export function searchModels(query: string): DeviceModel[] {
  const lowerQuery = query.toLowerCase()
  const allModels = [
    ...IPHONE_MODELS,
    ...IPOD_TOUCH_MODELS,
    ...IPAD_MODELS,
    ...MACBOOK_MODELS,
    ...IMAC_MODELS,
    ...MAC_MINI_MODELS,
    ...MAC_STUDIO_MODELS,
    ...MAC_PRO_MODELS,
    ...APPLE_WATCH_MODELS,
    ...AIRPODS_MODELS,
    ...APPLE_TV_MODELS,
  ]
  return allModels.filter(m =>
    m.label.toLowerCase().includes(lowerQuery) ||
    m.value.toLowerCase().includes(lowerQuery)
  )
}
