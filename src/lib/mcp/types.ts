import type { UserBrief } from '../auth-types'

/**
 * Authenticated user context for MCP tool execution
 */
export interface MCPUserContext {
  user: UserBrief
}

/**
 * MCP error codes as per specification
 */
export enum MCPErrorCode {
  ParseError = -32700,
  InvalidRequest = -32600,
  MethodNotFound = -32601,
  InvalidParams = -32602,
  InternalError = -32603,
  ServerError = -32000,
  Unauthorized = 401,
  Forbidden = 403,
  NotFound = 404,
}

/**
 * MCP error response
 */
export interface MCPError {
  code: number
  message: string
  data?: unknown
}
