/**
 * Help content loader that imports generated help content
 * This provides a more maintainable way to manage help content
 *
 * The help content is generated from markdown files in the help/ directory
 * using the generate-help-content.ts script. This approach works with both
 * webpack and Turbopack.
 */

export interface HelpContent {
  id: string
  title: string
  content: string
  category?: string
}

// Import generated help content
import {
  getHelpContent as getGeneratedHelpContent,
  getHelpContentByCategory as getGeneratedHelpContentByCategory,
  getAllHelpContent as getAllGeneratedHelpContent,
  getHelpCategories as getGeneratedHelpCategories,
  hasHelpContent as hasGeneratedHelpContent,
  getHelpIds as getGeneratedHelpIds,
} from './help'

/**
 * Get help content by ID
 */
export function getHelpContent(id: string): HelpContent | undefined {
  return getGeneratedHelpContent(id)
}

/**
 * Get all help content for a specific category
 */
export function getHelpContentByCategory(category: string): HelpContent[] {
  return getGeneratedHelpContentByCategory(category)
}

/**
 * Get all available help content
 */
export function getAllHelpContent(): HelpContent[] {
  return getAllGeneratedHelpContent()
}

/**
 * Get all available categories
 */
export function getHelpCategories(): string[] {
  return getGeneratedHelpCategories()
}

/**
 * Check if a help ID exists
 */
export function hasHelpContent(id: string): boolean {
  return hasGeneratedHelpContent(id)
}

/**
 * Get all available help IDs
 */
export function getHelpIds(): string[] {
  return getGeneratedHelpIds()
}
