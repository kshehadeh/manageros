import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import {
  getCurrentUserWithPersonAndOrganization,
  requireAdmin,
} from '@/lib/auth-utils'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { getOrganizationSubscription } from '@/lib/subscription-utils'
import { PlansPageClient } from '@/components/billing/plans-page-client'
import { Skeleton } from '@/components/ui/skeleton'

function PlansLoadingSkeleton() {
  return (
    <div className='space-y-6'>
      <div className='flex items-center justify-between'>
        <Skeleton className='h-8 w-48' />
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='grid gap-6 md:grid-cols-2 lg:grid-cols-3'>
        {[1, 2, 3].map(i => (
          <Skeleton key={i} className='h-80 w-full' />
        ))}
      </div>
    </div>
  )
}

export default async function OrganizationPlansPage() {
  // Require admin role and organization membership
  await requireAdmin()

  // Fetch organization details for the page
  const { organization } = await getCurrentUserWithPersonAndOrganization({
    includeOrganizationDetails: true,
  })

  // Ensure organization has required details
  if (!organization || !organization.id) {
    redirect('/organization/new')
  }

  // Get current subscription info
  const subscription = await getOrganizationSubscription(organization.id)

  const pathname = '/organization/plans'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Manage Plan', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Manage Plan'
          subtitle='View and manage your subscription plan'
        />

        <PageContent>
          <PageMain>
            <Suspense fallback={<PlansLoadingSkeleton />}>
              <PlansPageClient
                currentPlanId={subscription?.subscriptionPlanId ?? null}
                currentPlanName={subscription?.subscriptionPlanName ?? null}
                clerkOrganizationId={organization.clerkOrganizationId ?? null}
                billingPeriod={subscription?.billingPeriod ?? null}
                periodStart={subscription?.periodStart ?? null}
                periodEnd={subscription?.periodEnd ?? null}
                nextPaymentDate={subscription?.nextPaymentDate ?? null}
              />
            </Suspense>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
