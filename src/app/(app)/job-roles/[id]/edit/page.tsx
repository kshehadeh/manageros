import {
  getJobRole,
  getJobLevels,
  getJobDomains,
} from '@/lib/actions/job-roles'
import { notFound } from 'next/navigation'

import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/jobs/job-role-detail-client'
import { JobRoleEditForm } from '@/components/jobs/job-role-edit-form'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

interface JobRoleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function JobRoleEditPage({
  params,
}: JobRoleEditPageProps) {
  const user = await getCurrentUser()
  const { id } = await params

  if (!(await getActionPermission(user, 'job-role.edit', id))) {
    redirect('/dashboard')
  }

  try {
    const [jobRole, levels, domains] = await Promise.all([
      getJobRole(id),
      getJobLevels(),
      getJobDomains(),
    ])

    return (
      <JobRoleDetailClient jobRoleTitle={jobRole.title} jobRoleId={jobRole.id}>
        <JobRoleEditForm jobRole={jobRole} levels={levels} domains={domains} />
      </JobRoleDetailClient>
    )
  } catch (error) {
    console.error('Error fetching job role:', error)
    notFound()
  }
}
