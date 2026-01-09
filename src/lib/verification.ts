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
 * Calculate Levenshtein distance between two strings
 * Used for fuzzy matching of handwritten codes
 */
function levenshteinDistance(str1: string, str2: string): number {
  const m = str1.length
  const n = str2.length

  // Create a matrix of size (m+1) x (n+1)
  const dp: number[][] = Array(m + 1)
    .fill(null)
    .map(() => Array(n + 1).fill(0))

  // Initialize first column and row
  for (let i = 0; i <= m; i++) dp[i][0] = i
  for (let j = 0; j <= n; j++) dp[0][j] = j

  // Fill the matrix
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      if (str1[i - 1] === str2[j - 1]) {
        dp[i][j] = dp[i - 1][j - 1]
      } else {
        dp[i][j] = Math.min(
          dp[i - 1][j] + 1, // Deletion
          dp[i][j - 1] + 1, // Insertion
          dp[i - 1][j - 1] + 1 // Substitution
        )
      }
    }
  }

  return dp[m][n]
}

/**
 * Calculate similarity between two strings (0-1)
 */
function stringSimilarity(str1: string, str2: string): number {
  const maxLen = Math.max(str1.length, str2.length)
  if (maxLen === 0) return 1 // Both empty

  const distance = levenshteinDistance(str1, str2)
  return 1 - distance / maxLen
}

/**
 * Check if the verification code is found in the OCR-detected text
 * @param verificationCode - The expected verification code
 * @param detectedTexts - Array of text detected by OCR
 */
export function findCodeInDetectedText(
  verificationCode: string,
  detectedTexts: string[]
): { found: boolean; confidence: number; matchedText?: string } {
  const normalizedCode = verificationCode.toUpperCase().replace(/\s/g, '')

  for (const text of detectedTexts) {
    const normalizedText = text.toUpperCase().replace(/\s/g, '')

    // Exact match
    if (normalizedText.includes(normalizedCode)) {
      return { found: true, confidence: 1.0, matchedText: text }
    }

    // Check for the code as a substring with common OCR errors
    // Common substitutions: 0↔O, 1↔I, 8↔B, 5↔S, 2↔Z
    const fuzzyCode = normalizedCode
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/B/g, '8')
      .replace(/S/g, '5')
      .replace(/Z/g, '2')

    const fuzzyText = normalizedText
      .replace(/O/g, '0')
      .replace(/I/g, '1')
      .replace(/B/g, '8')
      .replace(/S/g, '5')
      .replace(/Z/g, '2')

    if (fuzzyText.includes(fuzzyCode)) {
      return { found: true, confidence: 0.9, matchedText: text }
    }
  }

  // Try fuzzy matching on each detected word/block
  for (const text of detectedTexts) {
    const words = text.toUpperCase().replace(/\s+/g, ' ').split(' ')

    for (const word of words) {
      // Only check words that are similar length to the code
      if (Math.abs(word.length - normalizedCode.length) <= 2) {
        const similarity = stringSimilarity(word, normalizedCode)

        if (similarity >= 0.8) {
          return {
            found: true,
            confidence: similarity,
            matchedText: word,
          }
        }
      }
    }
  }

  return { found: false, confidence: 0 }
}

/**
 * Verify that the verification code appears in a photo
 * Uses Google Cloud Vision OCR
 * @param verificationCode - The expected verification code
 * @param photoUrl - URL of the verification photo
 */
export async function verifyCodeInPhoto(
  verificationCode: string,
  photoUrl: string
): Promise<{ found: boolean; confidence: number; matchedText?: string }> {
  try {
    // Dynamic import to avoid circular dependencies
    const { detectTextInImage } = await import('./vision')

    const detectedTexts = await detectTextInImage(photoUrl)

    if (detectedTexts.length === 0) {
      return { found: false, confidence: 0 }
    }

    return findCodeInDetectedText(verificationCode, detectedTexts)
  } catch (error) {
    console.error('Verification code OCR failed:', error)
    return { found: false, confidence: 0 }
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
