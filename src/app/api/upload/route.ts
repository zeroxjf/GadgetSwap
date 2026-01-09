import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import { analyzeImage, detectTextInImage } from '@/lib/vision'
import { findCodeInDetectedText } from '@/lib/verification'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return NextResponse.json(
        { error: 'Authentication required' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { image, type, folder, verificationCode } = body

    if (!image) {
      return NextResponse.json(
        { error: 'Image data is required' },
        { status: 400 }
      )
    }

    // Determine folder based on type
    const uploadFolder = folder || (type === 'verification' ? 'gadgetswap/verification' : 'gadgetswap/listings')

    // Upload to Cloudinary
    const uploadResult = await uploadImage(image, {
      folder: uploadFolder,
      tags: [type || 'listing', session.user.email || 'unknown'],
    })

    // Run AI analysis and code verification for verification photos
    let aiAnalysis = null
    let codeVerification = null

    if (type === 'verification') {
      // Run AI analysis (spoof detection, manipulation detection)
      try {
        aiAnalysis = await analyzeImage(uploadResult.url)
      } catch (error) {
        console.error('AI analysis failed:', error)
      }

      // Run OCR to find verification code in the photo
      if (verificationCode) {
        try {
          const detectedTexts = await detectTextInImage(uploadResult.url)
          const codeResult = findCodeInDetectedText(verificationCode, detectedTexts)

          codeVerification = {
            codeFound: codeResult.found,
            confidence: codeResult.confidence,
            matchedText: codeResult.matchedText,
            allDetectedText: detectedTexts.slice(0, 10), // Return first 10 text blocks for debugging
          }
        } catch (error) {
          console.error('OCR verification failed:', error)
          codeVerification = {
            codeFound: false,
            confidence: 0,
            error: 'OCR analysis failed',
          }
        }
      }
    }

    // Determine overall verification status
    let verificationStatus = 'unknown'
    let verificationIssues: string[] = []

    if (type === 'verification') {
      // Check for manipulation (Photoshop, pasted text, digital overlays)
      if (aiAnalysis?.isLikelyManipulated) {
        verificationIssues.push('Image appears to be manipulated or edited')
        verificationStatus = 'flagged'
      }

      // Check for specific manipulation indicators
      if (aiAnalysis?.manipulationIndicators) {
        if (aiAnalysis.manipulationIndicators.includes('text_appears_digital')) {
          verificationIssues.push('Text appears to be digitally added, not handwritten')
        }
        if (aiAnalysis.manipulationIndicators.includes('screenshot_detected')) {
          verificationIssues.push('Image appears to be a screenshot')
          verificationStatus = 'flagged'
        }
        if (aiAnalysis.manipulationIndicators.includes('text_without_paper')) {
          verificationIssues.push('Code detected without visible paper - may be digitally overlaid')
        }
        if (aiAnalysis.manipulationIndicators.includes('image_found_online')) {
          verificationIssues.push('This image appears elsewhere online - may not be original')
          verificationStatus = 'flagged'
        }
        if (aiAnalysis.manipulationIndicators.includes('possible_compositing')) {
          verificationIssues.push('Image shows signs of being composited/pasted together')
        }
      }

      // Check for spoof (photo of photo, edited image)
      if (aiAnalysis?.safeSearch?.spoof === 'VERY_LIKELY') {
        verificationIssues.push('Image appears to be a photo of another image or heavily edited')
        verificationStatus = 'flagged'
      } else if (aiAnalysis?.safeSearch?.spoof === 'LIKELY') {
        verificationIssues.push('Image may be edited or a photo of a screen')
      }

      // Check if device is visible
      if (aiAnalysis && !aiAnalysis.hasDevice) {
        verificationIssues.push('No device detected in photo')
        verificationStatus = 'flagged'
      }

      // Check if code was found
      if (codeVerification && !codeVerification.codeFound) {
        verificationIssues.push('Verification code not detected in photo - ensure code is clearly written')
        verificationStatus = 'flagged'
      } else if (codeVerification?.codeFound && codeVerification.confidence < 0.9) {
        verificationIssues.push('Verification code partially detected - please ensure code is clearly visible')
      }

      // Check for AI-generated content
      if (aiAnalysis?.isLikelyAI) {
        verificationIssues.push('Image may be AI-generated')
        verificationStatus = 'flagged'
      }

      // Positive signals
      if (aiAnalysis?.hasPaper && aiAnalysis?.textAnalysis?.isLikelyHandwritten) {
        // Good signs - handwritten text on paper detected
        // This can override some minor flags
      }

      // If no issues, mark as passed
      if (verificationIssues.length === 0) {
        verificationStatus = 'passed'
      }
    }

    return NextResponse.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      verificationStatus,
      verificationIssues,
      codeVerification,
      aiAnalysis: aiAnalysis ? {
        aiGeneratedScore: aiAnalysis.confidence,
        isLikelyAI: aiAnalysis.isLikelyAI,
        isLikelyManipulated: aiAnalysis.isLikelyManipulated,
        safeSearch: aiAnalysis.safeSearch,
        hasDevice: aiAnalysis.hasDevice,
        hasPaper: aiAnalysis.hasPaper,
        labels: aiAnalysis.labels,
        manipulationIndicators: aiAnalysis.manipulationIndicators,
        textAnalysis: aiAnalysis.textAnalysis,
      } : null,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Failed to upload image' },
      { status: 500 }
    )
  }
}
