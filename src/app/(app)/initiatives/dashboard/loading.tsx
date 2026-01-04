import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { DashboardWidgetsSkeleton } from '@/components/widgets/dashboard-widgets-skeleton'
import { Rocket } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title={<Skeleton className='h-8 w-32' />}
        titleIcon={Rocket}
        subtitle={<Skeleton className='h-4 w-64' />}
        actions={
          <div className='flex flex-wrap items-center gap-3'>
            <Skeleton className='h-9 w-24 rounded-md' />
            <Skeleton className='h-9 w-32 rounded-md' />
          </div>
        }
      />
      <PageContent>
        <DashboardWidgetsSkeleton statsCount={4} chartsCount={2} />
      </PageContent>
    </PageContainer>
  )
}
