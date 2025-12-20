import type { ActionResult } from './tools/create-oneonone-action-tool'

/**
 * Ensures a URL is relative by removing any protocol/host/domain
 * and ensuring it starts with a forward slash
 */
function ensureRelativeUrl(url: string): string {
  try {
    // If it's already a relative URL (starts with /), return as-is
    if (url.startsWith('/')) {
      return url
    }

    // If it's an absolute URL, extract the pathname
    if (url.startsWith('http://') || url.startsWith('https://')) {
      const urlObj = new URL(url)
      return urlObj.pathname + urlObj.search
    }

    // If it doesn't start with /, add it
    return url.startsWith('/') ? url : `/${url}`
  } catch {
    // If URL parsing fails, ensure it starts with /
    return url.startsWith('/') ? url : `/${url}`
  }
}

/**
 * Check if a value is an ActionResult
 */
export function isActionResult(value: unknown): value is ActionResult {
  if (!value || typeof value !== 'object') {
    return false
  }

  const obj = value as Record<string, unknown>

  return (
    typeof obj.actionType === 'string' &&
    ['navigate', 'create', 'update', 'delete'].includes(obj.actionType) &&
    typeof obj.message === 'string'
  )
}

/**
 * Parse action tool response to extract action data
 * Tool outputs can be in various formats, so we need to handle different structures
 */
export function parseActionResponse(toolOutput: unknown): ActionResult | null {
  if (!toolOutput) {
    return null
  }

  // If it's already an ActionResult, return it
  if (isActionResult(toolOutput)) {
    return toolOutput
  }

  // If it's an object, try to extract action data
  if (typeof toolOutput === 'object') {
    const obj = toolOutput as Record<string, unknown>

    // Check if it has actionType and message (basic ActionResult structure)
    if (typeof obj.actionType === 'string' && typeof obj.message === 'string') {
      const url = typeof obj.url === 'string' ? obj.url : undefined
      return {
        actionType: obj.actionType as ActionResult['actionType'],
        url: url ? ensureRelativeUrl(url) : undefined,
        message: obj.message,
        metadata:
          typeof obj.metadata === 'object' && obj.metadata !== null
            ? (obj.metadata as Record<string, unknown>)
            : undefined,
        requiresConfirmation:
          typeof obj.requiresConfirmation === 'boolean'
            ? obj.requiresConfirmation
            : undefined,
      }
    }
  }

  // If it's a string, try to parse it as JSON
  if (typeof toolOutput === 'string') {
    try {
      const parsed = JSON.parse(toolOutput)
      if (isActionResult(parsed)) {
        return parsed
      }
    } catch {
      // Not valid JSON, ignore
    }
  }

  return null
}

/**
 * Extract action results from tool call outputs
 * This handles the case where a tool might return multiple results or nested structures
 */
export function extractActionsFromToolOutput(
  toolOutput: unknown
): ActionResult[] {
  const actions: ActionResult[] = []

  // If it's a single action result
  const singleAction = parseActionResponse(toolOutput)
  if (singleAction) {
    actions.push(singleAction)
    return actions
  }

  // If it's an array, check each item
  if (Array.isArray(toolOutput)) {
    for (const item of toolOutput) {
      const action = parseActionResponse(item)
      if (action) {
        actions.push(action)
      }
    }
  }

  // If it's an object with an actions array
  if (typeof toolOutput === 'object' && toolOutput !== null) {
    const obj = toolOutput as Record<string, unknown>
    if (Array.isArray(obj.actions)) {
      for (const item of obj.actions) {
        const action = parseActionResponse(item)
        if (action) {
          actions.push(action)
        }
      }
    }
  }

  return actions
}
