import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getJobRoles, getJobLevels, getJobDomains } from '@/lib/actions'
import { JobRoleManagement } from '@/components/job-role-management'
import { JobLevelManagement } from '@/components/job-level-management'
import { JobDomainManagement } from '@/components/job-domain-management'

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

      <div className='grid gap-6 lg:grid-cols-3'>
        {/* Job Level Management */}
        <div className='card'>
          <JobLevelManagement levels={levels} />
        </div>

        {/* Job Domain Management */}
        <div className='card'>
          <JobDomainManagement domains={domains} />
        </div>

        {/* Job Role Management */}
        <div className='card lg:col-span-1'>
          <JobRoleManagement
            jobRoles={jobRoles}
            levels={levels}
            domains={domains}
          />
        </div>
      </div>
    </div>
  )
}
