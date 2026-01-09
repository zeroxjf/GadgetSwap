/**
 * Message Content Moderation System
 *
 * Detects attempts to take transactions off-platform, including:
 * - Phone numbers
 * - Email addresses
 * - Payment apps (Venmo, PayPal, CashApp, Zelle, etc.)
 * - Social media handles
 * - External website links
 * - Common evasion tactics
 */

// =============================================================================
// DETECTION PATTERNS
// =============================================================================

// Phone number patterns (various formats)
const PHONE_PATTERNS = [
  /\b\d{3}[-.\s]?\d{3}[-.\s]?\d{4}\b/g,                    // 123-456-7890, 123.456.7890, 123 456 7890
  /\b\(\d{3}\)\s*\d{3}[-.\s]?\d{4}\b/g,                    // (123) 456-7890
  /\b\d{10,11}\b/g,                                         // 1234567890 (10-11 digits)
  /\b(?:call|text|msg|message|reach)\s*(?:me\s*)?(?:at|@)?\s*\d/gi,  // "call me at 1..."
  /\b\d{3}\s*\d{3}\s*\d{4}\b/g,                            // 123 456 7890
]

// Obfuscated number patterns (people trying to hide phone numbers)
const OBFUSCATED_PHONE_PATTERNS = [
  /\b(?:one|two|three|four|five|six|seven|eight|nine|zero|oh)[\s-]*(?:one|two|three|four|five|six|seven|eight|nine|zero|oh)[\s-]*/gi,
  /\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d[\s.,-]*\d/g,  // Spaced digits
]

// Email patterns
const EMAIL_PATTERNS = [
  /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,   // Standard email
  /\b[A-Za-z0-9._%+-]+\s*(?:@|at)\s*[A-Za-z0-9.-]+\s*(?:\.|dot)\s*(?:com|net|org|io|co|gmail|yahoo|hotmail|outlook)\b/gi,  // "john at gmail dot com"
  /\bemail\s*(?:me|is)?\s*:?\s*[A-Za-z0-9._%+-]+/gi,        // "email me: ..."
]

// Payment platform patterns
const PAYMENT_PLATFORM_PATTERNS = [
  /\b(?:venmo|paypal|cashapp|cash\s*app|zelle|apple\s*pay|google\s*pay|gpay|wise|western\s*union|money\s*gram|moneygram)\b/gi,
  /\$[A-Za-z][A-Za-z0-9_-]{2,}/g,                           // $cashtag format
  /\b(?:send|pay|transfer)\s*(?:me|to)?\s*(?:via|through|on|using)?\s*(?:venmo|paypal|cashapp|zelle)/gi,
  /\b(?:my|add\s*me\s*on)\s*(?:venmo|paypal|cashapp|zelle)\s*(?:is|:)?\s*@?[A-Za-z0-9_-]+/gi,
  /\b(?:goods\s*(?:and|&)\s*services|g\s*&\s*s|g&s|f\s*&\s*f|f&f|friends\s*(?:and|&)\s*family)\b/gi,  // PayPal payment types
  /\b(?:pp|paypal)\s*(?:me|g&s|f&f|goods|friends)\b/gi,     // PP shorthand
  /\b(?:bank\s*transfer|wire\s*transfer|direct\s*deposit|ach|routing\s*number|account\s*number)\b/gi,
  /\b(?:gift\s*card|prepaid\s*card|reload|green\s*dot)\b/gi,
]

// Social media patterns
const SOCIAL_MEDIA_PATTERNS = [
  /\b(?:instagram|ig|insta|facebook|fb|twitter|x|tiktok|snapchat|snap|telegram|whatsapp|discord|signal)\b/gi,
  /\b(?:dm|message)\s*(?:me)?\s*(?:on|@)\s*(?:ig|insta|instagram|fb|twitter|snap|telegram|whatsapp)/gi,
  /@[A-Za-z0-9_.]{3,30}\b/g,                                // @username format
  /\b(?:add|follow|hit)\s*(?:me)?\s*(?:up)?\s*(?:on|@)/gi,  // "add me on..."
]

// External link patterns (excluding GadgetSwap)
const EXTERNAL_LINK_PATTERNS = [
  /https?:\/\/(?!(?:www\.)?gadgetswap\.tech)[^\s]+/gi,      // Any URL not gadgetswap
  /\b(?:www\.)[^\s]+\.[A-Za-z]{2,}/gi,                      // www. links
  /\b(?:check\s*out|see|visit|go\s*to)\s*(?:my)?\s*(?:site|website|link|page)\b/gi,
]

// Evasion tactic patterns
const EVASION_PATTERNS = [
  /\b(?:off\s*(?:the\s*)?(?:platform|site|app)|outside\s*(?:of\s*)?(?:here|gadgetswap)|direct(?:ly)?|private(?:ly)?)\b/gi,
  /\b(?:avoid|skip|bypass)\s*(?:the)?\s*(?:fees?|commission|platform)\b/gi,
  /\b(?:save|cheaper|better\s*deal)\s*(?:if|by)\s*(?:we|you|going)\s*(?:direct|off)/gi,
  /\b(?:don't|can't)\s*(?:use|go\s*through)\s*(?:this|the)\s*(?:site|platform|app)\b/gi,
  /\b(?:meet\s*up|local|cash|in\s*person)\s*(?:only|preferred|instead)\b/gi,
]

// Crypto payment patterns
const CRYPTO_PATTERNS = [
  /\b(?:bitcoin|btc|ethereum|eth|crypto|usdt|usdc)\b/gi,
  /\b0x[a-fA-F0-9]{40}\b/g,                                 // Ethereum address
  /\b[13][a-km-zA-HJ-NP-Z1-9]{25,34}\b/g,                   // Bitcoin address
]

// =============================================================================
// TYPES
// =============================================================================

export interface ModerationFlag {
  type: 'phone' | 'email' | 'payment_app' | 'social_media' | 'external_link' | 'evasion' | 'crypto'
  severity: 'low' | 'medium' | 'high'
  match: string
  context: string
}

export interface ModerationResult {
  flagged: boolean
  flags: ModerationFlag[]
  riskScore: number  // 0-100
  blocked: boolean
  sanitizedContent?: string
  message?: string
}

// =============================================================================
// MAIN MODERATION FUNCTION
// =============================================================================

/**
 * Scan message content for off-platform transaction attempts
 *
 * @param content - The message content to scan
 * @returns ModerationResult with flags and risk assessment
 */
export function moderateMessage(content: string): ModerationResult {
  const flags: ModerationFlag[] = []
  const normalizedContent = content.toLowerCase()

  // Helper to add flag
  const addFlag = (
    type: ModerationFlag['type'],
    severity: ModerationFlag['severity'],
    match: string
  ) => {
    // Get context (surrounding text)
    const matchIndex = normalizedContent.indexOf(match.toLowerCase())
    const contextStart = Math.max(0, matchIndex - 20)
    const contextEnd = Math.min(content.length, matchIndex + match.length + 20)
    const context = content.slice(contextStart, contextEnd)

    flags.push({ type, severity, match, context })
  }

  // Check phone numbers
  for (const pattern of PHONE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('phone', 'high', match))
    }
  }

  // Check obfuscated phone numbers
  for (const pattern of OBFUSCATED_PHONE_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => {
        if (match.length >= 10) {  // Likely a phone number
          addFlag('phone', 'high', match)
        }
      })
    }
  }

  // Check emails
  for (const pattern of EMAIL_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('email', 'high', match))
    }
  }

  // Check payment platforms
  for (const pattern of PAYMENT_PLATFORM_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('payment_app', 'high', match))
    }
  }

  // Check social media
  for (const pattern of SOCIAL_MEDIA_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      // Filter out common false positives
      matches.forEach(match => {
        if (!isFalsePositive(match, 'social_media')) {
          addFlag('social_media', 'medium', match)
        }
      })
    }
  }

  // Check external links
  for (const pattern of EXTERNAL_LINK_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('external_link', 'medium', match))
    }
  }

  // Check evasion tactics
  for (const pattern of EVASION_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('evasion', 'high', match))
    }
  }

  // Check crypto
  for (const pattern of CRYPTO_PATTERNS) {
    const matches = content.match(pattern)
    if (matches) {
      matches.forEach(match => addFlag('crypto', 'medium', match))
    }
  }

  // Calculate risk score
  const riskScore = calculateRiskScore(flags)

  // Determine if blocked
  const blocked = riskScore >= 70 || hasHighSeverityFlags(flags)

  return {
    flagged: flags.length > 0,
    flags,
    riskScore,
    blocked,
    message: blocked
      ? 'This message was blocked because it appears to contain contact information or payment details. For your safety, please keep all transactions on GadgetSwap.'
      : flags.length > 0
        ? 'This message has been flagged for review.'
        : undefined,
  }
}

// =============================================================================
// HELPER FUNCTIONS
// =============================================================================

/**
 * Check for common false positives
 */
function isFalsePositive(match: string, type: string): boolean {
  const lowerMatch = match.toLowerCase()

  // Social media false positives
  if (type === 'social_media') {
    const falsePositives = [
      '@gadgetswap',
      '@mention',
      '@example',
      'dm',  // Could be "dm" in normal context
    ]
    return falsePositives.some(fp => lowerMatch.includes(fp))
  }

  return false
}

/**
 * Calculate overall risk score based on flags
 */
function calculateRiskScore(flags: ModerationFlag[]): number {
  if (flags.length === 0) return 0

  let score = 0

  for (const flag of flags) {
    switch (flag.severity) {
      case 'high':
        score += 35
        break
      case 'medium':
        score += 20
        break
      case 'low':
        score += 10
        break
    }

    // Bonus points for certain types
    if (flag.type === 'phone' || flag.type === 'email') {
      score += 15
    }
    if (flag.type === 'payment_app') {
      score += 20
    }
    if (flag.type === 'evasion') {
      score += 25
    }
  }

  return Math.min(100, score)
}

/**
 * Check if there are any high severity flags
 */
function hasHighSeverityFlags(flags: ModerationFlag[]): boolean {
  return flags.some(f => f.severity === 'high')
}

// =============================================================================
// SANITIZATION (optional - for displaying blocked content to admins)
// =============================================================================

/**
 * Sanitize message by redacting sensitive information
 * Useful for displaying flagged content to admins
 */
export function sanitizeMessage(content: string): string {
  let sanitized = content

  // Redact phone numbers
  for (const pattern of PHONE_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[PHONE REDACTED]')
  }

  // Redact emails
  for (const pattern of EMAIL_PATTERNS) {
    sanitized = sanitized.replace(pattern, '[EMAIL REDACTED]')
  }

  return sanitized
}

// =============================================================================
// UTILITY EXPORTS
// =============================================================================

/**
 * Quick check if a message should be blocked
 */
export function shouldBlockMessage(content: string): boolean {
  return moderateMessage(content).blocked
}

/**
 * Get human-readable explanation for flags
 */
export function getFlagExplanation(flag: ModerationFlag): string {
  const explanations: Record<ModerationFlag['type'], string> = {
    phone: 'Contains a phone number',
    email: 'Contains an email address',
    payment_app: 'Mentions external payment apps (Venmo, PayPal, etc.)',
    social_media: 'Contains social media reference',
    external_link: 'Contains external website link',
    evasion: 'Contains language suggesting off-platform transaction',
    crypto: 'Contains cryptocurrency reference',
  }
  return explanations[flag.type]
}
