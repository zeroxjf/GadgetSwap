import { prisma } from './prisma'

// Alphabet for verification codes
// Excludes I, O, 0, 1 to avoid confusion in handwritten notes
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

/**
 * ============================================================================
 * DATABASE-BACKED VERIFICATION CODE STORAGE
 * ============================================================================
 *
 * Verification codes are now stored in the PendingVerificationCode table
 * to ensure persistence across serverless instances and server restarts.
 *
 * This solves the reliability issues with in-memory storage in serverless
 * environments where each instance has its own memory space.
 * ============================================================================
 */

/**
 * Clean up expired verification codes from the database
 * Called periodically or before operations
 */
async function cleanupExpiredCodes(): Promise<void> {
  try {
    await prisma.pendingVerificationCode.deleteMany({
      where: { expiresAt: { lt: new Date() } }
    })
  } catch (error) {
    // Log but don't throw - cleanup is best-effort
    console.error('Failed to cleanup expired verification codes:', error)
  }
}

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
  // Clean up expired codes first (best-effort)
  cleanupExpiredCodes().catch(() => {})

  let attempts = 0

  while (attempts < maxAttempts) {
    const code = generateVerificationCode()

    // Check if code already exists in any listing
    const existingListing = await prisma.listing.findFirst({
      where: { verificationCode: code },
      select: { id: true },
    })

    // Also check pending codes in database
    const existingPending = await prisma.pendingVerificationCode.findUnique({
      where: { code },
    })

    if (!existingListing && !existingPending) {
      // Store code with expiration if userId provided
      if (userId) {
        const expiresAt = new Date(Date.now() + 60 * 60 * 1000) // 1 hour expiration
        await prisma.pendingVerificationCode.create({
          data: { code, userId, expiresAt }
        })
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
    await prisma.pendingVerificationCode.create({
      data: { code: fallbackCode, userId, expiresAt }
    })
  }

  return fallbackCode
}

/**
 * Validate and consume a verification code for listing creation
 * Returns true if code is valid and matches the user, false otherwise
 *
 * NOTE: This function is synchronous for backward compatibility.
 * Use validateVerificationCodeAsync for the database-backed version.
 * @deprecated Use validateVerificationCodeAsync instead
 */
export function validateVerificationCode(code: string, userId: string): boolean {
  // This synchronous version cannot work with database
  // It's kept for backward compatibility but should be replaced
  // with validateVerificationCodeAsync in all callers
  console.warn('validateVerificationCode is deprecated, use validateVerificationCodeAsync')
  return false
}

/**
 * Validate and consume a verification code for listing creation (async database-backed version)
 * Returns true if code is valid and matches the user, false otherwise
 */
export async function validateVerificationCodeAsync(code: string, userId: string): Promise<boolean> {
  try {
    const pending = await prisma.pendingVerificationCode.findUnique({
      where: { code }
    })

    if (!pending) {
      // Code not found in pending - might be already used or never generated
      return false
    }

    // Check expiration
    if (pending.expiresAt < new Date()) {
      // Delete expired code
      await prisma.pendingVerificationCode.delete({ where: { code } }).catch(() => {})
      return false
    }

    // Check user ownership
    if (pending.userId !== userId) {
      return false
    }

    // Valid - remove from pending so it can't be reused
    await prisma.pendingVerificationCode.delete({ where: { code } })
    return true
  } catch (error) {
    console.error('Error validating verification code:', error)
    return false
  }
}

/**
 * Check if a verification code is available (not expired and not used)
 */
export async function isVerificationCodeValid(code: string, userId: string): Promise<boolean> {
  try {
    const pending = await prisma.pendingVerificationCode.findUnique({
      where: { code }
    })

    if (!pending) {
      return false
    }

    return pending.userId === userId && pending.expiresAt >= new Date()
  } catch (error) {
    console.error('Error checking verification code:', error)
    return false
  }
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
