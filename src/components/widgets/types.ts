import { LucideIcon } from 'lucide-react'
import { ReactNode } from 'react'

/**
 * Widget metadata that describes how the widget should be presented
 */
export interface WidgetMetadata {
  /** Unique identifier for the widget */
  id: string
  /** Display title */
  title: string
  /** Optional icon to display with title */
  icon?: LucideIcon
  /** Minimum width for responsive layout */
  minWidth?: string
  /** Default visibility - can be overridden by user preferences */
  defaultVisible: boolean
  /** Widget category for grouping (e.g., 'stats', 'charts') */
  category?: string
  /** Widget description for tooltips/help */
  description?: string
}

/**
 * Context available to widgets for data fetching and rendering
 */
export interface WidgetContext {
  /** Current user ID */
  userId: string
  /** Current user's organization ID */
  organizationId: string
  /** Current user's linked person ID (if exists) */
  personId?: string | null
  /** Whether user has a linked person */
  hasLinkedPerson: boolean
}

/**
 * Widget visibility check result
 */
export interface WidgetVisibility {
  /** Whether widget should be shown */
  visible: boolean
  /** Optional reason for visibility state (for debugging) */
  reason?: string
}

/**
 * Base widget interface that all widgets must implement
 */
export interface Widget {
  /** Widget metadata */
  metadata: WidgetMetadata

  /**
   * Check if widget should be visible based on context
   * This is called before data fetching to avoid unnecessary work
   */
  checkVisibility(
    context: WidgetContext
  ): Promise<WidgetVisibility> | WidgetVisibility

  /**
   * Fetch data required for the widget
   * Only called if widget is visible
   */
  fetchData(context: WidgetContext): Promise<unknown>

  /**
   * Render the widget content as a React Server Component
   * Receives the fetched data and metadata
   */
  render(
    data: unknown,
    metadata: WidgetMetadata,
    context: WidgetContext
  ): ReactNode
}
