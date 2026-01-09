import { prisma } from './prisma'

// Alphabet for verification codes
// Excludes I, O, 0, 1 to avoid confusion in handwritten notes
const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

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
 * @param maxAttempts - Maximum attempts before adding timestamp suffix
 */
export async function createUniqueVerificationCode(
  maxAttempts: number = 10
): Promise<string> {
  let attempts = 0

  while (attempts < maxAttempts) {
    const code = generateVerificationCode()

    // Check if code already exists in any listing
    const existing = await prisma.listing.findFirst({
      where: { verificationCode: code },
      select: { id: true },
    })

    if (!existing) {
      return code
    }

    attempts++
  }

  // Fallback: add timestamp suffix to guarantee uniqueness
  const timestamp = Date.now().toString(36).slice(-2).toUpperCase()
  return `${generateVerificationCode()}${timestamp}`
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
