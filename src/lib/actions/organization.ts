/* eslint-disable camelcase */
'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import {
  getCurrentUser,
  getOptionalUser,
  isAdminOrOwner,
} from '@/lib/auth-utils'
import { syncUserDataToClerk } from '@/lib/clerk-session-sync'
import { auth } from '@clerk/nextjs/server'
import { getUserSubscriptionInfo } from '../subscription-utils'
import { PersonBrief } from '@/types/person'
export async function createOrganization(formData: {
  name: string
  slug: string
}) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.clerkUserId && user.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Look up the plan id from cler
  const userSubscriptionInfo = await getUserSubscriptionInfo(user.clerkUserId)

  // Validate that subscription was selected (required for creating new organizations)
  if (
    !userSubscriptionInfo ||
    userSubscriptionInfo.subscription_items?.length === 0 ||
    !userSubscriptionInfo.subscription_items?.[0]?.plan
  ) {
    throw new Error(
      'Subscription selection is required to create an organization'
    )
  }

  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug },
  })

  if (existingOrg) {
    throw new Error('Organization slug already exists')
  }

  // Determine plan name and subscription details
  const subscriptionPlanId =
    userSubscriptionInfo.subscription_items[0].plan_id || null
  const subscriptionPlanName =
    userSubscriptionInfo.subscription_items[0].plan.name || null

  // Determine role based on subscription typefree tier (plan === 'free')
  const userRole = 'OWNER'

  // Create organization and add user as admin/owner in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create organization with subscription information
    const organization = await tx.organization.create({
      data: {
        name: formData.name,
        slug: formData.slug,
        billingUserId: user.id, // Set creating user as billing user
        subscriptionPlanId,
        subscriptionPlanName,
        subscriptionStatus: userSubscriptionInfo.status,
      },
    })

    // Update user's organizationId (for backward compatibility)
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: userRole, // Keep for backward compatibility
      },
    })

    // Create OrganizationMember record with OWNER role for paid plans, ADMIN for free tier
    await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: organization.id,
        role: userRole,
      },
    })

    return organization
  })

  // Sync updated user data to Clerk (organizationId and role changed)
  // Wait for sync to complete to ensure Clerk metadata is updated
  const { userId } = await auth()
  if (userId) {
    await syncUserDataToClerk(userId)
  }

  // Revalidate paths that depend on organization status
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/organization/create', 'page')
  revalidatePath('/organization/subscribe', 'page')
  revalidatePath('/settings', 'page')

  return result
}

export async function linkUserToPerson(userId: string, personId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(currentUser)) {
    throw new Error(
      'Only organization admins or owners can link users to persons'
    )
  }

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error(
      'User must belong to an organization to link users to persons'
    )
  }

  // Verify the person belongs to the same organization
  const person = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId,
    },
  })

  if (!person) {
    throw new Error('Person not found or access denied')
  }

  // Check if person is already linked to a user
  const personWithUser = await prisma.person.findFirst({
    where: {
      id: personId,
      organizationId: currentUser.organizationId,
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
  if (!currentUser.organizationId) {
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
  if (!currentUser.organizationId) {
    return []
  }

  // Get users in the same organization who aren't linked to a person
  return await prisma.user.findMany({
    where: {
      organizationId: currentUser.organizationId,
      personId: null,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
    },
    orderBy: { name: 'asc' },
  })
}

// Organization Invitation Management Actions

export async function createOrganizationInvitation(email: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error('Only organization admins or owners can send invitations')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to send invitations')
  }

  // Check if email is already a user in the organization
  // First check if user exists at all
  const existingUserByEmail = await prisma.user.findUnique({
    where: {
      email: email.toLowerCase(),
    },
  })

  if (existingUserByEmail) {
    // If user exists and is in the same organization, they're already a member
    if (existingUserByEmail.organizationId === user.organizationId) {
      throw new Error('User is already a member of this organization')
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
        organizationId: user.organizationId,
      },
    },
  })

  if (existingInvitation) {
    // If invitation is already accepted, check if user is actually still in the organization
    // (user may have been removed after accepting the invitation)
    if (existingInvitation.status === 'accepted') {
      // Verify if the user is actually still a member
      const userStillInOrg = await prisma.user.findFirst({
        where: {
          email: email.toLowerCase(),
          organizationId: user.organizationId,
        },
      })

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
          invitedById: user.id, // Update who sent/reactivated the invitation
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
          invitedById: user.id, // Update who sent/reactivated the invitation
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
        organizationId: user.organizationId,
        invitedById: user.id,
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
              organizationId: user.organizationId,
            },
          },
        }
      )

      if (existingInvitation) {
        // If invitation is already accepted, check if user is actually still in the organization
        // (user may have been removed after accepting the invitation)
        if (existingInvitation.status === 'accepted') {
          // Verify if the user is actually still a member
          const userStillInOrg = await prisma.user.findFirst({
            where: {
              email: email.toLowerCase(),
              organizationId: user.organizationId,
            },
          })

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
                invitedById: user.id,
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
              invitedById: user.id,
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
  if (!user.organizationId) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      organizationId: user.organizationId,
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
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to manage invitations')
  }

  // Verify invitation belongs to user's organization
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: user.organizationId,
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

export async function reactivateOrganizationInvitation(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can reactivate invitations'
    )
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to manage invitations')
  }

  // Verify invitation belongs to user's organization
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      organizationId: user.organizationId,
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
  const existingUser = await prisma.user.findFirst({
    where: {
      email: invitation.email.toLowerCase(),
      organizationId: user.organizationId,
    },
  })

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
      invitedById: user.id, // Update who reactivated it
    },
  })

  revalidatePath('/organization/invitations')
  revalidatePath('/organization/members')
}

export async function acceptOrganizationInvitation(email: string) {
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
          name: true,
          slug: true,
        },
      },
    },
  })

  return invitation
}

export async function getPendingInvitationsForUser(email: string | null) {
  // If user doesn't exist, return empty array
  if (!email) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
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
          name: true,
          slug: true,
          description: true,
        },
      },
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
  }))
}

export async function acceptInvitationForUser(invitationId: string) {
  const user = await getOptionalUser()

  // Check if user already has an organization
  if (user?.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Normalize email to lowercase for comparison (invitations are stored in lowercase)
  const normalizedEmail = user?.email?.toLowerCase()

  if (!normalizedEmail) {
    throw new Error('User email is required to accept invitation')
  }

  // Find the invitation
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      email: normalizedEmail,
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
    throw new Error('Invitation not found or expired')
  }

  // Update user and invitation in a transaction
  const result = await prisma.$transaction(async tx => {
    // Update user's organizationId (for backward compatibility)
    const updatedUser = await tx.user.update({
      where: { id: user?.id },
      data: {
        organizationId: invitation.organizationId,
        role: 'USER', // Keep for backward compatibility
      },
      include: {
        organization: true,
      },
    })

    // Create OrganizationMember record with USER role
    if (!user) {
      throw new Error('User is required to accept invitation')
    }
    await tx.organizationMember.create({
      data: {
        userId: user.id,
        organizationId: invitation.organizationId,
        role: 'USER',
      },
    })

    // Mark invitation as accepted
    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    return updatedUser
  })

  // Sync updated user data to Clerk (organizationId changed)
  // Wait for sync to complete to ensure Clerk metadata is updated
  const { userId } = await auth()
  if (userId) {
    await syncUserDataToClerk(userId)
  }

  // Revalidate paths that depend on organization status
  revalidatePath('/', 'layout')
  revalidatePath('/dashboard', 'page')
  revalidatePath('/organization/create', 'page')
  revalidatePath('/organization/subscribe', 'page')
  revalidatePath('/settings', 'page')

  return result
}

// Organization Member Management Actions

/**
 * Get organization details including name, slug, description, and member count
 */
export async function getOrganizationDetails() {
  const user = await getCurrentUser()

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return null
  }

  const organization = await prisma.organization.findUnique({
    where: { id: user.organizationId },
    select: {
      id: true,
      name: true,
      slug: true,
      description: true,
      createdAt: true,
      _count: {
        select: {
          members: true,
          people: true,
          teams: true,
        },
      },
    },
  })

  return organization
}

export async function getOrganizationMembers() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can view organization members'
    )
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return []
  }

  // Get all organization members with their user and person info
  const members = await prisma.organizationMember.findMany({
    where: {
      organizationId: user.organizationId,
    },
    include: {
      user: {
        select: {
          id: true,
          name: true,
          email: true,
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
      },
    },
    orderBy: {
      user: {
        name: 'asc',
      },
    },
  })

  // Transform to match the expected format
  return members.map(member => ({
    id: member.user.id,
    name: member.user.name,
    email: member.user.email,
    role: member.role,
    createdAt: member.user.createdAt,
    person: member.user.person,
  }))
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
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to manage roles')
  }

  // Verify the target user is a member of the same organization
  const targetMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: currentUser.organizationId,
      },
    },
    include: {
      user: {
        select: {
          clerkUserId: true,
        },
      },
    },
  })

  if (!targetMembership) {
    throw new Error('User not found or access denied')
  }

  // Prevent users from changing their own role
  if (userId === currentUser.id) {
    throw new Error('You cannot change your own role')
  }

  // Prevent changing OWNER role (ownership transfer not yet implemented)
  if (targetMembership.role === 'OWNER' && newRole !== 'OWNER') {
    throw new Error(
      'Cannot change the organization owner role. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent assigning OWNER role (ownership transfer not yet implemented)
  if (targetMembership.role !== 'OWNER' && newRole === 'OWNER') {
    throw new Error(
      'Cannot assign OWNER role. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent removing the last admin or owner
  if (targetMembership.role === 'ADMIN' && newRole === 'USER') {
    const adminOrOwnerCount = await prisma.organizationMember.count({
      where: {
        organizationId: currentUser.organizationId,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    })

    if (adminOrOwnerCount <= 1) {
      throw new Error(
        'Cannot remove the last admin or owner from the organization'
      )
    }
  }

  // Update the user's role in the OrganizationMember table
  await prisma.organizationMember.update({
    where: {
      userId_organizationId: {
        userId,
        organizationId: currentUser.organizationId,
      },
    },
    data: { role: newRole },
  })

  // Sync updated user data to Clerk (role changed)
  if (targetMembership.user.clerkUserId) {
    await syncUserDataToClerk(targetMembership.user.clerkUserId)
  }

  revalidatePath('/organization/members')
  revalidatePath('/organization/settings')
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
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to manage members')
  }

  // Verify the target user is a member of the same organization
  const targetMembership = await prisma.organizationMember.findUnique({
    where: {
      userId_organizationId: {
        userId,
        organizationId: currentUser.organizationId,
      },
    },
    include: {
      user: {
        select: {
          clerkUserId: true,
          personId: true,
        },
      },
    },
  })

  if (!targetMembership) {
    throw new Error('User not found or access denied')
  }

  // Prevent users from removing themselves
  if (userId === currentUser.id) {
    throw new Error('You cannot remove yourself from the organization')
  }

  // Prevent removing the owner (billable user - ownership transfer not yet implemented)
  if (targetMembership.role === 'OWNER') {
    throw new Error(
      'Cannot remove the organization owner. Ownership transfer is not yet implemented.'
    )
  }

  // Prevent removing the last admin or owner
  if (targetMembership.role === 'ADMIN') {
    const adminOrOwnerCount = await prisma.organizationMember.count({
      where: {
        organizationId: currentUser.organizationId,
        role: {
          in: ['ADMIN', 'OWNER'],
        },
      },
    })

    if (adminOrOwnerCount <= 1) {
      throw new Error(
        'Cannot remove the last admin or owner from the organization'
      )
    }
  }

  // Remove user from organization in a transaction
  await prisma.$transaction(async tx => {
    // Unlink user from person if linked
    if (targetMembership.user.personId) {
      await tx.user.update({
        where: { id: userId },
        data: { personId: null },
      })
    }

    // Remove OrganizationMember record (this removes the user from the organization)
    if (!currentUser.organizationId) {
      throw new Error('Organization ID is required')
    }

    await tx.organizationMember.delete({
      where: {
        userId_organizationId: {
          userId,
          organizationId: currentUser.organizationId,
        },
      },
    })

    // Clear organizationId and reset role on User record to prevent stale permissions
    // This is important because getCurrentUser() falls back to User.role when no
    // OrganizationMember record exists, so we need to clear these fields
    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        role: 'USER', // Reset to default role
      },
    })
  })

  // Sync updated user data to Clerk (organizationId and role changed)
  if (targetMembership.user.clerkUserId) {
    await syncUserDataToClerk(targetMembership.user.clerkUserId)
  }

  revalidatePath('/organization/members')
  revalidatePath('/organization/settings')
}

// User Settings Actions - Allow users to link themselves to a person

export async function getAvailablePersonsForSelfLinking(): Promise<
  PersonBrief[]
> {
  const currentUser = await getCurrentUser()

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    return []
  }

  // Get persons in the same organization who aren't linked to a user
  return await prisma.person.findMany({
    where: {
      organizationId: currentUser.organizationId,
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
  if (!currentUser.organizationId) {
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
      organizationId: currentUser.organizationId,
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
  if (userId) {
    try {
      await syncUserDataToClerk(userId)
    } catch (error) {
      // Log error but don't fail the operation - sync is non-critical
      console.error(
        'Failed to sync user data to Clerk after linking person:',
        error
      )
    }
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
  if (userId) {
    try {
      await syncUserDataToClerk(userId)
    } catch (error) {
      // Log error but don't fail the operation - sync is non-critical
      console.error(
        'Failed to sync user data to Clerk after unlinking person:',
        error
      )
    }
  }

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function getCurrentUserWithPerson() {
  // Skip session claims to get fresh person link data from database
  // This ensures we get the latest personId even if session claims haven't refreshed yet
  const currentUser = await getCurrentUser({ skipSessionClaims: true })
  const person = await prisma.person.findUnique({
    where: { id: currentUser.personId || '' },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
      avatar: true,
    },
  })
  return {
    user: currentUser,
    person,
  }
}

export async function getSidebarData() {
  try {
    // Skip session claims to get fresh person link data from database
    // This ensures we get the latest personId even if session claims haven't refreshed yet
    // This is especially important for the sidebar which is refreshed after person link changes
    const { user, person } = await getCurrentUserWithPerson()
    const { getFilteredNavigation } = await import('@/lib/auth-utils')

    const navigation = await getFilteredNavigation(user)

    if (!user.organizationId) {
      return {
        user: user,
        person: null,
        navigation,
      }
    }

    // Get the linked person if it exists, using the fresh personId from getCurrentUser
    return {
      user: user,
      person: person,
      navigation,
    }
  } catch (error) {
    // If getCurrentUser fails, return empty sidebar data
    // This can happen if the user is authenticated in Clerk but not in database yet
    console.error('Error fetching sidebar data:', error)
    return {
      user: null,
      person: null,
      navigation: [],
    }
  }
}

// GitHub Organization Settings Actions

export async function getGithubOrganizations() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can view GitHub organization settings'
    )
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return []
  }

  try {
    return await prisma.organizationGithubOrg.findMany({
      where: {
        organizationId: user.organizationId,
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

export async function addGithubOrganization(githubOrgName: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can add GitHub organizations'
    )
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
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
          organizationId: user.organizationId,
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
        organizationId: user.organizationId,
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

export async function removeGithubOrganization(githubOrgId: string) {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    throw new Error(
      'Only organization admins or owners can remove GitHub organizations'
    )
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error(
      'User must belong to an organization to manage GitHub organizations'
    )
  }

  try {
    // Verify the GitHub org belongs to user's organization
    const githubOrg = await prisma.organizationGithubOrg.findFirst({
      where: {
        id: githubOrgId,
        organizationId: user.organizationId,
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
