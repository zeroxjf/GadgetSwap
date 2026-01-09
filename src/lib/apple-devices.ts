/**
 * Comprehensive Apple Device Database
 * Includes all iPhones, iPads, iPod touches with model identifiers
 * Accounts for hardware revisions and variants
 */

export interface AppleDevice {
  name: string              // Display name
  identifier: string[]      // Internal identifiers (e.g., iPhone1,1)
  modelNumbers: string[]    // Model numbers (e.g., A1203)
  chip: string              // SoC chip
  releaseYear: number
  storageOptions: number[]  // GB
  hasBootromExploit: boolean
  notes?: string
}

// ===========================================
// iPHONE DEVICES
// ===========================================

export const IPHONE_DEVICES: AppleDevice[] = [
  // iPhone 17 series (2025) - Placeholder for future
  {
    name: 'iPhone 17 Pro Max',
    identifier: ['iPhone18,1'],
    modelNumbers: [],
    chip: 'A19',
    releaseYear: 2025,
    storageOptions: [256, 512, 1024, 2048],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 17 Pro',
    identifier: ['iPhone18,2'],
    modelNumbers: [],
    chip: 'A19',
    releaseYear: 2025,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 17 Plus',
    identifier: ['iPhone18,3'],
    modelNumbers: [],
    chip: 'A19',
    releaseYear: 2025,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 17',
    identifier: ['iPhone18,4'],
    modelNumbers: [],
    chip: 'A19',
    releaseYear: 2025,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },

  // iPhone 16 series (2024)
  {
    name: 'iPhone 16 Pro Max',
    identifier: ['iPhone17,2'],
    modelNumbers: ['A3094', 'A3095', 'A3096'],
    chip: 'A18',
    releaseYear: 2024,
    storageOptions: [256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 16 Pro',
    identifier: ['iPhone17,1'],
    modelNumbers: ['A3091', 'A3092', 'A3093'],
    chip: 'A18',
    releaseYear: 2024,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 16 Plus',
    identifier: ['iPhone17,4'],
    modelNumbers: ['A3088', 'A3089', 'A3090'],
    chip: 'A18',
    releaseYear: 2024,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 16',
    identifier: ['iPhone17,3'],
    modelNumbers: ['A3085', 'A3086', 'A3087'],
    chip: 'A18',
    releaseYear: 2024,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },

  // iPhone 15 series (2023)
  {
    name: 'iPhone 15 Pro Max',
    identifier: ['iPhone16,2'],
    modelNumbers: ['A2849', 'A3105', 'A3106', 'A3108'],
    chip: 'A17',
    releaseYear: 2023,
    storageOptions: [256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 15 Pro',
    identifier: ['iPhone16,1'],
    modelNumbers: ['A2848', 'A3101', 'A3102', 'A3104'],
    chip: 'A17',
    releaseYear: 2023,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 15 Plus',
    identifier: ['iPhone15,5'],
    modelNumbers: ['A2847', 'A3093', 'A3094', 'A3096'],
    chip: 'A16',
    releaseYear: 2023,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 15',
    identifier: ['iPhone15,4'],
    modelNumbers: ['A2846', 'A3089', 'A3090', 'A3092'],
    chip: 'A16',
    releaseYear: 2023,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },

  // iPhone 14 series (2022)
  {
    name: 'iPhone 14 Pro Max',
    identifier: ['iPhone15,3'],
    modelNumbers: ['A2651', 'A2893', 'A2894', 'A2896'],
    chip: 'A16',
    releaseYear: 2022,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 14 Pro',
    identifier: ['iPhone15,2'],
    modelNumbers: ['A2650', 'A2889', 'A2890', 'A2892'],
    chip: 'A16',
    releaseYear: 2022,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 14 Plus',
    identifier: ['iPhone14,8'],
    modelNumbers: ['A2632', 'A2885', 'A2886', 'A2888'],
    chip: 'A15',
    releaseYear: 2022,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 14',
    identifier: ['iPhone14,7'],
    modelNumbers: ['A2649', 'A2881', 'A2882', 'A2884'],
    chip: 'A15',
    releaseYear: 2022,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },

  // iPhone 13 series (2021)
  {
    name: 'iPhone 13 Pro Max',
    identifier: ['iPhone14,3'],
    modelNumbers: ['A2643', 'A2484', 'A2641', 'A2644'],
    chip: 'A15',
    releaseYear: 2021,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 13 Pro',
    identifier: ['iPhone14,2'],
    modelNumbers: ['A2636', 'A2483', 'A2634', 'A2640'],
    chip: 'A15',
    releaseYear: 2021,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 13',
    identifier: ['iPhone14,5'],
    modelNumbers: ['A2631', 'A2482', 'A2633', 'A2634'],
    chip: 'A15',
    releaseYear: 2021,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 13 mini',
    identifier: ['iPhone14,4'],
    modelNumbers: ['A2628', 'A2481', 'A2626', 'A2629'],
    chip: 'A15',
    releaseYear: 2021,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },

  // iPhone 12 series (2020)
  {
    name: 'iPhone 12 Pro Max',
    identifier: ['iPhone13,4'],
    modelNumbers: ['A2342', 'A2410', 'A2411', 'A2412'],
    chip: 'A14',
    releaseYear: 2020,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 12 Pro',
    identifier: ['iPhone13,3'],
    modelNumbers: ['A2341', 'A2406', 'A2407', 'A2408'],
    chip: 'A14',
    releaseYear: 2020,
    storageOptions: [128, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 12',
    identifier: ['iPhone13,2'],
    modelNumbers: ['A2172', 'A2402', 'A2403', 'A2404'],
    chip: 'A14',
    releaseYear: 2020,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 12 mini',
    identifier: ['iPhone13,1'],
    modelNumbers: ['A2176', 'A2398', 'A2399', 'A2400'],
    chip: 'A14',
    releaseYear: 2020,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },

  // iPhone 11 series (2019)
  {
    name: 'iPhone 11 Pro Max',
    identifier: ['iPhone12,5'],
    modelNumbers: ['A2161', 'A2218', 'A2220'],
    chip: 'A13',
    releaseYear: 2019,
    storageOptions: [64, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 11 Pro',
    identifier: ['iPhone12,3'],
    modelNumbers: ['A2160', 'A2215', 'A2217'],
    chip: 'A13',
    releaseYear: 2019,
    storageOptions: [64, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone 11',
    identifier: ['iPhone12,1'],
    modelNumbers: ['A2111', 'A2221', 'A2223'],
    chip: 'A13',
    releaseYear: 2019,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },

  // iPhone XS/XR series (2018)
  {
    name: 'iPhone XS Max',
    identifier: ['iPhone11,4', 'iPhone11,6'],
    modelNumbers: ['A1921', 'A2101', 'A2102', 'A2104'],
    chip: 'A12',
    releaseYear: 2018,
    storageOptions: [64, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone XS',
    identifier: ['iPhone11,2'],
    modelNumbers: ['A1920', 'A2097', 'A2098', 'A2100'],
    chip: 'A12',
    releaseYear: 2018,
    storageOptions: [64, 256, 512],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone XR',
    identifier: ['iPhone11,8'],
    modelNumbers: ['A1984', 'A2105', 'A2106', 'A2108'],
    chip: 'A12',
    releaseYear: 2018,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },

  // iPhone X (2017)
  {
    name: 'iPhone X',
    identifier: ['iPhone10,3', 'iPhone10,6'],
    modelNumbers: ['A1865', 'A1901', 'A1902'],
    chip: 'A11',
    releaseYear: 2017,
    storageOptions: [64, 256],
    hasBootromExploit: true,
  },

  // iPhone 8 series (2017)
  {
    name: 'iPhone 8 Plus',
    identifier: ['iPhone10,2', 'iPhone10,5'],
    modelNumbers: ['A1864', 'A1897', 'A1898'],
    chip: 'A11',
    releaseYear: 2017,
    storageOptions: [64, 128, 256],
    hasBootromExploit: true,
  },
  {
    name: 'iPhone 8',
    identifier: ['iPhone10,1', 'iPhone10,4'],
    modelNumbers: ['A1863', 'A1905', 'A1906'],
    chip: 'A11',
    releaseYear: 2017,
    storageOptions: [64, 128, 256],
    hasBootromExploit: true,
  },

  // iPhone 7 series (2016)
  {
    name: 'iPhone 7 Plus',
    identifier: ['iPhone9,2', 'iPhone9,4'],
    modelNumbers: ['A1661', 'A1784', 'A1785'],
    chip: 'A10',
    releaseYear: 2016,
    storageOptions: [32, 128, 256],
    hasBootromExploit: true,
  },
  {
    name: 'iPhone 7',
    identifier: ['iPhone9,1', 'iPhone9,3'],
    modelNumbers: ['A1660', 'A1778', 'A1779'],
    chip: 'A10',
    releaseYear: 2016,
    storageOptions: [32, 128, 256],
    hasBootromExploit: true,
  },

  // iPhone SE series
  {
    name: 'iPhone SE (3rd generation)',
    identifier: ['iPhone14,6'],
    modelNumbers: ['A2595', 'A2782', 'A2783', 'A2784', 'A2785'],
    chip: 'A15',
    releaseYear: 2022,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone SE (2nd generation)',
    identifier: ['iPhone12,8'],
    modelNumbers: ['A2275', 'A2296', 'A2298'],
    chip: 'A13',
    releaseYear: 2020,
    storageOptions: [64, 128, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPhone SE (1st generation)',
    identifier: ['iPhone8,4'],
    modelNumbers: ['A1662', 'A1723', 'A1724'],
    chip: 'A9',
    releaseYear: 2016,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },

  // iPhone 6s series (2015)
  {
    name: 'iPhone 6s Plus',
    identifier: ['iPhone8,2'],
    modelNumbers: ['A1634', 'A1687', 'A1699'],
    chip: 'A9',
    releaseYear: 2015,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPhone 6s',
    identifier: ['iPhone8,1'],
    modelNumbers: ['A1633', 'A1688', 'A1700'],
    chip: 'A9',
    releaseYear: 2015,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },

  // iPhone 6 series (2014)
  {
    name: 'iPhone 6 Plus',
    identifier: ['iPhone7,1'],
    modelNumbers: ['A1522', 'A1524', 'A1593'],
    chip: 'A8',
    releaseYear: 2014,
    storageOptions: [16, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPhone 6',
    identifier: ['iPhone7,2'],
    modelNumbers: ['A1549', 'A1586', 'A1589'],
    chip: 'A8',
    releaseYear: 2014,
    storageOptions: [16, 64, 128],
    hasBootromExploit: true,
  },

  // iPhone 5s (2013)
  {
    name: 'iPhone 5s',
    identifier: ['iPhone6,1', 'iPhone6,2'],
    modelNumbers: ['A1453', 'A1457', 'A1518', 'A1528', 'A1530', 'A1533'],
    chip: 'A7',
    releaseYear: 2013,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
  },

  // iPhone 5c (2013)
  {
    name: 'iPhone 5c',
    identifier: ['iPhone5,3', 'iPhone5,4'],
    modelNumbers: ['A1456', 'A1507', 'A1516', 'A1529', 'A1532'],
    chip: 'A6',
    releaseYear: 2013,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
  },

  // iPhone 5 (2012)
  {
    name: 'iPhone 5',
    identifier: ['iPhone5,1', 'iPhone5,2'],
    modelNumbers: ['A1428', 'A1429', 'A1442'],
    chip: 'A6',
    releaseYear: 2012,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
  },

  // iPhone 4s (2011)
  {
    name: 'iPhone 4s',
    identifier: ['iPhone4,1'],
    modelNumbers: ['A1387', 'A1431'],
    chip: 'A5',
    releaseYear: 2011,
    storageOptions: [8, 16, 32, 64],
    hasBootromExploit: true,
  },

  // iPhone 4 (2010)
  {
    name: 'iPhone 4 (GSM)',
    identifier: ['iPhone3,1', 'iPhone3,2'],
    modelNumbers: ['A1332'],
    chip: 'A4',
    releaseYear: 2010,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
  },
  {
    name: 'iPhone 4 (CDMA)',
    identifier: ['iPhone3,3'],
    modelNumbers: ['A1349'],
    chip: 'A4',
    releaseYear: 2011,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
  },

  // iPhone 3GS (2009)
  {
    name: 'iPhone 3GS',
    identifier: ['iPhone2,1'],
    modelNumbers: ['A1303', 'A1325'],
    chip: 'APL0298',
    releaseYear: 2009,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
    notes: 'Old bootrom (pre-week 35 2009) has extra exploits',
  },

  // iPhone 3G (2008)
  {
    name: 'iPhone 3G',
    identifier: ['iPhone1,2'],
    modelNumbers: ['A1241', 'A1324'],
    chip: 'APL0098',
    releaseYear: 2008,
    storageOptions: [8, 16],
    hasBootromExploit: true,
  },

  // iPhone (1st generation) (2007)
  {
    name: 'iPhone (1st generation)',
    identifier: ['iPhone1,1'],
    modelNumbers: ['A1203'],
    chip: 'APL0098',
    releaseYear: 2007,
    storageOptions: [4, 8, 16],
    hasBootromExploit: true,
    notes: 'Original iPhone, 2G only',
  },
]

// ===========================================
// iPOD TOUCH DEVICES
// ===========================================

export const IPOD_TOUCH_DEVICES: AppleDevice[] = [
  // iPod touch 7th generation (2019)
  {
    name: 'iPod touch (7th generation)',
    identifier: ['iPod9,1'],
    modelNumbers: ['A2178'],
    chip: 'A10',
    releaseYear: 2019,
    storageOptions: [32, 128, 256],
    hasBootromExploit: true,
  },

  // iPod touch 6th generation (2015)
  {
    name: 'iPod touch (6th generation)',
    identifier: ['iPod7,1'],
    modelNumbers: ['A1574'],
    chip: 'A8',
    releaseYear: 2015,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },

  // iPod touch 5th generation (2012)
  {
    name: 'iPod touch (5th generation)',
    identifier: ['iPod5,1'],
    modelNumbers: ['A1421', 'A1509'],
    chip: 'A5',
    releaseYear: 2012,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
    notes: 'A1509 is 16GB only variant without rear camera',
  },

  // iPod touch 4th generation (2010)
  {
    name: 'iPod touch (4th generation)',
    identifier: ['iPod4,1'],
    modelNumbers: ['A1367'],
    chip: 'A4',
    releaseYear: 2010,
    storageOptions: [8, 16, 32, 64],
    hasBootromExploit: true,
  },

  // iPod touch 3rd generation (2009) - Two hardware revisions!
  {
    name: 'iPod touch (3rd generation) 32GB/64GB',
    identifier: ['iPod3,1'],
    modelNumbers: ['A1318'],
    chip: 'APL0298', // Same as iPhone 3GS
    releaseYear: 2009,
    storageOptions: [32, 64],
    hasBootromExploit: true,
    notes: 'True 3rd gen with faster processor, OpenGL ES 2.0',
  },

  // iPod touch 2nd generation (2008) - Multiple hardware revisions!
  {
    name: 'iPod touch (2nd generation) MB model',
    identifier: ['iPod2,1'],
    modelNumbers: ['A1288', 'MB528', 'MB533', 'MB376', 'MB377', 'MB378'],
    chip: 'APL0278',
    releaseYear: 2008,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
    notes: 'Original 2nd gen, has bootrom exploit',
  },
  {
    name: 'iPod touch (2nd generation) MC model',
    identifier: ['iPod2,1'],
    modelNumbers: ['A1288', 'MC086', 'MC008', 'MC011'],
    chip: 'APL0278',
    releaseYear: 2009,
    storageOptions: [8, 32],
    hasBootromExploit: false,
    notes: 'Late 2009 revision with fixed bootrom - NOT exploitable!',
  },

  // iPod touch 1st generation (2007)
  {
    name: 'iPod touch (1st generation)',
    identifier: ['iPod1,1'],
    modelNumbers: ['A1213'],
    chip: 'APL0098',
    releaseYear: 2007,
    storageOptions: [8, 16, 32],
    hasBootromExploit: true,
  },
]

// ===========================================
// iPAD DEVICES
// ===========================================

export const IPAD_DEVICES: AppleDevice[] = [
  // iPad Pro M4 (2024)
  {
    name: 'iPad Pro 13-inch (M4)',
    identifier: ['iPad16,3', 'iPad16,4'],
    modelNumbers: ['A2925', 'A2926', 'A2927', 'A3007'],
    chip: 'M4',
    releaseYear: 2024,
    storageOptions: [256, 512, 1024, 2048],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Pro 11-inch (M4)',
    identifier: ['iPad16,1', 'iPad16,2'],
    modelNumbers: ['A2921', 'A2922', 'A2923', 'A3006'],
    chip: 'M4',
    releaseYear: 2024,
    storageOptions: [256, 512, 1024, 2048],
    hasBootromExploit: false,
  },

  // iPad Pro M2 (2022)
  {
    name: 'iPad Pro 12.9-inch (6th generation)',
    identifier: ['iPad14,5', 'iPad14,6'],
    modelNumbers: ['A2436', 'A2437', 'A2764', 'A2766'],
    chip: 'M2',
    releaseYear: 2022,
    storageOptions: [128, 256, 512, 1024, 2048],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Pro 11-inch (4th generation)',
    identifier: ['iPad14,3', 'iPad14,4'],
    modelNumbers: ['A2759', 'A2761', 'A2435', 'A2762'],
    chip: 'M2',
    releaseYear: 2022,
    storageOptions: [128, 256, 512, 1024, 2048],
    hasBootromExploit: false,
  },

  // iPad Pro M1 (2021)
  {
    name: 'iPad Pro 12.9-inch (5th generation)',
    identifier: ['iPad13,8', 'iPad13,9', 'iPad13,10', 'iPad13,11'],
    modelNumbers: ['A2378', 'A2379', 'A2461', 'A2462'],
    chip: 'M1',
    releaseYear: 2021,
    storageOptions: [128, 256, 512, 1024, 2048],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Pro 11-inch (3rd generation)',
    identifier: ['iPad13,4', 'iPad13,5', 'iPad13,6', 'iPad13,7'],
    modelNumbers: ['A2301', 'A2377', 'A2459', 'A2460'],
    chip: 'M1',
    releaseYear: 2021,
    storageOptions: [128, 256, 512, 1024, 2048],
    hasBootromExploit: false,
  },

  // iPad Pro A12Z (2020)
  {
    name: 'iPad Pro 12.9-inch (4th generation)',
    identifier: ['iPad8,11', 'iPad8,12'],
    modelNumbers: ['A2069', 'A2229', 'A2232', 'A2233'],
    chip: 'A12Z',
    releaseYear: 2020,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Pro 11-inch (2nd generation)',
    identifier: ['iPad8,9', 'iPad8,10'],
    modelNumbers: ['A2068', 'A2228', 'A2230', 'A2231'],
    chip: 'A12Z',
    releaseYear: 2020,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },

  // iPad Pro A12X (2018)
  {
    name: 'iPad Pro 12.9-inch (3rd generation)',
    identifier: ['iPad8,5', 'iPad8,6', 'iPad8,7', 'iPad8,8'],
    modelNumbers: ['A1876', 'A1895', 'A2014', 'A1983'],
    chip: 'A12X',
    releaseYear: 2018,
    storageOptions: [64, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Pro 11-inch (1st generation)',
    identifier: ['iPad8,1', 'iPad8,2', 'iPad8,3', 'iPad8,4'],
    modelNumbers: ['A1980', 'A2013', 'A1934', 'A1979'],
    chip: 'A12X',
    releaseYear: 2018,
    storageOptions: [64, 256, 512, 1024],
    hasBootromExploit: false,
  },

  // iPad Pro A10X (2017)
  {
    name: 'iPad Pro 12.9-inch (2nd generation)',
    identifier: ['iPad7,1', 'iPad7,2'],
    modelNumbers: ['A1670', 'A1671', 'A1821'],
    chip: 'A10X',
    releaseYear: 2017,
    storageOptions: [64, 256, 512],
    hasBootromExploit: true,
  },
  {
    name: 'iPad Pro 10.5-inch',
    identifier: ['iPad7,3', 'iPad7,4'],
    modelNumbers: ['A1701', 'A1709', 'A1852'],
    chip: 'A10X',
    releaseYear: 2017,
    storageOptions: [64, 256, 512],
    hasBootromExploit: true,
  },

  // iPad Pro A9X (2015-2016)
  {
    name: 'iPad Pro 12.9-inch (1st generation)',
    identifier: ['iPad6,7', 'iPad6,8'],
    modelNumbers: ['A1584', 'A1652'],
    chip: 'A9X',
    releaseYear: 2015,
    storageOptions: [32, 128, 256],
    hasBootromExploit: true,
  },
  {
    name: 'iPad Pro 9.7-inch',
    identifier: ['iPad6,3', 'iPad6,4'],
    modelNumbers: ['A1673', 'A1674', 'A1675'],
    chip: 'A9X',
    releaseYear: 2016,
    storageOptions: [32, 128, 256],
    hasBootromExploit: true,
  },

  // iPad Air series
  {
    name: 'iPad Air 13-inch (M2)',
    identifier: ['iPad14,10', 'iPad14,11'],
    modelNumbers: ['A2898', 'A2899', 'A2900', 'A3008'],
    chip: 'M2',
    releaseYear: 2024,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Air 11-inch (M2)',
    identifier: ['iPad14,8', 'iPad14,9'],
    modelNumbers: ['A2902', 'A2903', 'A2904', 'A3009'],
    chip: 'M2',
    releaseYear: 2024,
    storageOptions: [128, 256, 512, 1024],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Air (5th generation)',
    identifier: ['iPad13,16', 'iPad13,17'],
    modelNumbers: ['A2588', 'A2589', 'A2591'],
    chip: 'M1',
    releaseYear: 2022,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Air (4th generation)',
    identifier: ['iPad13,1', 'iPad13,2'],
    modelNumbers: ['A2316', 'A2324', 'A2325', 'A2072'],
    chip: 'A14',
    releaseYear: 2020,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Air (3rd generation)',
    identifier: ['iPad11,3', 'iPad11,4'],
    modelNumbers: ['A2152', 'A2123', 'A2153', 'A2154'],
    chip: 'A12',
    releaseYear: 2019,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad Air 2',
    identifier: ['iPad5,3', 'iPad5,4'],
    modelNumbers: ['A1566', 'A1567'],
    chip: 'A8X',
    releaseYear: 2014,
    storageOptions: [16, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad Air (1st generation)',
    identifier: ['iPad4,1', 'iPad4,2', 'iPad4,3'],
    modelNumbers: ['A1474', 'A1475', 'A1476'],
    chip: 'A7',
    releaseYear: 2013,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },

  // iPad (standard) series
  {
    name: 'iPad (10th generation)',
    identifier: ['iPad13,18', 'iPad13,19'],
    modelNumbers: ['A2696', 'A2757', 'A2777'],
    chip: 'A14',
    releaseYear: 2022,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad (9th generation)',
    identifier: ['iPad12,1', 'iPad12,2'],
    modelNumbers: ['A2602', 'A2603', 'A2604', 'A2605'],
    chip: 'A13',
    releaseYear: 2021,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad (8th generation)',
    identifier: ['iPad11,6', 'iPad11,7'],
    modelNumbers: ['A2270', 'A2428', 'A2429', 'A2430'],
    chip: 'A12',
    releaseYear: 2020,
    storageOptions: [32, 128],
    hasBootromExploit: false,
  },
  {
    name: 'iPad (7th generation)',
    identifier: ['iPad7,11', 'iPad7,12'],
    modelNumbers: ['A2197', 'A2198', 'A2200'],
    chip: 'A10',
    releaseYear: 2019,
    storageOptions: [32, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad (6th generation)',
    identifier: ['iPad7,5', 'iPad7,6'],
    modelNumbers: ['A1893', 'A1954'],
    chip: 'A10',
    releaseYear: 2018,
    storageOptions: [32, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad (5th generation)',
    identifier: ['iPad6,11', 'iPad6,12'],
    modelNumbers: ['A1822', 'A1823'],
    chip: 'A9',
    releaseYear: 2017,
    storageOptions: [32, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad (4th generation)',
    identifier: ['iPad3,4', 'iPad3,5', 'iPad3,6'],
    modelNumbers: ['A1458', 'A1459', 'A1460'],
    chip: 'A6X',
    releaseYear: 2012,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad (3rd generation)',
    identifier: ['iPad3,1', 'iPad3,2', 'iPad3,3'],
    modelNumbers: ['A1416', 'A1430', 'A1403'],
    chip: 'A5X',
    releaseYear: 2012,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
    notes: 'First Retina iPad',
  },
  {
    name: 'iPad 2',
    identifier: ['iPad2,1', 'iPad2,2', 'iPad2,3', 'iPad2,4'],
    modelNumbers: ['A1395', 'A1396', 'A1397'],
    chip: 'A5',
    releaseYear: 2011,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
    notes: 'iPad2,4 is 32nm A5 revision (2012)',
  },
  {
    name: 'iPad (1st generation)',
    identifier: ['iPad1,1'],
    modelNumbers: ['A1219', 'A1337'],
    chip: 'A4',
    releaseYear: 2010,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
  },

  // iPad mini series
  {
    name: 'iPad mini (6th generation)',
    identifier: ['iPad14,1', 'iPad14,2'],
    modelNumbers: ['A2567', 'A2568', 'A2569'],
    chip: 'A15',
    releaseYear: 2021,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad mini (5th generation)',
    identifier: ['iPad11,1', 'iPad11,2'],
    modelNumbers: ['A2133', 'A2124', 'A2126', 'A2125'],
    chip: 'A12',
    releaseYear: 2019,
    storageOptions: [64, 256],
    hasBootromExploit: false,
  },
  {
    name: 'iPad mini 4',
    identifier: ['iPad5,1', 'iPad5,2'],
    modelNumbers: ['A1538', 'A1550'],
    chip: 'A8',
    releaseYear: 2015,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad mini 3',
    identifier: ['iPad4,7', 'iPad4,8', 'iPad4,9'],
    modelNumbers: ['A1599', 'A1600'],
    chip: 'A7',
    releaseYear: 2014,
    storageOptions: [16, 64, 128],
    hasBootromExploit: true,
  },
  {
    name: 'iPad mini 2',
    identifier: ['iPad4,4', 'iPad4,5', 'iPad4,6'],
    modelNumbers: ['A1489', 'A1490', 'A1491'],
    chip: 'A7',
    releaseYear: 2013,
    storageOptions: [16, 32, 64, 128],
    hasBootromExploit: true,
    notes: 'First Retina iPad mini',
  },
  {
    name: 'iPad mini (1st generation)',
    identifier: ['iPad2,5', 'iPad2,6', 'iPad2,7'],
    modelNumbers: ['A1432', 'A1454', 'A1455'],
    chip: 'A5',
    releaseYear: 2012,
    storageOptions: [16, 32, 64],
    hasBootromExploit: true,
  },
]

// ===========================================
// HELPER FUNCTIONS
// ===========================================

/**
 * Get all devices in a single array
 */
export function getAllDevices(): AppleDevice[] {
  return [...IPHONE_DEVICES, ...IPOD_TOUCH_DEVICES, ...IPAD_DEVICES]
}

/**
 * Find device by name (fuzzy match)
 */
export function findDeviceByName(name: string): AppleDevice | undefined {
  const normalized = normalizeDeviceName(name)
  return getAllDevices().find(d => normalizeDeviceName(d.name) === normalized)
}

/**
 * Find device by model number
 */
export function findDeviceByModelNumber(modelNumber: string): AppleDevice | undefined {
  const upper = modelNumber.toUpperCase()
  return getAllDevices().find(d => d.modelNumbers.some(m => m.toUpperCase() === upper))
}

/**
 * Find device by identifier
 */
export function findDeviceByIdentifier(identifier: string): AppleDevice | undefined {
  return getAllDevices().find(d => d.identifier.includes(identifier))
}

/**
 * Normalize device name for comparison
 */
export function normalizeDeviceName(name: string): string {
  return name
    .toLowerCase()
    .replace(/^apple\s+/i, '')
    .replace(/\s+/g, ' ')
    .replace(/\((\d+)(st|nd|rd|th)\s+gen(eration)?\)/gi, '($1 generation)')
    .replace(/(\d+)\s*gen/gi, '$1 generation')
    .trim()
}

/**
 * Get chip for device
 */
export function getChipForDevice(deviceName: string): string | null {
  const device = findDeviceByName(deviceName)
  return device?.chip || null
}

/**
 * Check if device has bootrom exploit
 */
export function deviceHasBootromExploit(deviceName: string): boolean {
  const device = findDeviceByName(deviceName)
  return device?.hasBootromExploit || false
}

/**
 * Get storage options for device
 */
export function getStorageOptionsForDevice(deviceName: string): number[] {
  const device = findDeviceByName(deviceName)
  return device?.storageOptions || []
}
