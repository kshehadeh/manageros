/* eslint-disable camelcase */
import { ClerkClient, createClerkClient } from '@clerk/backend'
import { clerkClient, User } from '@clerk/nextjs/server'
import type {
  ClerkCommercePlan,
  ClerkBillingPlansResponse,
  ClerkCommerceSubscription,
} from './clerk-types'
import type { UserBrief } from './auth-types'

let globalClerkClient: ClerkClient | null = null

export function getClerkClient(): ClerkClient {
  if (!globalClerkClient) {
    globalClerkClient = createClerkClient({
      secretKey: process.env.CLERK_SECRET_KEY || '',
    })
  }
  return globalClerkClient
}

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

export interface ClerkOrganizationMembership {
  id: string
  organization_id?: string // May be nested in organization object
  organization?: {
    id: string
    name: string
    slug: string
    [key: string]: unknown
  }
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
 * Fetch all billing plans from Clerk
 * Returns plans sorted by price (free first, then by ascending price)
 */
export async function getClerkBillingPlans(): Promise<ClerkCommercePlan[]> {
  if (!process.env.CLERK_SECRET_KEY) {
    console.warn('CLERK_SECRET_KEY not configured, cannot fetch billing plans')
    return []
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/billing/plans?payer_type=org`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
        next: { revalidate: 3600 }, // Cache for 1 hour
      }
    )

    if (!response.ok) {
      const errorText = await response.text()
      console.error(
        `Failed to fetch Clerk billing plans: ${response.status} ${errorText}`
      )
      return []
    }

    const data = (await response.json()) as ClerkBillingPlansResponse

    // Sort plans: free plans first, then by ascending price
    return data.data
      .filter(plan => plan.publicly_visible)
      .sort((a, b) => {
        // Free plans (fee.amount === 0) come first
        if (a.fee.amount === 0 && b.fee.amount !== 0) return -1
        if (a.fee.amount !== 0 && b.fee.amount === 0) return 1
        // Then sort by price ascending
        return a.fee.amount - b.fee.amount
      })
  } catch (error) {
    console.error('Error fetching Clerk billing plans:', error)
    return []
  }
}

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
 * Get user data from Clerk
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
    console.error('Error getting user from Clerk:', error)
    return null
  }
}

/**
 * Get user's organization memberships from Clerk
 * Returns list of organizations the user belongs to
 */
export async function getUserOrganizationMemberships(
  clerkUserId: string
): Promise<ClerkOrganizationMembership[]> {
  try {
    if (!process.env.CLERK_SECRET_KEY) {
      console.warn(
        'CLERK_SECRET_KEY not set. Cannot fetch user organization memberships.'
      )
      return []
    }

    const client = await clerkClient()
    const memberships = await client.users.getOrganizationMembershipList({
      userId: clerkUserId,
    })

    // Map to our ClerkOrganizationMembership type
    return memberships.data.map(m => ({
      id: m.id,
      organization_id: m.organization.id,
      public_user_data: {
        user_id: clerkUserId,
        first_name: m.publicUserData?.firstName || null,
        last_name: m.publicUserData?.lastName || null,
        image_url: m.publicUserData?.imageUrl || '',
        has_image: !!m.publicUserData?.imageUrl,
        identifier: m.publicUserData?.identifier || '',
      },
      role: m.role as 'org:admin' | 'org:member',
      created_at: m.createdAt,
      updated_at: m.updatedAt,
      object: 'organization_membership' as const,
    }))
  } catch (error) {
    console.error('Error getting user organization memberships:', error)
    return []
  }
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
      data: Array<
        ClerkOrganizationMembership & { organization?: { id: string } }
      >
    }

    const membership = data.data.find(
      m => m.public_user_data.user_id === clerkUserId
    )

    if (!membership) {
      return null
    }

    // Normalize the membership to ensure organization_id is set
    const normalizedMembership: ClerkOrganizationMembership = {
      ...membership,
      organization_id:
        membership.organization_id || membership.organization?.id || clerkOrgId,
    }
    return normalizedMembership
  } catch {
    return null
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

  // Verify membership exists first (for better error messages)
  const membership = await getClerkOrganizationMembership(
    clerkOrgId,
    clerkUserId
  )

  if (!membership) {
    // User is not a member, which is fine
    return
  }

  // Use REST API - Clerk API v1 endpoint format
  // DELETE /organizations/{organization_id}/memberships/{user_id}
  // Note: Clerk API uses user_id in the path, NOT membership_id
  const url = `${CLERK_API_BASE}/organizations/${clerkOrgId}/memberships/${clerkUserId}`

  const response = await fetch(url, {
    method: 'DELETE',
    headers: {
      Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
    },
  })

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

  // Validate inputs
  if (!clerkOrgId || !clerkUserId) {
    throw new Error(
      `Missing required parameters: clerkOrgId=${clerkOrgId}, clerkUserId=${clerkUserId}`
    )
  }

  // First, get the membership to ensure it exists and get the membership ID
  const membership = await getClerkOrganizationMembership(
    clerkOrgId,
    clerkUserId
  )

  if (!membership) {
    // Log detailed information for debugging
    console.error('Membership not found:', {
      clerkOrgId,
      clerkUserId,
      organizationId: clerkOrgId,
      userId: clerkUserId,
    })
    throw new Error(
      `User ${clerkUserId} is not a member of Clerk organization ${clerkOrgId}`
    )
  }

  // Extract organization ID from membership (handle both flat and nested formats)
  const membershipOrgId =
    membership.organization_id || membership.organization?.id || clerkOrgId

  // Log membership details for debugging
  console.log('Updating membership:', {
    membershipId: membership.id,
    organizationId: membershipOrgId,
    userId: clerkUserId,
    currentRole: membership.role,
    newRole: role,
    url: `${CLERK_API_BASE}/organizations/${membershipOrgId}/memberships/${clerkUserId}`,
  })

  // Use REST API - Clerk API v1 endpoint format
  // PATCH /organizations/{organization_id}/memberships/{user_id}
  // Note: Clerk API uses user_id in the path, NOT membership_id
  const response = await fetch(
    `${CLERK_API_BASE}/organizations/${membershipOrgId}/memberships/${clerkUserId}`,
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
    // Provide more detailed error information
    console.error('Clerk API error details:', {
      status: response.status,
      statusText: response.statusText,
      errorText,
      clerkOrgId,
      clerkUserId,
      membershipId: membership.id,
      membershipObject: membership,
      url: `${CLERK_API_BASE}/organizations/${membershipOrgId}/memberships/${clerkUserId}`,
      membershipOrgId,
      requestBody: { role },
    })
    throw new Error(
      `Failed to update user role in Clerk organization: ${response.status} ${errorText}`
    )
  }

  const updatedMembership =
    (await response.json()) as ClerkOrganizationMembership

  // Verify the membership was updated correctly
  if (updatedMembership.role !== role) {
    console.warn('Role update may not have been applied correctly', {
      expected: role,
      actual: updatedMembership.role,
    })
  }

  return updatedMembership
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
 * Get the number of members of a Clerk organization
 */
export async function getClerkOrganizationMembersCount(
  clerkOrgId: string
): Promise<number> {
  const members = await getClerkOrganizationMembers(clerkOrgId)
  return members.length
}

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

/**
 * Get Clerk organization by slug
 */
export async function getClerkOrganizationBySlug(
  slug: string
): Promise<ClerkOrganization | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/organizations?slug=${encodeURIComponent(slug)}`,
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
      data: ClerkOrganization[]
    }
    return data.data && data.data.length > 0 ? data.data[0] : null
  } catch {
    return null
  }
}

/**
 * Get user's subscription from Clerk
 */
export async function getUserSubscription(
  clerkUserId: string
): Promise<ClerkCommerceSubscription | null> {
  if (!process.env.CLERK_SECRET_KEY) {
    return null
  }

  try {
    const response = await fetch(
      `${CLERK_API_BASE}/users/${clerkUserId}/billing/subscription`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      return null
    }

    return (await response.json()) as ClerkCommerceSubscription
  } catch (error) {
    console.error('Error getting user subscription from Clerk:', error)
    return null
  }
}

/**
 * Get pending organization invitations for a user from Clerk
 */
export async function getPendingInvitationsForUser(
  clerkUserId: string | null
): Promise<
  Array<{
    id: string
    email: string
    organizationId: string
    status: 'pending'
    createdAt: string
    updatedAt: string
    expiresAt: string
    acceptedAt: null
    organization: {
      id: string
      clerkOrganizationId: string
      description: string | null
      name: string
    }
    invitedBy: {
      name: string
      email: string
    }
  }>
> {
  // If user doesn't exist, return empty array
  if (!clerkUserId || !process.env.CLERK_SECRET_KEY) {
    return []
  }

  try {
    // Fetch pending invitations from Clerk API
    const response = await fetch(
      `${CLERK_API_BASE}/users/${clerkUserId}/organization_invitations?status=pending`,
      {
        headers: {
          Authorization: `Bearer ${process.env.CLERK_SECRET_KEY}`,
        },
      }
    )

    if (!response.ok) {
      // 404 is expected when the user has been deleted from Clerk
      // Don't log these as errors to avoid noise from stale user data
      if (response.status !== 404) {
        console.error(
          `Failed to fetch Clerk invitations: ${response.status} ${await response.text()}`
        )
      }
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
    const { prisma } = await import('./db')
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
