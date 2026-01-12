import { NextRequest, NextResponse } from 'next/server'
import { prisma } from '@/lib/prisma'
import { getAuthenticatedUser } from '@/lib/auth'

/**
 * GET /api/alerts/[id]
 * Get a single device alert
 */
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    const alert = await prisma.deviceAlert.findUnique({
      where: { id },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (alert.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    return NextResponse.json({ alert })
  } catch (error) {
    console.error('Get alert error:', error)
    return NextResponse.json({ error: 'Failed to get alert' }, { status: 500 })
  }
}

/**
 * PUT /api/alerts/[id]
 * Update a device alert
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const existingAlert = await prisma.deviceAlert.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!existingAlert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (existingAlert.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    const body = await request.json()
    const {
      name,
      active,
      deviceType,
      deviceModel,
      osVersionMin,
      osVersionMax,
      osVersionExact,
      jailbreakStatus,
      bootromExploitOnly,
      storageMinGB,
      storageMaxGB,
      priceMin,
      priceMax,
      conditionMin,
      carrier,
      emailNotify,
      pushNotify,
    } = body

    // Build update data
    const updateData: any = {}
    if (name !== undefined) updateData.name = name
    if (typeof active === 'boolean') updateData.active = active
    if (deviceType !== undefined) updateData.deviceType = deviceType || null
    if (deviceModel !== undefined) updateData.deviceModel = deviceModel || null
    if (osVersionMin !== undefined) updateData.osVersionMin = osVersionMin || null
    if (osVersionMax !== undefined) updateData.osVersionMax = osVersionMax || null
    if (osVersionExact !== undefined) updateData.osVersionExact = osVersionExact || null
    if (jailbreakStatus !== undefined) updateData.jailbreakStatus = jailbreakStatus || null
    if (typeof bootromExploitOnly === 'boolean') updateData.bootromExploitOnly = bootromExploitOnly
    if (storageMinGB !== undefined) updateData.storageMinGB = storageMinGB || null
    if (storageMaxGB !== undefined) updateData.storageMaxGB = storageMaxGB || null
    if (priceMin !== undefined) updateData.priceMin = priceMin || null
    if (priceMax !== undefined) updateData.priceMax = priceMax || null
    if (conditionMin !== undefined) updateData.conditionMin = conditionMin || null
    if (carrier !== undefined) updateData.carrier = carrier || null
    if (typeof emailNotify === 'boolean') updateData.emailNotify = emailNotify
    if (typeof pushNotify === 'boolean') updateData.pushNotify = pushNotify

    const alert = await prisma.deviceAlert.update({
      where: { id },
      data: updateData,
    })

    return NextResponse.json({ success: true, alert })
  } catch (error) {
    console.error('Update alert error:', error)
    return NextResponse.json({ error: 'Failed to update alert' }, { status: 500 })
  }
}

/**
 * DELETE /api/alerts/[id]
 * Delete a device alert
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await getAuthenticatedUser()

    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const { id } = await params

    // Verify ownership
    const alert = await prisma.deviceAlert.findUnique({
      where: { id },
      select: { userId: true },
    })

    if (!alert) {
      return NextResponse.json({ error: 'Alert not found' }, { status: 404 })
    }

    if (alert.userId !== auth.user.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
    }

    await prisma.deviceAlert.delete({
      where: { id },
    })

    return NextResponse.json({ success: true, message: 'Alert deleted' })
  } catch (error) {
    console.error('Delete alert error:', error)
    return NextResponse.json({ error: 'Failed to delete alert' }, { status: 500 })
  }
}
