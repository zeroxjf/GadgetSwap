/**
 * Jailbreak Compatibility Checker
 * Uses comprehensive device database from apple-devices.ts
 * Data sourced from ios.cfw.guide
 */

import {
  getAllDevices,
  findDeviceByName,
  normalizeDeviceName,
  AppleDevice,
} from './apple-devices'

export interface JailbreakTool {
  name: string
  type: 'untethered' | 'semi-untethered' | 'semi-tethered' | 'tethered'
  website?: string
  notes?: string
}

export interface JailbreakResult {
  canJailbreak: boolean
  status: 'JAILBROKEN' | 'JAILBREAKABLE' | 'NOT_JAILBROKEN' | 'UNKNOWN'
  tools: JailbreakTool[]
  hasBootromExploit: boolean
  notes?: string
  device?: AppleDevice
}

// Chip generation order for comparison
const chipOrder = [
  // Legacy ARM chips
  'APL0098', 'APL0278', 'APL0298',
  // A-series
  'A4', 'A5', 'A5X', 'A6', 'A6X', 'A7', 'A8', 'A8X', 'A9', 'A9X',
  'A10', 'A10X', 'A11', 'A12', 'A12X', 'A12Z', 'A13', 'A14', 'A15', 'A16', 'A17', 'A18', 'A19',
  // M-series
  'M1', 'M2', 'M3', 'M4',
]

// Chips vulnerable to checkm8 bootrom exploit
// Only applies to: iPhone 4S through iPhone X
// A5-A11 chips (NOT A4 or earlier - those have limera1n instead)
const checkm8Chips = [
  'A5', 'A5X',           // iPhone 4S, iPad 2
  'A6', 'A6X',           // iPhone 5, 5c, iPad 4
  'A7',                  // iPhone 5s, iPad Air
  'A8', 'A8X',           // iPhone 6, 6 Plus, iPad Air 2
  'A9', 'A9X',           // iPhone 6s, 6s Plus, SE 1st gen, iPad Pro 1st gen
  'A10', 'A10X',         // iPhone 7, 7 Plus, iPad Pro 2nd gen
  'A11',                 // iPhone 8, 8 Plus, iPhone X
]

function getChipGeneration(chip: string): number {
  const index = chipOrder.indexOf(chip)
  return index === -1 ? 999 : index
}

function isChipAtOrBefore(chip: string, target: string): boolean {
  return getChipGeneration(chip) <= getChipGeneration(target)
}

function parseVersion(version: string): number[] {
  return version.split('.').map(v => parseInt(v, 10) || 0)
}

function compareVersions(v1: string, v2: string): number {
  const parts1 = parseVersion(v1)
  const parts2 = parseVersion(v2)

  for (let i = 0; i < Math.max(parts1.length, parts2.length); i++) {
    const p1 = parts1[i] || 0
    const p2 = parts2[i] || 0
    if (p1 < p2) return -1
    if (p1 > p2) return 1
  }
  return 0
}

function isVersionInRange(version: string, min: string, max: string): boolean {
  return compareVersions(version, min) >= 0 && compareVersions(version, max) <= 0
}

/**
 * Normalize device model name for lookup
 * Handles "Apple iPhone 14 Pro Max" -> "iPhone 14 Pro Max"
 */
function normalizeModelForLookup(model: string): string {
  // Remove "Apple " prefix
  let normalized = model.replace(/^Apple\s+/i, '')

  // Normalize generation naming
  normalized = normalized
    .replace(/\((\d+)(st|nd|rd|th)\s+Gen\)/gi, '($1 generation)')
    .replace(/\((\d+)\s+Gen\)/gi, '($1 generation)')

  return normalized
}

/**
 * Find device by model name with fuzzy matching
 */
function findDevice(deviceModel: string): AppleDevice | undefined {
  const normalized = normalizeModelForLookup(deviceModel)

  // Try exact match first
  let device = findDeviceByName(normalized)
  if (device) return device

  // Try case-insensitive exact match
  const allDevices = getAllDevices()
  const inputNorm = normalizeDeviceName(normalized)

  device = allDevices.find(d =>
    normalizeDeviceName(d.name) === inputNorm
  )
  if (device) return device

  // Try partial match - but be careful with similar names (iPhone 4 vs iPhone 4S)
  // Prefer matches where the input exactly matches the start of the device name
  device = allDevices.find(d => {
    const deviceNorm = normalizeDeviceName(d.name)
    // Input must match the device name exactly (case-insensitive)
    // OR the device name starts with the input and next char is space/paren
    if (deviceNorm === inputNorm) return true
    if (deviceNorm.startsWith(inputNorm)) {
      const nextChar = deviceNorm[inputNorm.length]
      return nextChar === ' ' || nextChar === '(' || nextChar === undefined
    }
    return false
  })

  return device
}

/**
 * Check jailbreak compatibility for a device and iOS version
 */
export function checkJailbreakCompatibility(
  deviceModel: string,
  iosVersion: string
): JailbreakResult {
  const device = findDevice(deviceModel)

  if (!device) {
    return {
      canJailbreak: false,
      status: 'UNKNOWN',
      tools: [],
      hasBootromExploit: false,
      notes: `Device not found in database: ${deviceModel}`,
    }
  }

  const chip = device.chip
  // checkm8 only applies to A5-A11 (iPhone 4S through iPhone X)
  const hasBootromExploit = checkm8Chips.includes(chip)
  const tools: JailbreakTool[] = []

  // Check palera1n (A11 and earlier, iOS 15.0+)
  // Source: https://ios.cfw.guide/installing-palera1n/
  if (isChipAtOrBefore(chip, 'A11') && compareVersions(iosVersion, '15.0') >= 0) {
    tools.push({
      name: 'palera1n',
      type: 'semi-tethered',
      website: 'https://palera.in',
      notes: chip === 'A11' ? 'A11 devices must disable passcode' : undefined,
    })
  }

  // Check Dopamine 2.0
  // Source: https://ios.cfw.guide/installing-dopamine/ and https://ellekit.space/dopamine/
  // - A8-A14: iOS 15.0 - 16.6.1
  // - A15-A16: iOS 15.0 - 16.5 ONLY (NOT 16.5.1-16.6.1 due to PPL bypass)
  // - M1: iOS 15.0 - 16.5.1
  // - M2: iOS 15.0 - 16.5
  const isA8toA11 = ['A8', 'A8X', 'A9', 'A9X', 'A10', 'A10X', 'A11'].includes(chip)
  const isA12toA14 = ['A12', 'A12X', 'A12Z', 'A13', 'A14'].includes(chip)
  const isA15orA16 = ['A15', 'A16'].includes(chip)
  const isM1 = chip === 'M1'
  const isM2 = chip === 'M2'

  if (isA8toA11 || isA12toA14) {
    // A8-A14: Full iOS 15.0 - 16.6.1 support
    if (isVersionInRange(iosVersion, '15.0', '16.6.1')) {
      tools.push({
        name: 'Dopamine',
        type: 'semi-untethered',
        website: 'https://ellekit.space/dopamine',
      })
    }
  } else if (isA15orA16 || isM2) {
    // A15-A16/M2: iOS 15.0 - 16.5 only (PPL bypass limitation)
    if (isVersionInRange(iosVersion, '15.0', '16.5')) {
      tools.push({
        name: 'Dopamine',
        type: 'semi-untethered',
        website: 'https://ellekit.space/dopamine',
      })
    }
  } else if (isM1) {
    // M1: iOS 15.0 - 16.5.1
    if (isVersionInRange(iosVersion, '15.0', '16.5.1')) {
      tools.push({
        name: 'Dopamine',
        type: 'semi-untethered',
        website: 'https://ellekit.space/dopamine',
      })
    }
  }

  // Check Serotonin (semi-jailbreak for A12-A16 on iOS 16.0-16.6.1)
  // Source: https://onejailbreak.com/blog/serotonin/
  // Useful for A15-A16 on iOS 16.5.1-16.6.1 where Dopamine doesn't work
  const isArm64e = ['A12', 'A12X', 'A12Z', 'A13', 'A14', 'A15', 'A16'].includes(chip)
  if (isArm64e && isVersionInRange(iosVersion, '16.0', '16.6.1')) {
    // Only add if Dopamine isn't available (A15-A16 on 16.5.1+)
    const dopamineAvailable = tools.some(t => t.name === 'Dopamine')
    if (!dopamineAvailable) {
      tools.push({
        name: 'Serotonin',
        type: 'semi-untethered',
        website: 'https://github.com/mineek/Serotonin',
        notes: 'Semi-jailbreak with tweak injection',
      })
    }
  }

  // Check NathanLR (A12+ on iOS 16.5.1-16.6.1, 16.7 RC, and 17.0 ONLY)
  // Source: https://theapplewiki.com/wiki/NathanLR
  // Note: iOS 17.0.1+ patches the exploit
  const isA12Plus = ['A12', 'A12X', 'A12Z', 'A13', 'A14', 'A15', 'A16', 'A17'].includes(chip)
  if (isA12Plus) {
    // iOS 16.5.1-16.6.1 or exactly 17.0
    if (isVersionInRange(iosVersion, '16.5.1', '16.6.1') || iosVersion === '17.0') {
      tools.push({
        name: 'NathanLR',
        type: 'semi-untethered',
        website: 'https://github.com/NathanLR/NathanLR',
        notes: iosVersion === '17.0' ? 'iOS 17.0 only - 17.0.1+ not supported' : undefined,
      })
    }
  }

  // Check meowbrek2 (A11 and earlier, iOS 15.0-15.8.3)
  // Source: https://ios.cfw.guide/installing-meowbrek2/
  if (isChipAtOrBefore(chip, 'A11') && isVersionInRange(iosVersion, '15.0', '15.8.3')) {
    tools.push({
      name: 'meowbrek2',
      type: 'semi-untethered',
      website: 'https://kok3shidoll.github.io/meowbrek2/',
    })
  }

  // Check unc0ver (iOS 11.0-14.3, or 14.6-14.8 for A12/A13)
  if (isVersionInRange(iosVersion, '11.0', '14.3')) {
    tools.push({
      name: 'unc0ver',
      type: 'semi-untethered',
      website: 'https://unc0ver.dev',
    })
  } else if (isVersionInRange(iosVersion, '14.6', '14.8') && ['A12', 'A12X', 'A12Z', 'A13'].includes(chip)) {
    tools.push({
      name: 'unc0ver',
      type: 'semi-untethered',
      website: 'https://unc0ver.dev',
      notes: 'A12/A13 only for iOS 14.6-14.8',
    })
  }

  // Check Taurine (iOS 14.0-14.8.1)
  if (isVersionInRange(iosVersion, '14.0', '14.8.1') && isChipAtOrBefore(chip, 'A14')) {
    tools.push({
      name: 'Taurine',
      type: 'semi-untethered',
      website: 'https://taurine.app',
    })
  }

  // Check checkra1n (A11 and earlier, iOS 12.0-14.8.1)
  if (hasBootromExploit && isVersionInRange(iosVersion, '12.0', '14.8.1')) {
    tools.push({
      name: 'checkra1n',
      type: 'semi-tethered',
      website: 'https://checkra.in',
      notes: 'Bootrom exploit - permanent',
    })
  }

  // Legacy: Chimera (iOS 12.0-12.5.7)
  if (isVersionInRange(iosVersion, '12.0', '12.5.7') && isChipAtOrBefore(chip, 'A12')) {
    tools.push({
      name: 'Chimera',
      type: 'semi-untethered',
      website: 'https://chimera.coolstar.org',
    })
  }

  // Legacy: Electra (iOS 11.0-11.4.1)
  if (isVersionInRange(iosVersion, '11.0', '11.4.1') && isChipAtOrBefore(chip, 'A11')) {
    tools.push({
      name: 'Electra',
      type: 'semi-untethered',
    })
  }

  // Legacy: Phoenix (iOS 9.3.5-9.3.6, 32-bit only)
  if (isVersionInRange(iosVersion, '9.3.5', '9.3.6') && ['A5', 'A5X', 'A6', 'A6X'].includes(chip)) {
    tools.push({
      name: 'Phoenix',
      type: 'semi-untethered',
      notes: '32-bit devices only',
    })
  }

  // Legacy: Home Depot (iOS 9.1-9.3.4, 32-bit only)
  if (isVersionInRange(iosVersion, '9.1', '9.3.4') && ['A5', 'A5X', 'A6', 'A6X'].includes(chip)) {
    tools.push({
      name: 'Home Depot',
      type: 'semi-untethered',
      notes: '32-bit devices only',
    })
  }

  // Legacy: Pangu9 (iOS 9.0-9.1)
  if (isVersionInRange(iosVersion, '9.0', '9.1')) {
    tools.push({
      name: 'Pangu9',
      type: 'untethered',
    })
  }

  // Legacy: TaiG (iOS 8.0-8.4)
  if (isVersionInRange(iosVersion, '8.0', '8.4')) {
    tools.push({
      name: 'TaiG',
      type: 'untethered',
    })
  }

  // Legacy: Pangu8 (iOS 8.0-8.1.2)
  if (isVersionInRange(iosVersion, '8.0', '8.1.2')) {
    tools.push({
      name: 'Pangu8',
      type: 'untethered',
    })
  }

  // Legacy: evasi0n7 (iOS 7.0-7.0.6)
  if (isVersionInRange(iosVersion, '7.0', '7.0.6')) {
    tools.push({
      name: 'evasi0n7',
      type: 'untethered',
    })
  }

  // Legacy: p0sixspwn (iOS 6.1.3-6.1.6)
  if (isVersionInRange(iosVersion, '6.1.3', '6.1.6')) {
    tools.push({
      name: 'p0sixspwn',
      type: 'untethered',
    })
  }

  // Legacy: evasi0n (iOS 6.0-6.1.2)
  if (isVersionInRange(iosVersion, '6.0', '6.1.2')) {
    tools.push({
      name: 'evasi0n',
      type: 'untethered',
    })
  }

  // Legacy: redsn0w/absinthe (iOS 5.0-5.1.1)
  if (isVersionInRange(iosVersion, '5.0', '5.1.1')) {
    tools.push({
      name: 'redsn0w/Absinthe',
      type: 'untethered',
    })
  }

  // Legacy: redsn0w (iOS 4.x and earlier for bootrom-exploitable devices)
  if (compareVersions(iosVersion, '5.0') < 0 && hasBootromExploit) {
    tools.push({
      name: 'redsn0w',
      type: 'tethered',
      notes: 'May require tethered boot',
    })
  }

  // Remove duplicate tools (keep first occurrence)
  const uniqueTools = tools.filter((tool, index, self) =>
    index === self.findIndex(t => t.name === tool.name)
  )

  const canJailbreak = uniqueTools.length > 0

  return {
    canJailbreak,
    status: canJailbreak ? 'JAILBREAKABLE' : 'NOT_JAILBROKEN',
    tools: uniqueTools,
    hasBootromExploit,
    device,
    notes: hasBootromExploit ? 'This device has a permanent bootrom exploit (checkm8)' : undefined,
  }
}

/**
 * Get the chip for a device model
 */
export function getDeviceChip(deviceModel: string): string | null {
  const device = findDevice(deviceModel)
  return device?.chip || null
}

/**
 * Check if a device has the checkm8 bootrom exploit
 */
export function hasCheckm8Exploit(deviceModel: string): boolean {
  const device = findDevice(deviceModel)
  return device?.hasBootromExploit || false
}

/**
 * Get all supported device models
 */
export function getSupportedDevices(): string[] {
  return getAllDevices().map(d => d.name)
}

/**
 * Re-export normalizeDeviceName for external use
 */
export { normalizeDeviceName } from './apple-devices'
