import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/app/api/auth/[...nextauth]/route'
import { uploadImage } from '@/lib/cloudinary'
import { analyzeImage } from '@/lib/vision'

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
    const { image, type, folder } = body

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

    // Run AI analysis for verification photos or if requested
    let aiAnalysis = null
    if (type === 'verification') {
      try {
        aiAnalysis = await analyzeImage(uploadResult.url)
      } catch (error) {
        console.error('AI analysis failed:', error)
        // Don't fail the upload if AI analysis fails
      }
    }

    return NextResponse.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
      aiAnalysis: aiAnalysis ? {
        aiGeneratedScore: aiAnalysis.confidence,
        isLikelyAI: aiAnalysis.isLikelyAI,
        safeSearch: aiAnalysis.safeSearch,
        hasDevice: aiAnalysis.hasDevice,
        labels: aiAnalysis.labels,
        manipulationIndicators: aiAnalysis.manipulationIndicators,
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
