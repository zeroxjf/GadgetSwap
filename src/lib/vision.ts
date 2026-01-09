import vision from '@google-cloud/vision'

// Initialize the client with credentials from environment
const getClient = () => {
  const credentials = process.env.GOOGLE_CLOUD_CREDENTIALS
  if (credentials) {
    return new vision.ImageAnnotatorClient({
      credentials: JSON.parse(credentials),
    })
  }
  // Fall back to default credentials (e.g., from GOOGLE_APPLICATION_CREDENTIALS)
  return new vision.ImageAnnotatorClient()
}

export interface SafeSearchResult {
  adult: string
  violence: string
  medical: string
  racy: string
  spoof: string
}

export interface AIDetectionResult {
  isLikelyAI: boolean
  confidence: number
  safeSearch: SafeSearchResult
  labels: string[]
  hasDevice: boolean
  manipulationIndicators: string[]
  rawResponse?: unknown
}

// Labels that indicate a real device photo
const DEVICE_LABELS = [
  'phone',
  'mobile phone',
  'smartphone',
  'iphone',
  'ipad',
  'tablet',
  'laptop',
  'computer',
  'macbook',
  'electronic device',
  'gadget',
  'portable communications device',
  'communication device',
  'display device',
]

// Labels that might indicate AI generation or heavy manipulation
const AI_INDICATOR_LABELS = [
  'digital art',
  'digital image',
  'cgi',
  'computer graphics',
  'render',
  '3d render',
  '3d rendering',
  'illustration',
  'graphic design',
  'artwork',
  'stock photography',
  'composite',
]

/**
 * Analyze an image for AI generation and manipulation
 * @param imageUrl - URL of the image to analyze
 */
export async function analyzeImage(imageUrl: string): Promise<AIDetectionResult> {
  const client = getClient()

  try {
    const [result] = await client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 30 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION', maxResults: 10 },
      ],
    })

    const safeSearch = result.safeSearchAnnotation || {}
    const labels = (result.labelAnnotations || []).map(
      (l) => l.description?.toLowerCase() || ''
    )
    const objects = (result.localizedObjectAnnotations || []).map(
      (o) => o.name?.toLowerCase() || ''
    )

    // Combine labels and detected objects
    const allDetections = [...labels, ...objects]

    // Check for device-related labels
    const hasDevice = DEVICE_LABELS.some((deviceLabel) =>
      allDetections.some(
        (detection) =>
          detection.includes(deviceLabel) || deviceLabel.includes(detection)
      )
    )

    // Check for AI/manipulation indicators
    const manipulationIndicators: string[] = []

    // Check labels for AI indicators
    AI_INDICATOR_LABELS.forEach((indicator) => {
      if (
        allDetections.some(
          (detection) =>
            detection.includes(indicator) || indicator.includes(detection)
        )
      ) {
        manipulationIndicators.push(`label:${indicator}`)
      }
    })

    // Analyze image properties for signs of manipulation
    const properties = result.imagePropertiesAnnotation
    if (properties?.dominantColors?.colors) {
      const colors = properties.dominantColors.colors
      const uniformity = calculateColorUniformity(colors)

      // Very high uniformity can indicate AI generation
      if (uniformity > 0.85) {
        manipulationIndicators.push('high_color_uniformity')
      }

      // Check for unnatural color distribution
      const colorCount = colors.length
      if (colorCount < 3) {
        manipulationIndicators.push('low_color_diversity')
      }
    }

    // Check if spoof likelihood is high (indicates edited/fake image)
    if (
      safeSearch.spoof === 'VERY_LIKELY' ||
      safeSearch.spoof === 'LIKELY'
    ) {
      manipulationIndicators.push('spoof_detected')
    }

    // Calculate overall AI likelihood score
    const aiScore = calculateAIScore(
      labels,
      manipulationIndicators,
      hasDevice
    )

    return {
      isLikelyAI: aiScore > 0.6,
      confidence: aiScore,
      safeSearch: {
        adult: String(safeSearch.adult || 'UNKNOWN'),
        violence: String(safeSearch.violence || 'UNKNOWN'),
        medical: String(safeSearch.medical || 'UNKNOWN'),
        racy: String(safeSearch.racy || 'UNKNOWN'),
        spoof: String(safeSearch.spoof || 'UNKNOWN'),
      },
      labels: labels.slice(0, 15), // Return top 15 labels
      hasDevice,
      manipulationIndicators,
    }
  } catch (error) {
    console.error('Google Vision analysis error:', error)
    // Return a safe default that doesn't block the listing
    return {
      isLikelyAI: false,
      confidence: 0,
      safeSearch: {
        adult: 'UNKNOWN',
        violence: 'UNKNOWN',
        medical: 'UNKNOWN',
        racy: 'UNKNOWN',
        spoof: 'UNKNOWN',
      },
      labels: [],
      hasDevice: false,
      manipulationIndicators: ['analysis_failed'],
    }
  }
}

/**
 * Detect text in an image (OCR) - useful for verification code detection
 * @param imageUrl - URL of the image to analyze
 */
export async function detectTextInImage(imageUrl: string): Promise<string[]> {
  const client = getClient()

  try {
    const [result] = await client.textDetection(imageUrl)
    const detections = result.textAnnotations || []

    // First detection is the full text, rest are individual words/blocks
    return detections.map((text) => text.description || '')
  } catch (error) {
    console.error('Google Vision OCR error:', error)
    return []
  }
}

/**
 * Check if an image contains inappropriate content
 * @param imageUrl - URL of the image to check
 */
export async function checkSafeSearch(imageUrl: string): Promise<{
  safe: boolean
  reasons: string[]
  results: SafeSearchResult
}> {
  const client = getClient()

  try {
    const [result] = await client.safeSearchDetection(imageUrl)
    const safeSearch = result.safeSearchAnnotation || {}

    const reasons: string[] = []

    if (
      safeSearch.adult === 'VERY_LIKELY' ||
      safeSearch.adult === 'LIKELY'
    ) {
      reasons.push('adult_content')
    }

    if (
      safeSearch.violence === 'VERY_LIKELY' ||
      safeSearch.violence === 'LIKELY'
    ) {
      reasons.push('violent_content')
    }

    return {
      safe: reasons.length === 0,
      reasons,
      results: {
        adult: String(safeSearch.adult || 'UNKNOWN'),
        violence: String(safeSearch.violence || 'UNKNOWN'),
        medical: String(safeSearch.medical || 'UNKNOWN'),
        racy: String(safeSearch.racy || 'UNKNOWN'),
        spoof: String(safeSearch.spoof || 'UNKNOWN'),
      },
    }
  } catch (error) {
    console.error('Google Vision SafeSearch error:', error)
    return {
      safe: true, // Default to safe on error to not block uploads
      reasons: [],
      results: {
        adult: 'UNKNOWN',
        violence: 'UNKNOWN',
        medical: 'UNKNOWN',
        racy: 'UNKNOWN',
        spoof: 'UNKNOWN',
      },
    }
  }
}

/**
 * Calculate color uniformity from dominant colors
 * Higher values indicate more uniform/artificial colors
 */
function calculateColorUniformity(
  colors: Array<{ pixelFraction?: number | null }>
): number {
  if (!colors || colors.length === 0) return 0

  // Calculate how much of the image is covered by the top color
  const topColorFraction = colors[0]?.pixelFraction || 0

  // Calculate variance in color distribution
  const fractions = colors.map((c) => c.pixelFraction || 0)
  const avg = fractions.reduce((a, b) => a + b, 0) / fractions.length
  const variance =
    fractions.reduce((sum, f) => sum + Math.pow(f - avg, 2), 0) /
    fractions.length

  // High uniformity = high top color fraction + low variance
  const uniformityScore = topColorFraction * 0.5 + (1 - Math.sqrt(variance)) * 0.5

  return Math.min(uniformityScore, 1)
}

/**
 * Calculate overall AI likelihood score based on various signals
 */
function calculateAIScore(
  labels: string[],
  manipulationIndicators: string[],
  hasDevice: boolean
): number {
  let score = 0

  // AI-related labels increase score significantly
  const aiLabelCount = labels.filter((label) =>
    AI_INDICATOR_LABELS.some(
      (indicator) => label.includes(indicator) || indicator.includes(label)
    )
  ).length

  score += Math.min(aiLabelCount * 0.25, 0.5)

  // Each manipulation indicator adds to the score
  score += Math.min(manipulationIndicators.length * 0.15, 0.4)

  // If no device is detected in a listing photo, that's suspicious
  if (!hasDevice) {
    score += 0.2
  }

  // Cap the score at 1.0
  return Math.min(score, 1)
}
