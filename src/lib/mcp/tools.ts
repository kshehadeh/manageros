import { z } from 'zod'
import { AsyncLocalStorage } from 'async_hooks'
import type { Tool } from '@modelcontextprotocol/sdk/types.js'
import type { MCPUserContext } from './types'
import type { UserBrief } from '../auth-types'
import { peopleTool } from '../ai/tools/people-tool'
import { tasksTool } from '../ai/tools/tasks-tool'
import { initiativesTool } from '../ai/tools/initiatives-tool'
import { meetingsTool } from '../ai/tools/meetings-tool'
import { teamsTool } from '../ai/tools/teams-tool'
import { feedbackTool } from '../ai/tools/feedback-tool'
import { currentUserTool } from '../ai/tools/current-user-tool'
import { githubTool } from '../ai/tools/github-tool'
import { jiraTool } from '../ai/tools/jira-tool'
import { dateTimeTool } from '../ai/tools/date-time-tool'
import { personLookupTool } from '../ai/tools/person-lookup-tool'
import { jobRoleLookupTool } from '../ai/tools/job-role-lookup-tool'

/**
 * AsyncLocalStorage for MCP user context
 * This allows tools to access the authenticated user without passing it explicitly
 */
const mcpUserContextStorage = new AsyncLocalStorage<UserBrief>()

/**
 * Convert Zod 4 schema to JSON Schema for MCP
 * Zod 4 uses a different internal structure with _zod.def
 */
function convertZodToJsonSchema(
  zodSchema: z.ZodTypeAny
): Record<string, unknown> {
  try {
    return buildJsonSchemaFromZod4(zodSchema)
  } catch (error) {
    console.error('Schema conversion error:', error)
    return { type: 'object', properties: {} }
  }
}

/**
 * Build JSON Schema from Zod 4 schema structure
 * Zod 4 uses _zod.def for type definitions
 */
function buildJsonSchemaFromZod4(
  schema: z.ZodTypeAny
): Record<string, unknown> {
  // Zod 4 uses _zod.def for the schema definition
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const zodMeta = (schema as any)._zod
  if (!zodMeta?.def) {
    return { type: 'object', properties: {} }
  }

  const def = zodMeta.def
  const typeName = def.type

  // Get description from schema if available
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const description = (schema as any).description

  switch (typeName) {
    case 'object': {
      const shape = def.shape || {}
      const properties: Record<string, unknown> = {}
      const required: string[] = []

      for (const [key, value] of Object.entries(shape)) {
        const fieldSchema = value as z.ZodTypeAny
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fieldZod = (fieldSchema as any)._zod
        const fieldType = fieldZod?.def?.type

        // Check if field is optional
        const isOptional = fieldType === 'optional' || fieldType === 'default'

        if (!isOptional) {
          required.push(key)
        }

        properties[key] = buildJsonSchemaFromZod4(fieldSchema)
      }

      return {
        type: 'object',
        properties,
        ...(required.length > 0 ? { required } : {}),
        ...(description ? { description } : {}),
      }
    }

    case 'string':
      return { type: 'string', ...(description ? { description } : {}) }

    case 'number':
      return { type: 'number', ...(description ? { description } : {}) }

    case 'boolean':
      return { type: 'boolean', ...(description ? { description } : {}) }

    case 'enum': {
      // Zod 4 stores enum values in def.entries as an object, we need the values
      const enumValues = def.entries
        ? Object.values(def.entries)
        : def.values || []
      return {
        type: 'string',
        enum: enumValues,
        ...(description ? { description } : {}),
      }
    }

    case 'optional':
    case 'default': {
      // For optional/default, get the inner type and preserve its description
      const innerSchema = buildJsonSchemaFromZod4(def.innerType)
      // Preserve the description from the outer schema if inner doesn't have one
      if (description && !innerSchema.description) {
        innerSchema.description = description
      }
      return innerSchema
    }

    case 'array':
      return {
        type: 'array',
        items: buildJsonSchemaFromZod4(def.element),
        ...(description ? { description } : {}),
      }

    case 'nullable': {
      const innerSchema = buildJsonSchemaFromZod4(def.innerType)
      return { ...innerSchema, nullable: true }
    }

    case 'literal':
      return { const: def.value, ...(description ? { description } : {}) }

    case 'union':
      return {
        anyOf: (def.options || []).map((opt: z.ZodTypeAny) =>
          buildJsonSchemaFromZod4(opt)
        ),
        ...(description ? { description } : {}),
      }

    case 'void':
    case 'undefined':
      return { type: 'object', properties: {} }

    default:
      console.log('Unknown Zod 4 type:', typeName)
      return { type: 'object', properties: {} }
  }
}

/**
 * Create an MCP tool from an existing AI tool
 */
function createMCPTool(
  name: string,
  description: string,
  parameters: z.ZodTypeAny
): Tool {
  const inputSchema = convertZodToJsonSchema(parameters) as Tool['inputSchema']

  return {
    name,
    description,
    inputSchema,
  }
}

/**
 * Execute a tool with MCP user context stored in AsyncLocalStorage
 * This allows getCurrentUser() to access the authenticated user
 */
async function executeWithContext<T>(
  context: MCPUserContext,
  fn: () => Promise<T>
): Promise<T> {
  return mcpUserContextStorage.run(context.user, fn)
}

/**
 * Get the current user from MCP context storage
 * This is used by a modified version of getCurrentUser that checks MCP context
 */
export function getMCPUserContext(): UserBrief | undefined {
  return mcpUserContextStorage.getStore()
}

/**
 * Register all MCP tools with the server
 * Tools are executed within the MCP user context using AsyncLocalStorage
 */
export async function executeMCPTool(
  toolName: string,
  args: unknown,
  context: MCPUserContext
): Promise<unknown> {
  return executeWithContext(context, async () => {
    switch (toolName) {
      case 'people':
        return peopleTool.execute(args || {})
      case 'tasks':
        return tasksTool.execute(args || {})
      case 'initiatives':
        return initiativesTool.execute(args || {})
      case 'meetings':
        return meetingsTool.execute(args || {})
      case 'teams':
        return teamsTool.execute(args || {})
      case 'feedback':
        return feedbackTool.execute(args || {})
      case 'currentUser':
        return currentUserTool.execute()
      case 'github':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return githubTool.execute(args as any)
      case 'jira':
        return jiraTool.execute(args || {})
      case 'dateTime':
        return dateTimeTool.execute()
      case 'personLookup':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return personLookupTool.execute(args as any)
      case 'jobRoleLookup':
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        return jobRoleLookupTool.execute(args as any)
      default:
        throw new Error(`Unknown tool: ${toolName}`)
    }
  })
}

/**
 * Get all MCP tool definitions
 */
export function getMCPToolDefinitions(): Tool[] {
  return [
    createMCPTool('people', peopleTool.description, peopleTool.parameters),
    createMCPTool('tasks', tasksTool.description, tasksTool.parameters),
    createMCPTool(
      'initiatives',
      initiativesTool.description,
      initiativesTool.parameters
    ),
    createMCPTool(
      'meetings',
      meetingsTool.description,
      meetingsTool.parameters
    ),
    createMCPTool('teams', teamsTool.description, teamsTool.parameters),
    createMCPTool(
      'feedback',
      feedbackTool.description,
      feedbackTool.parameters
    ),
    createMCPTool(
      'currentUser',
      currentUserTool.description,
      currentUserTool.parameters
    ),
    createMCPTool('github', githubTool.description, githubTool.parameters),
    createMCPTool('jira', jiraTool.description, jiraTool.parameters),
    createMCPTool(
      'dateTime',
      dateTimeTool.description,
      dateTimeTool.parameters
    ),
    createMCPTool(
      'personLookup',
      personLookupTool.description,
      personLookupTool.parameters
    ),
    createMCPTool(
      'jobRoleLookup',
      jobRoleLookupTool.description,
      jobRoleLookupTool.parameters
    ),
  ]
}
