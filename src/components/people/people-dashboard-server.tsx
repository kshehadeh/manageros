import {
  getCurrentUser,
  getCurrentUserWithPersonAndOrganization,
} from '@/lib/auth-utils'
import { widgetRegistry } from '@/components/widgets'
import type { WidgetContext } from '@/components/widgets'
import { PageSection } from '@/components/ui/page-section'
import { PeopleDashboardWidgetsClient } from './people-dashboard-widgets'

/**
 * Server component that orchestrates widget rendering
 * Fetches data and renders widgets based on visibility
 */
export async function PeopleDashboardServer() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    return (
      <PageSection>
        <div className='text-center text-xs text-muted-foreground py-8 font-mono'>
          Unable to load dashboard - user must belong to an organization
        </div>
      </PageSection>
    )
  }

  const { person } = await getCurrentUserWithPersonAndOrganization()

  // Create widget context
  const context: WidgetContext = {
    userId: user.managerOSUserId || '',
    organizationId: user.managerOSOrganizationId,
    personId: person?.id || null,
    hasLinkedPerson: !!person,
  }

  // Get all registered widgets
  const allWidgets = widgetRegistry.getAll()

  // Check visibility and fetch data for each widget
  const widgetPromises = allWidgets.map(async widget => {
    const visibility = await widget.checkVisibility(context)

    if (!visibility.visible) {
      return null
    }

    const data = await widget.fetchData(context)

    return {
      widgetId: widget.metadata.id,
      widgetElement: widget.render(data, widget.metadata, context),
      minWidth: widget.metadata.minWidth,
    }
  })

  const widgetResults = await Promise.all(widgetPromises)
  const visibleWidgets = widgetResults.filter(
    (result): result is NonNullable<typeof result> => result !== null
  )

  if (visibleWidgets.length === 0) {
    return (
      <PageSection>
        <div className='text-center text-xs text-muted-foreground py-8 font-mono'>
          No widgets available to display
        </div>
      </PageSection>
    )
  }

  // Group widgets by category
  const statsWidgets = visibleWidgets.filter(w => {
    const widget = widgetRegistry.get(w.widgetId)
    return widget?.metadata.category === 'stats'
  })
  const chartWidgets = visibleWidgets.filter(w => {
    const widget = widgetRegistry.get(w.widgetId)
    return widget?.metadata.category === 'charts'
  })

  return (
    <div className='space-y-4'>
      {/* Stats Cards Section */}
      {statsWidgets.length > 0 && (
        <PageSection>
          <PeopleDashboardWidgetsClient widgets={statsWidgets} />
        </PageSection>
      )}

      {/* Charts Section */}
      {chartWidgets.length > 0 && (
        <PageSection>
          <PeopleDashboardWidgetsClient widgets={chartWidgets} />
        </PageSection>
      )}
    </div>
  )
}
