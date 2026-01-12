import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { verifyIMEI, validateIMEIFormat, requiresIMEI } from '@/lib/imei'

/**
 * Check if two model names match, allowing for minor variations
 * e.g., "iPhone 15 Pro Max" should match "iPhone 15 Pro Max"
 * but also handle cases like "iPhone15,3" vs "iPhone 15 Pro Max"
 */
function checkModelMatch(imeiModel: string, selectedModel: string): boolean {
  // Normalize both strings
  const normalize = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, '')

  const normalizedImei = normalize(imeiModel)
  const normalizedSelected = normalize(selectedModel)

  // Exact match after normalization
  if (normalizedImei === normalizedSelected) return true

  // Check if one contains the other (for partial matches)
  if (normalizedImei.includes(normalizedSelected) || normalizedSelected.includes(normalizedImei)) {
    return true
  }

  // Extract key identifiers (model number and variant)
  // e.g., "iPhone 15 Pro Max" -> ["iphone", "15", "pro", "max"]
  const extractParts = (s: string) => {
    const parts = s.toLowerCase().match(/[a-z]+|\d+/g) || []
    return parts.filter(p => p.length > 0)
  }

  const imeiParts = extractParts(imeiModel)
  const selectedParts = extractParts(selectedModel)

  // Must have same device type (iphone, ipad)
  const imeiDevice = imeiParts.find(p => ['iphone', 'ipad', 'ipod', 'watch', 'macbook'].includes(p))
  const selectedDevice = selectedParts.find(p => ['iphone', 'ipad', 'ipod', 'watch', 'macbook'].includes(p))

  if (imeiDevice !== selectedDevice) return false

  // Must have same model number
  const imeiNumber = imeiParts.find(p => /^\d+$/.test(p) && parseInt(p) >= 3 && parseInt(p) <= 20)
  const selectedNumber = selectedParts.find(p => /^\d+$/.test(p) && parseInt(p) >= 3 && parseInt(p) <= 20)

  if (imeiNumber !== selectedNumber) return false

  // Check variants (pro, max, plus, mini, se)
  const variants = ['pro', 'max', 'plus', 'mini', 'se', 'ultra', 'air']
  const imeiVariants = imeiParts.filter(p => variants.includes(p)).sort()
  const selectedVariants = selectedParts.filter(p => variants.includes(p)).sort()

  // Variants must match exactly
  if (imeiVariants.join(',') !== selectedVariants.join(',')) return false

  return true
}

/**
 * POST /api/imei/verify
 * Verify an IMEI number for listing creation
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const body = await request.json()
    const { imei, deviceType, selectedModel } = body

    if (!imei) {
      return NextResponse.json({ error: 'IMEI is required' }, { status: 400 })
    }

    // Check if this device type requires IMEI
    if (deviceType && !requiresIMEI(deviceType)) {
      return NextResponse.json({
        success: true,
        required: false,
        message: 'IMEI verification not required for this device type',
      })
    }

    // Quick format validation first
    const formatCheck = validateIMEIFormat(imei)
    if (!formatCheck.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: formatCheck.error,
      })
    }

    // Full verification with TAC lookup
    const result = await verifyIMEI(imei)

    if (result.rateLimited) {
      return NextResponse.json(
        {
          success: false,
          rateLimited: true,
          waitTime: result.waitTime,
          error: `Too many verification requests. Please wait ${result.waitTime} seconds and try again.`,
        },
        { status: 429 }
      )
    }

    if (!result.valid) {
      return NextResponse.json({
        success: false,
        valid: false,
        error: result.error,
      })
    }

    // Check if it matches expected device type
    if (deviceType && result.isAppleDevice) {
      const expectedType = deviceType.toUpperCase()
      const actualType = result.deviceType?.toUpperCase()

      if (expectedType === 'IPHONE' && actualType !== 'IPHONE') {
        return NextResponse.json({
          success: false,
          valid: true,
          verified: false,
          error: `This IMEI belongs to ${result.modelName || result.model || 'a different device'}, not an iPhone`,
          detectedDevice: result.modelName || result.model,
        })
      }

      if (expectedType === 'IPAD' && actualType !== 'IPAD') {
        return NextResponse.json({
          success: false,
          valid: true,
          verified: false,
          error: `This IMEI belongs to ${result.modelName || result.model || 'a different device'}, not an iPad`,
          detectedDevice: result.modelName || result.model,
        })
      }
    }

    // Warn if not an Apple device
    if (!result.isAppleDevice && result.brand) {
      return NextResponse.json({
        success: false,
        valid: true,
        verified: false,
        error: `This IMEI belongs to a ${result.brand} device, not an Apple device`,
        detectedBrand: result.brand,
        detectedModel: result.model,
      })
    }

    // Check if IMEI model matches the selected model
    if (selectedModel && result.modelName) {
      const imeiModel = result.modelName.toLowerCase()
      // selectedModel format is "Apple iPhone 15 Pro Max" - extract just the model name
      const selectedModelClean = selectedModel.replace(/^Apple\s+/i, '').toLowerCase()

      // Check if the models match (allowing for minor variations)
      const modelsMatch = checkModelMatch(imeiModel, selectedModelClean)

      if (!modelsMatch) {
        return NextResponse.json({
          success: false,
          valid: true,
          verified: false,
          error: `IMEI belongs to "${result.modelName}" but you selected "${selectedModel.replace(/^Apple\s+/i, '')}". Please select the correct model.`,
          detectedModel: result.modelName,
          selectedModel: selectedModel.replace(/^Apple\s+/i, ''),
          modelMismatch: true,
        })
      }
    }

    return NextResponse.json({
      success: true,
      valid: true,
      verified: result.verified,
      brand: result.brand,
      model: result.model,
      modelName: result.modelName,
      deviceType: result.deviceType,
      isAppleDevice: result.isAppleDevice,
    })
  } catch (error) {
    console.error('IMEI verification error:', error)
    return NextResponse.json(
      { error: 'Failed to verify IMEI' },
      { status: 500 }
    )
  }
}
