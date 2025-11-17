/* eslint-disable camelcase */
'use server'

import { prisma } from '@/lib/db'
import { revalidatePath } from 'next/cache'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'
import { syncUserDataToClerk } from '@/lib/clerk-session-sync'
import { auth } from '@clerk/nextjs/server'
import { getUserSubscriptionInfo } from '../subscription-utils'
import { PersonBrief } from '@/types/person'
import type { UserBrief } from '@/lib/auth-types'
import {
  createClerkOrganization,
  addUserToClerkOrganization,
  mapManagerOSRoleToClerkRole,
  getClerkOrganizationSubscription,
  getClerkOrganization,
  getClerkOrganizationMembers,
  mapClerkRoleToManagerOSRole,
  getClerkOrganizationMembership,
  updateUserRoleInClerkOrganization,
  removeUserFromClerkOrganization,
  getClerkOrganizationMembersCount,
} from '../clerk-organization-utils'
export async function createOrganization(formData: {
  name: string
  slug: string
}) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.clerkUserId && user.managerOSOrganizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Determine role - creator is always OWNER
  const userRole = 'OWNER'

  // Create Clerk organization first (Clerk will handle slug uniqueness)
  let clerkOrgId: string
  try {
    const clerkOrg = await createClerkOrganization(formData.name, formData.slug)
    clerkOrgId = clerkOrg.id
  } catch (error) {
    console.error('Failed to create Clerk organization:', error)
    // Re-throw with user-friendly message if it's a slug conflict
    if (
      error instanceof Error &&
      (error.message.includes('422') || error.message.includes('slug'))
    ) {
      throw new Error(
        'Organization slug already exists. Please choose a different slug.'
      )
    }
    throw new Error(
      'Failed to create organization. Please try again or contact support.'
    )
  }

  // Get subscription from Clerk organization (may be null initially)
  const orgSubscriptionInfo = await getClerkOrganizationSubscription(clerkOrgId)

  // Determine plan name and subscription details from org subscription or user subscription
  let subscriptionPlanId: string | null = null
  let subscriptionPlanName: string | null = null
  let subscriptionStatus: string = 'active'

  if (
    orgSubscriptionInfo &&
    orgSubscriptionInfo.subscription_items &&
    orgSubscriptionInfo.subscription_items.length > 0 &&
    orgSubscriptionInfo.subscription_items[0]?.plan
  ) {
    // Organization has a subscription
    subscriptionPlanId =
      orgSubscriptionInfo.subscription_items[0].plan_id || null
    subscriptionPlanName =
      orgSubscriptionInfo.subscription_items[0].plan.name || null
    subscriptionStatus = orgSubscriptionInfo.status || 'active'
  } else {
    // Fallback: check user subscription (for migration/backward compatibility)
    const userSubscriptionInfo = await getUserSubscriptionInfo(
      user.clerkUserId || ''
    )
    if (
      userSubscriptionInfo &&
      userSubscriptionInfo.subscription_items &&
      userSubscriptionInfo.subscription_items.length > 0 &&
      userSubscriptionInfo.subscription_items[0]?.plan
    ) {
      subscriptionPlanId =
        userSubscriptionInfo.subscription_items[0].plan_id || null
      subscriptionPlanName =
        userSubscriptionInfo.subscription_items[0].plan.name || null
      subscriptionStatus = userSubscriptionInfo.status || 'active'
    } else {
      // No subscription - default to free plan
      subscriptionPlanName = 'Solo'
      subscriptionStatus = 'active'
    }
  }

  // Create organization in a transaction
  const result = await prisma.$transaction(async tx => {
    // Create organization with subscription information
    // Name and slug are stored in Clerk, not in our database
    const organization = await tx.organization.create({
      data: {
        billingUserId: user.managerOSUserId || '', // Set creating user as billing user (for reference)
        clerkOrganizationId: clerkOrgId,
        subscriptionPlanId,
        subscriptionPlanName,
        subscriptionStatus,
      },
    })

    return organization
  })

  // Add user to Clerk organization with admin role (OWNER maps to org:admin)
  if (user.clerkUserId) {
    try {
      await addUserToClerkOrganization(
        clerkOrgId,
        user.clerkUserId,
        await mapManagerOSRoleToClerkRole(userRole)
      )
    } catch (error) {
      console.error('Failed to add user to Clerk organization:', error)
      // Don't fail the whole operation - user is already in ManagerOS org
    }
  }

  // Sync updated user data to Clerk (organizationId and role changed)
  // Wait for sync to complete to ensure Clerk metadata is updated
  const updatedUser = await getCurrentUser()
  await syncUserDataToClerk(updatedUser)

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

export async function reactivateOrganizationInvitation(invitationId: string) {
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
          clerkOrganizationId: true,
        },
      },
    },
  })

  return invitation
}

export async function getPendingInvitationsForUser(clerkUserId: string | null) {
  // If user doesn't exist, return empty array
  if (!clerkUserId || !process.env.CLERK_SECRET_KEY) {
    return []
  }

  try {
    // Fetch pending invitations from Clerk API
    const response = await fetch(
      `https://api.clerk.com/v1/users/${clerkUserId}/organization_invitations?status=pending`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      console.error(
        `Failed to fetch Clerk invitations: ${response.status} ${await response.text()}`
      )
      return []
    }

    const data = (await response.json()) as {
      data: Array<{
        id: string
        email_address: string
        organization_id: string
        status: string
        created_at: number
        updated_at: number
        public_organization_data: {
          id: string
          name: string
          slug: string
        }
        public_metadata?: {
          invited_by_name?: string
          invited_by_email?: string
        }
      }>
    }

    // Get organization details from our database to enrich the response
    const clerkOrgIds = data.data.map(inv => inv.organization_id)
    const organizations = await prisma.organization.findMany({
      where: {
        clerkOrganizationId: {
          in: clerkOrgIds,
        },
      },
      select: {
        id: true,
        clerkOrganizationId: true,
        description: true,
      },
    })

    const orgMap = new Map(
      organizations.map(org => [org.clerkOrganizationId, org])
    )

    // Transform Clerk invitations to match expected format
    return data.data
      .filter(inv => {
        // Filter out expired invitations (Clerk doesn't filter by expiration)
        // We'll check expiration if Clerk provides it, otherwise include all pending
        return inv.status === 'pending'
      })
      .map(inv => {
        const org = orgMap.get(inv.organization_id)
        return {
          id: inv.id,
          email: inv.email_address,
          organizationId: org?.id || '',
          status: 'pending' as const,
          createdAt: new Date(inv.created_at * 1000).toISOString(),
          updatedAt: new Date(inv.updated_at * 1000).toISOString(),
          expiresAt: new Date(
            (inv.created_at + 7 * 24 * 60 * 60) * 1000
          ).toISOString(), // Assume 7-day expiration (standard Clerk default)
          acceptedAt: null,
          organization: org
            ? {
                id: org.id,
                clerkOrganizationId: org.clerkOrganizationId,
                description: org.description,
                name: inv.public_organization_data.name,
              }
            : {
                id: '',
                clerkOrganizationId: inv.organization_id,
                description: null,
                name: inv.public_organization_data.name,
              },
          invitedBy: {
            name:
              inv.public_metadata?.invited_by_name ||
              inv.public_organization_data.name,
            email: inv.public_metadata?.invited_by_email || '',
          },
        }
      })
  } catch (error) {
    console.error('Error fetching pending invitations from Clerk:', error)
    return []
  }
}

export async function acceptInvitationForUser(invitationId: string) {
  const user = await getCurrentUser()

  // Check if user already has an organization
  if (user.managerOSOrganizationId) {
    throw new Error('User already belongs to an organization')
  }

  // Normalize email to lowercase for comparison (invitations are stored in lowercase)
  const normalizedEmail = user.email?.toLowerCase()

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

  // Get organization with Clerk org ID
  const organization = await prisma.organization.findUnique({
    where: { id: invitation.organizationId },
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

  // Update invitation in a transaction
  const result = await prisma.$transaction(async tx => {
    // Mark invitation as accepted
    await tx.organizationInvitation.update({
      where: { id: invitation.id },
      data: {
        status: 'accepted',
        acceptedAt: new Date(),
      },
    })

    return organization
  })

  // Add user to Clerk organization
  if (user?.clerkUserId && clerkOrgId) {
    try {
      await addUserToClerkOrganization(
        clerkOrgId,
        user.clerkUserId,
        await mapManagerOSRoleToClerkRole('USER')
      )
    } catch (error) {
      console.error('Failed to add user to Clerk organization:', error)
      // Don't fail the operation - user is already in ManagerOS org
    }
  }

  // Sync updated user data to Clerk (organizationId changed)
  // Wait for sync to complete to ensure Clerk metadata is updated
  const updatedUser = await getCurrentUser()
  await syncUserDataToClerk(updatedUser)

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
 * Fetches name and slug from Clerk API
 * Returns both Clerk organization details and ManagerOS organization statistics
 */
export async function getOrganizationDetails() {
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

  // Get members from Clerk API
  const clerkMembers = await getClerkOrganizationMembers(
    organization.clerkOrganizationId
  )

  // Get all Clerk user IDs
  const clerkUserIds = clerkMembers.map(m => m.public_user_data.user_id)

  // Fetch corresponding ManagerOS users
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

  // Create a map of clerkUserId -> user
  const userMap = new Map(users.map(u => [u.clerkUserId || '', u]))

  // Transform Clerk members to ManagerOS format
  const memberPromises = clerkMembers.map(async clerkMember => {
    const clerkUserId = clerkMember.public_user_data.user_id
    const managerOSUser = userMap.get(clerkUserId)

    if (!managerOSUser) {
      // User exists in Clerk but not in ManagerOS DB yet
      return null
    }

    // Determine if user is billing user (OWNER)
    const isBillingUser = organization.billingUserId === managerOSUser.id

    // Map Clerk role to ManagerOS role
    const managerOSRole = await mapClerkRoleToManagerOSRole(
      clerkMember.role,
      isBillingUser
    )

    return {
      id: managerOSUser.id,
      name: managerOSUser.name,
      email: managerOSUser.email,
      role: managerOSRole,
      createdAt: managerOSUser.createdAt,
      person: managerOSUser.person,
    }
  })
  const memberResults = await Promise.all(memberPromises)
  const members = memberResults
    .filter((m): m is NonNullable<typeof m> => m !== null)
    .sort((a, b) => a.name.localeCompare(b.name))

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

  // Get organization with billing user info
  const orgWithBilling = await prisma.organization.findUnique({
    where: { id: currentUser.managerOSOrganizationId },
    select: {
      billingUserId: true,
    },
  })

  // Determine current role from Clerk membership
  const isCurrentBillingUser = orgWithBilling?.billingUserId === userId
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
    const clerkUserIds = clerkMembers.map(m => m.public_user_data.user_id)
    const users = await prisma.user.findMany({
      where: {
        clerkUserId: { in: clerkUserIds },
      },
      select: { id: true, clerkUserId: true },
    })
    const userMap = new Map(users.map(u => [u.clerkUserId || '', u.id]))

    const adminOrOwnerPromises = clerkMembers.map(async m => {
      const memberUserId = m.public_user_data.user_id
      const memberUserDbId = userMap.get(memberUserId)
      const isBillingUser = orgWithBilling?.billingUserId === memberUserDbId
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
    await updateUserRoleInClerkOrganization(
      organization.clerkOrganizationId,
      targetUser.clerkUserId,
      await mapManagerOSRoleToClerkRole(newRole)
    )
  } catch (error) {
    console.error('Failed to update user role in Clerk organization:', error)
    throw new Error('Failed to update user role')
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
export async function becomeOrganizationOwner() {
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

  // Get subscription from Clerk organization (preferred) or user subscription (fallback)
  const { getClerkOrganizationSubscription } = await import(
    '../clerk-organization-utils'
  )
  const orgSubscriptionInfo = clerkOrgId
    ? await getClerkOrganizationSubscription(clerkOrgId)
    : null

  // Determine plan name and subscription details
  // Allow both paid subscriptions and free plans
  let subscriptionPlanId: string | null = null
  let subscriptionPlanName: string | null = null
  let subscriptionStatus: string = 'active'

  if (
    orgSubscriptionInfo &&
    orgSubscriptionInfo.subscription_items &&
    orgSubscriptionInfo.subscription_items.length > 0 &&
    orgSubscriptionInfo.subscription_items[0]?.plan
  ) {
    // Organization has a subscription
    const plan = orgSubscriptionInfo.subscription_items[0].plan
    subscriptionPlanId = plan.id || null
    subscriptionPlanName = plan.name || null
    subscriptionStatus = orgSubscriptionInfo.status || 'active'
  } else {
    // Fallback: check user subscription (for backward compatibility)
    const userSubscriptionInfo = await getUserSubscriptionInfo(
      currentUser.clerkUserId
    )
    if (
      userSubscriptionInfo &&
      userSubscriptionInfo.subscription_items &&
      userSubscriptionInfo.subscription_items.length > 0 &&
      userSubscriptionInfo.subscription_items[0]?.plan
    ) {
      // User has a paid subscription
      const plan = userSubscriptionInfo.subscription_items[0].plan
      subscriptionPlanId = plan.id || null
      subscriptionPlanName = plan.name || null
      subscriptionStatus = userSubscriptionInfo.status || 'active'
    } else {
      // No paid subscription - allow free plan (Solo)
      subscriptionPlanId = null
      subscriptionPlanName = 'Solo'
      subscriptionStatus = 'active'
    }
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

  // Get organization with billing user info
  const orgWithBilling = await prisma.organization.findUnique({
    where: { id: organizationId },
    select: {
      id: true,
      clerkOrganizationId: true,
      billingUserId: true,
    },
  })

  if (!orgWithBilling) {
    throw new Error('Organization not found')
  }

  // Find existing owner (billing user)
  const existingOwnerUser = orgWithBilling.billingUserId
    ? await prisma.user.findUnique({
        where: { id: orgWithBilling.billingUserId },
        select: {
          id: true,
          clerkUserId: true,
          email: true,
          name: true,
          personId: true,
        },
      })
    : null

  // Update organization billingUserId and subscription info
  await prisma.organization.update({
    where: { id: organizationId },
    data: {
      billingUserId: currentUser.managerOSUserId || '',
      clerkOrganizationId: clerkOrgId || undefined,
      subscriptionPlanId: subscriptionPlanId || undefined,
      subscriptionPlanName: subscriptionPlanName || undefined,
      subscriptionStatus: subscriptionStatus || undefined,
    },
  })

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
  const isBillingUser = organization.billingUserId === userId
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
    const clerkUserIds = clerkMembers.map(m => m.public_user_data.user_id)
    const users = await prisma.user.findMany({
      where: {
        clerkUserId: { in: clerkUserIds },
      },
      select: { id: true, clerkUserId: true },
    })
    const userMap = new Map(users.map(u => [u.clerkUserId || '', u.id]))

    const adminOrOwnerPromises = clerkMembers.map(async m => {
      const memberUserId = m.public_user_data.user_id
      const memberUserDbId = userMap.get(memberUserId)
      const isMemberBillingUser = organization.billingUserId === memberUserDbId
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
  } catch (error) {
    console.error('Failed to remove user from Clerk organization:', error)
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
  revalidatePath('/organization/settings')
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

export async function getGithubOrganizations() {
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

export async function addGithubOrganization(githubOrgName: string) {
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

export async function removeGithubOrganization(githubOrgId: string) {
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
