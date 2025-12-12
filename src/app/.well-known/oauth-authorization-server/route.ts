/* eslint-disable camelcase */
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url-utils'

/**
 * OAuth 2.0 Authorization Server Metadata endpoint
 * Provides OAuth authorization server metadata as per RFC 8414
 * See: https://www.rfc-editor.org/rfc/rfc8414.html
 */
export async function GET() {
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

  // Try to fetch Clerk's actual OAuth Authorization Server metadata
  let clerkConfig: Record<string, unknown> = {}
  try {
    const clerkConfigUrl = `${cleanClerkUrl}/.well-known/oauth-authorization-server`
    const response = await fetch(clerkConfigUrl)
    if (response.ok) {
      clerkConfig = (await response.json()) as Record<string, unknown>
    }
  } catch (error) {
    console.warn(
      'Failed to fetch Clerk OAuth Authorization Server config:',
      error
    )
    // Fall back to defaults
  }

  // OAuth 2.0 Authorization Server Metadata as per RFC 8414
  const metadata = {
    // Use Clerk's configuration as base, or fallback to defaults
    issuer: clerkConfig.issuer || cleanClerkUrl,
    authorization_endpoint:
      clerkConfig.authorization_endpoint || `${cleanClerkUrl}/oauth/authorize`,
    token_endpoint:
      clerkConfig.token_endpoint || `${cleanClerkUrl}/oauth/token`,
    jwks_uri: clerkConfig.jwks_uri || `${cleanClerkUrl}/.well-known/jwks.json`,
    response_types_supported: clerkConfig.response_types_supported || ['code'],
    response_modes_supported: clerkConfig.response_modes_supported || ['query'],
    grant_types_supported: clerkConfig.grant_types_supported || [
      'authorization_code',
      'refresh_token',
    ],
    token_endpoint_auth_methods_supported:
      clerkConfig.token_endpoint_auth_methods_supported || [
        'client_secret_basic',
        'client_secret_post',
      ],
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'public_metadata',
      'private_metadata',
    ],
    code_challenge_methods_supported:
      clerkConfig.code_challenge_methods_supported || ['S256', 'plain'],
    // ManagerOS-specific: point to our protected resource metadata
    resource_metadata: `${baseUrl}/.well-known/oauth-protected-resource`,
    // Include registration endpoint for dynamic client registration (RFC 7591)
    registration_endpoint:
      clerkConfig.registration_endpoint || `${cleanClerkUrl}/oauth/register`,
    ...(clerkConfig.revocation_endpoint
      ? { revocation_endpoint: clerkConfig.revocation_endpoint }
      : {}),
    ...(clerkConfig.introspection_endpoint
      ? { introspection_endpoint: clerkConfig.introspection_endpoint }
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
