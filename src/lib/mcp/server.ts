// This file is kept for potential future use with transport-based implementations
// Currently, the route handler processes JSON-RPC messages directly
// without using the Server class with transports

/**
 * MCP Server metadata
 */
export const MCP_SERVER_INFO = {
  name: 'ManagerOS',
  version: '1.37.0',
} as const

/**
 * MCP Server capabilities
 */
export const MCP_SERVER_CAPABILITIES = {
  tools: {},
} as const
