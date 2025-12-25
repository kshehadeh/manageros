/**
 * Widget registry and exports
 *
 * This file registers all available widgets and exports them for use in dashboards
 */

import { widgetRegistry } from './registry'
import { totalPeopleWidget } from './total-people-widget'
import { directReportsWidget } from './direct-reports-widget'
import { oneOnOnesNeededWidget } from './one-on-ones-needed-widget'
import { feedback360NeededWidget } from './feedback-360-needed-widget'
import { maxReportsExceededWidget } from './max-reports-exceeded-widget'
import { teamBreakdownWidget } from './team-breakdown-widget'
import { jobRoleBreakdownWidget } from './job-role-breakdown-widget'

// Register all widgets
widgetRegistry.registerAll([
  totalPeopleWidget,
  directReportsWidget,
  oneOnOnesNeededWidget,
  feedback360NeededWidget,
  maxReportsExceededWidget,
  teamBreakdownWidget,
  jobRoleBreakdownWidget,
])

// Export registry and types
export { widgetRegistry } from './registry'
export type {
  Widget,
  WidgetMetadata,
  WidgetContext,
  WidgetVisibility,
  WidgetConfig,
  DashboardConfig,
} from './types'

// Export WidgetCard component
export { WidgetCard } from './widget-card'

// Export individual widgets for direct access if needed
export {
  totalPeopleWidget,
  directReportsWidget,
  oneOnOnesNeededWidget,
  feedback360NeededWidget,
  maxReportsExceededWidget,
  teamBreakdownWidget,
  jobRoleBreakdownWidget,
}
