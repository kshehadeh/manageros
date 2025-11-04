import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobLevels, getJobDomains } from '@/lib/actions/job-roles'
import { JobRoleHeaderButton } from '@/components/jobs/job-role-header-button'
import { JobRolesContent } from '@/components/jobs/job-roles-content'
import { JobRolesBreadcrumbClient } from '@/components/jobs/job-roles-breadcrumb-client'
import { PageSection } from '@/components/ui/page-section'

export default async function JobRoleManagementPage() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user is admin
  if (session.user.role !== 'ADMIN') {
    redirect('/dashboard')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  // Get levels and domains for management
  const [levels, domains] = await Promise.all([getJobLevels(), getJobDomains()])

  return (
    <JobRolesBreadcrumbClient>
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div>
              <h1 className='page-title'>Job Role Management</h1>
              <p className='page-subtitle'>
                Configure job levels, domains, and roles for your organization
              </p>
            </div>
            <div className='flex gap-2'>
              <JobRoleHeaderButton levels={levels} domains={domains} />
            </div>
          </div>
        </div>
        <PageSection>
          <JobRolesContent levels={levels} domains={domains} />
        </PageSection>
      </div>
    </JobRolesBreadcrumbClient>
  )
}
