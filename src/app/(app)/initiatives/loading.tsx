import { DashboardWidgetsSkeleton } from '@/components/widgets/dashboard-widgets-skeleton'

export default function LoadingPage() {
  return <DashboardWidgetsSkeleton statsCount={4} chartsCount={2} />
}
