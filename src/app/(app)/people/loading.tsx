import { DashboardWidgetsSkeleton } from '@/components/widgets/dashboard-widgets-skeleton'

export default function LoadingPage() {
  return <DashboardWidgetsSkeleton statsCount={5} chartsCount={2} />
}
