import { NextRequest, NextResponse } from 'next/server'
import { getAuthenticatedUser } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import crypto from 'crypto'

function getClientIP(request: NextRequest): string | null {
  // Check various headers for client IP (in order of reliability)
  const forwardedFor = request.headers.get('x-forwarded-for')
  if (forwardedFor) {
    // x-forwarded-for can contain multiple IPs, take the first one
    return forwardedFor.split(',')[0].trim()
  }

  const realIP = request.headers.get('x-real-ip')
  if (realIP) {
    return realIP
  }

  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  if (cfConnectingIP) {
    return cfConnectingIP
  }

  return null
}

function hashIP(ip: string): string {
  return crypto.createHash('sha256').update(ip).digest('hex')
}

export async function POST(request: NextRequest) {
  try {
    const auth = await getAuthenticatedUser()
    if (!auth?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const session = { user: auth.user }

    const ip = getClientIP(request)

    if (ip) {
      const ipHash = hashIP(ip)

      // Check if this IP hash is banned
      const bannedIP = await prisma.bannedIP.findUnique({
        where: { ipHash },
      })

      if (bannedIP) {
        // IP is banned - could sign them out here, but for now just flag it
        console.warn(`Banned IP hash ${ipHash.slice(0, 8)}... logged in as user ${session.user.id}`)
      }

      // Update user's last IP hash
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastIpHash: ipHash },
      })
    }

    return NextResponse.json({ success: true, tracked: !!ip })
  } catch (error) {
    console.error('Track login error:', error)
    return NextResponse.json({ error: 'Failed to track login' }, { status: 500 })
  }
}
