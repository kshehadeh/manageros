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
import { CheckoutPageClient } from '@/components/billing/checkout-page-client'
import { Skeleton } from '@/components/ui/skeleton'

interface CheckoutPageProps {
  searchParams: Promise<{
    planId?: string
    period?: 'month' | 'annual'
  }>
}

function CheckoutLoadingSkeleton() {
  return (
    <div className='max-w-2xl mx-auto space-y-6'>
      <Skeleton className='h-8 w-64' />
      <Skeleton className='h-48 w-full' />
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-12 w-full' />
    </div>
  )
}

export default async function OrganizationCheckoutPage({
  searchParams,
}: CheckoutPageProps) {
  // Require admin role and organization membership
  await requireAdmin()

  const resolvedParams = await searchParams

  // Fetch organization details for the page
  const { organization } = await getCurrentUserWithPersonAndOrganization({
    includeOrganizationDetails: true,
  })

  // Ensure organization has required details
  if (!organization || !organization.id || !organization.clerkOrganizationId) {
    redirect('/organization/new')
  }

  // Validate required parameters
  const planId = resolvedParams.planId
  const period = resolvedParams.period || 'month'

  if (!planId) {
    redirect('/organization/plans')
  }

  const pathname = '/organization/checkout'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Manage Plan', href: '/organization/plans' },
    { name: 'Checkout', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Complete Your Subscription'
          subtitle='Enter your payment details to upgrade your plan'
        />

        <PageContent>
          <PageMain>
            <Suspense fallback={<CheckoutLoadingSkeleton />}>
              <CheckoutPageClient
                planId={planId}
                planPeriod={period as 'month' | 'annual'}
                organizationId={organization.id}
                clerkOrganizationId={organization.clerkOrganizationId}
              />
            </Suspense>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
