/* eslint-disable camelcase */
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
      organizationMemberships: {
        select: {
          role: true,
          organizationId: true,
        },
      },
    },
  })

  // If user not found by clerkUserId, try to link by email or create on-the-fly
  // This handles:
  // 1. Users that existed before Clerk migration (link by email)
  // 2. Race condition where user registered via Clerk but webhook hasn't processed yet
  if (!user) {
    try {
      // Check if CLERK_SECRET_KEY is configured
      if (!process.env.CLERK_SECRET_KEY) {
        console.error(
          'CLERK_SECRET_KEY environment variable is not set. Cannot fetch user from Clerk.'
        )
        throw new Error(
          'Clerk secret key not configured. Please set CLERK_SECRET_KEY in your environment variables.'
        )
      }

      // Get user email from Clerk using the Clerk client
      const client = await clerkClient()
      const clerkUser = await client.users.getUser(userId)

      if (clerkUser?.emailAddresses?.[0]?.emailAddress) {
        const email = clerkUser.emailAddresses[0].emailAddress.toLowerCase()
        const name =
          clerkUser.firstName && clerkUser.lastName
            ? `${clerkUser.firstName} ${clerkUser.lastName}`
            : clerkUser.firstName || clerkUser.lastName || email.split('@')[0]

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
            organizationMemberships: {
              select: {
                role: true,
                organizationId: true,
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
              organizationMemberships: {
                select: {
                  role: true,
                  organizationId: true,
                },
              },
            },
          })
          // Sync the linked user data to Clerk
          await syncUserDataToClerk(userId)
        } else if (!existingUser) {
          // User doesn't exist - create on-the-fly (handles webhook race condition)
          // Check for pending invitation
          const { checkPendingInvitation } = await import(
            '@/lib/actions/organization'
          )
          const pendingInvitation = await checkPendingInvitation(email)

          // Create user in database
          user = await prisma.user.create({
            data: {
              email,
              name,
              clerkUserId: userId,
              role: 'USER',
              organizationId: pendingInvitation?.organization.id || null,
            },
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
              organizationMemberships: {
                select: {
                  role: true,
                  organizationId: true,
                },
              },
            },
          })

          // If there's a pending invitation, create OrganizationMember record
          if (pendingInvitation && user.organizationId) {
            await prisma.organizationMember.create({
              data: {
                userId: user.id,
                organizationId: user.organizationId,
                role: 'USER',
              },
            })
            // Reload user with memberships
            user = await prisma.user.findUnique({
              where: { id: user.id },
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
                organizationMemberships: {
                  select: {
                    role: true,
                    organizationId: true,
                  },
                },
              },
            })
          }

          // If there's a pending invitation, mark it as accepted
          if (pendingInvitation) {
            await prisma.organizationInvitation.update({
              where: { id: pendingInvitation.id },
              data: {
                status: 'accepted',
                acceptedAt: new Date(),
              },
            })
          }

          // Sync user data to Clerk metadata
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

  // Get role from OrganizationMember table if user has an organization
  // Fall back to user.role for backward compatibility
  let userRole = user.role
  if (user.organizationId) {
    const membership = user.organizationMemberships?.find(
      m => m.organizationId === user.organizationId
    )
    if (membership) {
      userRole = membership.role
    }
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
    role: userRole,
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
        organizationMemberships: {
          select: {
            role: true,
            organizationId: true,
          },
        },
      },
    })

    if (!user) {
      return null
    }

    // Get role from OrganizationMember table if user has an organization
    // Fall back to user.role for backward compatibility
    let userRole = user.role
    if (user.organizationId) {
      const membership = user.organizationMemberships?.find(
        m => m.organizationId === user.organizationId
      )
      if (membership) {
        userRole = membership.role
      }
    }

    return {
      id: user.id,
      email: user.email,
      name: user.name,
      role: userRole,
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
    {
      name: 'Reports',
      href: '/reports',
      icon: 'BarChart3',
      requiresPermission: 'report.access',
    },
    {
      name: 'Org Settings',
      href: '/organization/settings',
      icon: 'Building',
      adminOnly: true,
    },
  ]

  // Filter navigation based on organization membership and admin role
  const filteredNavigation = await Promise.all(
    navigation.map(async item => {
      // If user has no organization, only show Dashboard
      if (!user.organizationId) {
        return item.href === '/dashboard' ? item : null
      }

      // Hide "My Tasks" if user doesn't have a linked person
      if (item.href === '/my-tasks' && !user.personId) {
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

/**
 * Check if a user is an admin or owner in a specific organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<boolean> indicating if the user is an admin or owner in that organization
 */
export async function isAdminOrOwnerInOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  })
  return membership?.role === 'ADMIN' || membership?.role === 'OWNER'
}

/**
 * Check if a user is an admin in a specific organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<boolean> indicating if the user is an admin in that organization
 * @deprecated Use isAdminOrOwnerInOrganization instead - OWNER has the same permissions as ADMIN
 */
export async function isAdminInOrganization(
  userId: string,
  organizationId: string
): Promise<boolean> {
  return isAdminOrOwnerInOrganization(userId, organizationId)
}

/**
 * Get the role of a user in a specific organization
 * @param userId - The user ID
 * @param organizationId - The organization ID
 * @returns Promise<string | null> The role ('ADMIN', 'OWNER', or 'USER') or null if not a member
 */
export async function getUserRoleInOrganization(
  userId: string,
  organizationId: string
): Promise<string | null> {
  const membership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId,
      },
    },
  })
  return membership?.role || null
}

// Helper functions for role-based access control
// These use the role from the User object which is already org-scoped via getCurrentUser
export function isAdmin(user: { role: string }) {
  return user.role === 'ADMIN'
}

/**
 * Check if a user is an owner (has admin rights and is the billable user)
 * @param user - User object with role property
 * @returns boolean indicating if the user is an owner
 */
export function isOwner(user: { role: string }) {
  return user.role === 'OWNER'
}

/**
 * Check if a user is an admin or owner (both have admin-level permissions)
 * @param user - User object with role property
 * @returns boolean indicating if the user has admin-level permissions
 */
export function isAdminOrOwner(user: { role: string }) {
  return user.role === 'ADMIN' || user.role === 'OWNER'
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

/**
 * Type for permission check functions
 * Can be synchronous (for simple checks) or asynchronous (for entity lookups)
 */
type PermissionCheck = (user: User, id?: string) => boolean | Promise<boolean>

/**
 * Permission map that maps action IDs to their permission check functions
 */
const PermissionMap: Record<string, PermissionCheck> = {
  // Task permissions
  'task.create': user => {
    return (isAdminOrOwner(user) || !!user.personId) && !!user.organizationId
  },
  'task.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user created task OR user is assigned to task
    // Also verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          {
            createdById: user.id,
            createdBy: {
              organizationId: user.organizationId,
            },
          },
          {
            assigneeId: user.personId,
            OR: [
              { initiative: { organizationId: user.organizationId } },
              {
                objective: {
                  initiative: { organizationId: user.organizationId },
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
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user created task OR user is assigned to task
    // Also verify task belongs to user's organization
    const task = await prisma.task.findFirst({
      where: {
        id,
        OR: [
          {
            createdById: user.id,
            createdBy: {
              organizationId: user.organizationId,
            },
          },
          {
            assigneeId: user.personId,
            OR: [
              { initiative: { organizationId: user.organizationId } },
              {
                objective: {
                  initiative: { organizationId: user.organizationId },
                },
              },
            ],
          },
        ],
      },
    })

    return !!task
  },
  'task.view': user => {
    return !!user.organizationId
  },

  // Meeting permissions
  'meeting.create': user => {
    return !!user.personId && !!user.organizationId
  },
  'meeting.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if user created meeting OR user is owner OR user is participant
    // ADMIN users can edit any meeting in their organization
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        ...(isAdminOrOwner(user)
          ? {}
          : {
              OR: [
                { createdById: user.id },
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
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if user created meeting OR user is owner
    const meeting = await prisma.meeting.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
        OR: [{ createdById: user.id }, { ownerId: currentPerson.id }],
      },
    })

    return !!meeting
  },
  'meeting.view': async (user, id) => {
    if (!user.organizationId) {
      return false
    }

    if (!id || !user.personId) {
      return !!user.organizationId
    } else {
      // If the meeting exists AND is in the user's organization AND the user is an admin OR the user is the creator, owner or participant then
      // allow the user to view the meeting
      const meeting = await prisma.meeting.findFirst({
        where: {
          id,
          organizationId: user.organizationId,
          OR: [
            { createdById: user.id },
            { ownerId: user.personId },
            { participants: { some: { personId: user.personId } } },
          ],
        },
      })

      return !!meeting
    }
  },

  // Meeting Instance permissions
  'meeting-instance.create': user => {
    return !!user.personId && !!user.organizationId
  },
  'meeting-instance.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if meeting instance exists and user has permission to edit it
    // User can edit if they can edit the parent meeting OR they are a participant of the instance
    // ADMIN users can edit any meeting instance in their organization
    const meetingInstance = await prisma.meetingInstance.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
      },
      include: {
        meeting: true,
        participants: true,
      },
    })

    if (!meetingInstance) return false

    // Check if user is participant of the instance
    const isInstanceParticipant = meetingInstance.participants.some(
      p => p.personId === currentPerson.id
    )

    if (isInstanceParticipant) return true

    // Check parent meeting permissions (same as meeting.edit)
    if (isAdminOrOwner(user)) return true

    const meeting = await prisma.meeting.findFirst({
      where: {
        id: meetingInstance.meetingId,
        organizationId: user.organizationId,
        OR: [
          { createdById: user.id },
          { ownerId: currentPerson.id },
          {
            participants: {
              some: {
                personId: currentPerson.id,
              },
            },
          },
        ],
      },
    })

    return !!meeting
  },
  'meeting-instance.delete': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if meeting instance exists
    const meetingInstance = await prisma.meetingInstance.findFirst({
      where: {
        id,
        organizationId: user.organizationId,
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
        organizationId: user.organizationId,
        OR: [{ createdById: user.id }, { ownerId: currentPerson.id }],
      },
    })

    return !!meeting
  },
  'meeting-instance.view': async (user, id) => {
    if (!user.organizationId) {
      return false
    }

    if (!id) {
      return !!user.organizationId
    }

    // Get current user's person record (may be null if not linked)
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id }, organizationId: user.organizationId },
    })

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
        organizationId: user.organizationId,
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
              createdById: user.id,
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
    return (isAdminOrOwner(user) || !!user.personId) && !!user.organizationId
  },
  'initiative.edit': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'initiative.delete': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'initiative.view': user => {
    return !!user.organizationId
  },

  // Report permissions
  'report.access': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'report.create': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'report.edit': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'report.delete': user => {
    return isAdminOrOwner(user) && !!user.organizationId
  },
  'report.view': user => {
    return !!user.organizationId
  },

  // Feedback permissions
  'feedback.create': user => {
    return (isAdminOrOwner(user) || !!user.personId) && !!user.organizationId
  },
  'feedback.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if user is the creator (fromId)
    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        fromId: currentPerson.id,
        about: {
          organizationId: user.organizationId,
        },
      },
    })

    return !!feedback
  },
  'feedback.delete': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Get current user's person record
    const currentPerson = await prisma.person.findFirst({
      where: { user: { id: user.id } },
    })

    if (!currentPerson) return false

    // Check if user is the creator (fromId)
    const feedback = await prisma.feedback.findFirst({
      where: {
        id,
        fromId: currentPerson.id,
        about: {
          organizationId: user.organizationId,
        },
      },
    })

    return !!feedback
  },
  'feedback.view': user => {
    return !!user.organizationId
  },

  // One-on-One permissions
  'oneonone.create': user => {
    return (isAdminOrOwner(user) || !!user.personId) && !!user.organizationId
  },
  'oneonone.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
          {
            reportId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },
  'oneonone.delete': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
          {
            reportId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },
  'oneonone.view': async (user, id) => {
    if (!user.organizationId) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId || !id) return false

    // Check if user is a participant (managerId or reportId)
    // Also verify both participants belong to user's organization
    const oneOnOne = await prisma.oneOnOne.findFirst({
      where: {
        id,
        OR: [
          {
            managerId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
          {
            reportId: user.personId,
            manager: { organizationId: user.organizationId },
            report: { organizationId: user.organizationId },
          },
        ],
      },
    })

    return !!oneOnOne
  },

  // Feedback Campaign permissions
  'feedback-campaign.create': user => {
    return (isAdminOrOwner(user) || !!user.personId) && !!user.organizationId
  },
  'feedback-campaign.edit': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.id,
        targetPerson: {
          organizationId: user.organizationId,
        },
      },
    })

    return !!campaign
  },
  'feedback-campaign.delete': async (user, id) => {
    if (!user.organizationId || !id) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.id,
        targetPerson: {
          organizationId: user.organizationId,
        },
      },
    })

    return !!campaign
  },
  'feedback-campaign.view': async (user, id) => {
    if (!user.organizationId) return false
    if (isAdminOrOwner(user)) return true
    if (!user.personId) return false

    if (!id) {
      // Viewing list - user can see their own campaigns
      return true
    }

    // Check if user is the creator (userId)
    const campaign = await prisma.feedbackCampaign.findFirst({
      where: {
        id,
        userId: user.id,
        targetPerson: {
          organizationId: user.organizationId,
        },
      },
    })

    return !!campaign
  },

  // User linking permissions
  'user.link-person': user => {
    return isAdminOrOwner(user)
  },
}

/**
 * Central permission function to check if a user can perform a specific action
 * @param user - The user object
 * @param actionId - The action identifier (e.g., 'initiative.delete', 'task.create')
 * @param id - Optional entity ID for actions that require checking specific entity ownership
 * @returns Promise<boolean> indicating if the user can perform the action
 */
export async function getActionPermission(
  user: User,
  actionId: string,
  id?: string
): Promise<boolean> {
  if (actionId in PermissionMap) {
    const result = PermissionMap[actionId](user, id)
    return await Promise.resolve(result)
  }

  console.error(`Unknown action ID given: ${actionId}`)
  return false
}
