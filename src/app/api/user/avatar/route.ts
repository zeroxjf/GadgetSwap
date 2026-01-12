import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { uploadImage } from '@/lib/cloudinary'

const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']

/**
 * POST /api/user/avatar
 * Upload a profile photo
 * Accepts base64 encoded image data
 */
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const body = await request.json()
    const { image } = body

    if (!image) {
      return NextResponse.json({ error: 'No image provided' }, { status: 400 })
    }

    // Handle base64 data URL
    if (image.startsWith('data:image/')) {
      // Validate image type
      const mimeMatch = image.match(/^data:(image\/[a-z+]+);base64,/)
      if (!mimeMatch) {
        return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
      }

      const mimeType = mimeMatch[1]
      if (!ALLOWED_TYPES.includes(mimeType)) {
        return NextResponse.json({
          error: 'Invalid image type. Allowed: JPEG, PNG, WebP, GIF'
        }, { status: 400 })
      }

      // Check file size (rough estimate from base64)
      const base64Data = image.split(',')[1]
      const sizeInBytes = (base64Data.length * 3) / 4
      if (sizeInBytes > MAX_FILE_SIZE) {
        return NextResponse.json({
          error: 'Image too large. Maximum size is 5MB'
        }, { status: 400 })
      }

      // Upload to Cloudinary
      const uploadResult = await uploadImage(image, {
        folder: 'avatars',
        transformation: {
          width: 400,
          height: 400,
          crop: 'fill',
          gravity: 'face',
        },
      })

      // Store the Cloudinary URL
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image: uploadResult.url },
      })

      return NextResponse.json({
        success: true,
        image: uploadResult.url,
        message: 'Profile photo updated'
      })
    }

    // Handle URL (e.g., from OAuth)
    if (image.startsWith('http://') || image.startsWith('https://')) {
      await prisma.user.update({
        where: { id: session.user.id },
        data: { image },
      })

      return NextResponse.json({
        success: true,
        image,
        message: 'Profile photo updated'
      })
    }

    return NextResponse.json({ error: 'Invalid image format' }, { status: 400 })
  } catch (error) {
    console.error('Avatar upload error:', error)
    return NextResponse.json({ error: 'Failed to upload avatar' }, { status: 500 })
  }
}

/**
 * DELETE /api/user/avatar
 * Remove profile photo
 */
export async function DELETE() {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    await prisma.user.update({
      where: { id: session.user.id },
      data: { image: null },
    })

    return NextResponse.json({
      success: true,
      message: 'Profile photo removed'
    })
  } catch (error) {
    console.error('Avatar delete error:', error)
    return NextResponse.json({ error: 'Failed to remove avatar' }, { status: 500 })
  }
}
