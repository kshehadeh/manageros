import type { UserBrief } from '../auth-types'

/**
 * Authenticated user context for MCP tool execution
 */
export interface MCPUserContext {
  user: UserBrief
}
