import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { cookies } from 'next/headers'
import { prisma, withConnectionPoolRetry } from './db'
import {
  OrganizationBrief,
  UserBriefSchema,
  type UserBrief,
} from './auth-types'
import { getUserFromClerk, syncUserDataToClerk } from './clerk'
import z from 'zod'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { getClerkOrganization } from './clerk'
import { combineName } from '@/lib/utils/name-utils'
import { getTaskAccessWhereClause } from '@/lib/task-access-utils'

// Cookie name for tracking organization removal
const ORG_REMOVED_COOKIE = 'manageros_org_removed'

/**
 * Check if the user was recently removed from an organization
 * This reads a short-lived cookie set by /api/auth/org-removed route handler
 * The cookie expires after 60 seconds
 *
 * Note: Cookie deletion is not performed here because cookies are read-only
 * in server components/pages. The cookie will expire automatically.
 */
export async function wasRemovedFromOrganization(): Promise<boolean> {
  const cookieStore = await cookies()
  try {
    const removed = cookieStore.get(ORG_REMOVED_COOKIE)
    if (removed?.value === 'true') {
      return true
    }
  } catch {
    // Ignore cookie errors
  }
  return false
}

const SessionClaimsSchema = z.object({
  email: z.string().optional().nullable(),
  name: z.string().optional().nullable(),
  azp: z.string().optional().nullable(),
  exp: z.number(),
  fea: z.string().optional().nullable(),
  fva: z.array(z.number()).optional().nullable(),
  iat: z.number().optional().nullable(),
  iss: z.string().optional().nullable(),
  jti: z.string().optional().nullable(),
  nbf: z.number().optional().nullable(),
  pla: z.string().optional().nullable(),
  sid: z.string().optional().nullable(),
  sts: z.string().optional().nullable(),
  sub: z.string().optional().nullable(),
  v: z.number().optional().nullable(),
  o: z
    .object({
      id: z.string().optional().nullable(),
      rol: z.string().optional().nullable(),
      slg: z.string().optional().nullable(),
    })
    .optional()
    .nullable(),
  metadata: z.union([UserBriefSchema.optional().nullable(), z.object({})]),
})

export type SessionClaims = z.infer<typeof SessionClaimsSchema>

/**
 * Get the current authenticated user from Clerk
 * Throws an error if no user is authenticated
 * Use this for server actions and components that must have authentication
 *
 * ## Function Flow
 *
 * 1. **Authentication Check**: Validates that user is authenticated via Clerk
 * 2. **Session Claims Validation**: Validates and parses session claims from JWT
 * 3. **Initial Sync Object**: Builds UserBrief from session claims metadata
 * 4. **Organization Mismatch Detection**: Detects when Clerk org differs from metadata
 * 5. **User Record Resolution**: Ensures ManagerOS user record exists in database
 * 6. **Organization Resolution**: Ensures ManagerOS organization exists for Clerk org
 * 7. **Person Link Resolution**: Resolves person link if user is linked to a person
 * 8. **Metadata Sync**: Syncs updated data back to Clerk public metadata
 *
 * ## Edge Cases and Potential Issues
 *
 * ### 1. User Removed from Organization
 * **Scenario**: User is removed from Clerk organization but still has active session
 * **Current Behavior**:
 *   - Lines 84-91: Detects org removal and clears org-related fields
 *   - Sets organization fields to null
 *   - Syncs cleared data back to Clerk
 * **Issue**: User may still have stale session claims until next token refresh
 * **Impact**: Medium - User may see inconsistent state until session refresh
 *
 * ### 2. Organization Switched in Clerk
 * **Scenario**: User switches organizations in Clerk UI
 * **Current Behavior**:
 *   - Lines 92-96: Detects org change and forces revalidation
 *   - Revalidates all links (user, org, person)
 * **Issue**: Person link may be invalid in new organization
 * **Impact**: Medium - Person link may need to be cleared if person belongs to old org
 *
 * ### 3. Clerk User Deleted but Session Still Valid
 * **Scenario**: Clerk user account deleted but JWT still valid
 * **Current Behavior**:
 *   - Lines 110-123: Attempts to fetch user from Clerk API
 *   - Throws error if Clerk user not found
 * **Issue**: Error message may not be user-friendly
 * **Impact**: Low - Proper error handling exists
 *
 * ### 4. Organization Deleted in Clerk but Still in Database
 * **Scenario**: Organization deleted in Clerk but ManagerOS org record exists
 * **Current Behavior**:
 *   - Lines 149-156: Attempts to fetch org from Clerk API
 *   - Throws error if Clerk org not found
 * **Issue**: Should handle gracefully - user may be in invalid state
 * **Impact**: High - User may be stuck with invalid organization reference
 *
 * ### 5. Person Link Invalid After Org Change (FIXED)
 * **Scenario**: User switches orgs, but personId points to person in old org
 * **Current Behavior**:
 *   - Validates that person belongs to user's current organization
 *   - Clears person link if person doesn't belong to current org
 * **Status**: Fixed - Person link is now validated against current organization
 *
 * ### 6. Race Condition: Multiple Concurrent Calls
 * **Scenario**: Multiple requests call getCurrentUser simultaneously during org switch
 * **Current Behavior**: No locking mechanism
 * **Issue**: May create duplicate organizations or inconsistent state
 * **Impact**: Medium - Could cause data integrity issues
 *
 * ### 7. Clerk API Failures
 * **Scenario**: Clerk API is down or rate-limited
 * **Current Behavior**:
 *   - getUserFromClerk returns null, throws error
 *   - getClerkOrganization returns null, throws error
 * **Issue**: No retry logic or graceful degradation
 * **Impact**: High - Function will fail completely if Clerk API unavailable
 *
 * ### 8. Missing Email Address
 * **Scenario**: Clerk user has no primary email address
 * **Current Behavior**:
 *   - Lines 111-123: Throws error if no email
 * **Issue**: May prevent legitimate users from accessing system
 * **Impact**: Medium - May block users with incomplete Clerk profiles
 *
 * ### 9. Organization Auto-Creation Side Effects
 * **Scenario**: Organization auto-created when user joins Clerk org
 * **Current Behavior**:
 *   - Lines 164-169: Creates org with current user as billingUserId
 * **Issue**: First user to join becomes billing user, may not be intended
 * **Impact**: Medium - Billing user assignment may be incorrect
 *
 * ### 10. Person Belongs to Different Organization (FIXED)
 * **Scenario**: User's personId points to person in different organization
 * **Current Behavior**:
 *   - Validates person belongs to user's current organization
 *   - Clears person link and updates database if mismatch detected
 * **Status**: Fixed - Cross-org person access is now prevented
 *
 * ### 11. Session Claims Stale After Database Update
 * **Scenario**: User data updated in database but session claims not refreshed
 * **Current Behavior**:
 *   - Relies on resync flag to update Clerk metadata
 *   - But session claims may not update until next token refresh
 * **Issue**: Stale data in session claims until token refresh
 * **Impact**: Low - Data eventually consistent
 *
 * ### 12. User Has Multiple Organizations
 * **Scenario**: User is member of multiple Clerk organizations
 * **Current Behavior**:
 *   - Only handles single organization from session claims
 * **Issue**: System assumes single org per user
 * **Impact**: Low - Current design supports single org
 *
 * ## Remaining Edge Cases
 *
 * 1. ~~**Person Link Validation**: No check that personId belongs to user's organization~~ (FIXED)
 * 2. **Organization Membership Validation**: No verification that user is actually member of org in Clerk
 * 3. **Role Synchronization**: Role from Clerk may not match ManagerOS role (billing user check missing)
 * 4. **Concurrent Modification Protection**: No locking for org creation or user updates
 * 5. **Error Recovery**: No retry logic for Clerk API failures
 * 6. **Partial Failure Handling**: If syncUserDataToClerk fails, function still returns success
 * 7. ~~**Organization Deletion**: No handling for org deleted in Clerk but exists in ManagerOS~~ (FIXED via webhook)
 * 8. **User Deletion**: No handling for user deleted in Clerk but exists in ManagerOS
 * 9. **Email Change**: No handling for email change in Clerk
 * 10. **Name Change**: No handling for name change in Clerk
 */
export async function getCurrentUser(
  options: { revalidateLinks?: boolean } = {}
): Promise<UserBrief> {
  // Use treatPendingAsSignedOut: false to handle pending sessions
  const authResult = await auth({ treatPendingAsSignedOut: false })
  const { userId, sessionClaims } = authResult

  if (!userId) {
    throw new Error('Unauthorized')
  }

  const sessionClaimsValidated = SessionClaimsSchema.safeParse(sessionClaims)
  if (!sessionClaimsValidated.success) {
    throw new Error('Invalid session claims')
  }

  // Now assemble a user brief object based on what we have so far.
  let resync = false
  const syncObject = {
    email: sessionClaimsValidated.data.metadata?.email,
    name: sessionClaimsValidated.data.metadata?.name,
    clerkUserId: userId,
    clerkOrganizationId: sessionClaimsValidated.data.o?.id || null,
    managerOSOrganizationId:
      sessionClaimsValidated.data.metadata?.managerOSOrganizationId || null,
    managerOSPersonId:
      sessionClaimsValidated.data.metadata?.managerOSPersonId || null,
    role: sessionClaimsValidated.data.o?.rol,
    managerOSUserId:
      sessionClaimsValidated.data.metadata?.managerOSUserId || '',
  }

  // Check if the organization in the "o" claim differs from the metadata
  // This can happen when a user switches organizations in Clerk or leaves an organization
  const clerkOrgId = sessionClaimsValidated.data.o?.id
  const metadataClerkOrgId =
    sessionClaimsValidated.data.metadata?.clerkOrganizationId

  if (!clerkOrgId && metadataClerkOrgId) {
    // User has no organization in Clerk but metadata still has one
    // This means the user was removed from their organization
    // Clear all organization-related data
    syncObject.clerkOrganizationId = null
    syncObject.managerOSOrganizationId = null
    syncObject.managerOSPersonId = null
    syncObject.role = null
    resync = true

    // Note: Cookie setting is handled by /api/auth/org-removed route handler
    // because cookies are read-only in server components/pages
  } else if (
    clerkOrgId &&
    metadataClerkOrgId &&
    clerkOrgId !== metadataClerkOrgId
  ) {
    // Organization has changed - force revalidation of all links
    options.revalidateLinks = true
    resync = true
  }

  // If we don't have a user ID then try to get it.
  if (
    options.revalidateLinks ||
    !sessionClaimsValidated?.data.metadata?.managerOSUserId
  ) {
    // First check if we have a user object in the database for the clerk user.
    let user = await prisma.user.findUnique({
      where: { clerkUserId: userId },
    })

    if (!user) {
      // If we don't have a user object in the database then we need to create one.
      const clerkUser = await getUserFromClerk(userId)
      if (clerkUser && clerkUser.primaryEmailAddress?.emailAddress) {
        const email = clerkUser.primaryEmailAddress.emailAddress.toLowerCase()

        // Check if a user with this email already exists (but without a clerkUserId)
        const existingUserByEmail = await prisma.user.findUnique({
          where: { email },
        })

        if (existingUserByEmail) {
          // Only link if the existing user doesn't already have a clerkUserId
          // (if they do, it means there's a data inconsistency - the initial query should have found them)
          if (existingUserByEmail.clerkUserId) {
            // This shouldn't happen, but if it does, log a warning and use the existing user
            console.warn(
              `User with email ${email} already has clerkUserId ${existingUserByEmail.clerkUserId}, but we're trying to link ${userId}. Using existing user.`
            )
            user = existingUserByEmail
          } else {
            // Link the existing user to this Clerk account
            user = await prisma.user.update({
              where: { id: existingUserByEmail.id },
              data: {
                clerkUserId: userId,
                name: combineName(clerkUser.firstName, clerkUser.lastName),
              },
            })
          }
        } else {
          // Create a new user
          user = await prisma.user.create({
            data: {
              clerkUserId: userId,
              email,
              name: combineName(clerkUser.firstName, clerkUser.lastName),
            },
          })
        }
      } else {
        // The clerk user could not be found.  This is a fatal error and
        //  means that we cannot proceed.
        throw new Error('Clerk user could not be found - this is a fatal error')
      }
    }

    // Now set the managerOSUserId and clerkUserId in the sync object.
    syncObject.managerOSUserId = user.id
    syncObject.clerkUserId = userId
  }

  // Now we check if there's an organization associated with the user AND
  //  if there's one associated with the session claims (meaning one has been setup in clerk)
  if (
    sessionClaimsValidated.data.o?.id &&
    (options.revalidateLinks ||
      (sessionClaimsValidated.data.o?.id &&
        (!syncObject.managerOSOrganizationId ||
          !syncObject.clerkOrganizationId)))
  ) {
    const clerkOrgId = sessionClaimsValidated.data.o?.id

    // Validate that clerkOrganizationId is not empty or invalid
    if (!clerkOrgId || clerkOrgId.trim() === '') {
      // Invalid clerkOrganizationId - clear organization data
      syncObject.clerkOrganizationId = null
      syncObject.managerOSOrganizationId = null
      syncObject.managerOSPersonId = null
      syncObject.role = null
      resync = true
    } else {
      // First verify the organization still exists in Clerk
      // This handles the case where an org is deleted in Clerk but session claims are stale
      const clerkOrganization = await getClerkOrganization(clerkOrgId)
      let organization = null

      if (!clerkOrganization) {
        // Clerk organization doesn't exist - it was deleted
        // Clear organization data
        syncObject.clerkOrganizationId = null
        syncObject.managerOSOrganizationId = null
        syncObject.managerOSPersonId = null
        syncObject.role = null
        resync = true

        // Note: Cookie setting is handled by /api/auth/org-removed route handler
        // because cookies are read-only in server components/pages
      } else {
        // Organization exists in Clerk - now check our database
        organization = await prisma.organization.findUnique({
          where: {
            clerkOrganizationId: clerkOrgId,
          },
        })

        if (!organization) {
          // Check again if the organization already exists in our database (race condition protection)
          organization = await prisma.organization.findUnique({
            where: { clerkOrganizationId: clerkOrganization.id },
          })

          if (!organization) {
            // If the organization doesn't exist in our database then we need to create it.
            // Subscription information is stored in Clerk, not in our database
            // Use upsert to handle race conditions where multiple requests try to create simultaneously
            try {
              organization = await prisma.organization.create({
                data: {
                  clerkOrganizationId: clerkOrganization.id,
                },
              })
            } catch (error: unknown) {
              // Handle unique constraint violation (race condition)
              if (
                error &&
                typeof error === 'object' &&
                'code' in error &&
                error.code === 'P2002'
              ) {
                // Organization was created by another request - fetch it
                organization = await prisma.organization.findUnique({
                  where: { clerkOrganizationId: clerkOrganization.id },
                })
              } else {
                // Re-throw other errors
                throw error
              }
            }
          }
        }
      }

      // Only update sync object if we successfully found/created an organization
      if (organization) {
        syncObject.managerOSOrganizationId = organization.id
        syncObject.clerkOrganizationId = organization.clerkOrganizationId
        // Only resync if organization data actually changed
        const currentMetadata = sessionClaimsValidated.data.metadata
        if (
          !currentMetadata ||
          currentMetadata.managerOSOrganizationId !== organization.id ||
          currentMetadata.clerkOrganizationId !==
            organization.clerkOrganizationId
        ) {
          resync = true
        }
      }
    }
  }

  if (options.revalidateLinks || !syncObject.managerOSPersonId) {
    // Check if the current user is linked to a person.
    const user = await prisma.user.findUnique({
      where: { id: syncObject.managerOSUserId || '' },
    })
    if (user && user.personId) {
      // Validate that person belongs to user's current organization
      // This prevents cross-organization data access when user switches orgs
      if (syncObject.managerOSOrganizationId) {
        const person = await prisma.person.findFirst({
          where: {
            id: user.personId,
            organizationId: syncObject.managerOSOrganizationId,
          },
        })
        if (!person) {
          // Person doesn't belong to current org - clear the link
          syncObject.managerOSPersonId = null
          await prisma.user.update({
            where: { id: user.id },
            data: { personId: null },
          })
          resync = true
        } else {
          syncObject.managerOSPersonId = user.personId
          // Only resync if person link actually changed
          const currentMetadata = sessionClaimsValidated.data.metadata
          if (
            !currentMetadata ||
            currentMetadata.managerOSPersonId !== user.personId
          ) {
            resync = true
          }
        }
      } else {
        // User has no organization, clear person link
        syncObject.managerOSPersonId = null
        await prisma.user.update({
          where: { id: user.id },
          data: { personId: null },
        })
        resync = true
      }
    }
  }

  if (resync) {
    // Only sync if data actually changed to avoid unnecessary Clerk API calls
    // Compare current syncObject with what's in session claims metadata
    const currentMetadata = sessionClaimsValidated.data.metadata
    const hasDataChanged =
      !currentMetadata ||
      currentMetadata.managerOSUserId !== syncObject.managerOSUserId ||
      currentMetadata.managerOSOrganizationId !==
        syncObject.managerOSOrganizationId ||
      currentMetadata.managerOSPersonId !== syncObject.managerOSPersonId ||
      currentMetadata.clerkOrganizationId !== syncObject.clerkOrganizationId ||
      currentMetadata.email !== syncObject.email ||
      currentMetadata.name !== syncObject.name

    if (hasDataChanged) {
      // TODO: Handle sync failures gracefully
      // If sync fails, we should log but not fail the entire request
      await syncUserDataToClerk(syncObject)
    }
  }

  return syncObject
}

export async function getCurrentUserWithPersonAndOrganization(options?: {
  includeOrganizationDetails?: boolean
}) {
  // Get current user - use session claims by default to avoid unnecessary Clerk API calls
  // Only revalidate when explicitly needed (e.g., after org switch)
  const user = await getCurrentUser()
  const person = await withConnectionPoolRetry(() =>
    prisma.person.findUnique({
      where: { id: user.managerOSPersonId || '' },
      select: {
        id: true,
        name: true,
        email: true,
        role: true,
        avatar: true,
      },
    })
  )

  let organizationBrief: OrganizationBrief | null = null

  // Only fetch organization details from Clerk if explicitly requested
  // This avoids unnecessary API calls when name/slug aren't needed
  if (user.managerOSOrganizationId && options?.includeOrganizationDetails) {
    const organization = await withConnectionPoolRetry(() =>
      prisma.organization.findUnique({
        where: { id: user.managerOSOrganizationId || '' },
        select: {
          id: true,
          clerkOrganizationId: true,
        },
      })
    )

    if (organization) {
      const clerkOrganization = await getClerkOrganization(
        organization.clerkOrganizationId || ''
      )
      if (clerkOrganization) {
        organizationBrief = {
          id: organization.id,
          clerkOrganizationId: organization.clerkOrganizationId,
          name: clerkOrganization.name,
          slug: clerkOrganization.slug,
        } satisfies OrganizationBrief
      }
    }
  } else if (user.managerOSOrganizationId) {
    // Return basic org info without Clerk API call
    const organization = await withConnectionPoolRetry(() =>
      prisma.organization.findUnique({
        where: { id: user.managerOSOrganizationId || '' },
        select: {
          id: true,
          clerkOrganizationId: true,
        },
      })
    )

    if (organization) {
      organizationBrief = {
        id: organization.id,
        clerkOrganizationId: organization.clerkOrganizationId,
        name: null,
        slug: null,
      } satisfies OrganizationBrief
    }
  }

  return {
    user,
    person,
    organization: organizationBrief,
  }
}

/**
 * Require authentication with optional organization requirement
 * This is the standard way to handle authorization in page components
 *
 * @param options.requireOrganization - If true, redirects to organization setup if no org
 * @param options.requireAdmin - If true, redirects if user is not an admin/owner
 * @param options.redirectTo - Custom redirect path (defaults to appropriate page)
 */
export async function requireAuth(options?: {
  requireOrganization?: boolean
  requireAdmin?: boolean
  redirectTo?: string
}) {
  const user = await getCurrentUser()

  // If organization is required but user doesn't have one, redirect to route handler
  // that sets cookie (for removed users) and then redirects to org setup
  if (options?.requireOrganization && !user.managerOSOrganizationId) {
    redirect(options.redirectTo || '/api/auth/org-removed')
  }

  // If admin is required but user is not admin/owner, redirect to dashboard
  if (options?.requireAdmin && !isAdminOrOwner(user)) {
    redirect(options.redirectTo || '/dashboard')
  }

  return user
}

/**
 * Require organization membership for a page
 * This is a convenience helper that enforces organization membership
 * and redirects to the organization setup page if not a member
 *
 * Use this for pages that absolutely require organization context
 */
export async function requireOrganization() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/api/auth/org-removed')
  }

  return user
}

/**
 * Require admin/owner role for a page
 * This enforces both organization membership and admin status
 *
 * Use this for admin-only pages like organization settings
 */
export async function requireAdmin() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/api/auth/org-removed')
  }

  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  return user
}

/**
 * Get navigation items filtered by user permissions
 * This ensures server-side security for navigation filtering
 * Returns empty array if user is not authenticated (for use in Suspense boundaries)
 */
export async function getFilteredNavigation(user: UserBrief | null) {
  if (!user) {
    return []
  }

  interface NavigationItem {
    name: string
    href: string
    icon: string
    adminOnly: boolean
    requiresPermission?: PermissionType
    badgeCount?: number
    badgeVariant?:
      | 'default'
      | 'secondary'
      | 'destructive'
      | 'outline'
      | 'success'
      | 'warning'
      | 'error'
      | 'info'
      | 'neutral'
    section?: string
  }

  const navigation: NavigationItem[] = [
    {
      name: 'Dashboard',
      href: '/dashboard',
      icon: 'Home',
      adminOnly: false,
    },
    {
      name: 'My Tasks',
      href: '/my-tasks',
      icon: 'CheckSquare',
      adminOnly: false,
      section: 'Planning',
    },
    {
      name: 'Initiatives',
      href: '/initiatives',
      icon: 'Rocket',
      adminOnly: false,
      section: 'Planning',
    },
    {
      name: 'Meetings',
      href: '/meetings',
      icon: 'Calendar',
      adminOnly: false,
      section: 'Planning',
    },
    {
      name: 'Notes',
      href: '/notes',
      icon: 'FileText',
      adminOnly: false,
      section: 'Planning',
    },
    {
      name: 'People',
      href: '/people',
      icon: 'User',
      adminOnly: false,
      section: 'Teams and People',
    },
    {
      name: 'Teams',
      href: '/teams',
      icon: 'Users2',
      adminOnly: false,
      section: 'Teams and People',
    },
    {
      name: '360 Feedback',
      href: '/feedback-campaigns',
      icon: 'MessageSquare',
      adminOnly: false,
      section: 'Teams and People',
    },
    {
      name: 'Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
      section: 'Organization',
    },
    {
      name: 'Job Roles',
      href: '/organization/job-roles',
      icon: 'Briefcase',
      adminOnly: true,
      section: 'Organization',
    },
    {
      name: 'Notifications',
      href: '/notifications',
      icon: 'Bell',
      adminOnly: false,
      section: 'Organization',
    },
  ]

  // Filter navigation based on organization membership and admin role
  const filteredNavigation = await Promise.all(
    navigation.map(async item => {
      // If user has no organization, only show Dashboard
      if (!user.managerOSOrganizationId) {
        return item.href === '/dashboard' ? item : null
      }

      // Hide "My Tasks" if user doesn't have a linked person
      if (item.href === '/my-tasks' && !user.managerOSPersonId) {
        return null
      }

      // Check permission-based access
      if (item.requiresPermission) {
        const hasPermission = await getActionPermission(
          user,
          item.requiresPermission
        )
        if (!hasPermission) {
          return null
        }
      }

      // If user has organization, filter by admin role for admin-only items
      if (item.adminOnly && !isAdminOrOwner(user)) {
        return null
      }

      return item
    })
  )

  return filteredNavigation.filter(
    (item): item is NonNullable<typeof item> => item !== null
  )
}

/**
 * Check if a user is an admin or owner in a specific organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<boolean> indicating if the user is an admin or owner in that organization
 */
export async function isAdminOrOwnerInOrganization(
  user: UserBrief
): Promise<boolean> {
  return (
    user.role?.toLowerCase() === 'admin' || user.role?.toLowerCase() === 'owner'
  )
}

/**
 * Get the role of a user in a specific organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<string | null> The role ('ADMIN', 'OWNER', or 'USER') or null if not a member
 */
export async function getUserRoleInOrganization(
  user: UserBrief
): Promise<string | null> {
  return user.role?.toLowerCase() || null
}

// Helper functions for role-based access control
// These use the role from the User object which is already org-scoped via getCurrentUser
export function isAdmin(user: UserBrief) {
  return user.role?.toLowerCase() === 'admin'
}

/**
 * Check if a user is an owner (has admin rights and is the billable user)
 * @param user - User object with role property
 * @returns boolean indicating if the user is an owner
 */
export function isOwner(user: UserBrief) {
  return user.role?.toLowerCase() === 'owner'
}

/**
 * Check if a user is an admin or owner (both have admin-level permissions)
 * @param user - User object with role property
 * @returns boolean indicating if the user has admin-level permissions
 */
export function isAdminOrOwner(user: UserBrief) {
  return isAdmin(user) || isOwner(user)
}

export function isUser(user: UserBrief) {
  return user.role?.toLowerCase() === 'user'
}

export function canAccessOrganization(user: UserBrief, organizationId: string) {
  return user.managerOSOrganizationId === organizationId
}

/**
 * Type for permission check functions
 * Can be synchronous (for simple checks) or asynchronous (for entity lookups)
 */
type PermissionCheck = (
  user: UserBrief,
  id?: string
) => boolean | Promise<boolean>

/**
 * All possible permission keys in the system
 * This is the single source of truth for all permission identifiers
 */
const _PERMISSION_KEYS = [
  'task.create',
  'task.edit',
  'task.delete',
  'task.view',
  'meeting.create',
  'meeting.edit',
  'meeting.delete',
  'meeting.view',
  'person.create',
  'person.import',
  'person.edit',
  'person.delete',
  'person.view',
  'meeting-instance.create',
  'meeting-instance.edit',
  'meeting-instance.delete',
  'meeting-instance.view',
  'initiative.create',
  'initiative.edit',
  'initiative.delete',
  'initiative.view',
  'report.access',
  'report.create',
  'report.edit',
  'report.delete',
  'report.view',
  'feedback.create',
  'feedback.edit',
  'feedback.delete',
  'feedback.view',
  'oneonone.create',
  'oneonone.edit',
  'oneonone.delete',
  'oneonone.view',
  'feedback-campaign.create',
  'feedback-campaign.edit',
  'feedback-campaign.delete',
  'feedback-campaign.view',
  'user.link-person',
  'person.overview.view',
  'job-role.create',
  'job-role.edit',
  'job-role.delete',
  'job-role.view',
  'organization.invitation.view',
  'note.create',
  'note.edit',
  'note.delete',
  'note.view',
] as const

/**
 * Union type of all possible permission keys
 */
export type PermissionType = (typeof _PERMISSION_KEYS)[number]

/**
 * Permission map that maps action IDs to their permission check functions
 */
const PermissionMap: Record<PermissionType, PermissionCheck> = {
  // Task permissions
  'task.create': user => {
    return (
      (isAdminOrOwner(user) || !!user.managerOSPersonId) &&
      !!user.managerOSOrganizationId
    )
  },
  'task.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user created task OR user is assigned to task
    // Also verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          {
            createdById: user.managerOSUserId || '',
          },
          {
            assigneeId: user.managerOSPersonId,
            OR: [
              {
                initiative: {
                  organizationId: user.managerOSOrganizationId || '',
                },
              },
              {
                objective: {
                  initiative: { organizationId: user.managerOSOrganizationId },
                },
              },
            ],
          },
        ],
      },
    })

    return !!task
  },
  'task.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user created task OR user is assigned to task
    // Also verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          {
            createdById: user.managerOSUserId || '',
          },
          {
            assigneeId: user.managerOSPersonId,
            OR: [
              {
                initiative: {
                  organizationId: user.managerOSOrganizationId || '',
                },
              },
              {
                objective: {
                  initiative: {
                    organizationId: user.managerOSOrganizationId || '',
                  },
                },
              },
            ],
          },
        ],
      },
    })

    return !!task
  },
  'task.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Verify task belongs to user's organization using the same access pattern
    // as other task operations for consistency
    const task = await prisma.task.findFirst({
      where: {
        id,
        ...getTaskAccessWhereClause(
          user.managerOSOrganizationId,
          user.managerOSUserId || '',
          user.managerOSPersonId || undefined
        ),
      },
    })

    return !!task
  },

  // Meeting permissions
  'meeting.create': user => {
    return !!user.managerOSPersonId && !!user.managerOSOrganizationId
  },
  'meeting.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId || '' },
    })

    if (!currentPerson) return false

    // Check if user created meeting OR user is owner OR user is participant
    // ADMIN users can edit any meeting in their organization
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        ...(isAdminOrOwner(user)
          ? {}
          : {
              OR: [
                { createdById: user.managerOSUserId || '' },
                { ownerId: currentPerson.id },
                {
                  participants: {
                    some: {
                      personId: currentPerson.id,
                    },
                  },
                },
              ],
            }),
      },
    })

    return !!meeting
  },
  'meeting.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId },
    })

    if (!currentPerson) return false

    // Check if user created meeting OR user is owner
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        OR: [
          { createdById: user.managerOSUserId || '' },
          { ownerId: currentPerson.id },
        ],
      },
    })

    return !!meeting
  },
  'meeting.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id || !user.managerOSPersonId) {
      return !!user.managerOSOrganizationId
    } else {
      // If the meeting exists AND is in the user's organization AND the user is an admin OR the user is the creator, owner or participant then
      // allow the user to view the meeting
      const meeting = await prisma.meeting.findFirst({
        where: {
          id,
          organizationId: user.managerOSOrganizationId,
          OR: [
            { createdById: user.managerOSUserId || '' },
            { ownerId: user.managerOSPersonId },
            { participants: { some: { personId: user.managerOSPersonId } } },
          ],
        },
      })

      return !!meeting
    }
  },

  // Meeting Instance permissions
  'meeting-instance.create': user => {
    return !!user.managerOSPersonId && !!user.managerOSOrganizationId
  },
  'meeting-instance.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId || '' },
    })

    if (!currentPerson) return false

    // Check if meeting instance exists and user has permission to edit it
    // User can edit if they can edit the parent meeting OR they are a participant of the instance
    // ADMIN users can edit any meeting instance in their organization
    const meetingInstance = await prisma.meetingInstance.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId || '',
      },
      include: {
        meeting: true,
        participants: true,
      },
    })

    if (!meetingInstance) return false

    // Check if user is participant of the instance
    const isInstanceParticipant = meetingInstance.participants.some(
      p => p.personId === user.managerOSPersonId
    )

    if (isInstanceParticipant) return true
    if (isAdminOrOwner(user)) return true
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingInstance.meetingId,
        organizationId: user.managerOSOrganizationId || '',
        OR: [
          { createdById: user.managerOSUserId || '' },
          { ownerId: user.managerOSPersonId || '' },
          {
            participants: {
              some: {
                personId: user.managerOSPersonId || '',
              },
            },
          },
        ],
      },
    })

    return !!meeting
  },
  'meeting-instance.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId || '' },
    })

    if (!currentPerson) return false

    // Check if meeting instance exists
    const meetingInstance = await prisma.meetingInstance.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId || '',
      },
      include: {
        meeting: true,
      },
    })

    if (!meetingInstance) return false

    // Check parent meeting permissions (same as meeting.delete)
    // User can delete if they created the meeting OR they are the owner
    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingInstance.meetingId,
        organizationId: user.managerOSOrganizationId || '',
        OR: [
          { createdById: user.managerOSUserId || '' },
          { ownerId: currentPerson.id },
        ],
      },
    })

    return !!meeting
  },
  'meeting-instance.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Get current user's person record (may be null if not linked)
    const currentPerson = user.managerOSPersonId
      ? await prisma.person.findFirst({
          where: {
            id: user.managerOSPersonId,
            organizationId: user.managerOSOrganizationId,
          },
        })
      : null

    // Check if meeting instance exists and user has access
    // User can view if:
    // 1. Meeting is public (isPrivate: false)
    // 2. User is creator of the parent meeting
    // 3. User is owner of the parent meeting
    // 4. User is participant of the instance
    // 5. User is participant of the parent meeting
    const meetingInstance = await prisma.meetingInstance.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        OR: [
          // Meeting is public
          {
            meeting: {
              isPrivate: false,
            },
          },
          // User is creator of the meeting
          {
            meeting: {
              createdById: user.managerOSUserId || '',
            },
          },
          // User is owner of the meeting
          ...(currentPerson
            ? [
                {
                  meeting: {
                    ownerId: currentPerson.id,
                  },
                },
              ]
            : []),
          // User is participant of the instance
          ...(currentPerson
            ? [
                {
                  participants: {
                    some: {
                      personId: currentPerson.id,
                    },
                  },
                },
              ]
            : []),
          // User is participant of the parent meeting
          ...(currentPerson
            ? [
                {
                  meeting: {
                    participants: {
                      some: {
                        personId: currentPerson.id,
                      },
                    },
                  },
                },
              ]
            : []),
        ],
      },
    })

    return !!meetingInstance
  },

  // Initiative permissions
  'initiative.create': user => {
    return (
      (isAdminOrOwner(user) || !!user.managerOSPersonId) &&
      !!user.managerOSOrganizationId
    )
  },
  'initiative.edit': async (user, id) => {
    if (!user.managerOSOrganizationId) return false
    if (!isAdminOrOwner(user)) return false

    if (!id) {
      return isAdminOrOwner(user) && !!user.managerOSOrganizationId
    }

    // Verify initiative belongs to user's organization
    const initiative = await prisma.initiative.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!initiative
  },
  'initiative.delete': async (user, id) => {
    if (!user.managerOSOrganizationId) return false
    if (!isAdminOrOwner(user)) return false

    if (!id) {
      return isAdminOrOwner(user) && !!user.managerOSOrganizationId
    }

    // Verify initiative belongs to user's organization
    const initiative = await prisma.initiative.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!initiative
  },
  'initiative.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Verify initiative belongs to user's organization
    const initiative = await prisma.initiative.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!initiative
  },

  // Report permissions
  'report.access': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'report.create': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'report.edit': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'report.delete': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'report.view': user => {
    return !!user.managerOSOrganizationId
  },

  // Feedback permissions
  'feedback.create': user => {
    return (
      (isAdminOrOwner(user) || !!user.managerOSPersonId) &&
      !!user.managerOSOrganizationId
    )
  },
  'feedback.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId },
    })

    if (!currentPerson) return false

    // Check if user is the creator (fromId)
    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        fromId: currentPerson.id,
        about: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })

    return !!feedback
  },
  'feedback.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { id: user.managerOSPersonId },
    })

    if (!currentPerson) return false

    // Check if user is the creator (fromId)
    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        fromId: currentPerson.id,
        about: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })

    return !!feedback
  },
  'feedback.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Verify feedback belongs to user's organization
    // Feedback is visible if:
    // 1. It's public (isPrivate: false) AND the person it's about belongs to the user's organization, OR
    // 2. It's private (isPrivate: true) AND the user is the author AND the person it's about belongs to the user's organization
    const currentPerson = user.managerOSPersonId
      ? await prisma.person.findFirst({
          where: { id: user.managerOSPersonId },
        })
      : null

    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        about: {
          organizationId: user.managerOSOrganizationId,
        },
        OR: [
          { isPrivate: false }, // Public feedback
          ...(currentPerson
            ? [{ fromId: currentPerson.id }] // Private feedback by current user
            : []),
        ],
      },
    })

    return !!feedback
  },

  // One-on-One permissions
  'oneonone.create': user => {
    return (
      (isAdminOrOwner(user) || !!user.managerOSPersonId) &&
      !!user.managerOSOrganizationId
    )
  },
  'oneonone.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
          {
            reportId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },
  'oneonone.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
          {
            reportId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },
  'oneonone.view': async (user, id) => {
    if (!user.managerOSOrganizationId) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId || !id) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
          {
            reportId: user.managerOSPersonId,
            manager: { organizationId: user.managerOSOrganizationId },
            report: { organizationId: user.managerOSOrganizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },

  // Feedback Campaign permissions
  'feedback-campaign.create': user => {
    return (
      (isAdminOrOwner(user) || !!user.managerOSPersonId) &&
      !!user.managerOSOrganizationId
    )
  },
  'feedback-campaign.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.managerOSUserId || '',
        targetPerson: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })

    return !!campaign
  },
  'feedback-campaign.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.managerOSUserId || '',
        targetPerson: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })

    return !!campaign
  },
  'feedback-campaign.view': async (user, id) => {
    if (!user.managerOSOrganizationId) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId) return false

    if (!id) {
      // Viewing list - user can see their own campaigns
      return true
    }

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.managerOSUserId || '',
        targetPerson: {
          organizationId: user.managerOSOrganizationId,
        },
      },
    })

    return !!campaign
  },

  // Person permissions
  'person.create': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'person.import': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'person.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (!isAdminOrOwner(user)) return false

    // Verify person belongs to user's organization
    const person = await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!person
  },
  'person.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (!isAdminOrOwner(user)) return false

    // Verify person belongs to user's organization
    const person = await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!person
  },
  'person.view': async (user, id) => {
    if (!user.managerOSOrganizationId) return false

    // If no ID provided, user can view people list if they belong to organization
    if (!id) return true

    // If ID provided, verify person belongs to user's organization
    const person = await prisma.person.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!person
  },

  // Person overview permissions
  'person.overview.view': async (user, id) => {
    if (!user.managerOSOrganizationId) return false
    if (isAdminOrOwner(user)) return true
    if (!user.managerOSPersonId || !id) return false
    return await checkIfManagerOrSelf(user.managerOSPersonId, id)
  },

  // User linking permissions
  'user.link-person': user => {
    return isAdminOrOwner(user)
  },

  // Job Role permissions
  'job-role.create': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'job-role.edit': async (user, _id) => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'job-role.delete': async (user, _id) => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'job-role.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Verify job role belongs to user's organization
    const jobRole = await prisma.jobRole.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
      },
    })

    return !!jobRole
  },
  // Organization invitation permissions
  'organization.invitation.view': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  // Note permissions
  'note.create': user => {
    return !!user.managerOSOrganizationId
  },
  'note.edit': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true

    // Check if user created the note
    const note = await prisma.note.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        createdById: user.managerOSUserId || '',
      },
    })

    return !!note
  },
  'note.delete': async (user, id) => {
    if (!user.managerOSOrganizationId || !id) return false
    if (isAdminOrOwner(user)) return true

    // Check if user created the note
    const note = await prisma.note.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        createdById: user.managerOSUserId || '',
      },
    })

    return !!note
  },
  'note.view': async (user, id) => {
    if (!user.managerOSOrganizationId) {
      return false
    }

    if (!id) {
      return !!user.managerOSOrganizationId
    }

    // Check if user can view the note (creator, shared with everyone, or shared with user)
    const note = await prisma.note.findFirst({
      where: {
        id,
        organizationId: user.managerOSOrganizationId,
        OR: [
          { createdById: user.managerOSUserId || '' },
          { sharedWithEveryone: true },
          {
            sharedWith: {
              some: {
                userId: user.managerOSUserId || '',
              },
            },
          },
        ],
      },
    })

    return !!note
  },
}

export type PermissionKey = PermissionType

export type ActionPermissionOption = PermissionType

/**
 * Central permission function to check if a user can perform a specific action
 * @param user - The user object
 * @param actionId - The action identifier (e.g., 'initiative.delete', 'task.create')
 * @param id - Optional entity ID for actions that require checking specific entity ownership
 * @returns Promise<boolean> indicating if the user can perform the action
 */
export async function getActionPermission(
  user: UserBrief,
  actionId: PermissionType,
  id?: string
): Promise<boolean> {
  if (actionId in PermissionMap) {
    const result = PermissionMap[actionId](user, id)
    return await Promise.resolve(result)
  }

  console.error(`Unknown action ID given: ${actionId}`)
  return false
}
