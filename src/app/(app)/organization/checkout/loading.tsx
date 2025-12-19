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
    { name: 'Checkout', href: '/organization/checkout' },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title={<Skeleton className='h-8 w-64' />}
          subtitle={<Skeleton className='h-5 w-80' />}
        />

        <PageContent>
          <PageMain>
            <div className='max-w-2xl mx-auto space-y-6'>
              {/* Back button skeleton */}
              <Skeleton className='h-9 w-36' />

              {/* Order summary card skeleton */}
              <Skeleton className='h-48 w-full rounded-lg' />

              {/* Payment section skeleton */}
              <Skeleton className='h-64 w-full rounded-lg' />

              {/* Submit button skeleton */}
              <Skeleton className='h-12 w-full rounded-lg' />
            </div>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
