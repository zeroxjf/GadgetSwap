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
 * Normalize text for comparison - handles common handwriting/OCR confusions
 * Converts all ambiguous characters to a canonical form
 */
function normalizeForComparison(text: string): string {
  return text
    .toUpperCase()
    .replace(/\s/g, '')
    // Handle bidirectional substitutions - normalize to letters
    .replace(/0/g, 'O')
    .replace(/1/g, 'I')
    .replace(/8/g, 'B')
    .replace(/5/g, 'S')
    .replace(/2/g, 'Z')
    // Additional handwriting confusions
    .replace(/6/g, 'G')
    .replace(/9/g, 'G')
    .replace(/4/g, 'A')
    .replace(/\$/g, 'S')
    .replace(/@/g, 'A')
}

/**
 * Check if the verification code is found in the OCR-detected text
 * Enhanced for handwritten text detection
 * @param verificationCode - The expected verification code
 * @param detectedTexts - Array of text detected by OCR
 */
export function findCodeInDetectedText(
  verificationCode: string,
  detectedTexts: string[]
): { found: boolean; confidence: number; matchedText?: string } {
  const normalizedCode = verificationCode.toUpperCase().replace(/\s/g, '')
  const fuzzyCode = normalizeForComparison(normalizedCode)

  // First, try to find the code in the full concatenated text (first element is usually the full text)
  const fullText = detectedTexts[0] || ''
  const normalizedFullText = fullText.toUpperCase().replace(/\s/g, '')
  const fuzzyFullText = normalizeForComparison(normalizedFullText)

  // Exact match in full text
  if (normalizedFullText.includes(normalizedCode)) {
    return { found: true, confidence: 1.0, matchedText: normalizedCode }
  }

  // Fuzzy match in full text (handles OCR confusions)
  if (fuzzyFullText.includes(fuzzyCode)) {
    return { found: true, confidence: 0.95, matchedText: normalizedCode }
  }

  // Check each detected text block
  for (const text of detectedTexts) {
    const normalizedText = text.toUpperCase().replace(/\s/g, '')
    const fuzzyText = normalizeForComparison(normalizedText)

    // Exact match
    if (normalizedText.includes(normalizedCode)) {
      return { found: true, confidence: 1.0, matchedText: text }
    }

    // Fuzzy match with OCR corrections
    if (fuzzyText.includes(fuzzyCode)) {
      return { found: true, confidence: 0.9, matchedText: text }
    }
  }

  // Try fuzzy matching on each detected word/block
  for (const text of detectedTexts) {
    // Split on spaces, newlines, and common delimiters
    const words = text.toUpperCase().replace(/[\s\-_.,;:!?]+/g, ' ').split(' ').filter(w => w.length > 0)

    for (const word of words) {
      // Clean the word
      const cleanWord = word.replace(/[^A-Z0-9]/g, '')

      // Only check words that are similar length to the code (allow +/-2)
      if (Math.abs(cleanWord.length - normalizedCode.length) <= 2) {
        // Try exact match first
        if (cleanWord === normalizedCode) {
          return { found: true, confidence: 1.0, matchedText: word }
        }

        // Try fuzzy normalized match
        const fuzzyWord = normalizeForComparison(cleanWord)
        if (fuzzyWord === fuzzyCode) {
          return { found: true, confidence: 0.9, matchedText: word }
        }

        // Calculate string similarity
        const similarity = stringSimilarity(cleanWord, normalizedCode)
        if (similarity >= 0.8) {
          return { found: true, confidence: similarity, matchedText: word }
        }

        // Also check fuzzy similarity
        const fuzzySimilarity = stringSimilarity(fuzzyWord, fuzzyCode)
        if (fuzzySimilarity >= 0.85) {
          return { found: true, confidence: fuzzySimilarity * 0.95, matchedText: word }
        }
      }
    }
  }

  // Last resort: Check if code characters appear consecutively anywhere
  // This helps when spaces are inserted between characters in handwriting
  const allTextCombined = detectedTexts.join('').toUpperCase().replace(/[^A-Z0-9]/g, '')
  const fuzzyAllText = normalizeForComparison(allTextCombined)

  if (fuzzyAllText.includes(fuzzyCode)) {
    return { found: true, confidence: 0.85, matchedText: verificationCode }
  }

  // Check for code with spaces between characters (e.g., "A B C D E F")
  const codeWithSpaces = normalizedCode.split('').join('\\s*')
  const spaceRegex = new RegExp(codeWithSpaces, 'i')
  if (spaceRegex.test(fullText)) {
    return { found: true, confidence: 0.85, matchedText: verificationCode }
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
