// Re-export Prisma types for convenience
export type {
  User,
  Listing,
  Transaction,
  Message,
  Review,
  Notification,
  MarketRate,
  JailbreakInfo,
} from '@prisma/client'

// Enums (mirror Prisma for client-side use)
export enum DeviceType {
  IPHONE = 'IPHONE',
  IPAD = 'IPAD',
  MACBOOK = 'MACBOOK',
  MAC_MINI = 'MAC_MINI',
  MAC_STUDIO = 'MAC_STUDIO',
  MAC_PRO = 'MAC_PRO',
  IMAC = 'IMAC',
  APPLE_WATCH = 'APPLE_WATCH',
  APPLE_TV = 'APPLE_TV',
  AIRPODS = 'AIRPODS',
  ACCESSORIES = 'ACCESSORIES',
}

export enum DeviceCondition {
  NEW = 'NEW',
  LIKE_NEW = 'LIKE_NEW',
  EXCELLENT = 'EXCELLENT',
  GOOD = 'GOOD',
  FAIR = 'FAIR',
  POOR = 'POOR',
  FOR_PARTS = 'FOR_PARTS',
}

export enum JailbreakStatus {
  UNKNOWN = 'UNKNOWN',
  NOT_JAILBROKEN = 'NOT_JAILBROKEN',
  JAILBROKEN = 'JAILBROKEN',
  JAILBREAKABLE = 'JAILBREAKABLE',
  ROOTLESS_JB = 'ROOTLESS_JB',
  ROOTFUL_JB = 'ROOTFUL_JB',
}

export enum SubscriptionTier {
  FREE = 'FREE',
  PLUS = 'PLUS',
  PRO = 'PRO',
}

export enum ListingStatus {
  DRAFT = 'DRAFT',
  ACTIVE = 'ACTIVE',
  PENDING = 'PENDING',
  SOLD = 'SOLD',
  EXPIRED = 'EXPIRED',
  REMOVED = 'REMOVED',
}

// Frontend-specific types
export interface ListingWithSeller {
  id: string
  title: string
  description: string
  price: number
  condition: DeviceCondition
  status: ListingStatus
  views: number
  featured: boolean
  deviceType: DeviceType
  deviceModel: string
  storageGB: number | null
  color: string | null
  carrier: string | null
  osVersion: string | null
  buildNumber: string | null
  jailbreakStatus: JailbreakStatus
  jailbreakTool: string | null
  bootromExploit: boolean | null
  batteryHealth: number | null
  screenReplaced: boolean | null
  originalParts: boolean | null
  imeiClean: boolean | null
  icloudUnlocked: boolean
  images: ListingImage[]
  createdAt: Date
  updatedAt: Date
  seller: {
    id: string
    name: string | null
    username: string | null
    image: string | null
    rating: number
    ratingCount: number
    totalSales: number
  }
}

export interface ListingImage {
  id: string
  url: string
  order: number
}

export interface SearchFilters {
  query?: string
  deviceType?: DeviceType
  deviceModel?: string
  minPrice?: number
  maxPrice?: number
  condition?: DeviceCondition[]
  osVersion?: string
  osVersionMin?: string
  osVersionMax?: string
  jailbreakStatus?: JailbreakStatus[]
  storageGB?: number[]
  carrier?: string
  bootromExploit?: boolean
  sortBy?: 'price_asc' | 'price_desc' | 'newest' | 'oldest' | 'popular'
}

export interface SubscriptionPlanInfo {
  id: string
  name: string
  tier: SubscriptionTier
  price: number
  yearlyPrice: number | null
  maxActiveListings: number
  transactionFeePercent: number
  featuredListings: number
  analyticsAccess: boolean
  prioritySupport: boolean
  earlyAccessDeals: boolean
  bulkListingTools: boolean
}

export interface MarketInsight {
  deviceModel: string
  avgPrice: number
  minPrice: number
  maxPrice: number
  priceByCondition: Record<DeviceCondition, number>
  priceByStorage: Record<number, number>
  iosVersionPremiums: Record<string, number>
  recentSales: number
  demandTrend: 'rising' | 'stable' | 'falling'
}

export interface JailbreakCompatibility {
  osVersion: string
  isJailbreakable: boolean
  tools: {
    name: string
    type: string
    requiresBootrom: boolean
    url: string | null
  }[]
}

// API Response types
export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
  message?: string
}

export interface PaginatedResponse<T> {
  items: T[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}
