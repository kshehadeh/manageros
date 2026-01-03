/* eslint-disable camelcase */
'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { syncUserDataToClerk } from '@/lib/clerk'
import { auth } from '@clerk/nextjs/server'
import { PersonBrief } from '@/types/person'
import type { UserBrief } from '@/lib/auth-types'
import {
  createClerkOrganization,
  addUserToClerkOrganization,
  getClerkOrganization,
  getClerkOrganizationMembers,
  getClerkOrganizationMembership,
  updateUserRoleInClerkOrganization,
  removeUserFromClerkOrganization,
  getClerkOrganizationMembersCount,
  isBillingUser as isBillingUserFromClerk,
  deleteClerkOrganization,
  updateClerkOrganization,
} from '../clerk'
import {
  mapManagerOSRoleToClerkRole,
  mapClerkRoleToManagerOSRole,
} from '../clerk-organization-utils'

export async function linkUserToPerson(userId: string, personId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error(
      'Only organization admins or owners can link users to persons'
    )
  }

  // Check if user belongs to an organization
  if (!currentUser.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to link users to persons'
    )
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.managerOSOrganizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if person is already linked to a user
  const personWithUser = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.managerOSOrganizationId,
    },
    include: { user: true },
  })

  if (personWithUser?.user) {
    throw new Error('Person is already linked to a user')
  }

  // Link the user to the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: personId },
  })

  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function unlinkUserFromPerson(userId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error(
      'Only organization admins or owners can unlink users from persons'
    )
  }

  // Check if user belongs to an organization
  if (!currentUser.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage user-person links'
    )
  }

  // Unlink the user from the person
  await prisma.user.update({
    where: { id: userId },
    data: { personId: null },
  })

  revalidatePath('/people')
  revalidatePath('/people/[id]', 'page')
}

export async function getAvailableUsersForLinking() {
  const currentUser = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error(
      'Only organization admins or owners can view available users for linking'
    )
  }

  // Check if user belongs to an organization
  if (
    !currentUser.managerOSOrganizationId ||
    !currentUser.clerkOrganizationId
  ) {
    return []
  }

  // Get organization to find Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      clerkOrganizationId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    return []
  }

  // Get members from Clerk API
  const clerkMembers = await getClerkOrganizationMembers(
    organization.clerkOrganizationId
  )

  // Get all Clerk user IDs
  const clerkUserIds = clerkMembers.map(m => m.public_user_data.user_id)

  // Fetch corresponding ManagerOS users who aren't linked to a person
  const users = await prisma.user.findMany({
    where: {
      clerkUserId: {
        in: clerkUserIds,
      },
      personId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      clerkUserId: true,
    },
    orderBy: {
      name: 'asc',
    },
  })

  // Create a map of clerkUserId -> Clerk membership
  const membershipMap = new Map(
    clerkMembers.map(m => [m.public_user_data.user_id, m])
  )

  // Transform to match expected format
  return users
    .map(user => {
      const membership = membershipMap.get(user.clerkUserId || '')
      if (!membership) return null
      return {
        id: user.id,
        name: user.name,
        email: user.email,
        role: membership.role === 'org:admin' ? 'ADMIN' : 'USER',
      }
    })
    .filter((u): u is NonNullable<typeof u> => u !== null)
}

// Organization Invitation Management Actions

export async function createOrganizationInvitation(email: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can send invitations')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to send invitations')
  }

  // Check if email is already a user in the organization
  // First check if user exists at all
  const existingUserByEmail = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  })

  if (existingUserByEmail && existingUserByEmail.clerkUserId) {
    // Get organization to check Clerk membership
    const organization = await prisma.organization.findUnique({
      where: { id: user.managerOSOrganizationId },
      select: {
        clerkOrganizationId: true,
      },
    })

    if (organization && organization.clerkOrganizationId) {
      // Check if user is already a member via Clerk
      const existingMembership = await getClerkOrganizationMembership(
        organization.clerkOrganizationId,
        existingUserByEmail.clerkUserId
      )
      if (existingMembership) {
        throw new Error('User is already a member of this organization')
      }
    }
    // If user exists but is in a different organization or has no organization,
    // we can still send an invitation (they can accept and switch organizations)
    // So we continue with the invitation process
  }

  // Check if there's an existing invitation for this email (using unique constraint)
  const existingInvitation = await prisma.organizationInvitation.findUnique({
    where: {
      email_organizationId: {
        email: email.toLowerCase(),
        organizationId: user.managerOSOrganizationId,
      },
    },
  })

  if (existingInvitation) {
    // If invitation is already accepted, check if user is actually still in the organization
    // (user may have been removed after accepting the invitation)
    if (existingInvitation.status === 'accepted') {
      // Verify if the user is actually still a member
      const existingUser = await prisma.user.findUnique({
        where: {
          email: email.toLowerCase(),
        },
      })
      let userStillInOrg = false
      if (existingUser && existingUser.clerkUserId) {
        const organization = await prisma.organization.findUnique({
          where: { id: user.managerOSOrganizationId },
          select: { clerkOrganizationId: true },
        })
        if (organization && organization.clerkOrganizationId) {
          const membership = await getClerkOrganizationMembership(
            organization.clerkOrganizationId,
            existingUser.clerkUserId
          )
          userStillInOrg = !!membership
        }
      }

      if (userStillInOrg) {
        throw new Error('User is already a member of this organization')
      }

      // User was removed from organization, reactivate the invitation
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const reactivatedInvitation = await prisma.organizationInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          status: 'pending',
          expiresAt,
          acceptedAt: null, // Clear acceptedAt since they're no longer a member
          invitedById: user.managerOSUserId || '', // Update who sent/reactivated the invitation
        },
        include: {
          organization: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      revalidatePath('/organization/invitations')
      revalidatePath('/organization/members')
      return reactivatedInvitation
    }

    // If invitation is pending, update it to refresh expiration date
    if (existingInvitation.status === 'pending') {
      const expiresAt = new Date()
      expiresAt.setDate(expiresAt.getDate() + 7)

      const updatedInvitation = await prisma.organizationInvitation.update({
        where: { id: existingInvitation.id },
        data: {
          expiresAt,
          invitedById: user.managerOSUserId || '', // Update who sent/reactivated the invitation
        },
        include: {
          organization: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

      revalidatePath('/organization/invitations')
      revalidatePath('/organization/members')
      return updatedInvitation
    }

    // For revoked or expired invitations, use the reactivateOrganizationInvitation function
    await reactivateOrganizationInvitation(existingInvitation.id)

    // Fetch and return the reactivated invitation
    const reactivatedInvitation =
      await prisma.organizationInvitation.findUnique({
        where: { id: existingInvitation.id },
        include: {
          organization: true,
          invitedBy: {
            select: {
              name: true,
              email: true,
            },
          },
        },
      })

    if (!reactivatedInvitation) {
      throw new Error('Failed to reactivate invitation')
    }

    return reactivatedInvitation
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  try {
    const invitation = await prisma.organizationInvitation.create({
      data: {
        email: email.toLowerCase(),
        organizationId: user.managerOSOrganizationId,
        invitedById: user.managerOSUserId || '',
        expiresAt,
      },
      include: {
        organization: true,
        invitedBy: {
          select: {
            name: true,
            email: true,
          },
        },
      },
    })

    revalidatePath('/organization/invitations')
    return invitation
  } catch (error) {
    // Handle unique constraint error (race condition - invitation was created between check and create)
    if (
      error &&
      typeof error === 'object' &&
      'code' in error &&
      (error as { code: string }).code === 'P2002'
    ) {
      // Re-fetch the existing invitation and reactivate it
      const existingInvitation = await prisma.organizationInvitation.findUnique(
        {
          where: {
            email_organizationId: {
              email: email.toLowerCase(),
              organizationId: user.managerOSOrganizationId,
            },
          },
        }
      )

      if (existingInvitation) {
        // If invitation is already accepted, check if user is actually still in the organization
        // (user may have been removed after accepting the invitation)
        if (existingInvitation.status === 'accepted') {
          // Verify if the user is actually still a member
          const existingUser = await prisma.user.findUnique({
            where: {
              email: email.toLowerCase(),
            },
          })
          const userStillInOrg = existingUser
            ? await prisma.organizationMember.findFirst({
                where: {
                  userId: existingUser.id,
                  organizationId: user.managerOSOrganizationId,
                },
              })
            : null

          if (userStillInOrg) {
            throw new Error('User is already a member of this organization')
          }

          // User was removed from organization, reactivate the invitation
          const reactivatedInvitation =
            await prisma.organizationInvitation.update({
              where: { id: existingInvitation.id },
              data: {
                status: 'pending',
                expiresAt,
                acceptedAt: null, // Clear acceptedAt since they're no longer a member
                invitedById: user.managerOSUserId || '',
              },
              include: {
                organization: true,
                invitedBy: {
                  select: {
                    name: true,
                    email: true,
                  },
                },
              },
            })

          revalidatePath('/organization/invitations')
          revalidatePath('/organization/members')
          return reactivatedInvitation
        }

        // If invitation is pending, update it to refresh expiration date
        if (existingInvitation.status === 'pending') {
          const updatedInvitation = await prisma.organizationInvitation.update({
            where: { id: existingInvitation.id },
            data: {
              expiresAt,
              invitedById: user.managerOSUserId || '',
            },
            include: {
              organization: true,
              invitedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          })

          revalidatePath('/organization/invitations')
          revalidatePath('/organization/members')
          return updatedInvitation
        }

        // For revoked or expired invitations, use the reactivateOrganizationInvitation function
        await reactivateOrganizationInvitation(existingInvitation.id)

        // Fetch and return the reactivated invitation
        const reactivatedInvitation =
          await prisma.organizationInvitation.findUnique({
            where: { id: existingInvitation.id },
            include: {
              organization: true,
              invitedBy: {
                select: {
                  name: true,
                  email: true,
                },
              },
            },
          })

        if (!reactivatedInvitation) {
          throw new Error('Failed to reactivate invitation')
        }

        return reactivatedInvitation
      }
    }

    // Re-throw if it's not a unique constraint error or if we couldn't handle it
    throw error
  }
}

export async function getOrganizationInvitations() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can view invitations')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      organizationId: user.managerOSOrganizationId,
    },
    include: {
      invitedBy: {
        select: {
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

  // Convert Date objects to strings for client-side consumption
  return invitations.map(invitation => ({
    ...invitation,
    createdAt: invitation.createdAt.toISOString(),
    updatedAt: invitation.updatedAt.toISOString(),
    expiresAt: invitation.expiresAt.toISOString(),
    acceptedAt: invitation.acceptedAt?.toISOString(),
  }))
}

export async function revokeOrganizationInvitation(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can revoke invitations')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to manage invitations')
  }

  // Verify invitation belongs to user's organization
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!invitation) {
    throw new Error('Invitation not found or access denied')
  }

  if (invitation.status !== 'pending') {
    throw new Error('Only pending invitations can be revoked')
  }

  // Update invitation status to revoked
  await prisma.organizationInvitation.update({
    where: { id: invitationId },
    data: { status: 'revoked' },
  })

  revalidatePath('/organization/invitations')
}

async function reactivateOrganizationInvitation(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can reactivate invitations'
    )
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to manage invitations')
  }

  // Verify invitation belongs to user's organization
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: user.managerOSOrganizationId,
    },
  })

  if (!invitation) {
    throw new Error('Invitation not found or access denied')
  }

  if (invitation.status === 'pending') {
    throw new Error('Invitation is already active')
  }

  if (invitation.status === 'accepted') {
    throw new Error('Cannot reactivate an accepted invitation')
  }

  // Check if email is already a user in the organization
  const existingUserByEmail = await prisma.user.findUnique({
    where: {
      email: invitation.email.toLowerCase(),
    },
  })
  let existingUser = false
  if (existingUserByEmail && existingUserByEmail.clerkUserId) {
    const organization = await prisma.organization.findUnique({
      where: { id: user.managerOSOrganizationId },
      select: { clerkOrganizationId: true },
    })
    if (organization && organization.clerkOrganizationId) {
      const membership = await getClerkOrganizationMembership(
        organization.clerkOrganizationId,
        existingUserByEmail.clerkUserId
      )
      existingUser = !!membership
    }
  }

  if (existingUser) {
    throw new Error('User is already a member of this organization')
  }

  // Reactivate invitation with new expiration date (7 days from now)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

  await prisma.organizationInvitation.update({
    where: { id: invitationId },
    data: {
      status: 'pending',
      expiresAt,
      invitedById: user.managerOSUserId || '', // Update who reactivated it
    },
  })

  revalidatePath('/organization/invitations')
  revalidatePath('/organization/members')
}

async function acceptOrganizationInvitation(email: string) {
  // Find pending invitation for this email
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: true,
    },
  })

  if (!invitation) {
    return null // No valid invitation found
  }

  // Update invitation status to accepted
  await prisma.organizationInvitation.update({
    where: { id: invitation.id },
    data: {
      status: 'accepted',
      acceptedAt: new Date(),
    },
  })

  return invitation.organization
}

export async function checkPendingInvitation(email: string) {
  // Check if there's a pending invitation for this email
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      email: email.toLowerCase(),
      status: 'pending',
      expiresAt: {
        gt: new Date(), // Not expired
      },
    },
    include: {
      organization: {
        select: {
          id: true,
          clerkOrganizationId: true,
        },
      },
    },
  })

  return invitation
}

/**
 * Server action to trigger invitation acceptance
 * The actual acceptance is handled on the client-side via Clerk
 * This action just handles the post-acceptance sync
 */
export async function syncOrgDataToClerk() {
  const updatedUser = await getCurrentUser({ revalidateLinks: true })

  if (!updatedUser.clerkUserId) {
    throw new Error('User must be authenticated with Clerk')
  }

  try {
    // Sync updated user data to Clerk metadata (organization may have changed)
    // Use revalidateLinks to force refresh of organization data
    await syncUserDataToClerk(updatedUser)

    // Revalidate paths that depend on organization status
    revalidatePath('/', 'layout')
    revalidatePath('/dashboard', 'page')
    revalidatePath('/settings', 'page')

    return { success: true }
  } catch (error) {
    console.error('Error syncing after invitation acceptance:', error)
    throw error instanceof Error
      ? error
      : new Error('Failed to sync after invitation acceptance')
  }
}

// Organization Member Management Actions

/**
 * Get organization details including name, slug, description, and member count
 * Fetches name and slug from Clerk API
 * Returns both Clerk organization details and ManagerOS organization statistics
 */
async function getOrganizationDetails() {
  const user = await getCurrentUser()

  // Fetch name and slug from Clerk
  if (!user.clerkOrganizationId || !user.managerOSOrganizationId) {
    return null
  }

  // Get Clerk organization details
  const clerkOrganization = await getClerkOrganization(user.clerkOrganizationId)

  // Get organization statistics from ManagerOS database
  // TypeScript: organizationId is guaranteed to be non-null after the check above
  const organizationId: string = user.managerOSOrganizationId
  const [
    teamsCount,
    personsCount,
    membersCount,
    initiativesCount,
    meetingsCount,
  ] = await Promise.all([
    prisma.team.count({
      where: { organizationId },
    }),
    prisma.person.count({
      where: { organizationId },
    }),
    getClerkOrganizationMembersCount(user.clerkOrganizationId),
    prisma.initiative.count({
      where: { organizationId },
    }),
    prisma.meeting.count({
      where: { organizationId },
    }),
  ])

  const organizationStats = {
    teamsCount,
    personsCount,
    membersCount,
    initiativesCount,
    meetingsCount,
  }

  return {
    clerkOrganization,
    organizationStats,
  }
}

export async function getOrganizationMembers() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can view organization members'
    )
  }

  // Get organization to find Clerk org ID
  if (!user.managerOSOrganizationId || !user.clerkOrganizationId) {
    return []
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.managerOSOrganizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
      billingUserId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    return []
  }

  // Get members from Clerk API - this is the source of truth for roles
  const clerkMembers = await getClerkOrganizationMembers(
    organization.clerkOrganizationId
  )

  // Get all Clerk user IDs
  const clerkUserIds = clerkMembers.map(m => m.public_user_data.user_id)

  // Fetch corresponding ManagerOS users to merge with Clerk data
  const users = await prisma.user.findMany({
    where: {
      clerkUserId: {
        in: clerkUserIds,
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      clerkUserId: true,
      createdAt: true,
      person: {
        select: {
          id: true,
          name: true,
          role: true,
          status: true,
          team: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      },
    },
  })

  // Create a map of clerkUserId -> user for quick lookup
  const userMap = new Map(users.map(u => [u.clerkUserId || '', u]))

  // Transform Clerk members to ManagerOS format
  // Always use Clerk role as the source of truth
  const memberPromises = clerkMembers.map(async clerkMember => {
    const clerkUserId = clerkMember.public_user_data.user_id
    const managerOSUser = userMap.get(clerkUserId)

    // Determine if user is billing user (OWNER) by checking Clerk subscription payer
    const isBillingUser = await isBillingUserFromClerk(
      organization.clerkOrganizationId,
      clerkUserId
    )

    // Map Clerk role to ManagerOS role - Clerk is the source of truth
    const managerOSRole = await mapClerkRoleToManagerOSRole(
      clerkMember.role,
      isBillingUser
    )

    // If user exists in ManagerOS, merge Clerk role with database data
    if (managerOSUser) {
      return {
        id: managerOSUser.id,
        name: managerOSUser.name,
        email: managerOSUser.email,
        role: managerOSRole, // Role from Clerk, not database
        createdAt: managerOSUser.createdAt,
        person: managerOSUser.person,
      }
    }

    // User exists in Clerk but not in ManagerOS DB yet
    // Return basic info from Clerk with role from Clerk
    const clerkName =
      clerkMember.public_user_data.first_name ||
      clerkMember.public_user_data.last_name
        ? `${clerkMember.public_user_data.first_name || ''} ${clerkMember.public_user_data.last_name || ''}`.trim()
        : clerkMember.public_user_data.identifier

    return {
      id: clerkUserId, // Use Clerk user ID as temporary ID
      name: clerkName || 'Unknown',
      email: clerkMember.public_user_data.identifier,
      role: managerOSRole, // Role from Clerk
      createdAt: new Date(clerkMember.created_at * 1000), // Convert Clerk timestamp
      person: null, // No person record yet
    }
  })
  const memberResults = await Promise.all(memberPromises)
  const members = memberResults.sort((a, b) => a.name.localeCompare(b.name))

  return members
}

export async function updateUserRole(
  userId: string,
  newRole: 'ADMIN' | 'OWNER' | 'USER'
) {
  const currentUser = await getCurrentUser()

  // Check if current user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error('Only organization admins or owners can change user roles')
  }

  // Check if current user belongs to an organization
  if (
    !currentUser.managerOSOrganizationId ||
    !currentUser.clerkOrganizationId
  ) {
    throw new Error('User must belong to an organization to manage roles')
  }

  // Get organization with Clerk org ID and billing user
  const organization = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
      billingUserId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
      email: true,
      name: true,
      personId: true,
    },
  })

  if (!targetUser || !targetUser.clerkUserId) {
    throw new Error('User not found or does not have Clerk account')
  }

  // Verify the target user is a member of the same organization via Clerk
  const targetClerkMembership = await getClerkOrganizationMembership(
    organization.clerkOrganizationId,
    targetUser.clerkUserId
  )

  if (!targetClerkMembership) {
    throw new Error('User not found or access denied')
  }

  // Get organization
  const org = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      clerkOrganizationId: true,
    },
  })

  if (!org?.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  // Determine current role from Clerk membership
  // Check if target user is billing user by checking Clerk subscription
  const isCurrentBillingUser = targetUser.clerkUserId
    ? await isBillingUserFromClerk(
        org.clerkOrganizationId,
        targetUser.clerkUserId
      )
    : false
  const currentRole = await mapClerkRoleToManagerOSRole(
    targetClerkMembership.role,
    isCurrentBillingUser
  )

  // Prevent users from changing their own role
  if (userId === currentUser.managerOSUserId) {
    throw new Error('You cannot change your own role')
  }

  // Prevent changing OWNER role (ownership transfer not yet implemented)
  if (currentRole === 'OWNER' && newRole !== 'OWNER') {
    throw new Error(
      'Cannot change the organization owner role. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent assigning OWNER role (ownership transfer not yet implemented)
  if (currentRole !== 'OWNER' && newRole === 'OWNER') {
    throw new Error(
      'Cannot assign OWNER role. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent removing the last admin or owner
  if (currentRole === 'ADMIN' && newRole === 'USER') {
    const clerkMembers = await getClerkOrganizationMembers(
      organization.clerkOrganizationId
    )

    const adminOrOwnerPromises = clerkMembers.map(async m => {
      const memberUserId = m.public_user_data.user_id
      const isBillingUser = await isBillingUserFromClerk(
        organization.clerkOrganizationId,
        memberUserId
      )
      const role = await mapClerkRoleToManagerOSRole(m.role, isBillingUser)
      return role === 'ADMIN' || role === 'OWNER'
    })
    const adminOrOwnerResults = await Promise.all(adminOrOwnerPromises)
    const adminOrOwnerCount = adminOrOwnerResults.filter(Boolean).length

    if (adminOrOwnerCount <= 1) {
      throw new Error(
        'Cannot remove the last admin or owner from the organization'
      )
    }
  }

  // Update user's role in Clerk organization
  try {
    // Log the values being passed for debugging
    console.log('Updating user role:', {
      organizationClerkId: organization.clerkOrganizationId,
      targetUserClerkId: targetUser.clerkUserId,
      targetUserId: targetUser.id,
      targetUserEmail: targetUser.email,
      newRole,
      clerkRole: await mapManagerOSRoleToClerkRole(newRole),
    })

    await updateUserRoleInClerkOrganization(
      organization.clerkOrganizationId,
      targetUser.clerkUserId,
      await mapManagerOSRoleToClerkRole(newRole)
    )
  } catch (error) {
    console.error('Failed to update user role in Clerk organization:', error)
    // Include more context in the error
    const errorMessage =
      error instanceof Error ? error.message : 'Unknown error'
    throw new Error(
      `Failed to update user role: ${errorMessage}. User: ${targetUser.email} (${targetUser.clerkUserId}), Org: ${organization.clerkOrganizationId}`
    )
  }

  // Sync updated user data to Clerk (role changed)
  const targetUserBrief: UserBrief = {
    email: targetUser.email,
    name: targetUser.name,
    clerkUserId: targetUser.clerkUserId,
    clerkOrganizationId: organization.clerkOrganizationId,
    role: newRole.toLowerCase(),
    managerOSUserId: targetUser.id,
    managerOSOrganizationId: currentUser.managerOSOrganizationId,
    managerOSPersonId: targetUser.personId || null,
  }
  await syncUserDataToClerk(targetUserBrief)

  revalidatePath('/organization/members')
  revalidatePath('/organization/users')
  revalidatePath('/organization/settings')
}

/**
 * Make the current user the organization owner
 * This function:
 * 1. Checks if organization has no owner
 * 2. Checks if current user is an admin
 * 3. Updates billingUserId to current user
 * 4. Sets current user's role to OWNER
 * 5. If there's already an owner, sets that user's role to ADMIN
 */
async function becomeOrganizationOwner() {
  const currentUser = await getCurrentUser()

  // Check if current user is admin
  if (!isAdminOrOwner(currentUser)) {
    throw new Error('Only organization admins can become the owner')
  }

  // Check if current user belongs to an organization
  if (!currentUser.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to become owner')
  }

  const organizationId = currentUser.managerOSOrganizationId

  // Check if user already has a subscription (required to become owner)
  if (!currentUser.clerkUserId) {
    throw new Error('User must have a Clerk account to become owner')
  }

  // Get organization with Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
    },
  })

  if (!organization) {
    throw new Error('Organization not found')
  }

  // Get Clerk organization ID (should always exist now)
  const clerkOrgId = organization.clerkOrganizationId
  if (!clerkOrgId) {
    throw new Error(
      'Organization does not have a Clerk organization ID. Please contact support.'
    )
  }

  // Verify current user is a member via Clerk
  if (!currentUser.clerkUserId) {
    throw new Error('Current user does not have Clerk account')
  }

  const currentUserMembership = await getClerkOrganizationMembership(
    clerkOrgId,
    currentUser.clerkUserId
  )

  if (!currentUserMembership) {
    throw new Error('User is not a member of this organization')
  }

  // Get organization
  const org = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
    },
  })

  if (!org || !org.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  // Find existing owner (billing user) from Clerk subscription
  const { getBillingUserClerkId } = await import('../clerk')
  const existingOwnerClerkId = await getBillingUserClerkId(
    org.clerkOrganizationId
  )
  const existingOwnerUser = existingOwnerClerkId
    ? await prisma.user.findUnique({
        where: { clerkUserId: existingOwnerClerkId },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          name: true,
          personId: true,
        },
      })
    : null

  // Update organization clerkOrganizationId if needed (subscription info is in Clerk)
  if (clerkOrgId && org.clerkOrganizationId !== clerkOrgId) {
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        clerkOrganizationId: clerkOrgId,
      },
    })
  }

  // If there's an existing owner (different from current user), update their role in Clerk
  if (
    existingOwnerUser &&
    existingOwnerUser.id !== currentUser.managerOSUserId &&
    existingOwnerUser.clerkUserId
  ) {
    try {
      await updateUserRoleInClerkOrganization(
        clerkOrgId,
        existingOwnerUser.clerkUserId,
        await mapManagerOSRoleToClerkRole('ADMIN')
      )

      // Sync updated user data to Clerk
      const existingOwnerUserBrief: UserBrief = {
        email: existingOwnerUser.email,
        name: existingOwnerUser.name,
        clerkUserId: existingOwnerUser.clerkUserId,
        clerkOrganizationId: clerkOrgId || null,
        role: 'admin',
        managerOSUserId: existingOwnerUser.id,
        managerOSOrganizationId: organizationId,
        managerOSPersonId: existingOwnerUser.personId,
      }
      await syncUserDataToClerk(existingOwnerUserBrief)
    } catch (error) {
      console.error('Failed to update existing owner role in Clerk:', error)
      // Don't fail the operation
    }
  }

  // Update current user's role to OWNER in Clerk (if not already admin)
  if (currentUserMembership.role !== 'org:admin') {
    try {
      await updateUserRoleInClerkOrganization(
        clerkOrgId,
        currentUser.clerkUserId,
        await mapManagerOSRoleToClerkRole('OWNER')
      )
    } catch (error) {
      console.error('Failed to update user role in Clerk organization:', error)
      // Don't fail the operation
    }
  }

  // Sync updated user data to Clerk
  await syncUserDataToClerk(currentUser)

  revalidatePath('/organization/settings')
  revalidatePath('/organization/members')
  revalidatePath('/organization/users')
  revalidatePath('/dashboard')
}

export async function removeUserFromOrganization(userId: string) {
  const currentUser = await getCurrentUser()

  // Check if current user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error(
      'Only organization admins or owners can remove users from the organization'
    )
  }

  // Check if current user belongs to an organization
  if (
    !currentUser.managerOSOrganizationId ||
    !currentUser.clerkOrganizationId
  ) {
    throw new Error('User must belong to an organization to manage members')
  }

  // Get organization with Clerk org ID and billing user
  const organization = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
      billingUserId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  // Get target user
  const targetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      clerkUserId: true,
      personId: true,
    },
  })

  if (!targetUser || !targetUser.clerkUserId) {
    throw new Error('User not found or does not have Clerk account')
  }

  // Verify the target user is a member of the same organization via Clerk
  const targetClerkMembership = await getClerkOrganizationMembership(
    organization.clerkOrganizationId,
    targetUser.clerkUserId
  )

  if (!targetClerkMembership) {
    throw new Error('User not found or access denied')
  }

  // Determine current role from Clerk membership
  // Check if user is billing user from Clerk (more accurate than database field)
  const isBillingUser = await isBillingUserFromClerk(
    organization.clerkOrganizationId,
    targetUser.clerkUserId
  )
  const currentRole = await mapClerkRoleToManagerOSRole(
    targetClerkMembership.role,
    isBillingUser
  )

  // Prevent users from removing themselves
  if (userId === currentUser.managerOSUserId) {
    throw new Error('You cannot remove yourself from the organization')
  }

  // Prevent removing the owner (billable user - ownership transfer not yet implemented)
  if (currentRole === 'OWNER') {
    throw new Error(
      'Cannot remove the organization owner. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent removing the last admin or owner
  if (currentRole === 'ADMIN') {
    const clerkMembers = await getClerkOrganizationMembers(
      organization.clerkOrganizationId
    )

    const adminOrOwnerPromises = clerkMembers.map(async m => {
      const memberUserId = m.public_user_data.user_id
      const isMemberBillingUser = await isBillingUserFromClerk(
        organization.clerkOrganizationId,
        memberUserId
      )
      const role = await mapClerkRoleToManagerOSRole(
        m.role,
        isMemberBillingUser
      )
      return role === 'ADMIN' || role === 'OWNER'
    })
    const adminOrOwnerResults = await Promise.all(adminOrOwnerPromises)
    const adminOrOwnerCount = adminOrOwnerResults.filter(Boolean).length

    if (adminOrOwnerCount <= 1) {
      throw new Error(
        'Cannot remove the last admin or owner from the organization'
      )
    }
  }

  // Remove user from Clerk organization first
  try {
    await removeUserFromClerkOrganization(
      organization.clerkOrganizationId,
      targetUser.clerkUserId
    )
  } catch {
    throw new Error('Failed to remove user from organization')
  }

  // Unlink user from person if linked
  if (targetUser.personId) {
    await prisma.user.update({
      where: { id: userId },
      data: { personId: null },
    })
  }

  // Sync updated user data to Clerk (organizationId and role changed)
  // Fetch user data to construct UserBrief for syncing
  const updatedTargetUser = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      id: true,
      email: true,
      name: true,
      clerkUserId: true,
      personId: true,
    },
  })
  if (updatedTargetUser && updatedTargetUser.clerkUserId) {
    // User is no longer in organization, so construct minimal UserBrief
    const targetUserBrief: UserBrief = {
      email: updatedTargetUser.email,
      name: updatedTargetUser.name,
      clerkUserId: updatedTargetUser.clerkUserId,
      clerkOrganizationId: null, // No longer in organization
      role: 'user', // Default role
      managerOSUserId: updatedTargetUser.id,
      managerOSOrganizationId: null, // No longer in organization
      managerOSPersonId: updatedTargetUser.personId,
    }
    await syncUserDataToClerk(targetUserBrief)
  }

  revalidatePath('/organization/members')
  revalidatePath('/organization/users')
  revalidatePath('/organization/settings')
}

/**
 * Leave the current organization
 * Users cannot leave if they are the only admin or owner left
 */
export async function leaveOrganization() {
  const currentUser = await getCurrentUser()

  // Check if current user belongs to an organization
  if (
    !currentUser.managerOSOrganizationId ||
    !currentUser.clerkOrganizationId
  ) {
    throw new Error('User must belong to an organization to leave it')
  }

  // Get organization with Clerk org ID and billing user
  const organization = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
      billingUserId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  // Get current user's Clerk membership to determine role
  const currentUserMembership = await getClerkOrganizationMembership(
    organization.clerkOrganizationId,
    currentUser.clerkUserId!
  )

  if (!currentUserMembership) {
    throw new Error('User not found in organization')
  }

  // Determine current role from Clerk membership
  const isBillingUser =
    organization.billingUserId === currentUser.managerOSUserId
  const currentRole = await mapClerkRoleToManagerOSRole(
    currentUserMembership.role,
    isBillingUser
  )

  // Prevent leaving if user is the only admin or owner
  // This ensures the organization always has at least one admin
  if (currentRole === 'ADMIN' || currentRole === 'OWNER') {
    const clerkMembers = await getClerkOrganizationMembers(
      organization.clerkOrganizationId
    )

    const adminOrOwnerPromises = clerkMembers.map(async m => {
      const memberUserId = m.public_user_data.user_id
      const isMemberBillingUser = await isBillingUserFromClerk(
        organization.clerkOrganizationId,
        memberUserId
      )
      const role = await mapClerkRoleToManagerOSRole(
        m.role,
        isMemberBillingUser
      )
      return role === 'ADMIN' || role === 'OWNER'
    })
    const adminOrOwnerResults = await Promise.all(adminOrOwnerPromises)
    const adminOrOwnerCount = adminOrOwnerResults.filter(Boolean).length

    if (adminOrOwnerCount <= 1) {
      throw new Error(
        'You cannot leave the organization because you are the only admin. Please assign another admin before leaving.'
      )
    }
  }

  // Get current user from database
  const dbUser = await prisma.user.findUnique({
    where: { id: currentUser.managerOSUserId },
    select: {
      id: true,
      clerkUserId: true,
      personId: true,
    },
  })

  if (!dbUser || !dbUser.clerkUserId) {
    throw new Error('User not found or does not have Clerk account')
  }

  // Remove user from Clerk organization first
  try {
    await removeUserFromClerkOrganization(
      organization.clerkOrganizationId,
      dbUser.clerkUserId
    )
  } catch (error) {
    console.error('Failed to remove user from Clerk organization:', error)
    throw new Error('Failed to leave organization')
  }

  // Unlink user from person if linked
  if (dbUser.personId) {
    await prisma.user.update({
      where: { id: dbUser.id },
      data: { personId: null },
    })
  }

  // Sync updated user data to Clerk (organizationId and role changed)
  // Fetch user data to construct UserBrief for syncing
  const updatedUser = await prisma.user.findUnique({
    where: { id: dbUser.id },
    select: {
      id: true,
      email: true,
      name: true,
      clerkUserId: true,
      personId: true,
    },
  })
  if (updatedUser && updatedUser.clerkUserId) {
    // User is no longer in organization, so construct minimal UserBrief
    const userBrief: UserBrief = {
      email: updatedUser.email,
      name: updatedUser.name,
      clerkUserId: updatedUser.clerkUserId,
      clerkOrganizationId: null, // No longer in organization
      role: 'user', // Default role
      managerOSUserId: updatedUser.id,
      managerOSOrganizationId: null, // No longer in organization
      managerOSPersonId: updatedUser.personId,
    }
    await syncUserDataToClerk(userBrief)
  }

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/organization/settings')
  revalidatePath('/organization/members')
  revalidatePath('/organization/users')
}

/**
 * Delete the current organization
 * Only admins can delete organizations
 * This will delete ALL associated data and cannot be undone
 */
export async function deleteOrganization() {
  const currentUser = await getCurrentUser()

  // Check if current user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error('Only organization admins can delete the organization')
  }

  // Check if current user belongs to an organization
  if (
    !currentUser.managerOSOrganizationId ||
    !currentUser.clerkOrganizationId
  ) {
    throw new Error('User must belong to an organization to delete it')
  }

  // Get organization with Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
    },
  })

  if (!organization || !organization.clerkOrganizationId) {
    throw new Error('Organization not found')
  }

  const organizationId = organization.id
  const clerkOrgId = organization.clerkOrganizationId

  // Delete all related data in dependency order
  // Organization invitations (before users)
  await prisma.organizationInvitation.deleteMany({
    where: { organizationId },
  })

  // Meeting instance participants
  await prisma.meetingInstanceParticipant.deleteMany({
    where: { meetingInstance: { organizationId } },
  })

  // Meeting instances
  await prisma.meetingInstance.deleteMany({
    where: { organizationId },
  })

  // Meeting participants
  await prisma.meetingParticipant.deleteMany({
    where: { meeting: { organizationId } },
  })

  // Meetings
  await prisma.meeting.deleteMany({
    where: { organizationId },
  })

  // Feedback
  await prisma.feedback.deleteMany({
    where: { about: { organizationId } },
  })

  // One-on-ones
  await prisma.oneOnOne.deleteMany({
    where: { manager: { organizationId } },
  })

  // Tasks (through initiatives or objectives)
  await prisma.task.deleteMany({
    where: {
      OR: [
        { initiative: { organizationId } },
        { objective: { initiative: { organizationId } } },
      ],
    },
  })

  // Check-ins
  await prisma.checkIn.deleteMany({
    where: { initiative: { organizationId } },
  })

  // Objectives
  await prisma.objective.deleteMany({
    where: { initiative: { organizationId } },
  })

  // Initiative owners
  await prisma.initiativeOwner.deleteMany({
    where: { initiative: { organizationId } },
  })

  // Initiatives
  await prisma.initiative.deleteMany({
    where: { organizationId },
  })

  // People
  await prisma.person.deleteMany({
    where: { organizationId },
  })

  // Teams
  await prisma.team.deleteMany({
    where: { organizationId },
  })

  // Job roles
  await prisma.jobRole.deleteMany({
    where: { organizationId },
  })

  // Job levels
  await prisma.jobLevel.deleteMany({
    where: { organizationId },
  })

  // Job domains
  await prisma.jobDomain.deleteMany({
    where: { organizationId },
  })

  // Entity links
  await prisma.entityLink.deleteMany({
    where: { organizationId },
  })

  // Notifications
  await prisma.notification.deleteMany({
    where: { organizationId },
  })

  // Report instances
  await prisma.reportInstance.deleteMany({
    where: { organizationId },
  })

  // Cron job executions
  await prisma.cronJobExecution.deleteMany({
    where: { organizationId },
  })

  // Notes
  await prisma.note.deleteMany({
    where: { organizationId },
  })

  // File attachments
  await prisma.fileAttachment.deleteMany({
    where: { organizationId },
  })

  // Note images
  await prisma.noteImage.deleteMany({
    where: { organizationId },
  })

  // GitHub orgs
  await prisma.organizationGithubOrg.deleteMany({
    where: { organizationId },
  })

  // Tolerance rules
  await prisma.organizationToleranceRule.deleteMany({
    where: { organizationId },
  })

  // Exceptions
  await prisma.exception.deleteMany({
    where: { organizationId },
  })

  // OAuth clients
  await prisma.oAuthClientMetadata.deleteMany({
    where: { organizationId },
  })

  // Onboarding instances
  await prisma.onboardingInstance.deleteMany({
    where: { organizationId },
  })

  // Onboarding templates
  await prisma.onboardingTemplate.deleteMany({
    where: { organizationId },
  })

  // Integrations
  await prisma.integration.deleteMany({
    where: { organizationId },
  })

  // Delete Clerk organization
  try {
    await deleteClerkOrganization(clerkOrgId)
  } catch (error) {
    console.error('Failed to delete Clerk organization:', error)
    // Continue with database deletion even if Clerk deletion fails
  }

  // Finally, delete the organization record
  await prisma.organization.delete({
    where: { id: organizationId },
  })

  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/organization', 'layout')
}

// User Settings Actions - Allow users to link themselves to a person

export async function getAvailablePersonsForSelfLinking(): Promise<
  PersonBrief[]
> {
  const currentUser = await getCurrentUser()

  // Check if user belongs to an organization
  if (!currentUser.managerOSOrganizationId) {
    return []
  }

  // Get persons in the same organization who aren't linked to a user
  return await prisma.person.findMany({
    where: {
      organizationId: currentUser.managerOSOrganizationId,
      user: null, // No user linked
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      status: true,
      avatar: true,
    },
    orderBy: { name: 'asc' },
  })
}

export async function linkSelfToPerson(personId: string) {
  const currentUser = await getCurrentUser()

  // Check if user belongs to an organization
  if (!currentUser.managerOSOrganizationId) {
    throw new Error('User must belong to an organization to link to a person')
  }

  // Query the database directly to check if user is already linked
  // This bypasses any cached session claims that might be stale
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      personId: true,
    },
  })

  if (!dbUser) {
    throw new Error('User not found')
  }

  // Check if user is already linked to a person using fresh database data
  if (dbUser.personId) {
    throw new Error(
      'You are already linked to a person. Unlink first to link elsewhere.'
    )
  }

  // Verify the person belongs to the same organization and isn't already linked
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.managerOSOrganizationId,
      user: null, // Ensure not already linked
    },
  })

  if (!person)
    throw new Error(
      'Person not found, access denied, or already linked to another user'
    )

  // Link the current user to the person
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { personId: personId },
  })

  // Sync updated user data to Clerk (personId changed)
  // This updates Clerk's public metadata so it's available in session tokens
  // Get fresh user data after linking - need to bypass cache to get updated personId
  const updatedUser = await getCurrentUser()
  try {
    updatedUser.managerOSPersonId = personId
    await syncUserDataToClerk(updatedUser)
  } catch (error) {
    // Log error but don't fail the operation - sync is non-critical
    console.error(
      'Failed to sync user data to Clerk after linking person:',
      error
    )
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function unlinkSelfFromPerson() {
  // Verify user is authenticated (getCurrentUser throws if not)
  await getCurrentUser()

  // Query the database directly to get the fresh personId value
  // This bypasses any cached session claims that might be stale
  const { userId } = await auth()
  if (!userId) {
    throw new Error('Unauthorized')
  }

  const dbUser = await prisma.user.findUnique({
    where: { clerkUserId: userId },
    select: {
      id: true,
      personId: true,
    },
  })

  if (!dbUser) {
    throw new Error('User not found')
  }

  // Check if user is actually linked to a person using fresh database data
  if (!dbUser.personId) {
    throw new Error('You are not currently linked to any person')
  }

  // Unlink the current user from their person
  await prisma.user.update({
    where: { id: dbUser.id },
    data: { personId: null },
  })

  // Sync updated user data to Clerk (personId changed)
  // This updates Clerk's public metadata so it's available in session tokens
  // Get fresh user data after unlinking - need to bypass cache to get updated personId
  const updatedUser = await getCurrentUser()
  try {
    updatedUser.managerOSPersonId = null
    await syncUserDataToClerk(updatedUser)
  } catch (error) {
    // Log error but don't fail the operation - sync is non-critical
    console.error(
      'Failed to sync user data to Clerk after unlinking person:',
      error
    )
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

// GitHub Organization Settings Actions

async function getGithubOrganizations() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can view GitHub organization settings'
    )
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    return []
  }

  try {
    return await prisma.organizationGithubOrg.findMany({
      where: {
        organizationId: user.managerOSOrganizationId,
      },
      orderBy: { githubOrgName: 'asc' },
    })
  } catch (error) {
    // If table doesn't exist yet or model isn't available, return empty array
    if (
      error instanceof Error &&
      (error.message.includes('does not exist') ||
        error.message.includes('Unknown model') ||
        error.message.includes('Cannot read properties') ||
        error.message.includes('undefined'))
    ) {
      console.warn(
        'OrganizationGithubOrg model/table not available. Please restart the dev server and run database migrations.'
      )
      return []
    }
    throw error
  }
}

async function addGithubOrganization(githubOrgName: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can add GitHub organizations'
    )
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage GitHub organizations'
    )
  }

  // Validate GitHub org name (alphanumeric, hyphens, underscores only)
  const sanitizedOrgName = githubOrgName.trim().toLowerCase()
  if (!/^[a-zA-Z0-9_-]+$/.test(sanitizedOrgName)) {
    throw new Error(
      'GitHub organization name can only contain letters, numbers, hyphens, and underscores'
    )
  }

  try {
    // Check if already exists
    const existing = await prisma.organizationGithubOrg.findUnique({
      where: {
        organizationId_githubOrgName: {
          organizationId: user.managerOSOrganizationId,
          githubOrgName: sanitizedOrgName,
        },
      },
    })

    if (existing) {
      throw new Error(
        'This GitHub organization is already configured for your organization'
      )
    }

    // Create the GitHub organization association
    await prisma.organizationGithubOrg.create({
      data: {
        organizationId: user.managerOSOrganizationId,
        githubOrgName: sanitizedOrgName,
      },
    })

    revalidatePath('/organization/settings')
  } catch (error) {
    // If model isn't available, provide helpful error message
    if (
      error instanceof Error &&
      (error.message.includes('Cannot read properties') ||
        error.message.includes('undefined') ||
        error.message.includes('does not exist'))
    ) {
      throw new Error(
        'GitHub organizations feature is not available yet. Please restart your dev server to load the database changes.'
      )
    }
    throw error
  }
}

async function removeGithubOrganization(githubOrgId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can remove GitHub organizations'
    )
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to manage GitHub organizations'
    )
  }

  try {
    // Verify the GitHub org belongs to user's organization
    const githubOrg = await prisma.organizationGithubOrg.findFirst({
      where: {
        id: githubOrgId,
        organizationId: user.managerOSOrganizationId,
      },
    })

    if (!githubOrg) {
      throw new Error('GitHub organization not found or access denied')
    }

    // Delete the GitHub organization association
    await prisma.organizationGithubOrg.delete({
      where: { id: githubOrgId },
    })

    revalidatePath('/organization/settings')
  } catch (error) {
    // If model isn't available, provide helpful error message
    if (
      error instanceof Error &&
      (error.message.includes('Cannot read properties') ||
        error.message.includes('undefined') ||
        error.message.includes('does not exist'))
    ) {
      throw new Error(
        'GitHub organizations feature is not available yet. Please restart your dev server to load the database changes.'
      )
    }
    throw error
  }
}

/**
 * Update organization profile (name)
 * Only admins can update organization profile
 */
export async function updateOrganizationProfile(formData: { name: string }) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can update organization profile'
    )
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId || !user.clerkOrganizationId) {
    throw new Error(
      'User must belong to an organization to update organization profile'
    )
  }

  // Validate name
  const name = formData.name.trim()
  if (!name) {
    throw new Error('Organization name cannot be empty')
  }

  if (name.length > 100) {
    throw new Error('Organization name must be 100 characters or less')
  }

  // Update organization name in Clerk
  try {
    await updateClerkOrganization(user.clerkOrganizationId, { name })
  } catch (error) {
    console.error('Failed to update Clerk organization:', error)
    throw new Error(
      error instanceof Error
        ? error.message
        : 'Failed to update organization profile'
    )
  }

  // Revalidate paths that depend on organization data
  revalidatePath('/organization/settings')
  revalidatePath('/dashboard')
  revalidatePath('/', 'layout')
}

// Initiative Size Definitions Actions

export type InitiativeSizeDefinitionsType = {
  xs?: string
  s?: string
  m?: string
  l?: string
  xl?: string
}

/**
 * Get initiative size definitions for the current organization
 */
export async function getInitiativeSizeDefinitions(): Promise<InitiativeSizeDefinitionsType | null> {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return null
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.managerOSOrganizationId },
    select: { initiativeSizeDefinitions: true },
  })

  if (!organization || !organization.initiativeSizeDefinitions) {
    return null
  }

  return organization.initiativeSizeDefinitions as InitiativeSizeDefinitionsType
}

/**
 * Update initiative size definitions for the current organization
 */
export async function updateInitiativeSizeDefinitions(
  definitions: InitiativeSizeDefinitionsType
) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can update initiative size definitions'
    )
  }

  if (!user.managerOSOrganizationId) {
    throw new Error(
      'User must belong to an organization to update initiative size definitions'
    )
  }

  // Validate definitions - ensure all values are strings and not too long
  const validSizes = ['xs', 's', 'm', 'l', 'xl'] as const
  const sanitizedDefinitions: InitiativeSizeDefinitionsType = {}

  for (const size of validSizes) {
    if (definitions[size] !== undefined) {
      const value = String(definitions[size]).trim()
      if (value.length > 500) {
        throw new Error(
          `Definition for size "${size}" must be 500 characters or less`
        )
      }
      if (value) {
        sanitizedDefinitions[size] = value
      }
    }
  }

  await prisma.organization.update({
    where: { id: user.managerOSOrganizationId },
    data: { initiativeSizeDefinitions: sanitizedDefinitions },
  })

  revalidatePath('/organization/settings')
  revalidatePath('/organization/settings/initiative-sizes')
  revalidatePath('/initiatives')
}
