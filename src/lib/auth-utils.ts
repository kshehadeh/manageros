import { auth, clerkClient } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import type { User } from './auth-types'
import { syncUserDataToClerk } from './clerk-session-sync'

// Re-export User type for convenience
export type { User }

/**
 * Get the current authenticated user from Clerk
 * Throws an error if no user is authenticated
 * Use this for server actions and components that must have authentication
 */
export async function getCurrentUser(): Promise<User> {
  // Use treatPendingAsSignedOut: false to handle pending sessions
  const authResult = await auth({ treatPendingAsSignedOut: false })
  const { userId, sessionClaims } = authResult

  if (!userId) {
    throw new Error('Unauthorized')
  }

  // Try to get user data from session claims first (if Session Token is customized in Clerk Dashboard)
  // This avoids a database lookup if the data is in the token
  // NOTE: Custom claims only appear in sessionClaims if the Session Token is customized in
  // Clerk Dashboard (Sessions → Customize session token), NOT just JWT Templates
  const claimsData = sessionClaims.metadata as {
    managerOSUserId?: string
    organizationId?: string | null
    organizationName?: string | null
    organizationSlug?: string | null
    personId?: string | null
    role?: string
  }

  // If we have ManagerOS user ID in claims, use it (data is in JWT)
  if (claimsData?.managerOSUserId) {
    return {
      id: claimsData.managerOSUserId,
      email: (sessionClaims?.email as string) || '',
      name: (sessionClaims?.name as string) || '',
      role: claimsData.role || 'USER',
      organizationId: claimsData.organizationId || null,
      organizationName: claimsData.organizationName || null,
      organizationSlug: claimsData.organizationSlug || null,
      personId: claimsData.personId || null,
    }
  }

  // Fallback to database lookup if not in session claims
  // Look up user in database by Clerk user ID
  let user = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    include: {
      organization: {
        select: {
          name: true,
          slug: true,
        },
      },
      person: {
        select: {
          id: true,
        },
      },
    },
  })

  // If user not found by clerkUserId, try to link by email
  // This handles the case where a user existed before Clerk migration
  if (!user) {
    try {
      // Get user email from Clerk using the Clerk client
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        const email = clerkUser.emailAddresses[0].emailAddress.toLowerCase()

        // Try to find existing user by email
        const existingUser = await prisma.user.findUnique({
          where: { email },
          include: {
            organization: {
              select: {
                name: true,
                slug: true,
              },
            },
            person: {
              select: {
                id: true,
              },
            },
          },
        })

        // If found, link the Clerk user ID to the existing user
        if (existingUser && !existingUser.clerkUserId) {
          user = await prisma.user.update({
            where: { id: existingUser.id },
            data: { clerkUserId: userId },
            include: {
              organization: {
                select: {
                  name: true,
                  slug: true,
                },
              },
              person: {
                select: {
                  id: true,
                },
              },
            },
          })
          // Sync the linked user data to Clerk
          await syncUserDataToClerk(userId)
        }
      }
    } catch (error) {
      // If we can't fetch from Clerk, log and continue
      console.error('Error fetching user from Clerk:', error)
    }
  }

  if (!user) {
    throw new Error('User not found in database')
  }

  // Sync user data to Clerk metadata (for future JWT token inclusion)
  // This is async but we don't wait for it to complete
  syncUserDataToClerk(userId).catch(err => {
    console.error('Failed to sync user data to Clerk:', err)
  })

  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    organizationId: user.organizationId,
    organizationName: user.organization?.name || null,
    organizationSlug: user.organization?.slug || null,
    personId: user.person?.id || null,
  }
}

/**
 * Get the current authenticated user from Clerk
 * Returns null if no user is authenticated (does not throw)
 * Use this for server components wrapped in Suspense to enable static rendering
 */
export async function getOptionalUser(): Promise<User | null> {
  // Use treatPendingAsSignedOut: false to handle pending sessions
  const { userId } = await auth({ treatPendingAsSignedOut: false })

  if (!userId) {
    return null
  }

  try {
    // Look up user in database by Clerk user ID
    const user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
      include: {
        organization: {
          select: {
            name: true,
            slug: true,
          },
        },
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

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      organizationId: user.organizationId,
      organizationName: user.organization?.name || null,
      organizationSlug: user.organization?.slug || null,
      personId: user.person?.id || null,
    }
  } catch {
    return null
  }
}

/**
 * Require authentication with optional organization requirement
 * This is the standard way to handle authorization in page components
 */
export async function requireAuth(options?: {
  requireOrganization?: boolean
  redirectTo?: string
}) {
  const user = await getCurrentUser()

  if (options?.requireOrganization && !user.organizationId) {
    redirect(options.redirectTo || '/organization/create')
  }

  return user
}

/**
 * Get navigation items filtered by user permissions
 * This ensures server-side security for navigation filtering
 * Returns empty array if user is not authenticated (for use in Suspense boundaries)
 */
export async function getFilteredNavigation(user: User | null) {
  if (!user) {
    return []
  }

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'My Tasks', href: '/my-tasks', icon: 'CheckSquare' },
    { name: 'Initiatives', href: '/initiatives', icon: 'Rocket' },
    { name: 'Meetings', href: '/meetings', icon: 'Calendar' },
    { name: 'Reports', href: '/reports', icon: 'BarChart3' },
    {
      name: 'Org Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
    },
  ]

  // Filter navigation based on organization membership and admin role
  return navigation.filter(item => {
    // If user has no organization, only show Dashboard
    if (!user.organizationId) {
      return item.href === '/dashboard'
    }

    // If user has organization, filter by admin role for admin-only items
    return !item.adminOnly || user.role === 'ADMIN'
  })
}

/**
 * Check if the current user can access overviews/synopses for a person.
 * Access is granted if:
 * 1. The user is linked to the person themselves
 * 2. The user is a manager (direct or indirect) of that person
 */
export async function canAccessSynopsesForPerson(
  personId: string
): Promise<boolean> {
  const user = await getCurrentUser()

  if (!user.organizationId || !user.personId) {
    return false
  }

  // Check if user is linked to the person themselves
  if (user.personId === personId) {
    return true
  }

  // Check if user is a manager (direct or indirect) of that person
  const { checkIfManagerOrSelf } = await import('@/lib/utils/people-utils')
  return await checkIfManagerOrSelf(user.personId, personId)
}

// Helper functions for role-based access control
export function isAdmin(user: { role: string }) {
  return user.role === 'ADMIN'
}

export function isUser(user: { role: string }) {
  return user.role === 'USER'
}

export function canAccessOrganization(
  user: { organizationId: string | null },
  organizationId: string
) {
  return user.organizationId === organizationId
}
