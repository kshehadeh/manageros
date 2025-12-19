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
import { OrganizationBillingClient } from '@/components/organization/organization-billing-client'
import { Skeleton } from '@/components/ui/skeleton'

function BillingLoadingSkeleton() {
  return (
    <div className='space-y-6'>
      <Skeleton className='h-32 w-full' />
      <Skeleton className='h-64 w-full' />
      <Skeleton className='h-64 w-full' />
    </div>
  )
}

export default async function OrganizationBillingPage() {
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

  const pathname = '/organization/billing'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: '/organization/settings' },
    { name: 'Billing', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Organization Billing'
          subtitle='View your subscription plan, statements, and payment history'
        />

        <PageContent>
          <PageMain>
            <Suspense fallback={<BillingLoadingSkeleton />}>
              <OrganizationBillingClient />
            </Suspense>
          </PageMain>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
