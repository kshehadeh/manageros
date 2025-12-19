import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import {
  getCurrentUserWithPersonAndOrganization,
  requireAdmin,
} from '@/lib/auth-utils'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { OrganizationProfileButton } from '@/components/organization/organization-profile-button'
import { OrganizationSettingsActionsDropdown } from '@/components/organization/organization-settings-actions-dropdown'
import { OrganizationSectionServer } from '@/components/settings/organization-section-server'
import { OrganizationSectionSkeleton } from '@/components/settings/organization-section-skeleton'
import {
  Building,
  Users,
  BarChart3,
  Plug,
  AlertTriangle,
  Settings,
  ClipboardList,
} from 'lucide-react'
import { PlanLimitsSection } from '@/components/settings/plan-limits-section'
import { PlanLimitsSectionSkeleton } from '@/components/settings/plan-limits-section-skeleton'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { IntegrationsSectionServer } from '@/components/integrations/integrations-section-server'
import { IntegrationsSectionSkeleton } from '@/components/integrations/integrations-section-skeleton'

export default async function OrganizationSettingsPage() {
  // Require admin role and organization membership
  await requireAdmin()

  // Fetch organization details for the page
  const { organization } = await getCurrentUserWithPersonAndOrganization({
    includeOrganizationDetails: true,
  })

  // Ensure organization has required details
  if (!organization || !organization.name) {
    redirect('/organization/new')
  }

  // Since requireAdmin passed, user is guaranteed to be admin
  const isAdmin = true

  const pathname = '/organization/settings'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Organization Settings', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title='Organization Settings'
          subtitle='Manage your organization settings and members'
          actions={
            <div className='flex items-center gap-2'>
              <OrganizationSettingsActionsDropdown
                organizationName={organization.name}
              />
              <OrganizationProfileButton />
            </div>
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Basic Information Section */}
              <PageSection
                header={
                  <SectionHeader icon={Building} title='Basic Information' />
                }
              >
                <Suspense fallback={<OrganizationSectionSkeleton />}>
                  <OrganizationSectionServer
                    organizationId={organization.id!}
                    organizationName={organization.name!}
                    organizationSlug={organization.slug ?? null}
                    isAdmin={isAdmin}
                  />
                </Suspense>
              </PageSection>

              {/* Plan Limits Section */}
              {organization.id && (
                <PageSection
                  header={
                    <SectionHeader
                      icon={BarChart3}
                      title='Plan Limits & Usage'
                    />
                  }
                >
                  <Suspense fallback={<PlanLimitsSectionSkeleton />}>
                    <PlanLimitsSection organizationId={organization.id} />
                  </Suspense>
                </PageSection>
              )}

              {/* Integrations Section */}
              {organization.id && (
                <PageSection
                  header={<SectionHeader icon={Plug} title='Integrations' />}
                >
                  <Suspense fallback={<IntegrationsSectionSkeleton />}>
                    <IntegrationsSectionServer />
                  </Suspense>
                </PageSection>
              )}
            </div>
          </PageMain>

          <PageSidebar>
            <div className='space-y-6'>
              {/* Administration Section */}
              <PageSection
                header={
                  <SectionHeader
                    icon={Settings}
                    title='Administration'
                    variant='no-background'
                    description='Manage users and tolerance rules for your organization'
                  />
                }
              >
                <div className='space-y-4'>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full justify-start'
                  >
                    <Link
                      href='/organization/users'
                      className='flex items-center gap-2'
                    >
                      <Users className='w-4 h-4' />
                      Manage Users
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full justify-start'
                  >
                    <Link
                      href='/organization/onboarding-templates'
                      className='flex items-center gap-2'
                    >
                      <ClipboardList className='w-4 h-4' />
                      Onboarding Templates
                    </Link>
                  </Button>
                  <Button
                    asChild
                    variant='outline'
                    className='w-full justify-start'
                  >
                    <Link
                      href='/organization/settings/tolerance-rules'
                      className='flex items-center gap-2'
                    >
                      <AlertTriangle className='w-4 h-4' />
                      Manage Tolerance Rules
                    </Link>
                  </Button>
                </div>
              </PageSection>
            </div>
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
