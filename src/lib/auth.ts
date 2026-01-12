import { NextAuthOptions, getServerSession } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { cookies } from 'next/headers'
import { prisma } from './prisma'
import { logActivity } from './activity'

export const authOptions: NextAuthOptions = {
  adapter: PrismaAdapter(prisma) as any,
  session: {
    strategy: 'jwt',
  },
  pages: {
    signIn: '/auth/signin',
    error: '/auth/error',
    verifyRequest: '/auth/verify-request',
  },
  providers: [
    GoogleProvider({
      clientId: process.env.GOOGLE_CLIENT_ID!,
      clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    }),
    AppleProvider({
      clientId: process.env.APPLE_ID!,
      clientSecret: process.env.APPLE_SECRET!,
      checks: [],
    }),
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          throw new Error('Email and password required')
        }

        const user = await prisma.user.findUnique({
          where: { email: credentials.email },
        })

        if (!user) {
          throw new Error('No user found with this email')
        }

        if (!user.passwordHash) {
          throw new Error('Please sign in with Google or Apple')
        }

        const isValid = await bcrypt.compare(credentials.password, user.passwordHash)

        if (!isValid) {
          throw new Error('Invalid password')
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          image: user.image,
        }
      },
    }),
  ],
  callbacks: {
    async jwt({ token, user, account }) {
      if (user) {
        token.id = user.id
      }

      // Fetch additional user data from database (including ban status)
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
            role: true,
            subscriptionTier: true,
            rating: true,
            totalSales: true,
            onboardingComplete: true,
            banned: true,
          },
        })

        if (dbUser) {
          // Check if user is banned - invalidate their session
          if (dbUser.banned) {
            token.banned = true
          } else {
            token.banned = false
          }
          token.username = dbUser.username
          token.role = dbUser.role
          token.subscriptionTier = dbUser.subscriptionTier
          token.rating = dbUser.rating
          token.totalSales = dbUser.totalSales
          token.onboardingComplete = dbUser.onboardingComplete
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string | null
        session.user.role = token.role as 'USER' | 'MODERATOR' | 'ADMIN'
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.rating = token.rating as number
        session.user.totalSales = token.totalSales as number
        session.user.onboardingComplete = token.onboardingComplete as boolean
        session.user.banned = token.banned as boolean
      }
      return session
    },
  },
  events: {
    async signIn({ user, account }) {
      // Log login activity
      if (user.id) {
        await logActivity({
          userId: user.id,
          type: 'LOGIN',
          description: `Signed in via ${account?.provider || 'credentials'}`,
          metadata: { provider: account?.provider },
        })
      }
    },
    async createUser({ user }) {
      // Generate a unique username for new users
      const baseUsername = user.email?.split('@')[0] || 'user'
      let username = baseUsername
      let counter = 1

      while (await prisma.user.findUnique({ where: { username } })) {
        username = `${baseUsername}${counter}`
        counter++
      }

      await prisma.user.update({
        where: { id: user.id },
        data: { username },
      })

      // Log signup activity
      await logActivity({
        userId: user.id,
        type: 'SIGNUP',
        description: 'Created a new account',
      })
    },
  },
}

// Extend the built-in session types
declare module 'next-auth' {
  interface Session {
    user: {
      id: string
      email: string
      name?: string | null
      image?: string | null
      username?: string | null
      role: 'USER' | 'MODERATOR' | 'ADMIN'
      subscriptionTier: string
      rating: number
      totalSales: number
      onboardingComplete: boolean
      banned: boolean
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username?: string | null
    role: 'USER' | 'MODERATOR' | 'ADMIN'
    subscriptionTier: string
    rating: number
    totalSales: number
    onboardingComplete: boolean
    banned: boolean
  }
}

/**
 * Get authenticated user from either NextAuth JWT session or mobile session token.
 * This supports both web (JWT) and mobile (database session) authentication.
 */
export async function getAuthenticatedUser() {
  // First try NextAuth session (for web clients)
  const nextAuthSession = await getServerSession(authOptions)
  if (nextAuthSession?.user?.id) {
    return {
      user: nextAuthSession.user,
      source: 'nextauth' as const,
    }
  }

  // Fall back to mobile session token (from cookie)
  const cookieStore = await cookies()
  const sessionToken = cookieStore.get('next-auth.session-token')?.value

  if (!sessionToken) {
    return null
  }

  // Look up the session in the database
  const session = await prisma.session.findUnique({
    where: { sessionToken },
    include: {
      user: {
        select: {
          id: true,
          email: true,
          name: true,
          image: true,
          username: true,
          role: true,
          subscriptionTier: true,
          rating: true,
          totalSales: true,
          onboardingComplete: true,
          banned: true,
        },
      },
    },
  })

  // Check if session exists and hasn't expired
  if (!session || session.expires < new Date()) {
    return null
  }

  // Check if user is banned
  if (session.user.banned) {
    return null
  }

  return {
    user: {
      id: session.user.id,
      email: session.user.email!,
      name: session.user.name,
      image: session.user.image,
      username: session.user.username,
      role: session.user.role as 'USER' | 'MODERATOR' | 'ADMIN',
      subscriptionTier: session.user.subscriptionTier,
      rating: session.user.rating,
      totalSales: session.user.totalSales,
      onboardingComplete: session.user.onboardingComplete,
      banned: false,
    },
    source: 'mobile' as const,
  }
}
