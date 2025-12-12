import { prisma } from './db'
import { getUserFromClerk } from './clerk'
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

    // Return UserBrief - user won't have organization yet
    return {
      email: managerOSUser.email,
      name: managerOSUser.name,
      clerkUserId: managerOSUser.clerkUserId || null,
      clerkOrganizationId: null,
      managerOSUserId: managerOSUser.id,
      managerOSOrganizationId: null,
      managerOSPersonId: null,
      role: null,
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

  // Try to get role from Clerk organization membership if we have an org
  if (clerkOrganizationId) {
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
