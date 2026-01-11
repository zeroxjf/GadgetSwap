import { NextRequest, NextResponse } from 'next/server'

/**
 * Simple in-memory rate limiter for serverless
 *
 * IMPORTANT LIMITATION: This in-memory rate limiter does NOT work reliably
 * in serverless environments (Vercel, AWS Lambda, etc.) because:
 * 1. Each serverless instance has its own memory space
 * 2. Instances can be created/destroyed at any time
 * 3. Requests may hit different instances, bypassing the limit
 *
 * For production at scale, replace with Redis-based rate limiting:
 * - Upstash Redis (recommended for Vercel): https://upstash.com/
 * - @upstash/ratelimit package provides drop-in replacement
 *
 * Current implementation is acceptable for:
 * - Development/testing
 * - Low-traffic production (single instance)
 * - Basic abuse prevention (not security-critical rate limiting)
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
