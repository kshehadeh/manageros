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
  isAdminOrOwner,
} from '@/lib/auth-utils'
import { OrganizationSettingsBreadcrumbClient } from '@/components/organization/organization-settings-breadcrumb-client'
import { OrganizationProfileButton } from '@/components/organization/organization-profile-button'
import { OrganizationSectionServer } from '@/components/settings/organization-section-server'
import { OrganizationSectionSkeleton } from '@/components/settings/organization-section-skeleton'
import { Building, Users, Briefcase, BarChart3 } from 'lucide-react'
import { PlanLimitsSection } from '@/components/settings/plan-limits-section'
import { PlanLimitsSectionSkeleton } from '@/components/settings/plan-limits-section-skeleton'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'

export default async function OrganizationSettingsPage() {
  const { user, organization } = await getCurrentUserWithPersonAndOrganization({
    includeOrganizationDetails: true,
  })

  if (!user) {
    redirect('/dashboard')
  }

  // Check if user is admin
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.managerOSOrganizationId || !organization || !organization.name) {
    redirect('/organization/new')
  }

  // At this point, organization is guaranteed to exist with name
  const isAdmin = isAdminOrOwner(user)

  return (
    <OrganizationSettingsBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Organization Settings'
          subtitle='Manage your organization settings and members'
          actions={<OrganizationProfileButton />}
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Basic Information Section */}
              <PageSection
                variant='bordered'
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
                  variant='bordered'
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
            </div>
          </PageMain>

          <PageSidebar>
            <div className='space-y-6'>
              {/* Manager Users Section */}
              <PageSection
                header={
                  <SectionHeader
                    icon={Users}
                    title='Manager Users'
                    description='Manage organization members and invitations'
                    variant='no-background'
                  />
                }
              >
                <div className='space-y-4'>
                  <Button asChild variant='outline'>
                    <Link
                      href='/organization/users'
                      className='flex items-center gap-2'
                    >
                      <Users className='w-4 h-4' />
                      Manage Users
                    </Link>
                  </Button>
                </div>
              </PageSection>

              {/* Job Roles and Titles Section */}
              <PageSection
                header={
                  <SectionHeader
                    icon={Briefcase}
                    title='Job Roles and Titles'
                    variant='no-background'
                    description='Manage job levels, domains, and roles for your organization'
                  />
                }
              >
                <div className='space-y-4'>
                  <Button asChild variant='outline'>
                    <Link
                      href='/organization/job-roles'
                      className='flex items-center gap-2'
                    >
                      <Briefcase className='w-4 h-4' />
                      Manage Job Roles
                    </Link>
                  </Button>
                </div>
              </PageSection>
            </div>
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </OrganizationSettingsBreadcrumbClient>
  )
}
