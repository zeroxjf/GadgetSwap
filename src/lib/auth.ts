import { NextAuthOptions } from 'next-auth'
import { PrismaAdapter } from '@auth/prisma-adapter'
import CredentialsProvider from 'next-auth/providers/credentials'
import GoogleProvider from 'next-auth/providers/google'
import AppleProvider from 'next-auth/providers/apple'
import bcrypt from 'bcryptjs'
import { prisma } from './prisma'

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

      // Fetch additional user data from database
      if (token.id) {
        const dbUser = await prisma.user.findUnique({
          where: { id: token.id as string },
          select: {
            id: true,
            email: true,
            name: true,
            username: true,
            image: true,
            subscriptionTier: true,
            rating: true,
            totalSales: true,
          },
        })

        if (dbUser) {
          token.username = dbUser.username
          token.subscriptionTier = dbUser.subscriptionTier
          token.rating = dbUser.rating
          token.totalSales = dbUser.totalSales
        }
      }

      return token
    },
    async session({ session, token }) {
      if (session.user) {
        session.user.id = token.id as string
        session.user.username = token.username as string | null
        session.user.subscriptionTier = token.subscriptionTier as string
        session.user.rating = token.rating as number
        session.user.totalSales = token.totalSales as number
      }
      return session
    },
  },
  events: {
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
      subscriptionTier: string
      rating: number
      totalSales: number
    }
  }
}

declare module 'next-auth/jwt' {
  interface JWT {
    id: string
    username?: string | null
    subscriptionTier: string
    rating: number
    totalSales: number
  }
}
