import { NextAuthOptions, User } from 'next-auth'
import CredentialsProvider from 'next-auth/providers/credentials'
import { prisma } from './db'
import bcrypt from 'bcryptjs'

export const authOptions: NextAuthOptions = {
  // Remove PrismaAdapter for now to fix the compilation issue
  providers: [
    CredentialsProvider({
      name: 'credentials',
      credentials: {
        email: { label: 'Email', type: 'email' },
        password: { label: 'Password', type: 'password' },
      },
      async authorize(credentials) {
        if (!credentials?.email || !credentials?.password) {
          return null
        }

        const user = await prisma.user.findUnique({
          where: {
            email: credentials.email,
          },
          include: {
            organization: true,
            person: {
              select: {
                id: true,
              },
            },
          },
        })

        if (!user) {
          return null
        }

        const isPasswordValid = await bcrypt.compare(
          credentials.password,
          user.passwordHash
        )

        if (!isPasswordValid) {
          return null
        }

        return {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          organizationId: user.organizationId,
          organizationName: user.organization?.name || null,
          organizationSlug: user.organization?.slug || null,
          personId: user.person?.id || null,
        } as User
      },
    }),
  ],
  session: {
    strategy: 'jwt',
    maxAge: 30 * 24 * 60 * 60, // 30 days
  },
  callbacks: {
    async jwt({ token, user, trigger }) {
      if (user) {
        token.role = user.role
        token.organizationId = user.organizationId
        token.organizationName = user.organizationName
        token.organizationSlug = user.organizationSlug
        token.personId = user.personId
      }

      // If this is a session update trigger, fetch fresh user data
      if (trigger === 'update' && token.sub) {
        const freshUser = await prisma.user.findUnique({
          where: { id: token.sub },
          include: {
            organization: true,
            person: {
              select: {
                id: true,
              },
            },
          },
        })

        if (freshUser) {
          token.role = freshUser.role
          token.organizationId = freshUser.organizationId
          token.organizationName = freshUser.organization?.name || null
          token.organizationSlug = freshUser.organization?.slug || null
          token.personId = freshUser.person?.id || null
        }
      }

      // Always verify the user still exists and is active
      if (token.sub) {
        const user = await prisma.user.findUnique({
          where: { id: token.sub },
          select: { id: true },
        })

        if (!user) {
          // User no longer exists, invalidate token
          return null
        }
      }

      return token
    },
    async session({ session, token }) {
      if (token) {
        session.user.id = token.sub!
        session.user.role = token.role as string
        session.user.organizationId = token.organizationId as string
        session.user.organizationName = token.organizationName as string
        session.user.organizationSlug = token.organizationSlug as string
        session.user.personId = token.personId as string | null
      }
      return session
    },
    async signOut() {
      // This callback is called when the user signs out
      // We can add any cleanup logic here if needed
      return true
    },
  },
  pages: {
    signIn: '/auth/signin',
    newUser: '/auth/signup',
  },
}

// Helper functions for role-based access control
export function isAdmin(user: { role: string }) {
  return user.role === 'ADMIN'
}

export function isUser(user: { role: string }) {
  return user.role === 'USER'
}

export function canAccessOrganization(
  user: { organizationId: string },
  organizationId: string
) {
  return user.organizationId === organizationId
}
