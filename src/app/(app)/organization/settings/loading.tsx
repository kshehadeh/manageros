import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default function LoadingPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title={<Skeleton className='h-8 w-48' />}
          subtitle={<Skeleton className='h-5 w-64' />}
          actions={<Skeleton className='h-9 w-36 rounded-md' />}
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Placeholder for sections - individual components will show their own skeletons */}
              <Skeleton className='h-32 w-full rounded-lg' />
              <Skeleton className='h-48 w-full rounded-lg' />
            </div>
          </PageMain>

          <PageSidebar>
            <div className='space-y-6'>
              {/* Placeholder for sidebar sections - individual components will show their own skeletons */}
              <Skeleton className='h-32 w-full rounded-lg' />
              <Skeleton className='h-24 w-full rounded-lg' />
            </div>
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
