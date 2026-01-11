import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

/**
 * ============================================================================
 * SERVERLESS RATE LIMITER WITH DATABASE FALLBACK
 * ============================================================================
 *
 * IMPORTANT: This rate limiter uses BOTH in-memory and database-backed storage.
 *
 * IN-MEMORY LIMITATIONS (still applies for first-line defense):
 * - Each serverless instance has its own memory space
 * - Instances can be created/destroyed at any time
 * - Requests may hit different instances, bypassing the in-memory limit
 *
 * DATABASE FALLBACK (provides cross-instance rate limiting):
 * - Checks database for rate limit records across all instances
 * - Use checkRateLimitWithDb() for security-critical endpoints
 * - Has slight performance overhead but ensures global rate limiting
 *
 * For optimal production at scale, consider Redis-based rate limiting:
 * - Upstash Redis (recommended for Vercel): https://upstash.com/
 * - @upstash/ratelimit package provides drop-in replacement
 * ============================================================================
 */

interface RateLimitEntry {
  count: number
  resetAt: number
}

// In-memory store (shared within same serverless instance)
const rateLimitStore = new Map<string, RateLimitEntry>()

// Clean up old entries periodically
setInterval(() => {
  const now = Date.now()
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetAt < now) {
      rateLimitStore.delete(key)
    }
  }
}, 60000) // Clean every minute

interface RateLimitConfig {
  limit: number        // Max requests
  windowMs: number     // Time window in milliseconds
  keyPrefix?: string   // Prefix for the rate limit key
}

/**
 * Get client IP from request
 */
function getClientIP(request: NextRequest): string {
  // Vercel/Cloudflare headers
  const forwarded = request.headers.get('x-forwarded-for')
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  // Fallback
  return 'unknown'
}

/**
 * Check rate limit and return result
 */
export function checkRateLimit(
  request: NextRequest,
  config: RateLimitConfig
): { success: boolean; remaining: number; resetIn: number } {
  const ip = getClientIP(request)
  const key = `${config.keyPrefix || 'rl'}:${ip}`
  const now = Date.now()

  const entry = rateLimitStore.get(key)

  if (!entry || entry.resetAt < now) {
    // First request or window expired
    rateLimitStore.set(key, {
      count: 1,
      resetAt: now + config.windowMs,
    })
    return {
      success: true,
      remaining: config.limit - 1,
      resetIn: config.windowMs,
    }
  }

  if (entry.count >= config.limit) {
    // Rate limited
    return {
      success: false,
      remaining: 0,
      resetIn: entry.resetAt - now,
    }
  }

  // Increment counter
  entry.count++
  rateLimitStore.set(key, entry)

  return {
    success: true,
    remaining: config.limit - entry.count,
    resetIn: entry.resetAt - now,
  }
}

/**
 * Rate limit response helper
 */
export function rateLimitResponse(resetIn: number): NextResponse {
  const retryAfter = Math.ceil(resetIn / 1000)
  return NextResponse.json(
    {
      error: 'Too many requests. Please try again later.',
      retryAfter,
    },
    {
      status: 429,
      headers: {
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Remaining': '0',
      },
    }
  )
}

/**
 * Pre-configured rate limiters for common use cases
 */
export const rateLimits = {
  // Auth endpoints - strict
  register: { limit: 5, windowMs: 60 * 60 * 1000, keyPrefix: 'register' },      // 5 per hour
  forgotPassword: { limit: 3, windowMs: 60 * 60 * 1000, keyPrefix: 'forgot' },  // 3 per hour
  login: { limit: 10, windowMs: 15 * 60 * 1000, keyPrefix: 'login' },           // 10 per 15 min

  // API endpoints - moderate
  messages: { limit: 30, windowMs: 60 * 1000, keyPrefix: 'msg' },               // 30 per minute
  checkout: { limit: 10, windowMs: 60 * 1000, keyPrefix: 'checkout' },          // 10 per minute
  support: { limit: 5, windowMs: 60 * 1000, keyPrefix: 'support' },             // 5 per minute

  // General API - lenient
  api: { limit: 100, windowMs: 60 * 1000, keyPrefix: 'api' },                   // 100 per minute
}

/**
 * Database-backed rate limit check for security-critical endpoints
 * This provides cross-instance rate limiting in serverless environments
 *
 * USAGE: Use this for auth endpoints, password reset, etc. where
 * in-memory rate limiting is insufficient.
 */
export async function checkRateLimitWithDb(
  request: NextRequest,
  config: RateLimitConfig
): Promise<{ success: boolean; remaining: number; resetIn: number }> {
  const ip = getClientIP(request)
  const key = `${config.keyPrefix || 'rl'}:${ip}`
  const now = new Date()
  const resetAt = new Date(now.getTime() + config.windowMs)

  try {
    // First, clean up expired entries (fire and forget)
    prisma.rateLimit.deleteMany({
      where: { resetAt: { lt: now } }
    }).catch(() => {}) // Ignore cleanup errors

    // Try to find or create rate limit entry atomically
    const existing = await prisma.rateLimit.findUnique({
      where: { key }
    })

    if (!existing || existing.resetAt < now) {
      // Create new entry or reset expired one
      await prisma.rateLimit.upsert({
        where: { key },
        update: { count: 1, resetAt },
        create: { key, count: 1, resetAt }
      })
      return {
        success: true,
        remaining: config.limit - 1,
        resetIn: config.windowMs,
      }
    }

    if (existing.count >= config.limit) {
      // Rate limited
      return {
        success: false,
        remaining: 0,
        resetIn: existing.resetAt.getTime() - now.getTime(),
      }
    }

    // Increment counter
    await prisma.rateLimit.update({
      where: { key },
      data: { count: { increment: 1 } }
    })

    return {
      success: true,
      remaining: config.limit - existing.count - 1,
      resetIn: existing.resetAt.getTime() - now.getTime(),
    }
  } catch (error) {
    // If database fails, fall back to in-memory check
    console.error('Database rate limit check failed, falling back to in-memory:', error)
    return checkRateLimit(request, config)
  }
}
