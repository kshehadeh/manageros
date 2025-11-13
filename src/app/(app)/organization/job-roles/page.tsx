import { redirect } from 'next/navigation'
import { getJobLevels, getJobDomains } from '@/lib/actions/job-roles'
import { JobRoleHeaderButton } from '@/components/jobs/job-role-header-button'
import { JobRolesContent } from '@/components/jobs/job-roles-content'
import { JobRolesBreadcrumbClient } from '@/components/jobs/job-roles-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getCurrentUser, isAdminOrOwner } from '@/lib/auth-utils'

export default async function JobRoleManagementPage() {
  const user = await getCurrentUser()

  // Check if user is admin or owner
  if (!isAdminOrOwner(user)) {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!user.organizationId) {
    redirect('/organization/create')
  }

  // Get levels and domains for management
  const [levels, domains] = await Promise.all([getJobLevels(), getJobDomains()])

  return (
    <JobRolesBreadcrumbClient>
      <PageContainer>
        <PageHeader
          title='Job Role Management'
          subtitle='Configure job levels, domains, and roles for your organization'
          actions={<JobRoleHeaderButton levels={levels} domains={domains} />}
        />
        <PageContent>
          <PageSection>
            <JobRolesContent levels={levels} domains={domains} />
          </PageSection>
        </PageContent>
      </PageContainer>
    </JobRolesBreadcrumbClient>
  )
}
