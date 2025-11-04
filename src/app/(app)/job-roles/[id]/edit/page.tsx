import {
  getJobRole,
  getJobLevels,
  getJobDomains,
} from '@/lib/actions/job-roles'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/jobs/job-role-detail-client'
import { JobRoleEditForm } from '@/components/jobs/job-role-edit-form'

interface JobRoleEditPageProps {
  params: Promise<{ id: string }>
}

export default async function JobRoleEditPage({
  params,
}: JobRoleEditPageProps) {
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

  const { id } = await params

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
