import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobRoles, getJobLevels, getJobDomains } from '@/lib/actions'
import { JobRolesPageClient } from '@/components/jobs/job-roles-page-client'

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

  // Get job roles, levels, and domains for management
  const [jobRoles, levels, domains] = await Promise.all([
    getJobRoles(),
    getJobLevels(),
    getJobDomains(),
  ])

  return (
    <div className='page-container'>
      <div className='page-header'>
        <h1 className='page-title'>Job Role Management</h1>
        <p className='page-subtitle'>
          Configure job levels, domains, and roles for your organization
        </p>
      </div>

      <JobRolesPageClient
        jobRoles={jobRoles}
        levels={levels}
        domains={domains}
      />
    </div>
  )
}
