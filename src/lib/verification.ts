import { prisma } from './prisma'

// Alphabet for verification codes
// Excludes I, O, 0, 1 to avoid confusion in handwritten notes
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

// In-memory store for pending verification codes with expiration
// Format: { code: { userId, expiresAt } }
// SECURITY: Codes expire after 1 hour to prevent reuse attacks
//
// LIMITATION: This in-memory store does NOT work reliably in serverless environments
// (Vercel, AWS Lambda, etc.) because each instance has its own memory space.
// For production at scale, migrate to database-backed verification codes:
// - Create a VerificationCode table with userId, code, expiresAt, usedAt columns
// - Use database transactions to prevent race conditions
// - This ensures codes persist across serverless instances and server restarts
const pendingVerificationCodes = new Map<string, { userId: string; expiresAt: Date }>()

// Clean up expired codes periodically
setInterval(() => {
  const now = new Date()
  for (const [code, data] of pendingVerificationCodes.entries()) {
    if (data.expiresAt < now) {
      pendingVerificationCodes.delete(code)
    }
  }
}, 60000) // Clean every minute

/**
 * Generate a random 6-character verification code
 */
export function generateVerificationCode(): string {
  let code = ''
  for (let i = 0; i < 6; i++) {
    const randomIndex = Math.floor(Math.random() * ALPHABET.length)
    code += ALPHABET[randomIndex]
  }
  return code
}

/**
 * Create a unique verification code that doesn't exist in the database
 * Stores the code with userId and 1-hour expiration to prevent reuse
 * @param userId - The user ID requesting the code
 * @param maxAttempts - Maximum attempts before adding timestamp suffix
 */
export async function createUniqueVerificationCode(
  userId?: string,
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const code = generateVerificationCode()

    // Check if code already exists in any listing
    const existingListing = await prisma.listing.findFirst({
      where: { verificationCode: code },
      select: { id: true },
    })

    // Also check pending codes
    const existingPending = pendingVerificationCodes.has(code)

    if (!existingListing && !existingPending) {
      // Store code with expiration if userId provided
      if (userId) {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration
        pendingVerificationCodes.set(code, { userId, expiresAt })
      }
      return code
    }

    attempts++
  }

  // Fallback: add timestamp suffix to guarantee uniqueness
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase()
  const fallbackCode = `${generateVerificationCode()}${timestamp}`

  // Store fallback code with expiration if userId provided
  if (userId) {
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    pendingVerificationCodes.set(fallbackCode, { userId, expiresAt })
  }

  return fallbackCode
}

/**
 * Validate and consume a verification code for listing creation
 * Returns true if code is valid and matches the user, false otherwise
 */
export function validateVerificationCode(code: string, userId: string): boolean {
  const pending = pendingVerificationCodes.get(code)

  if (!pending) {
    // Code not found in pending - might be already used or never generated
    return false
  }

  // Check expiration
  if (pending.expiresAt < new Date()) {
    pendingVerificationCodes.delete(code)
    return false
  }

  // Check user ownership
  if (pending.userId !== userId) {
    return false
  }

  // Valid - remove from pending so it can't be reused
  pendingVerificationCodes.delete(code)
  return true
}

/**
 * Check if a verification code is available (not expired and not used)
 */
export function isVerificationCodeValid(code: string, userId: string): boolean {
  const pending = pendingVerificationCodes.get(code)

  if (!pending) {
    return false
  }

  return pending.userId === userId && pending.expiresAt >= new Date()
}

/**
 * Validate that a verification code format is correct
 */
export function isValidCodeFormat(code: string): boolean {
  // Should be 6-8 characters (6 base + possible timestamp suffix)
  if (code.length < 6 || code.length > 8) return false

  // Should only contain characters from our alphabet (plus possible digits from timestamp)
  const validChars = ALPHABET + '0189'
  return code
    .toUpperCase()
    .split('')
    .every((char) => validChars.includes(char))
}
