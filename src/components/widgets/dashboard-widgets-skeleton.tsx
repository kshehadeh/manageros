import { PageSection } from '@/components/ui/page-section'
import { WidgetSkeleton, ChartWidgetSkeleton } from './widget-skeleton'

interface DashboardWidgetsSkeletonProps {
  statsCount?: number
  chartsCount?: number
}

/**
 * Skeleton component for dashboard widgets layout
 * Shows skeleton widgets in the same layout as the actual dashboard
 */
export function DashboardWidgetsSkeleton({
  statsCount = 5,
  chartsCount = 2,
}: DashboardWidgetsSkeletonProps) {
  return (
    <div className='space-y-4'>
      {/* Stats Cards Section */}
      {statsCount > 0 && (
        <PageSection>
          <div className='flex flex-wrap gap-4'>
            {Array.from({ length: statsCount }).map((_, index) => (
              <div
                key={index}
                className='min-w-0'
                style={{ minWidth: '160px', flex: '1 1 auto' }}
              >
                <WidgetSkeleton />
              </div>
            ))}
          </div>
        </PageSection>
      )}

      {/* Charts Section */}
      {chartsCount > 0 && (
        <PageSection>
          <div className='flex flex-wrap gap-4'>
            {Array.from({ length: chartsCount }).map((_, index) => (
              <div
                key={index}
                className='min-w-0'
                style={{ minWidth: '320px', flex: '1 1 auto' }}
              >
                <ChartWidgetSkeleton />
              </div>
            ))}
          </div>
        </PageSection>
      )}
    </div>
  )
}
