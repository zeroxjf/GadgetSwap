import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage, UploadResult } from '@/lib/cloudinary'
import { analyzeImage, AIDetectionResult } from '@/lib/vision'

// Maximum file size: 10MB
const MAX_FILE_SIZE = 10 * 1024 * 1024

// Allowed image MIME types
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/heic']

export interface UploadResponse {
  success: boolean
  url?: string
  publicId?: string
  aiAnalysis?: AIDetectionResult
  error?: string
}

/**
 * POST /api/upload
 * Upload an image to Cloudinary and optionally run AI analysis
 */
export async function POST(request: NextRequest): Promise<NextResponse<UploadResponse>> {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { image, type, runAiAnalysis = true } = body

    // Validate image data
    if (!image) {
      return NextResponse.json(
        { success: false, error: 'No image provided' },
        { status: 400 }
      )
    }

    // Validate type
    if (!['listing', 'verification', 'avatar'].includes(type)) {
      return NextResponse.json(
        { success: false, error: 'Invalid upload type' },
        { status: 400 }
      )
    }

    // Check if it's a base64 image
    let imageData = image
    if (image.startsWith('data:')) {
      // Extract MIME type and validate
      const mimeMatch = image.match(/^data:(image\/\w+);base64,/)
      if (!mimeMatch) {
        return NextResponse.json(
          { success: false, error: 'Invalid image format' },
          { status: 400 }
        )
      }

      const mimeType = mimeMatch[1]
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return NextResponse.json(
          { success: false, error: `Unsupported image type: ${mimeType}` },
          { status: 400 }
        )
      }

      // Estimate file size from base64
      const base64Data = image.split(',')[1]
      const estimatedSize = (base64Data.length * 3) / 4
      if (estimatedSize > MAX_FILE_SIZE) {
        return NextResponse.json(
          { success: false, error: 'Image too large. Maximum size is 10MB.' },
          { status: 400 }
        )
      }
    }

    // Determine folder based on type
    const folder = getUploadFolder(type, session.user.id)

    // Upload to Cloudinary
    let uploadResult: UploadResult
    try {
      uploadResult = await uploadImage(imageData, {
        folder,
        tags: [type, `user:${session.user.id}`],
      })
    } catch (uploadError) {
      console.error('Cloudinary upload failed:', uploadError)
      return NextResponse.json(
        { success: false, error: 'Failed to upload image' },
        { status: 500 }
      )
    }

    // Run AI analysis if requested (for listing and verification photos)
    let aiAnalysis: AIDetectionResult | undefined
    if (runAiAnalysis && (type === 'listing' || type === 'verification')) {
      try {
        aiAnalysis = await analyzeImage(uploadResult.url)
      } catch (aiError) {
        console.error('AI analysis failed:', aiError)
        // Don't fail the upload if AI analysis fails
        aiAnalysis = undefined
      }
    }

    return NextResponse.json({
      success: true,
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      aiAnalysis,
    })
  } catch (error) {
    console.error('Upload error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to process upload' },
      { status: 500 }
    )
  }
}

/**
 * Get the Cloudinary folder path based on upload type
 */
function getUploadFolder(type: string, userId: string): string {
  const base = 'gadgetswap'

  switch (type) {
    case 'listing':
      return `${base}/listings/${userId}`
    case 'verification':
      return `${base}/verification/${userId}`
    case 'avatar':
      return `${base}/avatars`
    default:
      return `${base}/misc/${userId}`
  }
}

/**
 * DELETE /api/upload
 * Delete an image from Cloudinary (for cleanup)
 */
export async function DELETE(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const { publicId } = await request.json()

    if (!publicId) {
      return NextResponse.json(
        { success: false, error: 'No publicId provided' },
        { status: 400 }
      )
    }

    // Verify the image belongs to this user (check folder path)
    if (!publicId.includes(session.user.id)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized to delete this image' },
        { status: 403 }
      )
    }

    const { deleteImage } = await import('@/lib/cloudinary')
    await deleteImage(publicId)

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete error:', error)
    return NextResponse.json(
      { success: false, error: 'Failed to delete image' },
      { status: 500 }
    )
  }
}
