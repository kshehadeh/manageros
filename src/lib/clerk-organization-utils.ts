/* eslint-disable camelcase */
'use server'

import { prisma } from '@/lib/db'
import { ClerkCommerceSubscription } from './clerk-types'

const CLERK_API_BASE = 'https://api.clerk.com/v1'

/**
 * Clerk Organization API response types
 */
export interface ClerkOrganization {
  id: string
  name: string
  slug: string
  created_at: number
  updated_at: number
  members_count: number
  admin_delete_enabled: boolean
  max_allowed_memberships: number | null
  has_image: boolean
  image_url: string
  public_metadata: Record<string, unknown>
  private_metadata: Record<string, unknown>
  object: 'organization'
}

interface ClerkOrganizationMembership {
  id: string
  organization_id: string
  public_user_data: {
    user_id: string
    first_name: string | null
    last_name: string | null
    image_url: string
    has_image: boolean
    identifier: string
  }
  role: 'org:admin' | 'org:member'
  created_at: number
  updated_at: number
  object: 'organization_membership'
}

/**
 * Create a Clerk organization
 */
export async function createClerkOrganization(
  name: string,
  slug: string
): Promise<ClerkOrganization> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is not set. Cannot create Clerk organization.'
    )
  }

  const response = await fetch(`${CLERK_API_BASE}/organizations`, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      name,
      slug,
    }),
  })

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to create Clerk organization: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as ClerkOrganization
}

/**
 * Delete a Clerk organization
 */
export async function deleteClerkOrganization(
  clerkOrgId: string
): Promise<void> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is not set. Cannot delete Clerk organization.'
    )
  }

  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${clerkOrgId}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text()
    throw new Error(
      `Failed to delete Clerk organization: ${response.status} ${errorText}`
    )
  }
}

/**
 * Add a user to a Clerk organization
 */
export async function addUserToClerkOrganization(
  clerkOrgId: string,
  clerkUserId: string,
  role: 'org:admin' | 'org:member'
): Promise<ClerkOrganizationMembership> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is not set. Cannot add user to Clerk organization.'
    )
  }

  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships`,
    {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        user_id: clerkUserId,
        role,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    // If user is already a member, that's okay - return success
    if (response.status === 422) {
      // Try to get existing membership
      const existingMembership = await getClerkOrganizationMembership(
        clerkOrgId,
        clerkUserId
      )
      if (existingMembership) {
        return existingMembership
      }
    }
    throw new Error(
      `Failed to add user to Clerk organization: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as ClerkOrganizationMembership
}

/**
 * Get a user's membership in a Clerk organization
 */
export async function getClerkOrganizationMembership(
  clerkOrgId: string,
  clerkUserId: string
): Promise<ClerkOrganizationMembership | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    const data = (await response.json()) as {
      data: ClerkOrganizationMembership[]
    }

    return (
      data.data.find(
        membership => membership.public_user_data.user_id === clerkUserId
      ) || null
    )
  } catch {
    return null
  }
}

/**
 * Remove a user from a Clerk organization
 */
export async function removeUserFromClerkOrganization(
  clerkOrgId: string,
  clerkUserId: string
): Promise<void> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is not set. Cannot remove user from Clerk organization.'
    )
  }

  // First, get the membership ID
  const membership = await getClerkOrganizationMembership(
    clerkOrgId,
    clerkUserId
  )

  if (!membership) {
    // User is not a member, which is fine
    return
  }

  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships/${membership.id}`,
    {
      method: 'DELETE',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
      },
    }
  )

  if (!response.ok && response.status !== 404) {
    const errorText = await response.text()
    throw new Error(
      `Failed to remove user from Clerk organization: ${response.status} ${errorText}`
    )
  }
}

/**
 * Update a user's role in a Clerk organization
 */
export async function updateUserRoleInClerkOrganization(
  clerkOrgId: string,
  clerkUserId: string,
  role: 'org:admin' | 'org:member'
): Promise<ClerkOrganizationMembership> {
  if (!process.env.CLERK_SECRET_KEY) {
    throw new Error(
      'CLERK_SECRET_KEY environment variable is not set. Cannot update user role in Clerk organization.'
    )
  }

  // First, get the membership ID
  const membership = await getClerkOrganizationMembership(
    clerkOrgId,
    clerkUserId
  )

  if (!membership) {
    throw new Error('User is not a member of the Clerk organization')
  }

  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships/${membership.id}`,
    {
      method: 'PATCH',
      headers: {
        Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        role,
      }),
    }
  )

  if (!response.ok) {
    const errorText = await response.text()
    throw new Error(
      `Failed to update user role in Clerk organization: ${response.status} ${errorText}`
    )
  }

  return (await response.json()) as ClerkOrganizationMembership
}

/**
 * Get organization details from Clerk
 */
export async function getClerkOrganization(
  clerkOrgId: string
): Promise<ClerkOrganization | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/organizations/${clerkOrgId}`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      throw new Error(
        `Failed to get Clerk organization: ${response.status} ${errorText}`
      )
    }

    return (await response.json()) as ClerkOrganization
  } catch (error) {
    console.error('Error getting Clerk organization:', error)
    return null
  }
}

/**
 * Get subscription for a Clerk organization
 */
export async function getClerkOrganizationSubscription(
  clerkOrgId: string
): Promise<ClerkCommerceSubscription | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/organizations/${clerkOrgId}/billing/subscription`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      if (response.status === 404) {
        return null
      }
      const errorText = await response.text()
      throw new Error(
        `Failed to get Clerk organization subscription: ${response.status} ${errorText}`
      )
    }

    return (await response.json()) as ClerkCommerceSubscription
  } catch (error) {
    console.error('Error getting Clerk organization subscription:', error)
    return null
  }
}

/**
 * Create subscription for a Clerk organization
 * Note: Clerk doesn't have a direct API to create subscriptions - they're created via checkout
 * This function is a placeholder for future use if Clerk adds this API
 */
export async function _createClerkOrganizationSubscription(
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
export async function ensureClerkOrganization(
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

/**
 * Get all members of a Clerk organization
 */
export async function getClerkOrganizationMembers(
  clerkOrgId: string
): Promise<ClerkOrganizationMembership[]> {
  if (!process.env.CLERK_SECRET_KEY) {
    return []
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )
    if (!response.ok) {
      return []
    }

    const data = (await response.json()) as {
      data: ClerkOrganizationMembership[]
    }

    return data.data || []
  } catch (error) {
    console.error('Error getting Clerk organization members:', error)
    return []
  }
}

/**
 * Get the number of members of a Clerk organization
 */
export async function getClerkOrganizationMembersCount(
  clerkOrgId: string
): Promise<number> {
  const members = await getClerkOrganizationMembers(clerkOrgId)
  return members.length
}

/**
 * Map Clerk role to ManagerOS role
 * OWNER is determined by checking if user is the billing user
 */
/**
 * Get the billing user's Clerk user ID from an organization's subscription
 * Returns null if no subscription or payer found
 */
export async function getBillingUserClerkId(
  clerkOrgId: string
): Promise<string | null> {
  try {
    const subscription = await getClerkOrganizationSubscription(clerkOrgId)
    if (subscription?.subscription_items?.[0]?.payer?.user_id) {
      return subscription.subscription_items[0].payer.user_id
    }
    return null
  } catch (error) {
    console.error('Error getting billing user from Clerk:', error)
    return null
  }
}

/**
 * Check if a Clerk user ID is the billing user for an organization
 */
export async function isBillingUser(
  clerkOrgId: string,
  clerkUserId: string
): Promise<boolean> {
  const billingUserClerkId = await getBillingUserClerkId(clerkOrgId)
  return billingUserClerkId === clerkUserId
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
