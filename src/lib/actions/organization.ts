'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser } from '@/lib/auth-utils'

export async function createOrganization(formData: {
  name: string
  slug: string
}) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Check if organization slug already exists
  const existingOrg = await prisma.organization.findUnique({
    where: { slug: formData.slug },
  })

  if (existingOrg) {
    throw new Error('Organization slug already exists')
  }

  // Create organization and update user in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create organization
    const organization = await tx.organization.create({
      data: {
        name: formData.name,
        slug: formData.slug,
      },
    })

    // Update user to be admin of the organization
    await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: organization.id,
        role: 'ADMIN',
      },
    })

    return organization
  })

  revalidatePath('/')
  return result
}

export async function linkUserToPerson(userId: string, personId: string) {
  const currentUser = await getCurrentUser()

  // Check if user is admin
  if (currentUser.role !== 'ADMIN') {
    throw new Error('Only organization admins can link users to persons')
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

  // Check if user is admin
  if (currentUser.role !== 'ADMIN') {
    throw new Error('Only organization admins can unlink users from persons')
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

  // Check if user is admin
  if (currentUser.role !== 'ADMIN') {
    throw new Error(
      'Only organization admins can view available users for linking'
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

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can send invitations')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    throw new Error('User must belong to an organization to send invitations')
  }

  // Check if email is already a user in the organization
  const existingUser = await prisma.user.findFirst({
    where: {
      email: email.toLowerCase(),
      organizationId: user.organizationId,
    },
  })

  if (existingUser) {
    throw new Error('User is already a member of this organization')
  }

  // Check if there's already a pending invitation for this email
  const existingPendingInvitation =
    await prisma.organizationInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: user.organizationId,
        status: 'pending',
      },
    })

  if (existingPendingInvitation) {
    throw new Error('An invitation has already been sent to this email address')
  }

  // Check if there's a revoked or expired invitation for this email
  const existingRevokedOrExpiredInvitation =
    await prisma.organizationInvitation.findFirst({
      where: {
        email: email.toLowerCase(),
        organizationId: user.organizationId,
        status: { in: ['revoked', 'expired'] },
      },
    })

  if (existingRevokedOrExpiredInvitation) {
    // Reactivate the existing invitation instead of creating a new one
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const reactivatedInvitation = await prisma.organizationInvitation.update({
      where: { id: existingRevokedOrExpiredInvitation.id },
      data: {
        status: 'pending',
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
    return reactivatedInvitation
  }

  // Create invitation (expires in 7 days)
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + 7)

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
}

export async function getOrganizationInvitations() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can view invitations')
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

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can revoke invitations')
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

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can reactivate invitations')
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

export async function getPendingInvitationsForUser() {
  const user = await getCurrentUser()

  // Only return invitations if user doesn't have an organization
  if (user.organizationId) {
    return []
  }

  const invitations = await prisma.organizationInvitation.findMany({
    where: {
      email: user.email,
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
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.organizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Find the invitation
  const invitation = await prisma.organizationInvitation.findFirst({
    where: {
      id: invitationId,
      email: user.email,
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
    // Update user to join the organization
    const updatedUser = await tx.user.update({
      where: { id: user.id },
      data: {
        organizationId: invitation.organizationId,
      },
      include: {
        organization: true,
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

  revalidatePath('/')
  return result
}

// Organization Member Management Actions

export async function getOrganizationMembers() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    throw new Error('Only organization admins can view organization members')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    return []
  }

  // Get all users in the organization with their linked person info
  return await prisma.user.findMany({
    where: {
      organizationId: user.organizationId,
    },
    select: {
      id: true,
      name: true,
      email: true,
      role: true,
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
    orderBy: { name: 'asc' },
  })
}

export async function updateUserRole(
  userId: string,
  newRole: 'ADMIN' | 'USER'
) {
  const currentUser = await getCurrentUser()

  // Check if current user is admin
  if (currentUser.role !== 'ADMIN') {
    throw new Error('Only organization admins can change user roles')
  }

  // Check if current user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to manage roles')
  }

  // Verify the target user belongs to the same organization
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId: currentUser.organizationId,
    },
  })

  if (!targetUser) {
    throw new Error('User not found or access denied')
  }

  // Prevent users from changing their own role
  if (userId === currentUser.id) {
    throw new Error('You cannot change your own role')
  }

  // Prevent removing the last admin
  if (targetUser.role === 'ADMIN' && newRole === 'USER') {
    const adminCount = await prisma.user.count({
      where: {
        organizationId: currentUser.organizationId,
        role: 'ADMIN',
      },
    })

    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from the organization')
    }
  }

  // Update the user's role
  await prisma.user.update({
    where: { id: userId },
    data: { role: newRole },
  })

  revalidatePath('/organization/members')
  revalidatePath('/organization/settings')
}

export async function removeUserFromOrganization(userId: string) {
  const currentUser = await getCurrentUser()

  // Check if current user is admin
  if (currentUser.role !== 'ADMIN') {
    throw new Error(
      'Only organization admins can remove users from the organization'
    )
  }

  // Check if current user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to manage members')
  }

  // Verify the target user belongs to the same organization
  const targetUser = await prisma.user.findFirst({
    where: {
      id: userId,
      organizationId: currentUser.organizationId,
    },
  })

  if (!targetUser) {
    throw new Error('User not found or access denied')
  }

  // Prevent users from removing themselves
  if (userId === currentUser.id) {
    throw new Error('You cannot remove yourself from the organization')
  }

  // Prevent removing the last admin
  if (targetUser.role === 'ADMIN') {
    const adminCount = await prisma.user.count({
      where: {
        organizationId: currentUser.organizationId,
        role: 'ADMIN',
      },
    })

    if (adminCount <= 1) {
      throw new Error('Cannot remove the last admin from the organization')
    }
  }

  // Remove user from organization in a transaction
  await prisma.$transaction(async tx => {
    // Unlink user from person if linked
    if (targetUser.personId) {
      await tx.user.update({
        where: { id: userId },
        data: { personId: null },
      })
    }

    // Remove user from organization
    await tx.user.update({
      where: { id: userId },
      data: {
        organizationId: null,
        role: 'USER', // Reset role to default
      },
    })
  })

  revalidatePath('/organization/members')
  revalidatePath('/organization/settings')
}

// User Settings Actions - Allow users to link themselves to a person

export async function getAvailablePersonsForSelfLinking() {
  const currentUser = await getCurrentUser()

  // Check if user belongs to an organization
  if (!currentUser.organizationId) {
    throw new Error('User must belong to an organization to link to a person')
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

  // Check if user is already linked to a person
  if (currentUser.personId) {
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
    where: { id: currentUser.id },
    data: { personId: personId },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function unlinkSelfFromPerson() {
  const currentUser = await getCurrentUser()

  // Check if user is actually linked to a person
  if (!currentUser.personId) {
    throw new Error('You are not currently linked to any person')
  }

  // Unlink the current user from their person
  await prisma.user.update({
    where: { id: currentUser.id },
    data: { personId: null },
  })

  revalidatePath('/settings')
  revalidatePath('/dashboard')
}

export async function getCurrentUserWithPerson() {
  const currentUser = await getCurrentUser()

  if (!currentUser.organizationId) {
    return {
      user: currentUser,
      person: null,
    }
  }

  // Get the linked person if it exists
  const person = currentUser.personId
    ? await prisma.person.findUnique({
        where: { id: currentUser.personId },
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
          status: true,
          avatar: true,
        },
      })
    : null

  return {
    user: currentUser,
    person,
  }
}
