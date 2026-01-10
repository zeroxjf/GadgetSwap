import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

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

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const ip = getClientIP(request)

    if (ip) {
      // Check if this IP is banned
      const bannedIP = await prisma.bannedIP.findUnique({
        where: { ipAddress: ip },
      })

      if (bannedIP) {
        // IP is banned - could sign them out here, but for now just flag it
        console.warn(`Banned IP ${ip} logged in as user ${session.user.id}`)
      }

      // Update user's last IP address
      await prisma.user.update({
        where: { id: session.user.id },
        data: { lastIpAddress: ip },
      })
    }

    return NextResponse.json({ success: true, tracked: !!ip })
  } catch (error) {
    console.error('Track login error:', error)
    return NextResponse.json({ error: 'Failed to track login' }, { status: 500 })
  }
}
