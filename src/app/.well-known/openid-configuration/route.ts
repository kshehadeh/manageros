/* eslint-disable camelcase */
import { connection } from 'next/server'
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url-utils'

/**
 * OpenID Connect Discovery endpoint
 * Provides OpenID Connect configuration for MCP clients
 * See: https://openid.net/specs/openid-connect-discovery-1_0.html
 */
export async function GET() {
  // Opt out of static rendering - this route fetches from Clerk at runtime
  await connection()
  const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL

  if (!clerkFrontendApiUrl) {
    return new NextResponse(
      JSON.stringify({
        error: 'OAuth not configured',
        error_description: 'CLERK_FRONTEND_API_URL is not set',
      }),
      {
        status: 503,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }

  // Remove trailing slash from clerkFrontendApiUrl if present
  const cleanClerkUrl = clerkFrontendApiUrl.replace(/\/$/, '')
  const baseUrl = getBaseUrl()

  // Try to fetch Clerk's actual OpenID Connect configuration
  let clerkConfig: Record<string, unknown> = {}
  try {
    const clerkConfigUrl = `${cleanClerkUrl}/.well-known/openid-configuration`
    const response = await fetch(clerkConfigUrl)
    if (response.ok) {
      clerkConfig = (await response.json()) as Record<string, unknown>
    }
  } catch (error) {
    console.warn('Failed to fetch Clerk OpenID Connect config:', error)
    // Fall back to hardcoded values
  }

  // Clerk supports standard OAuth scopes plus metadata scopes:
  // openid, profile, email, public_metadata, private_metadata
  // ManagerOS authorization is based on organization membership and user role,
  // not OAuth scopes. All authenticated users have access to their organization's data.

  // Merge Clerk's configuration with ManagerOS-specific information
  const metadata = {
    // Use Clerk's configuration as base, or fallback to defaults
    issuer: clerkConfig.issuer || cleanClerkUrl,
    authorization_endpoint:
      clerkConfig.authorization_endpoint || `${cleanClerkUrl}/oauth/authorize`,
    token_endpoint:
      clerkConfig.token_endpoint || `${cleanClerkUrl}/oauth/token`,
    userinfo_endpoint:
      clerkConfig.userinfo_endpoint || `${cleanClerkUrl}/oauth/userinfo`,
    jwks_uri: clerkConfig.jwks_uri || `${cleanClerkUrl}/.well-known/jwks.json`,
    response_types_supported: clerkConfig.response_types_supported || ['code'],
    subject_types_supported: clerkConfig.subject_types_supported || ['public'],
    id_token_signing_alg_values_supported:
      clerkConfig.id_token_signing_alg_values_supported || ['RS256'],
    // Use Clerk's actual scopes (includes openid, profile, email, public_metadata, private_metadata)
    scopes_supported: clerkConfig.scopes_supported || [
      'openid',
      'profile',
      'email',
      'public_metadata',
      'private_metadata',
    ],
    claims_supported: clerkConfig.claims_supported || [
      'sub',
      'iss',
      'aud',
      'exp',
      'iat',
      'email',
      'email_verified',
      'name',
      'picture',
    ],
    // ManagerOS-specific: point to our protected resource metadata
    resource_metadata: `${baseUrl}/.well-known/oauth-protected-resource`,
    // Include registration endpoint for dynamic client registration (RFC 7591)
    // Clerk's oauth-authorization-server has this, but not openid-configuration
    registration_endpoint:
      clerkConfig.registration_endpoint || `${cleanClerkUrl}/oauth/register`,
    ...(clerkConfig.token_endpoint_auth_methods_supported
      ? {
          token_endpoint_auth_methods_supported:
            clerkConfig.token_endpoint_auth_methods_supported,
        }
      : {}),
    ...(clerkConfig.grant_types_supported
      ? { grant_types_supported: clerkConfig.grant_types_supported }
      : {}),
  }

  return new NextResponse(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
    },
  })
}
