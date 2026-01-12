import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

// Get user's current draft
export async function GET(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    // Find the user's most recent draft
    const draft = await prisma.listing.findFirst({
      where: {
        sellerId: session.user.id,
        status: 'DRAFT',
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        images: { orderBy: { order: 'asc' } },
      },
    })

    if (!draft) {
      return NextResponse.json({ draft: null })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Failed to fetch draft:', error)
    return NextResponse.json({ error: 'Failed to fetch draft' }, { status: 500 })
  }
}

// Create or update a draft
export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const body = await request.json()
    const { draftId, formData, images, verificationCode, verificationPhotoUrl } = body

    // SECURITY: Validate storageGB bounds if provided
    if (formData.storageGB) {
      const storageGB = parseInt(formData.storageGB)
      if (isNaN(storageGB) || storageGB < 1 || storageGB > 2048) {
        return NextResponse.json({ error: 'Storage must be between 1 and 2048 GB' }, { status: 400 })
      }
    }

    // SECURITY: Validate batteryHealth bounds if provided
    if (formData.batteryHealth) {
      const batteryHealth = parseInt(formData.batteryHealth)
      if (isNaN(batteryHealth) || batteryHealth < 0 || batteryHealth > 100) {
        return NextResponse.json({ error: 'Battery health must be between 0 and 100' }, { status: 400 })
      }
    }

    // Prepare the listing data
    const listingData: any = {
      sellerId: session.user.id,
      status: 'DRAFT',
      reviewStatus: 'PENDING_REVIEW',
      // Basic info
      title: formData.title || 'Untitled Draft',
      description: formData.description || '',
      price: formData.price ? parseFloat(formData.price) : 0,
      // Device info
      deviceType: formData.deviceType || 'IPHONE',
      deviceModel: formData.deviceModel || '',
      storageGB: formData.storageGB ? parseInt(formData.storageGB) : null,
      color: formData.color || null,
      carrier: formData.carrier || null,
      condition: formData.condition || 'GOOD',
      // iOS info
      osVersion: formData.osVersion || null,
      jailbreakStatus: formData.jailbreakStatus || 'UNKNOWN',
      // Hardware info
      batteryHealth: formData.batteryHealth ? parseInt(formData.batteryHealth) : null,
      imeiClean: formData.imeiClean ?? true,
      icloudUnlocked: formData.icloudUnlocked ?? true,
      // Third-party parts
      originalParts: !formData.hasThirdPartyParts,
      // Return policy
      acceptsReturns: formData.acceptsReturns ?? false,
      returnWindowDays: formData.returnWindowDays || 14,
      // Verification
      verificationCode: verificationCode || null,
      verificationPhotoUrl: verificationPhotoUrl || null,
    }

    let draft

    if (draftId) {
      // Update existing draft
      // First verify the draft belongs to this user
      const existingDraft = await prisma.listing.findFirst({
        where: {
          id: draftId,
          sellerId: session.user.id,
          status: 'DRAFT',
        },
      })

      if (!existingDraft) {
        return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
      }

      // Delete existing images and recreate
      await prisma.listingImage.deleteMany({
        where: { listingId: draftId },
      })

      draft = await prisma.listing.update({
        where: { id: draftId },
        data: {
          ...listingData,
          images: images?.length > 0 ? {
            create: images.map((url: string, index: number) => ({
              url,
              order: index,
            })),
          } : undefined,
        },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
      })
    } else {
      // Create new draft
      draft = await prisma.listing.create({
        data: {
          ...listingData,
          images: images?.length > 0 ? {
            create: images.map((url: string, index: number) => ({
              url,
              order: index,
            })),
          } : undefined,
        },
        include: {
          images: { orderBy: { order: 'asc' } },
        },
      })
    }

    return NextResponse.json({ draft })
  } catch (error) {
    console.error('Failed to save draft:', error)
    return NextResponse.json({ error: 'Failed to save draft' }, { status: 500 })
  }
}

// Delete a draft
export async function DELETE(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const session = { user: auth.user }

    const { searchParams } = new URL(request.url)
    const draftId = searchParams.get('id')

    if (!draftId) {
      return NextResponse.json({ error: 'Draft ID required' }, { status: 400 })
    }

    // Verify ownership
    const draft = await prisma.listing.findFirst({
      where: {
        id: draftId,
        sellerId: session.user.id,
        status: 'DRAFT',
      },
    })

    if (!draft) {
      return NextResponse.json({ error: 'Draft not found' }, { status: 404 })
    }

    // Delete images first
    await prisma.listingImage.deleteMany({
      where: { listingId: draftId },
    })

    // Delete the draft
    await prisma.listing.delete({
      where: { id: draftId },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Failed to delete draft:', error)
    return NextResponse.json({ error: 'Failed to delete draft' }, { status: 500 })
  }
}
