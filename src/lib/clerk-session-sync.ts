/**
 * Utilities for syncing ManagerOS user data to Clerk session claims
 * This allows us to store orgId, managerOSUserId, etc. in the session token
 * so they're available via auth() without database lookups
 *
 * IMPORTANT: For custom claims to appear in auth().sessionClaims, you must:
 * 1. Call syncUserDataToClerk() to populate user public metadata
 * 2. Customize the Session Token in Clerk Dashboard (Sessions → Customize session token)
 *    - JWT Templates alone are NOT sufficient for sessionClaims
 */

import { clerkClient, User } from '@clerk/nextjs/server'
import type { UserBrief } from './auth-types'

/**
 * Sync user data to Clerk's public metadata (which can be included in JWT via templates)
 * This should be called after:
 * - User signs up
 * - User joins/leaves an organization
 * - User's role changes
 * - User links/unlinks their person record
 */
export async function syncUserDataToClerk(userBrief: UserBrief) {
  // Check if CLERK_SECRET_KEY is configured
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn(
      'CLERK_SECRET_KEY environment variable is not set. Cannot sync user data to Clerk.'
    )
    return
  }

  if (!userBrief.clerkUserId) {
    console.warn('Cannot sync user data to Clerk. Clerk user ID is not set.')
    return
  }

  const client = await clerkClient()

  // Update Clerk user's public metadata with ManagerOS-specific data
  // This metadata can be included in JWT tokens via Clerk's JWT template
  await client.users.updateUserMetadata(userBrief.clerkUserId, {
    publicMetadata: userBrief,
  })
}

/**
 * Get user data from Clerk session claims (if available)
 * Falls back to database lookup if not in claims
 */
export async function getUserFromClerk(
  clerkUserId: string
): Promise<User | null> {
  try {
    // Check if CLERK_SECRET_KEY is configured
    if (!process.env.CLERK_SECRET_KEY) {
      console.warn(
        'CLERK_SECRET_KEY environment variable is not set. Cannot fetch user from Clerk.'
      )
      return null
    }

    const client = await clerkClient()
    const clerkUser = await client.users.getUser(clerkUserId)
    return clerkUser
  } catch (error) {
    console.error('Error getting user from session claims:', error)
    return null
  }
}
