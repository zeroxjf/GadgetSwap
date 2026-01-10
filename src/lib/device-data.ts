/**
 * Comprehensive Apple device data for GadgetSwap
 * Used for filters, listings, and display formatting
 * Data sourced from AppleDB - includes all devices from 2010+
 */

// Device type definitions with proper casing
export const deviceTypes = [
  { value: 'IPHONE', label: 'iPhone' },
  { value: 'IPAD', label: 'iPad' },
  { value: 'MACBOOK', label: 'MacBook' },
  { value: 'IMAC', label: 'iMac' },
  { value: 'MAC_MINI', label: 'Mac mini' },
  { value: 'MAC_STUDIO', label: 'Mac Studio' },
  { value: 'MAC_PRO', label: 'Mac Pro' },
  { value: 'APPLE_WATCH', label: 'Apple Watch' },
  { value: 'AIRPODS', label: 'AirPods' },
  { value: 'APPLE_TV', label: 'Apple TV' },
  { value: 'HOMEPOD', label: 'HomePod' },
  { value: 'IPOD', label: 'iPod' },
  { value: 'VISION_PRO', label: 'Apple Vision Pro' },
] as const

// Map for quick lookup
export const deviceTypeLabels: Record<string, string> = Object.fromEntries(
  deviceTypes.map((d) => [d.value, d.label])
)

// Get proper display label for a device type
export function getDeviceTypeLabel(value: string): string {
  return deviceTypeLabels[value] || value
}

// Models organized by device type - comprehensive list from AppleDB
export const modelsByDeviceType: Record<string, { value: string; label: string }[]> = {
  IPHONE: [
    // iPhone 17 series (2025)
    { value: 'iPhone 17 Pro Max', label: 'iPhone 17 Pro Max' },
    { value: 'iPhone 17 Pro', label: 'iPhone 17 Pro' },
    { value: 'iPhone 17', label: 'iPhone 17' },
    { value: 'iPhone Air', label: 'iPhone Air' },
    // iPhone 16 series (2024-2025)
    { value: 'iPhone 16e', label: 'iPhone 16e' },
    { value: 'iPhone 16 Pro Max', label: 'iPhone 16 Pro Max' },
    { value: 'iPhone 16 Pro', label: 'iPhone 16 Pro' },
    { value: 'iPhone 16 Plus', label: 'iPhone 16 Plus' },
    { value: 'iPhone 16', label: 'iPhone 16' },
    // iPhone 15 series (2023)
    { value: 'iPhone 15 Pro Max', label: 'iPhone 15 Pro Max' },
    { value: 'iPhone 15 Pro', label: 'iPhone 15 Pro' },
    { value: 'iPhone 15 Plus', label: 'iPhone 15 Plus' },
    { value: 'iPhone 15', label: 'iPhone 15' },
    // iPhone 14 series (2022)
    { value: 'iPhone 14 Pro Max', label: 'iPhone 14 Pro Max' },
    { value: 'iPhone 14 Pro', label: 'iPhone 14 Pro' },
    { value: 'iPhone 14 Plus', label: 'iPhone 14 Plus' },
    { value: 'iPhone 14', label: 'iPhone 14' },
    // iPhone 13 series (2021)
    { value: 'iPhone 13 Pro Max', label: 'iPhone 13 Pro Max' },
    { value: 'iPhone 13 Pro', label: 'iPhone 13 Pro' },
    { value: 'iPhone 13', label: 'iPhone 13' },
    { value: 'iPhone 13 mini', label: 'iPhone 13 mini' },
    // iPhone 12 series (2020)
    { value: 'iPhone 12 Pro Max', label: 'iPhone 12 Pro Max' },
    { value: 'iPhone 12 Pro', label: 'iPhone 12 Pro' },
    { value: 'iPhone 12', label: 'iPhone 12' },
    { value: 'iPhone 12 mini', label: 'iPhone 12 mini' },
    // iPhone 11 series (2019)
    { value: 'iPhone 11 Pro Max', label: 'iPhone 11 Pro Max' },
    { value: 'iPhone 11 Pro', label: 'iPhone 11 Pro' },
    { value: 'iPhone 11', label: 'iPhone 11' },
    // iPhone X series (2017-2018)
    { value: 'iPhone XS Max', label: 'iPhone XS Max' },
    { value: 'iPhone XS', label: 'iPhone XS' },
    { value: 'iPhone XR', label: 'iPhone XR' },
    { value: 'iPhone X', label: 'iPhone X' },
    // iPhone 8 series (2017)
    { value: 'iPhone 8 Plus', label: 'iPhone 8 Plus' },
    { value: 'iPhone 8', label: 'iPhone 8' },
    // iPhone 7 series (2016)
    { value: 'iPhone 7 Plus', label: 'iPhone 7 Plus' },
    { value: 'iPhone 7', label: 'iPhone 7' },
    // iPhone SE
    { value: 'iPhone SE (3rd gen)', label: 'iPhone SE (3rd gen)' },
    { value: 'iPhone SE (2nd gen)', label: 'iPhone SE (2nd gen)' },
    { value: 'iPhone SE (1st gen)', label: 'iPhone SE (1st gen)' },
    // iPhone 6s series (2015)
    { value: 'iPhone 6s Plus', label: 'iPhone 6s Plus' },
    { value: 'iPhone 6s', label: 'iPhone 6s' },
    // iPhone 6 series (2014)
    { value: 'iPhone 6 Plus', label: 'iPhone 6 Plus' },
    { value: 'iPhone 6', label: 'iPhone 6' },
    // iPhone 5 series (2012-2013)
    { value: 'iPhone 5s', label: 'iPhone 5s' },
    { value: 'iPhone 5c', label: 'iPhone 5c' },
    { value: 'iPhone 5', label: 'iPhone 5' },
    // iPhone 4 series (2010-2011)
    { value: 'iPhone 4S', label: 'iPhone 4S' },
    { value: 'iPhone 4', label: 'iPhone 4' },
    // iPhone 3GS (2009)
    { value: 'iPhone 3GS', label: 'iPhone 3GS' },
  ],
  IPAD: [
    // iPad Pro M5 (2025)
    { value: 'iPad Pro 13-inch (M5)', label: 'iPad Pro 13" (M5)' },
    { value: 'iPad Pro 11-inch (M5)', label: 'iPad Pro 11" (M5)' },
    // iPad Pro M4 (2024)
    { value: 'iPad Pro 13-inch (M4)', label: 'iPad Pro 13" (M4)' },
    { value: 'iPad Pro 11-inch (M4)', label: 'iPad Pro 11" (M4)' },
    // iPad Pro M2 (2022)
    { value: 'iPad Pro 12.9-inch (6th gen)', label: 'iPad Pro 12.9" (6th gen, M2)' },
    { value: 'iPad Pro 11-inch (4th gen)', label: 'iPad Pro 11" (4th gen, M2)' },
    // iPad Pro M1 (2021)
    { value: 'iPad Pro 12.9-inch (5th gen)', label: 'iPad Pro 12.9" (5th gen, M1)' },
    { value: 'iPad Pro 11-inch (3rd gen)', label: 'iPad Pro 11" (3rd gen, M1)' },
    // iPad Pro (2020)
    { value: 'iPad Pro 12.9-inch (4th gen)', label: 'iPad Pro 12.9" (4th gen)' },
    { value: 'iPad Pro 11-inch (2nd gen)', label: 'iPad Pro 11" (2nd gen)' },
    // iPad Pro (2018)
    { value: 'iPad Pro 12.9-inch (3rd gen)', label: 'iPad Pro 12.9" (3rd gen)' },
    { value: 'iPad Pro 11-inch (1st gen)', label: 'iPad Pro 11" (1st gen)' },
    // iPad Pro (2017)
    { value: 'iPad Pro 12.9-inch (2nd gen)', label: 'iPad Pro 12.9" (2nd gen)' },
    { value: 'iPad Pro 10.5-inch', label: 'iPad Pro 10.5"' },
    // iPad Pro (2015-2016)
    { value: 'iPad Pro 12.9-inch (1st gen)', label: 'iPad Pro 12.9" (1st gen)' },
    { value: 'iPad Pro 9.7-inch', label: 'iPad Pro 9.7"' },
    // iPad Air M3 (2025)
    { value: 'iPad Air 13-inch (M3)', label: 'iPad Air 13" (M3)' },
    { value: 'iPad Air 11-inch (M3)', label: 'iPad Air 11" (M3)' },
    // iPad Air M2 (2024)
    { value: 'iPad Air 13-inch (M2)', label: 'iPad Air 13" (M2)' },
    { value: 'iPad Air 11-inch (M2)', label: 'iPad Air 11" (M2)' },
    // iPad Air (older)
    { value: 'iPad Air (5th gen)', label: 'iPad Air (5th gen, M1)' },
    { value: 'iPad Air (4th gen)', label: 'iPad Air (4th gen)' },
    { value: 'iPad Air (3rd gen)', label: 'iPad Air (3rd gen)' },
    { value: 'iPad Air 2', label: 'iPad Air 2' },
    { value: 'iPad Air (1st gen)', label: 'iPad Air (1st gen)' },
    // iPad (standard) - 2025
    { value: 'iPad (A16)', label: 'iPad (A16)' },
    // iPad (standard) - older
    { value: 'iPad (10th gen)', label: 'iPad (10th gen)' },
    { value: 'iPad (9th gen)', label: 'iPad (9th gen)' },
    { value: 'iPad (8th gen)', label: 'iPad (8th gen)' },
    { value: 'iPad (7th gen)', label: 'iPad (7th gen)' },
    { value: 'iPad (6th gen)', label: 'iPad (6th gen)' },
    { value: 'iPad (5th gen)', label: 'iPad (5th gen)' },
    { value: 'iPad (4th gen)', label: 'iPad (4th gen)' },
    { value: 'iPad (3rd gen)', label: 'iPad (3rd gen)' },
    { value: 'iPad 2', label: 'iPad 2' },
    { value: 'iPad (1st gen)', label: 'iPad (1st gen)' },
    // iPad mini
    { value: 'iPad mini (A17 Pro)', label: 'iPad mini (A17 Pro)' },
    { value: 'iPad mini (6th gen)', label: 'iPad mini (6th gen)' },
    { value: 'iPad mini (5th gen)', label: 'iPad mini (5th gen)' },
    { value: 'iPad mini 4', label: 'iPad mini 4' },
    { value: 'iPad mini 3', label: 'iPad mini 3' },
    { value: 'iPad mini 2', label: 'iPad mini 2' },
    { value: 'iPad mini (1st gen)', label: 'iPad mini (1st gen)' },
  ],
  MACBOOK: [
    // MacBook Pro M5 (2025)
    { value: 'MacBook Pro 14-inch (M5)', label: 'MacBook Pro 14" (M5)' },
    // MacBook Pro M4 (2024)
    { value: 'MacBook Pro 16-inch (M4 Max)', label: 'MacBook Pro 16" (M4 Max)' },
    { value: 'MacBook Pro 16-inch (M4 Pro)', label: 'MacBook Pro 16" (M4 Pro)' },
    { value: 'MacBook Pro 14-inch (M4 Max)', label: 'MacBook Pro 14" (M4 Max)' },
    { value: 'MacBook Pro 14-inch (M4 Pro)', label: 'MacBook Pro 14" (M4 Pro)' },
    { value: 'MacBook Pro 14-inch (M4)', label: 'MacBook Pro 14" (M4)' },
    // MacBook Pro M3 (2023)
    { value: 'MacBook Pro 16-inch (M3 Max)', label: 'MacBook Pro 16" (M3 Max)' },
    { value: 'MacBook Pro 16-inch (M3 Pro)', label: 'MacBook Pro 16" (M3 Pro)' },
    { value: 'MacBook Pro 14-inch (M3 Max)', label: 'MacBook Pro 14" (M3 Max)' },
    { value: 'MacBook Pro 14-inch (M3 Pro)', label: 'MacBook Pro 14" (M3 Pro)' },
    { value: 'MacBook Pro 14-inch (M3)', label: 'MacBook Pro 14" (M3)' },
    // MacBook Pro M2 (2022-2023)
    { value: 'MacBook Pro 16-inch (M2 Max)', label: 'MacBook Pro 16" (M2 Max)' },
    { value: 'MacBook Pro 16-inch (M2 Pro)', label: 'MacBook Pro 16" (M2 Pro)' },
    { value: 'MacBook Pro 14-inch (M2 Max)', label: 'MacBook Pro 14" (M2 Max)' },
    { value: 'MacBook Pro 14-inch (M2 Pro)', label: 'MacBook Pro 14" (M2 Pro)' },
    { value: 'MacBook Pro 13-inch (M2)', label: 'MacBook Pro 13" (M2)' },
    // MacBook Pro M1 (2020-2021)
    { value: 'MacBook Pro 16-inch (M1 Max)', label: 'MacBook Pro 16" (M1 Max)' },
    { value: 'MacBook Pro 16-inch (M1 Pro)', label: 'MacBook Pro 16" (M1 Pro)' },
    { value: 'MacBook Pro 14-inch (M1 Max)', label: 'MacBook Pro 14" (M1 Max)' },
    { value: 'MacBook Pro 14-inch (M1 Pro)', label: 'MacBook Pro 14" (M1 Pro)' },
    { value: 'MacBook Pro 13-inch (M1)', label: 'MacBook Pro 13" (M1)' },
    // MacBook Pro Intel (2016-2020)
    { value: 'MacBook Pro 16-inch (2019)', label: 'MacBook Pro 16" (2019)' },
    { value: 'MacBook Pro 15-inch (2019)', label: 'MacBook Pro 15" (2019)' },
    { value: 'MacBook Pro 15-inch (2018)', label: 'MacBook Pro 15" (2018)' },
    { value: 'MacBook Pro 13-inch (2020)', label: 'MacBook Pro 13" (2020)' },
    { value: 'MacBook Pro 13-inch (2019)', label: 'MacBook Pro 13" (2019)' },
    { value: 'MacBook Pro 13-inch (2018)', label: 'MacBook Pro 13" (2018)' },
    { value: 'MacBook Pro 15-inch (2017)', label: 'MacBook Pro 15" (2017)' },
    { value: 'MacBook Pro 13-inch (2017)', label: 'MacBook Pro 13" (2017)' },
    { value: 'MacBook Pro 15-inch (2016)', label: 'MacBook Pro 15" (2016)' },
    { value: 'MacBook Pro 13-inch (2016)', label: 'MacBook Pro 13" (2016)' },
    // MacBook Pro Retina (2012-2015)
    { value: 'MacBook Pro Retina 15-inch (Mid 2015)', label: 'MacBook Pro Retina 15" (Mid 2015)' },
    { value: 'MacBook Pro Retina 13-inch (Early 2015)', label: 'MacBook Pro Retina 13" (Early 2015)' },
    { value: 'MacBook Pro Retina 15-inch (Mid 2014)', label: 'MacBook Pro Retina 15" (Mid 2014)' },
    { value: 'MacBook Pro Retina 13-inch (Mid 2014)', label: 'MacBook Pro Retina 13" (Mid 2014)' },
    { value: 'MacBook Pro Retina 15-inch (Late 2013)', label: 'MacBook Pro Retina 15" (Late 2013)' },
    { value: 'MacBook Pro Retina 13-inch (Late 2013)', label: 'MacBook Pro Retina 13" (Late 2013)' },
    { value: 'MacBook Pro Retina 15-inch (Early 2013)', label: 'MacBook Pro Retina 15" (Early 2013)' },
    { value: 'MacBook Pro Retina 13-inch (Early 2013)', label: 'MacBook Pro Retina 13" (Early 2013)' },
    { value: 'MacBook Pro Retina 15-inch (Mid 2012)', label: 'MacBook Pro Retina 15" (Mid 2012)' },
    { value: 'MacBook Pro Retina 13-inch (Late 2012)', label: 'MacBook Pro Retina 13" (Late 2012)' },
    // MacBook Pro non-Retina (2010-2012)
    { value: 'MacBook Pro 17-inch (Late 2011)', label: 'MacBook Pro 17" (Late 2011)' },
    { value: 'MacBook Pro 17-inch (Early 2011)', label: 'MacBook Pro 17" (Early 2011)' },
    { value: 'MacBook Pro 15-inch (Mid 2012)', label: 'MacBook Pro 15" (Mid 2012)' },
    { value: 'MacBook Pro 15-inch (Late 2011)', label: 'MacBook Pro 15" (Late 2011)' },
    { value: 'MacBook Pro 15-inch (Early 2011)', label: 'MacBook Pro 15" (Early 2011)' },
    { value: 'MacBook Pro 13-inch (Mid 2012)', label: 'MacBook Pro 13" (Mid 2012)' },
    { value: 'MacBook Pro 13-inch (Late 2011)', label: 'MacBook Pro 13" (Late 2011)' },
    { value: 'MacBook Pro 13-inch (Early 2011)', label: 'MacBook Pro 13" (Early 2011)' },
    { value: 'MacBook Pro 17-inch (Mid 2010)', label: 'MacBook Pro 17" (Mid 2010)' },
    { value: 'MacBook Pro 15-inch (Mid 2010)', label: 'MacBook Pro 15" (Mid 2010)' },
    { value: 'MacBook Pro 13-inch (Mid 2010)', label: 'MacBook Pro 13" (Mid 2010)' },
    // MacBook Air M4 (2025)
    { value: 'MacBook Air 15-inch (M4)', label: 'MacBook Air 15" (M4)' },
    { value: 'MacBook Air 13-inch (M4)', label: 'MacBook Air 13" (M4)' },
    // MacBook Air M3 (2024)
    { value: 'MacBook Air 15-inch (M3)', label: 'MacBook Air 15" (M3)' },
    { value: 'MacBook Air 13-inch (M3)', label: 'MacBook Air 13" (M3)' },
    // MacBook Air M2 (2022-2023)
    { value: 'MacBook Air 15-inch (M2)', label: 'MacBook Air 15" (M2)' },
    { value: 'MacBook Air 13-inch (M2)', label: 'MacBook Air 13" (M2)' },
    // MacBook Air M1 (2020)
    { value: 'MacBook Air (M1)', label: 'MacBook Air (M1)' },
    // MacBook Air Intel (2018-2020)
    { value: 'MacBook Air (Retina, 2020)', label: 'MacBook Air (Retina, 2020)' },
    { value: 'MacBook Air (Retina, 2019)', label: 'MacBook Air (Retina, 2019)' },
    { value: 'MacBook Air (Retina, 2018)', label: 'MacBook Air (Retina, 2018)' },
    { value: 'MacBook Air (2017)', label: 'MacBook Air (2017)' },
    // MacBook Air older (2010-2015)
    { value: 'MacBook Air 13-inch (Early 2015)', label: 'MacBook Air 13" (Early 2015)' },
    { value: 'MacBook Air 11-inch (Early 2015)', label: 'MacBook Air 11" (Early 2015)' },
    { value: 'MacBook Air 13-inch (Early 2014)', label: 'MacBook Air 13" (Early 2014)' },
    { value: 'MacBook Air 11-inch (Early 2014)', label: 'MacBook Air 11" (Early 2014)' },
    { value: 'MacBook Air 13-inch (Mid 2013)', label: 'MacBook Air 13" (Mid 2013)' },
    { value: 'MacBook Air 11-inch (Mid 2013)', label: 'MacBook Air 11" (Mid 2013)' },
    { value: 'MacBook Air 13-inch (Mid 2012)', label: 'MacBook Air 13" (Mid 2012)' },
    { value: 'MacBook Air 11-inch (Mid 2012)', label: 'MacBook Air 11" (Mid 2012)' },
    { value: 'MacBook Air 13-inch (Mid 2011)', label: 'MacBook Air 13" (Mid 2011)' },
    { value: 'MacBook Air 11-inch (Mid 2011)', label: 'MacBook Air 11" (Mid 2011)' },
    { value: 'MacBook Air 13-inch (Late 2010)', label: 'MacBook Air 13" (Late 2010)' },
    { value: 'MacBook Air 11-inch (Late 2010)', label: 'MacBook Air 11" (Late 2010)' },
    // MacBook 12"
    { value: 'MacBook 12-inch (2017)', label: 'MacBook 12" (2017)' },
    { value: 'MacBook 12-inch (Early 2016)', label: 'MacBook 12" (Early 2016)' },
    { value: 'MacBook 12-inch (Early 2015)', label: 'MacBook 12" (Early 2015)' },
    // MacBook non-Retina (2010)
    { value: 'MacBook 13-inch (Mid 2010)', label: 'MacBook 13" (Mid 2010)' },
  ],
  IMAC: [
    // iMac M4 (2024)
    { value: 'iMac 24-inch (M4)', label: 'iMac 24" (M4)' },
    // iMac M3 (2023)
    { value: 'iMac 24-inch (M3)', label: 'iMac 24" (M3)' },
    // iMac M1 (2021)
    { value: 'iMac 24-inch (M1)', label: 'iMac 24" (M1)' },
    // iMac Intel (2015-2020)
    { value: 'iMac (Retina 5K, 27-inch, 2020)', label: 'iMac 27" 5K (2020)' },
    { value: 'iMac (Retina 5K, 27-inch, 2019)', label: 'iMac 27" 5K (2019)' },
    { value: 'iMac (Retina 4K, 21.5-inch, 2019)', label: 'iMac 21.5" 4K (2019)' },
    { value: 'iMac (Retina 5K, 27-inch, 2017)', label: 'iMac 27" 5K (2017)' },
    { value: 'iMac (Retina 4K, 21.5-inch, 2017)', label: 'iMac 21.5" 4K (2017)' },
    { value: 'iMac (21.5-inch, 2017)', label: 'iMac 21.5" (2017)' },
    { value: 'iMac (Retina 5K, 27-inch, Late 2015)', label: 'iMac 27" 5K (Late 2015)' },
    { value: 'iMac (Retina 4K, 21.5-inch, Late 2015)', label: 'iMac 21.5" 4K (Late 2015)' },
    { value: 'iMac (21.5-inch, Late 2015)', label: 'iMac 21.5" (Late 2015)' },
    { value: 'iMac (Retina 5K, 27-inch, Mid 2015)', label: 'iMac 27" 5K (Mid 2015)' },
    { value: 'iMac (Retina 5K, 27-inch, Late 2014)', label: 'iMac 27" 5K (Late 2014)' },
    { value: 'iMac (21.5-inch, Mid 2014)', label: 'iMac 21.5" (Mid 2014)' },
    { value: 'iMac (27-inch, Late 2013)', label: 'iMac 27" (Late 2013)' },
    { value: 'iMac (21.5-inch, Late 2013)', label: 'iMac 21.5" (Late 2013)' },
    { value: 'iMac (21.5-inch, Early 2013)', label: 'iMac 21.5" (Early 2013)' },
    { value: 'iMac (27-inch, Late 2012)', label: 'iMac 27" (Late 2012)' },
    { value: 'iMac (21.5-inch, Late 2012)', label: 'iMac 21.5" (Late 2012)' },
    // iMac (2010-2011)
    { value: 'iMac (27-inch, Mid 2011)', label: 'iMac 27" (Mid 2011)' },
    { value: 'iMac (21.5-inch, Mid 2011)', label: 'iMac 21.5" (Mid 2011)' },
    { value: 'iMac (27-inch, Mid 2010)', label: 'iMac 27" (Mid 2010)' },
    { value: 'iMac (21.5-inch, Mid 2010)', label: 'iMac 21.5" (Mid 2010)' },
    // iMac Pro
    { value: 'iMac Pro', label: 'iMac Pro (2017)' },
  ],
  MAC_MINI: [
    // Mac mini M4 (2024)
    { value: 'Mac mini (M4 Pro)', label: 'Mac mini (M4 Pro)' },
    { value: 'Mac mini (M4)', label: 'Mac mini (M4)' },
    // Mac mini M2 (2023)
    { value: 'Mac mini (M2 Pro)', label: 'Mac mini (M2 Pro)' },
    { value: 'Mac mini (M2)', label: 'Mac mini (M2)' },
    // Mac mini M1 (2020)
    { value: 'Mac mini (M1)', label: 'Mac mini (M1)' },
    // Mac mini Intel (2014-2018)
    { value: 'Mac mini (2018)', label: 'Mac mini (2018)' },
    { value: 'Mac mini (Late 2014)', label: 'Mac mini (Late 2014)' },
    { value: 'Mac mini (Late 2012)', label: 'Mac mini (Late 2012)' },
    { value: 'Mac mini (Mid 2011)', label: 'Mac mini (Mid 2011)' },
    { value: 'Mac mini (Mid 2010)', label: 'Mac mini (Mid 2010)' },
  ],
  MAC_STUDIO: [
    // Mac Studio (2025)
    { value: 'Mac Studio (M4 Max)', label: 'Mac Studio (M4 Max)' },
    { value: 'Mac Studio (M3 Ultra)', label: 'Mac Studio (M3 Ultra)' },
    // Mac Studio (2023)
    { value: 'Mac Studio (M2 Ultra)', label: 'Mac Studio (M2 Ultra)' },
    { value: 'Mac Studio (M2 Max)', label: 'Mac Studio (M2 Max)' },
    // Mac Studio (2022)
    { value: 'Mac Studio (M1 Ultra)', label: 'Mac Studio (M1 Ultra)' },
    { value: 'Mac Studio (M1 Max)', label: 'Mac Studio (M1 Max)' },
  ],
  MAC_PRO: [
    // Mac Pro (2023)
    { value: 'Mac Pro (2023)', label: 'Mac Pro (M2 Ultra, 2023)' },
    { value: 'Mac Pro (Rack, 2023)', label: 'Mac Pro Rack (M2 Ultra, 2023)' },
    // Mac Pro (2019)
    { value: 'Mac Pro (2019)', label: 'Mac Pro (2019)' },
    { value: 'Mac Pro (Rack, 2019)', label: 'Mac Pro Rack (2019)' },
    // Mac Pro (older)
    { value: 'Mac Pro (Late 2013)', label: 'Mac Pro (Late 2013)' },
    { value: 'Mac Pro (Mid 2012)', label: 'Mac Pro (Mid 2012)' },
    { value: 'Mac Pro (Mid 2010)', label: 'Mac Pro (Mid 2010)' },
  ],
  APPLE_WATCH: [
    // Apple Watch Series 11 (2025)
    { value: 'Apple Watch Series 11 (46mm)', label: 'Apple Watch Series 11 (46mm)' },
    { value: 'Apple Watch Series 11 (42mm)', label: 'Apple Watch Series 11 (42mm)' },
    // Apple Watch Ultra 3 (2025)
    { value: 'Apple Watch Ultra 3', label: 'Apple Watch Ultra 3' },
    // Apple Watch SE 3 (2025)
    { value: 'Apple Watch SE 3 (44mm)', label: 'Apple Watch SE 3 (44mm)' },
    { value: 'Apple Watch SE 3 (40mm)', label: 'Apple Watch SE 3 (40mm)' },
    // Apple Watch Series 10 (2024)
    { value: 'Apple Watch Series 10 (46mm)', label: 'Apple Watch Series 10 (46mm)' },
    { value: 'Apple Watch Series 10 (42mm)', label: 'Apple Watch Series 10 (42mm)' },
    // Apple Watch Ultra 2 (2023)
    { value: 'Apple Watch Ultra 2', label: 'Apple Watch Ultra 2' },
    // Apple Watch Series 9 (2023)
    { value: 'Apple Watch Series 9 (45mm)', label: 'Apple Watch Series 9 (45mm)' },
    { value: 'Apple Watch Series 9 (41mm)', label: 'Apple Watch Series 9 (41mm)' },
    // Apple Watch Ultra (2022)
    { value: 'Apple Watch Ultra', label: 'Apple Watch Ultra' },
    // Apple Watch Series 8 (2022)
    { value: 'Apple Watch Series 8 (45mm)', label: 'Apple Watch Series 8 (45mm)' },
    { value: 'Apple Watch Series 8 (41mm)', label: 'Apple Watch Series 8 (41mm)' },
    // Apple Watch SE 2nd gen (2022)
    { value: 'Apple Watch SE (2nd gen, 44mm)', label: 'Apple Watch SE 2 (44mm)' },
    { value: 'Apple Watch SE (2nd gen, 40mm)', label: 'Apple Watch SE 2 (40mm)' },
    // Apple Watch Series 7 (2021)
    { value: 'Apple Watch Series 7 (45mm)', label: 'Apple Watch Series 7 (45mm)' },
    { value: 'Apple Watch Series 7 (41mm)', label: 'Apple Watch Series 7 (41mm)' },
    // Apple Watch Series 6 (2020)
    { value: 'Apple Watch Series 6 (44mm)', label: 'Apple Watch Series 6 (44mm)' },
    { value: 'Apple Watch Series 6 (40mm)', label: 'Apple Watch Series 6 (40mm)' },
    // Apple Watch SE 1st gen (2020)
    { value: 'Apple Watch SE (1st gen, 44mm)', label: 'Apple Watch SE (44mm)' },
    { value: 'Apple Watch SE (1st gen, 40mm)', label: 'Apple Watch SE (40mm)' },
    // Apple Watch Series 5 (2019)
    { value: 'Apple Watch Series 5 (44mm)', label: 'Apple Watch Series 5 (44mm)' },
    { value: 'Apple Watch Series 5 (40mm)', label: 'Apple Watch Series 5 (40mm)' },
    // Apple Watch Series 4 (2018)
    { value: 'Apple Watch Series 4 (44mm)', label: 'Apple Watch Series 4 (44mm)' },
    { value: 'Apple Watch Series 4 (40mm)', label: 'Apple Watch Series 4 (40mm)' },
    // Apple Watch Series 3 (2017)
    { value: 'Apple Watch Series 3 (42mm)', label: 'Apple Watch Series 3 (42mm)' },
    { value: 'Apple Watch Series 3 (38mm)', label: 'Apple Watch Series 3 (38mm)' },
    // Apple Watch Series 2 (2016)
    { value: 'Apple Watch Series 2 (42mm)', label: 'Apple Watch Series 2 (42mm)' },
    { value: 'Apple Watch Series 2 (38mm)', label: 'Apple Watch Series 2 (38mm)' },
    // Apple Watch Series 1 (2016)
    { value: 'Apple Watch Series 1 (42mm)', label: 'Apple Watch Series 1 (42mm)' },
    { value: 'Apple Watch Series 1 (38mm)', label: 'Apple Watch Series 1 (38mm)' },
    // Apple Watch 1st gen (2015)
    { value: 'Apple Watch (1st gen, 42mm)', label: 'Apple Watch (1st gen, 42mm)' },
    { value: 'Apple Watch (1st gen, 38mm)', label: 'Apple Watch (1st gen, 38mm)' },
  ],
  AIRPODS: [
    // AirPods Pro 3 (2025)
    { value: 'AirPods Pro 3', label: 'AirPods Pro 3' },
    // AirPods 4 (2024)
    { value: 'AirPods 4 (ANC)', label: 'AirPods 4 (Active Noise Cancellation)' },
    { value: 'AirPods 4', label: 'AirPods 4' },
    // AirPods Max (2024)
    { value: 'AirPods Max (USB-C)', label: 'AirPods Max (USB-C)' },
    // AirPods Pro 2 (2022-2023)
    { value: 'AirPods Pro 2 (USB-C)', label: 'AirPods Pro 2 (USB-C)' },
    { value: 'AirPods Pro 2 (Lightning)', label: 'AirPods Pro 2 (Lightning)' },
    // AirPods (3rd gen) (2021)
    { value: 'AirPods (3rd gen)', label: 'AirPods (3rd gen)' },
    // AirPods Max (2020)
    { value: 'AirPods Max', label: 'AirPods Max' },
    // AirPods Pro (1st gen) (2019)
    { value: 'AirPods Pro (1st gen)', label: 'AirPods Pro (1st gen)' },
    // AirPods (2nd gen) (2019)
    { value: 'AirPods (2nd gen)', label: 'AirPods (2nd gen)' },
    // AirPods (1st gen) (2016)
    { value: 'AirPods (1st gen)', label: 'AirPods (1st gen)' },
  ],
  APPLE_TV: [
    { value: 'Apple TV 4K (3rd gen)', label: 'Apple TV 4K (3rd gen, 2022)' },
    { value: 'Apple TV 4K (2nd gen)', label: 'Apple TV 4K (2nd gen, 2021)' },
    { value: 'Apple TV 4K (1st gen)', label: 'Apple TV 4K (1st gen, 2017)' },
    { value: 'Apple TV HD', label: 'Apple TV HD (2015)' },
    { value: 'Apple TV (3rd gen)', label: 'Apple TV (3rd gen, 2012)' },
    { value: 'Apple TV (2nd gen)', label: 'Apple TV (2nd gen, 2010)' },
  ],
  HOMEPOD: [
    { value: 'HomePod (2nd gen)', label: 'HomePod (2nd gen, 2023)' },
    { value: 'HomePod mini', label: 'HomePod mini' },
    { value: 'HomePod (1st gen)', label: 'HomePod (1st gen, 2018)' },
  ],
  IPOD: [
    { value: 'iPod touch (7th gen)', label: 'iPod touch (7th gen, 2019)' },
    { value: 'iPod touch (6th gen)', label: 'iPod touch (6th gen, 2015)' },
    { value: 'iPod touch (5th gen)', label: 'iPod touch (5th gen, 2012)' },
    { value: 'iPod touch (4th gen)', label: 'iPod touch (4th gen, 2010)' },
    { value: 'iPod nano (7th gen)', label: 'iPod nano (7th gen, 2012)' },
    { value: 'iPod nano (6th gen)', label: 'iPod nano (6th gen, 2010)' },
    { value: 'iPod shuffle (4th gen)', label: 'iPod shuffle (4th gen, 2010)' },
  ],
  VISION_PRO: [
    { value: 'Apple Vision Pro', label: 'Apple Vision Pro' },
  ],
}

// Conditions
export const conditions = [
  { value: 'NEW', label: 'New' },
  { value: 'LIKE_NEW', label: 'Like New' },
  { value: 'EXCELLENT', label: 'Excellent' },
  { value: 'GOOD', label: 'Good' },
  { value: 'FAIR', label: 'Fair' },
  { value: 'POOR', label: 'Poor' },
  { value: 'FOR_PARTS', label: 'For Parts' },
] as const

export const conditionLabels: Record<string, string> = Object.fromEntries(
  conditions.map((c) => [c.value, c.label])
)

export function getConditionLabel(value: string): string {
  return conditionLabels[value] || value
}

// Storage options
export const storageOptions = [
  { value: 8, label: '8GB' },
  { value: 16, label: '16GB' },
  { value: 32, label: '32GB' },
  { value: 64, label: '64GB' },
  { value: 128, label: '128GB' },
  { value: 256, label: '256GB' },
  { value: 512, label: '512GB' },
  { value: 1024, label: '1TB' },
  { value: 2048, label: '2TB' },
  { value: 4096, label: '4TB' },
  { value: 8192, label: '8TB' },
] as const

// iOS versions
export const iosVersions = [
  { value: '18', label: 'iOS 18' },
  { value: '17', label: 'iOS 17' },
  { value: '16', label: 'iOS 16' },
  { value: '15', label: 'iOS 15' },
  { value: '14', label: 'iOS 14' },
  { value: '13', label: 'iOS 13' },
  { value: '12', label: 'iOS 12' },
  { value: '11', label: 'iOS 11' },
  { value: '10', label: 'iOS 10' },
  { value: '9', label: 'iOS 9 & below' },
] as const

// Jailbreak statuses for filters (simplified to 2 options)
export const jailbreakStatuses = [
  { value: 'JAILBREAKABLE', label: 'Jailbreakable' },
  { value: 'STOCK', label: 'Stock' },
] as const

// Map filter values to actual database values
export const jailbreakFilterValues: Record<string, string[]> = {
  JAILBREAKABLE: ['JAILBROKEN', 'JAILBREAKABLE', 'ROOTLESS_JB', 'ROOTFUL_JB'],
  STOCK: ['NOT_JAILBROKEN'],
}

export const jailbreakStatusLabels: Record<string, string> = {
  JAILBROKEN: 'Jailbreakable',
  JAILBREAKABLE: 'Jailbreakable',
  ROOTLESS_JB: 'Jailbreakable',
  ROOTFUL_JB: 'Jailbreakable',
  NOT_JAILBROKEN: 'Stock',
  STOCK: 'Stock',
  UNKNOWN: 'Unknown',
}

export function getJailbreakStatusLabel(value: string): string {
  return jailbreakStatusLabels[value] || value.replace(/_/g, ' ')
}
