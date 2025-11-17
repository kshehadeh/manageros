import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { prisma } from './db'
import {
  OrganizationBrief,
  UserBriefSchema,
  type UserBrief,
} from './auth-types'
import { getUserFromClerk, syncUserDataToClerk } from './clerk-session-sync'
import z from 'zod'
import { checkIfManagerOrSelf } from '@/lib/utils/people-utils'
import { getClerkOrganization } from './clerk-organization-utils'
import { combineName } from '@/lib/utils/name-utils'

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
  o: z.object({
    id: z.string().optional().nullable(),
    rol: z.string().optional().nullable(),
    slg: z.string().optional().nullable(),
  }),
  metadata: z.union([UserBriefSchema.optional().nullable(), z.object({})]),
})

export type SessionClaims = z.infer<typeof SessionClaimsSchema>

/**
 * Get the current authenticated user from Clerk
 * Throws an error if no user is authenticated
 * Use this for server actions and components that must have authentication
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
        user = await prisma.user.create({
          data: {
            clerkUserId: userId,
            email: clerkUser.primaryEmailAddress?.emailAddress,
            name: combineName(clerkUser.firstName, clerkUser.lastName),
          },
        })
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
    options.revalidateLinks ||
    (sessionClaimsValidated.data.o?.id && !syncObject.managerOSOrganizationId)
  ) {
    // First see if we can find one based on the organization in clerk.
    let organization = await prisma.organization.findUnique({
      where: {
        clerkOrganizationId: sessionClaimsValidated.data.o?.id || undefined,
      },
    })

    if (!organization) {
      // if there isn't one in our database then let's create it by getting the details
      // from clerk.
      const clerkOrganization = await getClerkOrganization(
        sessionClaimsValidated.data.o?.id || ''
      )
      if (!clerkOrganization) {
        throw new Error(
          'Clerk organization could not be found - this is a fatal error'
        )
      }

      // Now we can create it using the clerk organization details. If we
      //  have to create it now then let's assume that the billing user is the
      //  current user.
      organization = await prisma.organization.create({
        data: {
          clerkOrganizationId: clerkOrganization.id,
          billingUserId: syncObject.managerOSUserId,
        },
      })

      syncObject.managerOSOrganizationId = organization.id
      syncObject.clerkOrganizationId = organization.clerkOrganizationId
      resync = true
    }
  }

  if (options.revalidateLinks || !syncObject.managerOSPersonId) {
    // Check if the current user is linked to a person.
    const user = await prisma.user.findUnique({
      where: { id: syncObject.managerOSUserId || '' },
    })
    if (user && user.personId) {
      syncObject.managerOSPersonId = user.personId
      resync = true
    }
  }

  if (resync) {
    await syncUserDataToClerk(syncObject)
  }

  return syncObject
}

export async function getCurrentUserWithPersonAndOrganization() {
  // Get current user - session claims may be stale, so we'll query person directly
  const user = await getCurrentUser({ revalidateLinks: true })
  const person = await prisma.person.findUnique({
    where: { id: user.managerOSPersonId || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
  })

  let organizationBrief: OrganizationBrief | null = null

  if (user.managerOSOrganizationId) {
    const organization = await prisma.organization.findUnique({
      where: { id: user.managerOSOrganizationId || '' },
      select: {
        id: true,
        clerkOrganizationId: true,
      },
    })

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
 */
export async function requireAuth(options?: {
  requireOrganization?: boolean
  redirectTo?: string
}) {
  const user = await getCurrentUser()

  if (options?.requireOrganization && !user.managerOSOrganizationId) {
    redirect(options.redirectTo || '/organization/create')
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

  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: 'Home' },
    { name: 'My Tasks', href: '/my-tasks', icon: 'CheckSquare' },
    { name: 'Initiatives', href: '/initiatives', icon: 'Rocket' },
    { name: 'Meetings', href: '/meetings', icon: 'Calendar' },
    { name: 'People', href: '/people', icon: 'User' },
    { name: 'Teams', href: '/teams', icon: 'Users2' },
    {
      name: 'Reports',
      href: '/reports',
      icon: 'BarChart3',
      requiresPermission: 'report.access' as PermissionType,
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
  'task.view': user => {
    return !!user.managerOSOrganizationId
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
  'initiative.edit': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'initiative.delete': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
  },
  'initiative.view': user => {
    return !!user.managerOSOrganizationId
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
  'feedback.view': user => {
    return !!user.managerOSOrganizationId
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
  'job-role.view': user => {
    return !!user.managerOSOrganizationId
  },
  // Organization invitation permissions
  'organization.invitation.view': user => {
    return isAdminOrOwner(user) && !!user.managerOSOrganizationId
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
