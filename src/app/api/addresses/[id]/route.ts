import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

/**
 * PUT /api/addresses/[id]
 * Update a saved address
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    const { id } = await params
    const body = await request.json()

    // Verify ownership
    const existing = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    // If setting as default, unset other defaults
    if (body.isDefault) {
      await prisma.savedAddress.updateMany({
        where: { userId: session.user.id, isDefault: true, id: { not: id } },
        data: { isDefault: false },
      })
    }

    const address = await prisma.savedAddress.update({
      where: {
        id,
        userId: session.user.id,
      },
      data: {
        label: body.label,
        name: body.name,
        line1: body.line1,
        line2: body.line2,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        phone: body.phone,
        isDefault: body.isDefault,
      },
    })

    return NextResponse.json({ address })
  } catch (error) {
    console.error('Update address error:', error)
    return NextResponse.json(
      { error: 'Failed to update address' },
      { status: 500 }
    )
  }
}

/**
 * DELETE /api/addresses/[id]
 * Delete a saved address
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const session = { user: auth.user }

    const { id } = await params

    // Verify ownership
    const existing = await prisma.savedAddress.findFirst({
      where: { id, userId: session.user.id },
    })

    if (!existing) {
      return NextResponse.json(
        { error: 'Address not found' },
        { status: 404 }
      )
    }

    await prisma.savedAddress.delete({
      where: { id },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Delete address error:', error)
    return NextResponse.json(
      { error: 'Failed to delete address' },
      { status: 500 }
    )
  }
}
