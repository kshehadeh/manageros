import { getJobRole, getJobLevels, getJobDomains } from '@/lib/actions'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/job-role-detail-client'
import { JobRoleEditForm } from '@/components/job-role-edit-form'
import { Button } from '@/components/ui/button'
import { ArrowLeft } from 'lucide-react'
import Link from 'next/link'

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
        <div className='page-container'>
          {/* Header */}
          <div className='page-header'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <Button variant='ghost' size='sm' asChild>
                    <Link href={`/job-roles/${jobRole.id}`}>
                      <ArrowLeft className='h-4 w-4' />
                    </Link>
                  </Button>
                  <h1 className='page-title'>Edit Job Role</h1>
                </div>
                <div className='page-section-subtitle'>
                  Update job role details and description
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='main-layout'>
            <div className='main-content'>
              <JobRoleEditForm
                jobRole={jobRole}
                levels={levels}
                domains={domains}
              />
            </div>
          </div>
        </div>
      </JobRoleDetailClient>
    )
  } catch (error) {
    console.error('Error fetching job role:', error)
    notFound()
  }
}
