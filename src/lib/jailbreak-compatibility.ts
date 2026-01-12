/**
 * Jailbreak Compatibility Checker
 * Uses comprehensive device database from apple-devices.ts
 * Data sourced from The Apple Wiki and ios.cfw.guide
 * Last updated: January 2026
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

  // Check palera1n (A8-A11 checkm8 devices)
  // Source: The Apple Wiki - palera1n
  // Supports: iOS 15.0-15.8.5, 16.0-16.7.12, 17.0-17.7.10, 18.0-18.7.1
  const palera1nChips = ['A8', 'A8X', 'A9', 'A9X', 'A10', 'A10X', 'A11']
  if (palera1nChips.includes(chip)) {
    const palera1nSupported =
      isVersionInRange(iosVersion, '15.0', '15.8.5') ||
      isVersionInRange(iosVersion, '16.0', '16.7.12') ||
      isVersionInRange(iosVersion, '17.0', '17.7.10') ||
      isVersionInRange(iosVersion, '18.0', '18.7.1')

    if (palera1nSupported) {
      tools.push({
        name: 'palera1n',
        type: 'semi-tethered',
        website: 'https://palera.in',
        notes: chip === 'A11' ? 'A11 devices must disable passcode' : undefined,
      })
    }
  }

  // Check Dopamine 2.x
  // Source: The Apple Wiki - Dopamine
  // Precise version support:
  // - A8-A11: iOS 15.0-15.8.5, 16.0-16.6.1
  // - A12-A14: iOS 15.0-15.8.5, 16.0-16.6.1
  // - A15-A16: iOS 15.0-15.8.5, 16.0-16.5 ONLY (NOT 16.5.1+ due to PPL bypass)
  // - M1: iOS 15.0-15.8.5, 16.0-16.5.1
  // - M2: iOS 15.0-15.8.5, 16.0-16.5
  const isA8toA11 = ['A8', 'A8X', 'A9', 'A9X', 'A10', 'A10X', 'A11'].includes(chip)
  const isA12toA14 = ['A12', 'A12X', 'A12Z', 'A13', 'A14'].includes(chip)
  const isA15orA16 = ['A15', 'A16'].includes(chip)
  const isM1 = chip === 'M1'
  const isM2 = chip === 'M2'

  if (isA8toA11 || isA12toA14) {
    // A8-A14: iOS 15.0-15.8.5 and 16.0-16.6.1
    const dopamineSupported =
      isVersionInRange(iosVersion, '15.0', '15.8.5') ||
      isVersionInRange(iosVersion, '16.0', '16.6.1')
    if (dopamineSupported) {
      tools.push({
        name: 'Dopamine',
        type: 'semi-untethered',
        website: 'https://ellekit.space/dopamine',
      })
    }
  } else if (isA15orA16 || isM2) {
    // A15-A16/M2: iOS 15.0-15.8.5 and 16.0-16.5 only (PPL bypass limitation)
    const dopamineSupported =
      isVersionInRange(iosVersion, '15.0', '15.8.5') ||
      isVersionInRange(iosVersion, '16.0', '16.5')
    if (dopamineSupported) {
      tools.push({
        name: 'Dopamine',
        type: 'semi-untethered',
        website: 'https://ellekit.space/dopamine',
      })
    }
  } else if (isM1) {
    // M1: iOS 15.0-15.8.5 and 16.0-16.5.1
    const dopamineSupported =
      isVersionInRange(iosVersion, '15.0', '15.8.5') ||
      isVersionInRange(iosVersion, '16.0', '16.5.1')
    if (dopamineSupported) {
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

  // Check NathanLR (A12+ on iOS 16.5.1-16.7 RC, and 17.0 ONLY)
  // Source: The Apple Wiki - NathanLR
  // Note: iOS 17.0.1+ patches the exploit
  const isA12Plus = ['A12', 'A12X', 'A12Z', 'A13', 'A14', 'A15', 'A16', 'A17'].includes(chip)
  if (isA12Plus) {
    // iOS 16.5.1-16.7 or exactly 17.0
    if (isVersionInRange(iosVersion, '16.5.1', '16.7') || iosVersion === '17.0') {
      tools.push({
        name: 'NathanLR',
        type: 'semi-untethered',
        website: 'https://github.com/NathanLR/NathanLR',
        notes: iosVersion === '17.0' ? 'iOS 17.0 only - 17.0.1+ not supported' : 'Semi-jailbreak',
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

  // Check XinaA15 (A12+ on iOS 15.0-15.1.1 ONLY)
  // Source: The Apple Wiki - XinaA15
  const xinaChips = ['A12', 'A12X', 'A12Z', 'A13', 'A14', 'A15', 'A16', 'M1', 'M2']
  if (xinaChips.includes(chip) && isVersionInRange(iosVersion, '15.0', '15.1.1')) {
    tools.push({
      name: 'XinaA15',
      type: 'semi-untethered',
      website: 'https://github.com/jacksight/xina520_official_jailbreak',
      notes: 'iOS 15.0-15.1.1 only',
    })
  }

  // Check unc0ver
  // Source: The Apple Wiki - unc0ver
  // v8.0.2: iOS 14.0-14.3 (all), 14.6-14.8 (A12-A14 only)
  // v6.2.0: iOS 11.0-14.3 (excluding 13.5.1 for some devices)
  // Note: 13.5.1 patches the Sock Puppet exploit
  const isUnc0verA12toA14 = ['A12', 'A12X', 'A12Z', 'A13', 'A14'].includes(chip)

  // iOS 11.0-13.5 (13.5.1 excluded - patches Sock Puppet)
  if (isVersionInRange(iosVersion, '11.0', '13.5') && iosVersion !== '13.5.1') {
    tools.push({
      name: 'unc0ver',
      type: 'semi-untethered',
      website: 'https://unc0ver.dev',
    })
  } else if (isVersionInRange(iosVersion, '13.5.5', '14.3')) {
    // iOS 13.5.5 beta through 14.3
    tools.push({
      name: 'unc0ver',
      type: 'semi-untethered',
      website: 'https://unc0ver.dev',
    })
  } else if (isVersionInRange(iosVersion, '14.6', '14.8') && isUnc0verA12toA14) {
    // iOS 14.6-14.8 for A12-A14 only (Fugu14 based)
    tools.push({
      name: 'unc0ver',
      type: 'semi-untethered',
      website: 'https://unc0ver.dev',
      notes: 'A12-A14 only for iOS 14.6-14.8',
    })
  }

  // Check Taurine (iOS 14.0-14.8.1)
  // Source: The Apple Wiki - Taurine
  if (isVersionInRange(iosVersion, '14.0', '14.8.1') && isChipAtOrBefore(chip, 'A14')) {
    tools.push({
      name: 'Taurine',
      type: 'semi-untethered',
      website: 'https://taurine.app',
    })
  }

  // Check Odyssey (iOS 13.0-13.7, A9-A13)
  // Source: The Apple Wiki - Odyssey
  const odysseyChips = ['A9', 'A9X', 'A10', 'A10X', 'A11', 'A12', 'A12X', 'A12Z', 'A13']
  if (odysseyChips.includes(chip) && isVersionInRange(iosVersion, '13.0', '13.7')) {
    tools.push({
      name: 'Odyssey',
      type: 'semi-untethered',
      website: 'https://theodyssey.dev',
    })
  }

  // Check checkra1n (A5-A11, iOS 12.0-14.8.1)
  // Source: The Apple Wiki - checkra1n
  if (hasBootromExploit && isVersionInRange(iosVersion, '12.0', '14.8.1')) {
    tools.push({
      name: 'checkra1n',
      type: 'semi-tethered',
      website: 'https://checkra.in',
      notes: 'Bootrom exploit - permanent',
    })
  }

  // Legacy: Chimera (iOS 12.0-12.5.7)
  // Source: The Apple Wiki - Chimera
  if (isVersionInRange(iosVersion, '12.0', '12.5.7') && isChipAtOrBefore(chip, 'A12')) {
    tools.push({
      name: 'Chimera',
      type: 'semi-untethered',
      website: 'https://chimera.coolstar.org',
    })
  }

  // Legacy: Electra (iOS 11.0-11.4.1)
  // Source: The Apple Wiki - Electra
  if (isVersionInRange(iosVersion, '11.0', '11.4.1') && isChipAtOrBefore(chip, 'A11')) {
    tools.push({
      name: 'Electra',
      type: 'semi-untethered',
      website: 'https://coolstar.org/electra/',
    })
  }

  // Legacy: H3lix (iOS 10.0-10.3.4, 32-bit only)
  // Source: The Apple Wiki - H3lix
  const h3lixChips = ['A5', 'A5X', 'A6', 'A6X'] // 32-bit devices
  if (h3lixChips.includes(chip) && isVersionInRange(iosVersion, '10.0', '10.3.4')) {
    tools.push({
      name: 'H3lix',
      type: 'semi-untethered',
      website: 'https://h3lix.tihmstar.net',
      notes: '32-bit devices only',
    })
  }

  // Legacy: socket (iOS 10.0.1-10.3.3, 64-bit)
  // Source: The Apple Wiki - socket
  const socketChips = ['A7', 'A8', 'A8X', 'A9', 'A9X', 'A10', 'A10X'] // 64-bit checkm8 devices
  if (socketChips.includes(chip) && isVersionInRange(iosVersion, '10.0.1', '10.3.3')) {
    tools.push({
      name: 'socket',
      type: 'semi-untethered',
      website: 'https://github.com/nickcano/socket',
      notes: '64-bit devices only',
    })
  }

  // Legacy: doubleH3lix (iOS 10.0-10.3.4, 64-bit A7-A9)
  // Source: The Apple Wiki - doubleH3lix
  const dh3lixChips = ['A7', 'A8', 'A8X', 'A9', 'A9X']
  if (dh3lixChips.includes(chip) && isVersionInRange(iosVersion, '10.0', '10.3.4')) {
    tools.push({
      name: 'doubleH3lix',
      type: 'semi-untethered',
      notes: 'A7-A9 64-bit devices',
    })
  }

  // Legacy: Meridian (iOS 10.0-10.3.3)
  // Source: The Apple Wiki - Meridian
  if (isChipAtOrBefore(chip, 'A10X') && isVersionInRange(iosVersion, '10.0', '10.3.3')) {
    tools.push({
      name: 'Meridian',
      type: 'semi-untethered',
      website: 'https://meridian.sparkes.zone',
    })
  }

  // Legacy: Phoenix (iOS 9.3.5-9.3.6, 32-bit only)
  // Source: The Apple Wiki - Phoenix
  if (isVersionInRange(iosVersion, '9.3.5', '9.3.6') && ['A5', 'A5X', 'A6', 'A6X'].includes(chip)) {
    tools.push({
      name: 'Phoenix',
      type: 'semi-untethered',
      website: 'https://phoenixpwn.com',
      notes: '32-bit devices only',
    })
  }

  // Legacy: Home Depot (iOS 9.1-9.3.4, 32-bit only)
  // Source: The Apple Wiki - Home Depot
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
