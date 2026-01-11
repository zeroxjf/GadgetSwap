import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { uploadImage } from '@/lib/cloudinary'
import { isCurrentUserBanned } from '@/lib/admin'

/**
 * POST /api/upload
 * Upload an image to Cloudinary
 * Verification photos will be manually reviewed by staff
 */
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

    // SECURITY: Check if user is banned
    if (await isCurrentUserBanned()) {
      return NextResponse.json({ error: 'Your account has been suspended' }, { status: 403 })
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

    return NextResponse.json({
      url: uploadResult.url,
      publicId: uploadResult.publicId,
      width: uploadResult.width,
      height: uploadResult.height,
    })
  } catch (error) {
    console.error('Upload failed:', error)
    return NextResponse.json(
      { error: 'Failed to upload image', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    )
  }
}
