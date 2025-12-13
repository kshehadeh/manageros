import {
  validateClerkToken,
  getClerkUserFromToken,
  mapClerkUserToManagerOS,
} from '../oauth-utils'
import type { MCPUserContext } from './types'

/**
 * Extract bearer token from Authorization header
 */
function extractBearerToken(authHeader: string | null): string | null {
  if (!authHeader) {
    return null
  }

  const parts = authHeader.split(' ')
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null
  }

  return parts[1]
}

/**
 * Authenticate MCP request using OAuth bearer token
 * @param request - The incoming request
 * @returns Authenticated user context or null if authentication fails
 */
export async function authenticateMCPRequest(
  request: Request
): Promise<MCPUserContext | null> {
  try {
    // Extract bearer token from Authorization header
    const authHeader = request.headers.get('authorization')
    const token = extractBearerToken(authHeader)

    if (!token) {
      return null
    }

    // Validate token
    const tokenInfo = await validateClerkToken(token)
    if (!tokenInfo || !tokenInfo.active) {
      return null
    }

    // Get user info from Clerk
    const clerkUserInfo = await getClerkUserFromToken(token)
    if (!clerkUserInfo || !clerkUserInfo.user_id) {
      return null
    }

    // Map Clerk user to ManagerOS user
    const userBrief = await mapClerkUserToManagerOS(clerkUserInfo.user_id)

    // Ensure user belongs to an organization
    if (!userBrief.managerOSOrganizationId) {
      return null
    }

    return {
      user: userBrief,
    }
  } catch (error) {
    console.error('Error authenticating MCP request:', error)
    return null
  }
}

/**
 * Get authenticated user context from request
 * Throws error if authentication fails
 */
export async function getAuthenticatedMCPUser(
  request: Request
): Promise<MCPUserContext> {
  const context = await authenticateMCPRequest(request)
  if (!context) {
    throw new Error('Unauthorized - invalid or missing OAuth token')
  }
  return context
}
