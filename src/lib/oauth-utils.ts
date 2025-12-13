import { prisma } from './db'
import { getUserFromClerk, getUserOrganizationMemberships } from './clerk'
import type { UserBrief } from './auth-types'

/**
 * Clerk OAuth Token Info response from /oauth/token_info endpoint
 */
export interface ClerkTokenInfo {
  active: boolean
  client_id: string
  iat?: number
  scope?: string
  sub?: string
  exp?: number
}

/**
 * Clerk OAuth UserInfo response from /oauth/userinfo endpoint
 */
export interface ClerkUserInfo {
  object: string
  instance_id: string
  user_id: string
  sub: string
  email?: string
  email_verified?: boolean
  family_name?: string
  given_name?: string
  name?: string
  username?: string
  preferred_username?: string
  picture?: string
  public_metadata?: Record<string, unknown>
  private_metadata?: Record<string, unknown>
  unsafe_metadata?: Record<string, unknown>
}

/**
 * Get Clerk Frontend API URL from environment variables
 */
function getClerkFrontendApiUrl(): string {
  const url = process.env.CLERK_FRONTEND_API_URL
  if (!url) {
    throw new Error(
      'CLERK_FRONTEND_API_URL environment variable is not set. Please set it in your .env file.'
    )
  }
  return url
}

/**
 * Validate a Clerk-issued OAuth access token using Clerk's token introspection endpoint
 * @param token - The OAuth access token to validate
 * @returns Token info if valid, null if invalid
 */
export async function validateClerkToken(
  token: string
): Promise<ClerkTokenInfo | null> {
  const frontendApiUrl = getClerkFrontendApiUrl()
  const clientId = process.env.CLERK_OAUTH_CLIENT_ID
  const clientSecret = process.env.CLERK_OAUTH_CLIENT_SECRET

  if (!clientId || !clientSecret) {
    console.warn(
      'CLERK_OAUTH_CLIENT_ID or CLERK_OAUTH_CLIENT_SECRET not set. Cannot validate OAuth tokens.'
    )
    return null
  }

  try {
    // Create Basic Auth header with Client ID and Secret
    const auth = Buffer.from(`${clientId}:${clientSecret}`).toString('base64')

    const response = await fetch(`${frontendApiUrl}/oauth/token_info`, {
      method: 'POST',
      headers: {
        Authorization: `Basic ${auth}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({
        token,
      }),
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Invalid token
        return null
      }
      const errorText = await response.text()
      console.error(
        `Failed to validate Clerk token: ${response.status} ${errorText}`
      )
      return null
    }

    const tokenInfo = (await response.json()) as ClerkTokenInfo

    // Check if token is active and not expired
    if (!tokenInfo.active) {
      return null
    }

    // Check expiration if provided
    if (tokenInfo.exp && tokenInfo.exp * 1000 < Date.now()) {
      return null
    }

    return tokenInfo
  } catch (error) {
    console.error('Error validating Clerk token:', error)
    return null
  }
}

/**
 * Get user information from Clerk's /oauth/userinfo endpoint
 * @param token - The OAuth access token
 * @returns User info if valid, null if invalid
 */
export async function getClerkUserFromToken(
  token: string
): Promise<ClerkUserInfo | null> {
  const frontendApiUrl = getClerkFrontendApiUrl()

  try {
    const response = await fetch(`${frontendApiUrl}/oauth/userinfo`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    })

    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        // Invalid token
        return null
      }
      const errorText = await response.text()
      console.error(
        `Failed to get Clerk user info: ${response.status} ${errorText}`
      )
      return null
    }

    return (await response.json()) as ClerkUserInfo
  } catch (error) {
    console.error('Error getting Clerk user info:', error)
    return null
  }
}

/**
 * Result of auto-selecting an organization for a user
 */
interface AutoSelectOrgResult {
  clerkOrganizationId: string
  managerOSOrganizationId: string
  role: string | null
}

/**
 * Auto-select the first Clerk organization membership for a user
 * If the user has organization memberships in Clerk, find the corresponding
 * ManagerOS organization and return the IDs.
 * @param clerkUserId - The Clerk user ID
 * @returns Organization info if found, null otherwise
 */
async function autoSelectFirstOrganization(
  clerkUserId: string
): Promise<AutoSelectOrgResult | null> {
  try {
    // Get user's Clerk organization memberships
    const memberships = await getUserOrganizationMemberships(clerkUserId)

    if (memberships.length === 0) {
      return null
    }

    // Use the first organization membership
    const firstMembership = memberships[0]
    const clerkOrgId = firstMembership.organization_id

    // Find the corresponding ManagerOS organization
    const managerOSOrg = await prisma.organization.findFirst({
      where: { clerkOrganizationId: clerkOrgId },
      select: { id: true },
    })

    if (!managerOSOrg) {
      // ManagerOS organization doesn't exist for this Clerk org
      // This can happen if the org was created in Clerk but not yet synced
      console.log(
        `No ManagerOS organization found for Clerk org ${clerkOrgId}. User will need to set up organization first.`
      )
      return null
    }

    // Determine role from membership
    const role = firstMembership.role === 'org:admin' ? 'admin' : 'user'

    return {
      clerkOrganizationId: clerkOrgId,
      managerOSOrganizationId: managerOSOrg.id,
      role,
    }
  } catch (error) {
    console.error('Error auto-selecting organization:', error)
    return null
  }
}

/**
 * Map Clerk user ID to ManagerOS UserBrief
 * This function retrieves the ManagerOS user record and builds a UserBrief
 * @param clerkUserId - The Clerk user ID from the token
 * @returns UserBrief with ManagerOS user data
 */
export async function mapClerkUserToManagerOS(
  clerkUserId: string
): Promise<UserBrief> {
  // Find the ManagerOS user by clerkUserId
  const user = await prisma.user.findUnique({
    where: { clerkUserId },
    include: {
      person: {
        select: {
          id: true,
          organizationId: true,
        },
      },
    },
  })

  if (!user) {
    // If user doesn't exist, try to get it from Clerk and create it
    const clerkUser = await getUserFromClerk(clerkUserId)
    if (!clerkUser || !clerkUser.primaryEmailAddress?.emailAddress) {
      throw new Error('Clerk user not found or has no email')
    }

    const email = clerkUser.primaryEmailAddress.emailAddress.toLowerCase()

    // Check if user exists by email
    const existingUser = await prisma.user.findUnique({
      where: { email },
    })

    let managerOSUser
    if (existingUser) {
      // Link existing user to Clerk account
      managerOSUser = await prisma.user.update({
        where: { id: existingUser.id },
        data: {
          clerkUserId,
          name:
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName || clerkUser.lastName || email,
        },
      })
    } else {
      // Create new user
      managerOSUser = await prisma.user.create({
        data: {
          clerkUserId,
          email,
          name:
            clerkUser.firstName && clerkUser.lastName
              ? `${clerkUser.firstName} ${clerkUser.lastName}`
              : clerkUser.firstName || clerkUser.lastName || email,
        },
      })
    }

    // Try to auto-select first Clerk organization membership
    const orgResult = await autoSelectFirstOrganization(clerkUserId)

    return {
      email: managerOSUser.email,
      name: managerOSUser.name,
      clerkUserId: managerOSUser.clerkUserId || null,
      clerkOrganizationId: orgResult?.clerkOrganizationId || null,
      managerOSUserId: managerOSUser.id,
      managerOSOrganizationId: orgResult?.managerOSOrganizationId || null,
      managerOSPersonId: null,
      role: orgResult?.role || null,
    }
  }

  // Get organization from user's person or from Clerk organization membership
  let organizationId: string | null = null
  let clerkOrganizationId: string | null = null
  let role: string | null = null

  if (user.person?.organizationId) {
    organizationId = user.person.organizationId
    // Get Clerk organization ID from ManagerOS organization
    const organization = await prisma.organization.findUnique({
      where: { id: organizationId },
      select: { clerkOrganizationId: true },
    })
    clerkOrganizationId = organization?.clerkOrganizationId || null
  }

  // If user has no organization, try to auto-select from Clerk memberships
  if (!organizationId) {
    const orgResult = await autoSelectFirstOrganization(clerkUserId)
    if (orgResult) {
      organizationId = orgResult.managerOSOrganizationId
      clerkOrganizationId = orgResult.clerkOrganizationId
      role = orgResult.role
    }
  }

  // Try to get role from Clerk organization membership if we have an org but no role yet
  if (clerkOrganizationId && !role) {
    try {
      const { getClerkOrganizationMembership } = await import('./clerk')
      const membership = await getClerkOrganizationMembership(
        clerkOrganizationId,
        clerkUserId
      )
      if (membership) {
        role = membership.role === 'org:admin' ? 'admin' : 'user'
      }
    } catch (error) {
      console.error('Error getting Clerk organization membership:', error)
    }
  }

  return {
    email: user.email,
    name: user.name,
    clerkUserId: user.clerkUserId || null,
    clerkOrganizationId,
    managerOSUserId: user.id,
    managerOSOrganizationId: organizationId,
    managerOSPersonId: user.personId || null,
    role,
  }
}
