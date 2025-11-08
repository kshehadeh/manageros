/**
 * Utilities for syncing ManagerOS user data to Clerk session claims
 * This allows us to store orgId, managerOSUserId, etc. in the JWT token
 * so they're available via auth() without database lookups
 */

import { clerkClient } from '@clerk/nextjs/server'
import { prisma } from './db'

/**
 * Sync user data to Clerk's public metadata (which can be included in JWT via templates)
 * This should be called after:
 * - User signs up
 * - User joins/leaves an organization
 * - User's role changes
 * - User links/unlinks their person record
 */
export async function syncUserDataToClerk(clerkUserId: string) {
  try {
    const user = await prisma.user.findUnique({
      where: { clerkUserId },
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
      console.warn(`User not found for clerkUserId: ${clerkUserId}`)
      return
    }

    const client = await clerkClient()

    // Update Clerk user's public metadata with ManagerOS-specific data
    // This metadata can be included in JWT tokens via Clerk's JWT template
    await client.users.updateUserMetadata(clerkUserId, {
      publicMetadata: {
        managerOSUserId: user.id,
        organizationId: user.organizationId || null,
        organizationName: user.organization?.name || null,
        organizationSlug: user.organization?.slug || null,
        personId: user.person?.id || null,
        role: user.role,
      },
    })
  } catch (error) {
    console.error('Error syncing user data to Clerk:', error)
    // Don't throw - this is a non-critical operation
  }
}

/**
 * Get user data from Clerk session claims (if available)
 * Falls back to database lookup if not in claims
 */
export async function getUserFromSessionClaims(clerkUserId: string): Promise<{
  managerOSUserId?: string
  organizationId?: string | null
  organizationName?: string | null
  organizationSlug?: string | null
  personId?: string | null
  role?: string
} | null> {
  try {
    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)

    const publicMetadata = clerkUser.publicMetadata as {
      managerOSUserId?: string
      organizationId?: string | null
      organizationName?: string | null
      organizationSlug?: string | null
      personId?: string | null
      role?: string
    }

    // Only return if we have the ManagerOS user ID (indicates data is synced)
    if (publicMetadata?.managerOSUserId) {
      return publicMetadata
    }

    return null
  } catch (error) {
    console.error('Error getting user from session claims:', error)
    return null
  }
}
