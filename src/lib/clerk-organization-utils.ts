'use server'

import { prisma } from '@/lib/db'
import { createClerkOrganization } from './clerk'

/**
 * Create subscription for a Clerk organization
 * Note: Clerk doesn't have a direct API to create subscriptions - they're created via checkout
 * This function is a placeholder for future use if Clerk adds this API
 */
async function _createClerkOrganizationSubscription(
  _clerkOrgId: string,
  _planId: string
): Promise<void> {
  // This function is a placeholder for documentation purposes
  return
}

/**
 * Map ManagerOS role to Clerk organization role
 */
export async function mapManagerOSRoleToClerkRole(
  role: 'OWNER' | 'ADMIN' | 'USER'
): Promise<'org:admin' | 'org:member'> {
  if (role === 'OWNER' || role === 'ADMIN') {
    return 'org:admin'
  }
  return 'org:member'
}

/**
 * Ensure a Clerk organization exists for a ManagerOS organization
 * Creates it if it doesn't exist
 * Note: This function requires name and slug to be provided since they're no longer stored in DB
 */
async function ensureClerkOrganization(
  organizationId: string,
  name: string,
  slug: string
): Promise<string> {
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

  // If Clerk organization already exists, return its ID
  if (organization.clerkOrganizationId) {
    return organization.clerkOrganizationId
  }

  // Create Clerk organization
  try {
    const clerkOrg = await createClerkOrganization(name, slug)

    // Update ManagerOS organization with Clerk org ID
    await prisma.organization.update({
      where: { id: organizationId },
      data: {
        clerkOrganizationId: clerkOrg.id,
      },
    })

    return clerkOrg.id
  } catch (error) {
    console.error(
      `Failed to create Clerk organization for ManagerOS org ${organizationId}:`,
      error
    )
    throw error
  }
}

export async function mapClerkRoleToManagerOSRole(
  clerkRole: 'org:admin' | 'org:member',
  isBillingUser: boolean = false
): Promise<'OWNER' | 'ADMIN' | 'USER'> {
  if (clerkRole === 'org:admin') {
    return isBillingUser ? 'OWNER' : 'ADMIN'
  }
  return 'USER'
}
