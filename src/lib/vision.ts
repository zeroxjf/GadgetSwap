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

export interface TextAnalysis {
  isLikelyDigital: boolean
  isLikelyHandwritten: boolean
  confidence: number
  indicators: string[]
}

export interface AIDetectionResult {
  isLikelyAI: boolean
  isLikelyManipulated: boolean
  confidence: number
  safeSearch: SafeSearchResult
  labels: string[]
  hasDevice: boolean
  hasPaper: boolean
  manipulationIndicators: string[]
  textAnalysis?: TextAnalysis
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

// Labels that indicate paper/handwriting (good signs for verification)
const PAPER_LABELS = [
  'paper',
  'document',
  'note',
  'handwriting',
  'writing',
  'text',
  'receipt',
  'card',
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
  'photo manipulation',
  'edited',
  'photomontage',
]

// Labels that suggest digital/printed text (suspicious for verification code)
const DIGITAL_TEXT_LABELS = [
  'font',
  'typography',
  'printed',
  'label',
  'sign',
  'banner',
  'screenshot',
  'screen',
  'display',
  'monitor',
]

/**
 * Analyze an image for AI generation, manipulation, and fraud
 * Specifically designed to detect:
 * - Photoshopped/edited images with pasted verification codes
 * - AI-generated images
 * - Screenshots or photos of screens
 * - Digital text overlaid on real device photos
 *
 * @param imageUrl - URL of the image to analyze
 */
export async function analyzeImage(imageUrl: string): Promise<AIDetectionResult> {
  const client = getClient()

  try {
    // Request comprehensive analysis including document/text detection
    const [result] = await client.annotateImage({
      image: { source: { imageUri: imageUrl } },
      features: [
        { type: 'SAFE_SEARCH_DETECTION' },
        { type: 'LABEL_DETECTION', maxResults: 50 },
        { type: 'IMAGE_PROPERTIES' },
        { type: 'OBJECT_LOCALIZATION', maxResults: 15 },
        { type: 'DOCUMENT_TEXT_DETECTION' }, // More detailed text analysis
        { type: 'WEB_DETECTION' }, // Check if image appears elsewhere online
      ],
    })

    const safeSearch = result.safeSearchAnnotation || {}
    const labelAnnotations = result.labelAnnotations || []
    const labels = labelAnnotations.map((l) => l.description?.toLowerCase() || '')
    const labelScores = labelAnnotations.map((l) => ({
      label: l.description?.toLowerCase() || '',
      score: l.score || 0,
    }))
    const objects = (result.localizedObjectAnnotations || []).map(
      (o) => o.name?.toLowerCase() || ''
    )
    const webDetection = result.webDetection || {}
    const fullTextAnnotation = result.fullTextAnnotation

    // Combine labels and detected objects
    const allDetections = [...labels, ...objects]

    // Check for device-related labels
    const hasDevice = DEVICE_LABELS.some((deviceLabel) =>
      allDetections.some(
        (detection) =>
          detection.includes(deviceLabel) || deviceLabel.includes(detection)
      )
    )

    // Check for paper/handwriting labels (good sign)
    const hasPaper = PAPER_LABELS.some((paperLabel) =>
      allDetections.some(
        (detection) =>
          detection.includes(paperLabel) || paperLabel.includes(detection)
      )
    )

    // Manipulation indicators
    const manipulationIndicators: string[] = []

    // 1. Check labels for AI/manipulation indicators
    AI_INDICATOR_LABELS.forEach((indicator) => {
      const found = labelScores.find(
        (l) => l.label.includes(indicator) || indicator.includes(l.label)
      )
      if (found && found.score > 0.5) {
        manipulationIndicators.push(`ai_label:${indicator}`)
      }
    })

    // 2. Check for digital text indicators (suggests pasted/edited text)
    const hasDigitalTextLabels = DIGITAL_TEXT_LABELS.some((dtLabel) =>
      allDetections.some(
        (detection) => detection.includes(dtLabel) || dtLabel.includes(detection)
      )
    )
    if (hasDigitalTextLabels) {
      manipulationIndicators.push('digital_text_detected')
    }

    // 3. Check if the image appears to be a screenshot or screen photo
    const isScreenshot = allDetections.some((d) =>
      ['screenshot', 'screen capture', 'screen', 'display', 'monitor'].some(
        (term) => d.includes(term)
      )
    )
    if (isScreenshot) {
      manipulationIndicators.push('screenshot_detected')
    }

    // 4. Analyze text characteristics for digital vs handwritten
    let textAnalysis: TextAnalysis | undefined
    if (fullTextAnnotation) {
      textAnalysis = analyzeTextCharacteristics(fullTextAnnotation)
      if (textAnalysis.isLikelyDigital && !textAnalysis.isLikelyHandwritten) {
        manipulationIndicators.push('text_appears_digital')
      }
    }

    // 5. Analyze image properties for manipulation signs
    const properties = result.imagePropertiesAnnotation
    if (properties?.dominantColors?.colors) {
      const colors = properties.dominantColors.colors
      const uniformity = calculateColorUniformity(colors)

      // Very high uniformity can indicate AI generation
      if (uniformity > 0.85) {
        manipulationIndicators.push('high_color_uniformity')
      }

      // Check for unnatural color distribution
      if (colors.length < 3) {
        manipulationIndicators.push('low_color_diversity')
      }

      // Check for signs of compositing (unusual color boundaries)
      const compositingScore = detectCompositingSigns(colors)
      if (compositingScore > 0.7) {
        manipulationIndicators.push('possible_compositing')
      }
    }

    // 6. Check if spoof likelihood is high (photo of photo, edited image)
    if (safeSearch.spoof === 'VERY_LIKELY') {
      manipulationIndicators.push('high_spoof_likelihood')
    } else if (safeSearch.spoof === 'LIKELY') {
      manipulationIndicators.push('spoof_detected')
    }

    // 7. Check web detection for reverse image search hits
    // If the image (or very similar) appears elsewhere, it might be stolen
    if (webDetection.fullMatchingImages && webDetection.fullMatchingImages.length > 0) {
      manipulationIndicators.push('image_found_online')
    }
    if (webDetection.pagesWithMatchingImages && webDetection.pagesWithMatchingImages.length > 2) {
      manipulationIndicators.push('image_widely_used_online')
    }

    // 8. Check for signs the verification code might be pasted
    // If we detect text but NO paper/handwriting, suspicious
    if (fullTextAnnotation && fullTextAnnotation.text && !hasPaper) {
      // Text detected but no paper - could be digital overlay
      manipulationIndicators.push('text_without_paper')
    }

    // Calculate overall manipulation score
    const { aiScore, manipulationScore } = calculateManipulationScores(
      labels,
      labelScores,
      manipulationIndicators,
      hasDevice,
      hasPaper,
      textAnalysis
    )

    return {
      isLikelyAI: aiScore > 0.6,
      isLikelyManipulated: manipulationScore > 0.5,
      confidence: Math.max(aiScore, manipulationScore),
      safeSearch: {
        adult: String(safeSearch.adult || 'UNKNOWN'),
        violence: String(safeSearch.violence || 'UNKNOWN'),
        medical: String(safeSearch.medical || 'UNKNOWN'),
        racy: String(safeSearch.racy || 'UNKNOWN'),
        spoof: String(safeSearch.spoof || 'UNKNOWN'),
      },
      labels: labels.slice(0, 15),
      hasDevice,
      hasPaper,
      manipulationIndicators,
      textAnalysis,
    }
  } catch (error) {
    console.error('Google Vision analysis error:', error)
    return {
      isLikelyAI: false,
      isLikelyManipulated: false,
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
      hasPaper: false,
      manipulationIndicators: ['analysis_failed'],
    }
  }
}

/**
 * Analyze text characteristics to determine if text is handwritten or digital
 * Handwritten text has: irregular spacing, varying sizes, uneven baselines
 * Digital/pasted text has: uniform spacing, consistent sizes, perfect alignment
 */
function analyzeTextCharacteristics(fullTextAnnotation: any): TextAnalysis {
  const indicators: string[] = []
  let digitalScore = 0
  let handwrittenScore = 0

  const pages = fullTextAnnotation.pages || []

  for (const page of pages) {
    const blocks = page.blocks || []

    for (const block of blocks) {
      const paragraphs = block.paragraphs || []

      for (const paragraph of paragraphs) {
        const words = paragraph.words || []

        if (words.length < 2) continue

        // Analyze character consistency within words
        const charHeights: number[] = []
        const charWidths: number[] = []
        const baselines: number[] = []

        for (const word of words) {
          const symbols = word.symbols || []
          for (const symbol of symbols) {
            const box = symbol.boundingBox?.vertices || []
            if (box.length === 4) {
              const height = Math.abs((box[2]?.y || 0) - (box[0]?.y || 0))
              const width = Math.abs((box[1]?.x || 0) - (box[0]?.x || 0))
              const baseline = box[2]?.y || 0

              if (height > 0) charHeights.push(height)
              if (width > 0) charWidths.push(width)
              if (baseline > 0) baselines.push(baseline)
            }
          }
        }

        // Calculate variance in character properties
        if (charHeights.length > 3) {
          const heightVariance = calculateVariance(charHeights)
          const widthVariance = calculateVariance(charWidths)
          const baselineVariance = calculateVariance(baselines)

          const avgHeight = charHeights.reduce((a, b) => a + b, 0) / charHeights.length
          const normalizedHeightVar = heightVariance / (avgHeight * avgHeight)
          const normalizedBaselineVar = baselineVariance / (avgHeight * avgHeight)

          // Handwritten text has higher variance
          if (normalizedHeightVar > 0.05 || normalizedBaselineVar > 0.02) {
            handwrittenScore += 0.3
            indicators.push('irregular_character_sizes')
          } else if (normalizedHeightVar < 0.01 && normalizedBaselineVar < 0.005) {
            // Very uniform - likely digital
            digitalScore += 0.4
            indicators.push('uniform_character_sizes')
          }

          // Check baseline consistency
          if (normalizedBaselineVar > 0.03) {
            handwrittenScore += 0.2
            indicators.push('uneven_baseline')
          } else if (normalizedBaselineVar < 0.005) {
            digitalScore += 0.3
            indicators.push('perfect_baseline')
          }
        }

        // Check word spacing consistency
        if (words.length > 2) {
          const wordGaps: number[] = []
          for (let i = 1; i < words.length; i++) {
            const prevBox = words[i - 1].boundingBox?.vertices || []
            const currBox = words[i].boundingBox?.vertices || []
            if (prevBox.length === 4 && currBox.length === 4) {
              const gap = (currBox[0]?.x || 0) - (prevBox[1]?.x || 0)
              if (gap > 0) wordGaps.push(gap)
            }
          }

          if (wordGaps.length > 1) {
            const gapVariance = calculateVariance(wordGaps)
            const avgGap = wordGaps.reduce((a, b) => a + b, 0) / wordGaps.length
            const normalizedGapVar = avgGap > 0 ? gapVariance / (avgGap * avgGap) : 0

            if (normalizedGapVar < 0.02) {
              // Very uniform spacing - likely digital
              digitalScore += 0.3
              indicators.push('uniform_word_spacing')
            } else if (normalizedGapVar > 0.1) {
              handwrittenScore += 0.2
              indicators.push('irregular_word_spacing')
            }
          }
        }
      }
    }
  }

  // Check detected properties for handwriting indicators
  const detectedBreak = fullTextAnnotation.text?.includes('\n')
  if (!detectedBreak && fullTextAnnotation.text?.length > 20) {
    // Long text without natural breaks might be digital
    digitalScore += 0.1
  }

  return {
    isLikelyDigital: digitalScore > 0.5,
    isLikelyHandwritten: handwrittenScore > 0.3,
    confidence: Math.max(digitalScore, handwrittenScore),
    indicators,
  }
}

/**
 * Calculate variance of an array of numbers
 */
function calculateVariance(values: number[]): number {
  if (values.length === 0) return 0
  const avg = values.reduce((a, b) => a + b, 0) / values.length
  return values.reduce((sum, v) => sum + Math.pow(v - avg, 2), 0) / values.length
}

/**
 * Detect signs of image compositing based on color distribution
 */
function detectCompositingSigns(
  colors: Array<{ pixelFraction?: number | null; color?: { red?: number; green?: number; blue?: number } | null }>
): number {
  if (!colors || colors.length < 2) return 0

  let compositingScore = 0

  // Check for sharp color boundaries (sign of pasting)
  // In natural photos, color fractions typically follow a smooth distribution
  const fractions = colors.map((c) => c.pixelFraction || 0).filter((f) => f > 0.01)

  if (fractions.length > 2) {
    // Check for sudden jumps in color distribution
    const sortedFractions = [...fractions].sort((a, b) => b - a)

    // If there's a big gap between dominant colors, might be composited
    for (let i = 1; i < Math.min(sortedFractions.length, 4); i++) {
      const ratio = sortedFractions[i - 1] / sortedFractions[i]
      if (ratio > 5) {
        compositingScore += 0.2
      }
    }
  }

  // Check for unnatural color combinations
  // E.g., very saturated colors next to natural skin tones
  const rgbColors = colors
    .filter((c) => c.color && c.pixelFraction && c.pixelFraction > 0.05)
    .map((c) => ({
      r: c.color?.red || 0,
      g: c.color?.green || 0,
      b: c.color?.blue || 0,
      fraction: c.pixelFraction || 0,
    }))

  // Check for pure digital colors (perfect 255 or 0 values)
  for (const color of rgbColors) {
    const isPureColor =
      (color.r === 255 || color.r === 0) &&
      (color.g === 255 || color.g === 0) &&
      (color.b === 255 || color.b === 0)

    if (isPureColor && color.fraction > 0.1) {
      compositingScore += 0.3
    }
  }

  return Math.min(compositingScore, 1)
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
 * Calculate AI and manipulation scores based on all signals
 * Returns separate scores for AI generation and photo manipulation/fraud
 */
function calculateManipulationScores(
  labels: string[],
  labelScores: Array<{ label: string; score: number }>,
  manipulationIndicators: string[],
  hasDevice: boolean,
  hasPaper: boolean,
  textAnalysis?: TextAnalysis
): { aiScore: number; manipulationScore: number } {
  let aiScore = 0
  let manipulationScore = 0

  // --- AI Generation Score ---

  // AI-related labels
  const aiLabelCount = labels.filter((label) =>
    AI_INDICATOR_LABELS.some(
      (indicator) => label.includes(indicator) || indicator.includes(label)
    )
  ).length
  aiScore += Math.min(aiLabelCount * 0.25, 0.5)

  // High color uniformity
  if (manipulationIndicators.includes('high_color_uniformity')) {
    aiScore += 0.2
  }

  // Low color diversity
  if (manipulationIndicators.includes('low_color_diversity')) {
    aiScore += 0.15
  }

  // --- Manipulation/Fraud Score ---

  // Digital text detected (pasted code)
  if (manipulationIndicators.includes('digital_text_detected')) {
    manipulationScore += 0.25
  }

  // Text appears digital from analysis
  if (manipulationIndicators.includes('text_appears_digital')) {
    manipulationScore += 0.35
  }

  // Screenshot detected
  if (manipulationIndicators.includes('screenshot_detected')) {
    manipulationScore += 0.4
  }

  // Text without paper (digital overlay)
  if (manipulationIndicators.includes('text_without_paper')) {
    manipulationScore += 0.3
  }

  // Spoof detection
  if (manipulationIndicators.includes('high_spoof_likelihood')) {
    manipulationScore += 0.4
    aiScore += 0.2
  } else if (manipulationIndicators.includes('spoof_detected')) {
    manipulationScore += 0.25
    aiScore += 0.1
  }

  // Possible compositing
  if (manipulationIndicators.includes('possible_compositing')) {
    manipulationScore += 0.3
  }

  // Image found online (possibly stolen)
  if (manipulationIndicators.includes('image_found_online')) {
    manipulationScore += 0.3
  }
  if (manipulationIndicators.includes('image_widely_used_online')) {
    manipulationScore += 0.4
  }

  // --- Positive signals (reduce scores) ---

  // Has paper detected (good sign for handwritten code)
  if (hasPaper) {
    manipulationScore -= 0.15
  }

  // Has device detected
  if (hasDevice) {
    manipulationScore -= 0.1
    aiScore -= 0.1
  } else {
    // No device is suspicious
    manipulationScore += 0.15
    aiScore += 0.1
  }

  // Text analysis shows handwriting
  if (textAnalysis?.isLikelyHandwritten) {
    manipulationScore -= 0.2
  }

  // Clamp scores to [0, 1]
  aiScore = Math.max(0, Math.min(1, aiScore))
  manipulationScore = Math.max(0, Math.min(1, manipulationScore))

  return { aiScore, manipulationScore }
}
