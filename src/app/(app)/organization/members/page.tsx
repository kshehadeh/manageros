import { redirect } from 'next/navigation'
import {
  getOrganizationInvitations,
  getOrganizationDetails,
} from '@/lib/actions/organization'
import { OrganizationMembersDataTable } from '@/components/organization-members/data-table'
import OrganizationInvitationsSection from '@/components/organization-invitations-section'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { Building, Users, UserCheck, Calendar } from 'lucide-react'
import { getCurrentUser } from '@/lib/auth-utils'

export default async function OrganizationDetailsPage() {
  const user = await getCurrentUser()

  // Check if user is admin
  if (user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    redirect('/organization/create')
  }

  const organization = await getOrganizationDetails()
  const invitations = await getOrganizationInvitations()

  if (!organization) {
    redirect('/organization/create')
  }

  return (
    <PageContainer>
      <PageHeader
        title={organization.name}
        titleIcon={Building}
        subtitle={
          organization.description ||
          'Organization details and member management'
        }
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Organization Information */}
            <PageSection
              header={
                <SectionHeader
                  icon={Building}
                  title='Organization Information'
                  description='Basic information about your organization'
                />
              }
            >
              <div className='grid gap-4 md:grid-cols-2'>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Name
                  </p>
                  <p className='text-base font-semibold mt-1'>
                    {organization.name}
                  </p>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Slug
                  </p>
                  <p className='text-base font-semibold mt-1'>
                    {organization.slug}
                  </p>
                </div>
                {organization.description && (
                  <div className='md:col-span-2'>
                    <p className='text-sm font-medium text-muted-foreground'>
                      Description
                    </p>
                    <p className='text-base mt-1'>{organization.description}</p>
                  </div>
                )}
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Created
                  </p>
                  <div className='flex items-center gap-2 mt-1'>
                    <Calendar className='h-4 w-4 text-muted-foreground' />
                    <p className='text-base'>
                      {new Date(organization.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div>
                  <p className='text-sm font-medium text-muted-foreground'>
                    Organization ID
                  </p>
                  <p className='text-base font-mono text-sm mt-1'>
                    {organization.id}
                  </p>
                </div>
              </div>
            </PageSection>

            {/* Organization Statistics */}
            <PageSection
              header={
                <SectionHeader
                  icon={Users}
                  title='Organization Statistics'
                  description='Overview of your organization'
                />
              }
            >
              <div className='grid gap-4 md:grid-cols-3'>
                <div className='flex items-center gap-3 p-4 border rounded-lg'>
                  <div className='p-2 bg-blue-100 dark:bg-blue-900/20 rounded-lg'>
                    <Users className='h-5 w-5 text-blue-600 dark:text-blue-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>
                      {organization._count.members}
                    </p>
                    <p className='text-sm text-muted-foreground'>Members</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-4 border rounded-lg'>
                  <div className='p-2 bg-green-100 dark:bg-green-900/20 rounded-lg'>
                    <UserCheck className='h-5 w-5 text-green-600 dark:text-green-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>
                      {organization._count.people}
                    </p>
                    <p className='text-sm text-muted-foreground'>People</p>
                  </div>
                </div>
                <div className='flex items-center gap-3 p-4 border rounded-lg'>
                  <div className='p-2 bg-purple-100 dark:bg-purple-900/20 rounded-lg'>
                    <Building className='h-5 w-5 text-purple-600 dark:text-purple-400' />
                  </div>
                  <div>
                    <p className='text-2xl font-bold'>
                      {organization._count.teams}
                    </p>
                    <p className='text-sm text-muted-foreground'>Teams</p>
                  </div>
                </div>
              </div>
            </PageSection>

            {/* Organization Members */}
            <PageSection
              header={
                <SectionHeader
                  icon={UserCheck}
                  title='Organization Members'
                  description='Manage member roles and remove users from your organization'
                />
              }
            >
              <OrganizationMembersDataTable
                settingsId='organization-members'
                currentUserId={user.id}
              />
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          <OrganizationInvitationsSection invitations={invitations} />
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
