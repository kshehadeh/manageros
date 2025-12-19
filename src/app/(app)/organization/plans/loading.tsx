import { Skeleton } from '@/components/ui/skeleton'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default function LoadingPage() {
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Manage Plan', href: '/organization/plans' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title={<Skeleton className='h-8 w-48' />}
          subtitle={<Skeleton className='h-5 w-64' />}
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Back button skeleton */}
              <Skeleton className='h-9 w-36' />

              {/* Current plan info skeleton */}
              <Skeleton className='h-16 w-full rounded-lg' />

              {/* Billing period toggle skeleton */}
              <div className='flex justify-center'>
                <Skeleton className='h-8 w-64' />
              </div>

              {/* Plans grid skeleton */}
              <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
                {[1, 2, 3].map(i => (
                  <Skeleton key={i} className='h-80 w-full rounded-lg' />
                ))}
              </div>
            </div>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
