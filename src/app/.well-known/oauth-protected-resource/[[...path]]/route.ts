/* eslint-disable camelcase */
import { NextResponse } from 'next/server'
import { getBaseUrl } from '@/lib/utils/url-utils'

/**
 * OAuth Protected Resource Metadata endpoint
 * Provides OAuth discovery information for MCP clients
 * See: https://modelcontextprotocol.io/specification/draft/basic/authorization
 * RFC 9728: https://www.rfc-editor.org/rfc/rfc9728.html
 *
 * Per RFC 9728, the protected resource metadata URL is formed by inserting
 * "/.well-known/oauth-protected-resource" into the resource's URI path.
 * For example, if the resource is at http://localhost:3000/api/mcp,
 * the metadata URL is http://localhost:3000/.well-known/oauth-protected-resource/api/mcp
 *
 * This catch-all route handles both:
 * - /.well-known/oauth-protected-resource (base path)
 * - /.well-known/oauth-protected-resource/api/mcp (MCP endpoint path)
 */
export async function GET(
  request: Request,
  { params }: { params: Promise<{ path?: string[] }> }
) {
  const { path } = await params
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

  // Get the authorization server issuer URL
  // Remove trailing slash from clerkFrontendApiUrl if present to avoid double slashes
  // NOTE: authorization_servers should be the issuer URL, NOT the well-known path
  // The client will append /.well-known/oauth-authorization-server to discover metadata
  const cleanClerkUrl = clerkFrontendApiUrl.replace(/\/$/, '')

  // Get base URL for the resource
  const baseUrl = getBaseUrl()

  // Determine the resource URL based on the path
  // If path is ['api', 'mcp'], the resource is /api/mcp
  // Otherwise, default to /api/mcp (our MCP endpoint)
  const resourcePath =
    path && path.length > 0 ? `/${path.join('/')}` : '/api/mcp'
  const resourceUrl = `${baseUrl}${resourcePath}`

  // Protected Resource Metadata as per RFC 9728
  // Note: Clerk supports standard OAuth scopes plus metadata scopes
  // ManagerOS authorization is based on organization membership and user role,
  // not OAuth scopes. All authenticated users have access to their organization's data.
  const metadata = {
    resource: resourceUrl,
    // authorization_servers contains issuer URLs, client appends /.well-known/* paths
    authorization_servers: [cleanClerkUrl],
    jwks_uri: `${cleanClerkUrl}/.well-known/jwks.json`,
    scopes_supported: [
      'openid',
      'profile',
      'email',
      'public_metadata',
      'private_metadata',
    ],
    bearer_methods_supported: ['header'],
    resource_documentation: `${baseUrl}/docs/mcp-server`,
    // Note: ManagerOS uses organization-based access control, not scope-based
    // All authenticated users can access their organization's data
    authorization_details_types_supported: [],
  }

  return new NextResponse(JSON.stringify(metadata, null, 2), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Cache-Control': 'public, max-age=3600',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
