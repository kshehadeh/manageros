import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title={<Skeleton className='h-8 w-48' />}
        iconComponent={<Skeleton className='h-16 w-16 rounded-full' />}
        subtitle={
          <div className='space-y-2'>
            <Skeleton className='h-5 w-32' />
            <Skeleton className='h-4 w-40' />
            <div className='flex flex-wrap items-center gap-4 mt-3'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-4 w-32' />
            </div>
          </div>
        }
        actions={<Skeleton className='h-8 w-8' />}
      />
      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Placeholder for sections - individual components will show their own skeletons */}
            <Skeleton className='h-32 w-full rounded-lg' />
            <Skeleton className='h-48 w-full rounded-lg' />
            <Skeleton className='h-40 w-full rounded-lg' />
          </div>
        </PageMain>
        <PageSidebar>
          <div className='space-y-6'>
            {/* Placeholder for sidebar sections - individual components will show their own skeletons */}
            <Skeleton className='h-32 w-full rounded-lg' />
            <Skeleton className='h-24 w-full rounded-lg' />
            <Skeleton className='h-40 w-full rounded-lg' />
          </div>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
