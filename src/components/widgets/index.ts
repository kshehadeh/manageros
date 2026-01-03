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
import { totalOpenInitiativesWidget } from './initiatives/total-open-initiatives-widget'
import { initiativesInExceptionWidget } from './initiatives/initiatives-in-exception-widget'
import { userInitiativesWidget } from './initiatives/user-initiatives-widget'
import { overdueInitiativesWidget } from './initiatives/overdue-initiatives-widget'
import { initiativesStatusChartWidget } from './initiatives/initiatives-status-chart-widget'
import { initiativesRagChartWidget } from './initiatives/initiatives-rag-chart-widget'

// Register all widgets
widgetRegistry.registerAll([
  totalPeopleWidget,
  directReportsWidget,
  oneOnOnesNeededWidget,
  feedback360NeededWidget,
  maxReportsExceededWidget,
  teamBreakdownWidget,
  jobRoleBreakdownWidget,
  totalOpenInitiativesWidget,
  initiativesInExceptionWidget,
  userInitiativesWidget,
  overdueInitiativesWidget,
  initiativesStatusChartWidget,
  initiativesRagChartWidget,
])

// Export registry and types
export { widgetRegistry } from './registry'
export type {
  Widget,
  WidgetMetadata,
  WidgetContext,
  WidgetVisibility,
} from './types'

// Export WidgetCard component

// Export skeleton components

// Export individual widgets for direct access if needed
