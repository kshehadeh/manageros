import { NextRequest } from 'next/server'
import { getAuthenticatedMCPUser } from '@/lib/mcp/auth'
import { getMCPToolDefinitions, executeMCPTool } from '@/lib/mcp/tools'
import { getBaseUrl } from '@/lib/utils/url-utils'
import type {
  JSONRPCMessage,
  JSONRPCRequest,
} from '@modelcontextprotocol/sdk/types.js'

/**
 * Get OAuth discovery URL for WWW-Authenticate header
 */
function getOAuthDiscoveryUrl(): string {
  const baseUrl = getBaseUrl()
  return `${baseUrl}/.well-known/oauth-protected-resource`
}

/**
 * Handle MCP JSON-RPC request
 * Processes JSON-RPC messages directly by calling request handlers
 */

async function handleMCPRequest(req: NextRequest): Promise<Response> {
  try {
    // Parse JSON-RPC message from request body first to check if it's initialize
    // We need to clone the request to read the body multiple times
    const bodyText = await req.text()
    let message: JSONRPCMessage
    try {
      message = JSON.parse(bodyText) as JSONRPCMessage
    } catch {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: -32700,
            message: 'Parse error',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if it's a request that doesn't require authentication
    // - initialize: Initial handshake
    // - tools/list: Clients need to discover tools before authenticating
    const isUnauthenticatedMethod =
      'method' in message &&
      (message.method === 'initialize' || message.method === 'tools/list')

    // Only authenticate if method requires it
    let mcpContext: Awaited<ReturnType<typeof getAuthenticatedMCPUser>> | null =
      null
    if (!isUnauthenticatedMethod) {
      try {
        // Create a new request with the body for authentication
        const authReq = new Request(req.url, {
          method: req.method,
          headers: req.headers,
          body: bodyText,
        })
        mcpContext = await getAuthenticatedMCPUser(authReq)
      } catch {
        // Return 401 with WWW-Authenticate header for non-initialize requests
        const discoveryUrl = getOAuthDiscoveryUrl()
        const headers: HeadersInit = {
          'Content-Type': 'application/json',
        }
        if (discoveryUrl) {
          headers['WWW-Authenticate'] =
            `Bearer resource_metadata="${discoveryUrl}"`
        }
        return new Response(
          JSON.stringify({
            jsonrpc: '2.0',
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            id: (message as any).id || null,
            error: {
              code: 401,
              message: 'Unauthorized - invalid or missing OAuth token',
            },
          }),
          {
            status: 401,
            headers,
          }
        )
      }
    }

    // Validate JSON-RPC message
    if (!message.jsonrpc || message.jsonrpc !== '2.0') {
      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          id: (message as any).id || null,
          error: {
            code: -32600,
            message: 'Invalid Request',
          },
        }),
        {
          status: 400,
          headers: { 'Content-Type': 'application/json' },
        }
      )
    }

    // Check if it's a request (has method)
    if ('method' in message) {
      const request = message as JSONRPCRequest
      let result: unknown
      let error: { code: number; message: string; data?: unknown } | null = null

      try {
        // Handle different MCP methods
        switch (request.method) {
          case 'initialize': {
            const baseUrl = getBaseUrl()
            const clerkFrontendApiUrl = process.env.CLERK_FRONTEND_API_URL
            const discoveryUrl = `${baseUrl}/.well-known/oauth-protected-resource`

            result = {
              protocolVersion: '2024-11-05',
              capabilities: {
                tools: {},
              },
              serverInfo: {
                name: 'ManagerOS',
                version: '1.37.0',
              },
              // Include OAuth metadata in initialize response
              ...(clerkFrontendApiUrl && {
                oauth: {
                  // eslint-disable-next-line camelcase
                  resource_metadata: discoveryUrl,
                  // eslint-disable-next-line camelcase
                  authorization_servers: [
                    `${clerkFrontendApiUrl}/.well-known/oauth-authorization-server`,
                  ],
                },
              }),
            }
            break
          }

          case 'tools/list':
            // tools/list doesn't require authentication, but if context exists, use it
            result = {
              tools: getMCPToolDefinitions(),
            }
            break

          case 'tools/call': {
            if (!mcpContext) {
              error = {
                code: 401,
                message:
                  'Unauthorized - authentication required for tool calls',
              }
              break
            }

            const { name, arguments: args } = (request.params || {}) as {
              name?: string
              arguments?: unknown
            }

            if (!name) {
              error = {
                code: -32602,
                message: 'Invalid params - tool name is required',
              }
              break
            }

            try {
              const toolResult = await executeMCPTool(
                name,
                args || {},
                mcpContext
              )
              result = {
                content: [
                  {
                    type: 'text',
                    text: JSON.stringify(toolResult, null, 2),
                  },
                ],
              }
              // eslint-disable-next-line @typescript-eslint/no-explicit-any
            } catch (toolError: any) {
              error = {
                code: -32603,
                message: toolError.message || 'Tool execution failed',
                data: {
                  tool: name,
                  error: toolError.name,
                },
              }
            }
            break
          }

          default:
            error = {
              code: -32601,
              message: `Method not found: ${request.method}`,
            }
        }
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
      } catch (handlerError: any) {
        error = {
          code: -32603,
          message: handlerError.message || 'Internal error',
          data: handlerError,
        }
      }

      // Build response
      const response: JSONRPCMessage = error
        ? ({
            jsonrpc: '2.0',
            id: request.id,
            error,
          } as JSONRPCMessage)
        : ({
            jsonrpc: '2.0',
            id: request.id,
            result: result as Record<string, unknown>,
          } as JSONRPCMessage)

      return new Response(JSON.stringify(response), {
        status: 200,
        headers: { 'Content-Type': 'application/json' },
      })
    }

    // Not a request, return error
    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        id: (message as any).id || null,
        error: {
          code: -32600,
          message: 'Invalid Request - expected a request with method',
        },
      }),
      {
        status: 400,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  } catch (error) {
    console.error('MCP request error:', error)

    // If it's an authentication error, include WWW-Authenticate header with OAuth discovery
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      const discoveryUrl = getOAuthDiscoveryUrl()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer resource_metadata="${discoveryUrl}"`,
      }

      return new Response(
        JSON.stringify({
          jsonrpc: '2.0',
          id: null,
          error: {
            code: 401,
            message: 'Unauthorized - invalid or missing OAuth token',
          },
        }),
        {
          status: 401,
          headers,
        }
      )
    }

    return new Response(
      JSON.stringify({
        jsonrpc: '2.0',
        id: null,
        error: {
          code: -32603,
          message: error instanceof Error ? error.message : 'Internal error',
        },
      }),
      {
        status: 500,
        headers: { 'Content-Type': 'application/json' },
      }
    )
  }
}

/**
 * MCP API route handler - GET for SSE stream (not implemented yet)
 * For now, redirect to POST or return error
 */
export async function GET(_req: NextRequest) {
  return new Response(
    JSON.stringify({
      error: 'GET method not supported. Use POST for JSON-RPC messages.',
    }),
    {
      status: 405,
      headers: { 'Content-Type': 'application/json' },
    }
  )
}

/**
 * MCP API route handler - POST for JSON-RPC messages
 */
export async function POST(req: NextRequest) {
  try {
    return await handleMCPRequest(req)
  } catch (error) {
    console.error('MCP POST error:', error)
    if (error instanceof Error && error.message.includes('Unauthorized')) {
      const discoveryUrl = getOAuthDiscoveryUrl()
      const headers: HeadersInit = {
        'Content-Type': 'application/json',
        'WWW-Authenticate': `Bearer resource_metadata="${discoveryUrl}"`,
      }

      return new Response(
        JSON.stringify({
          error: 'Unauthorized - invalid or missing OAuth token',
        }),
        { status: 401, headers }
      )
    }
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    })
  }
}

// Handle OPTIONS for CORS
export async function OPTIONS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
    },
  })
}
