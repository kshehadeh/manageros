import { getJobRole } from '@/lib/actions/job-roles'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/jobs/job-role-detail-client'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { JobRoleActionsDropdown } from '@/components/jobs/job-role-actions-dropdown'
import { SectionHeader } from '@/components/ui/section-header'
import { PersonListItem } from '@/components/people/person-list-item'
import { Building2, Users, Briefcase, FileText } from 'lucide-react'
import Link from 'next/link'

interface JobRoleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobRoleDetailPage({
  params,
}: JobRoleDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // Check if user belongs to an organization
  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params

  try {
    const jobRole = await getJobRole(id)

    return (
      <JobRoleDetailClient jobRoleTitle={jobRole.title} jobRoleId={jobRole.id}>
        <div className='space-y-6'>
          {/* Header */}
          <div className='px-4 lg:px-6'>
            <div className='page-header'>
              <div className='flex items-start justify-between'>
                <div className='flex-1'>
                  <h1 className='page-title'>{jobRole.title}</h1>
                  <div className='page-section-subtitle'>
                    {jobRole.level.name} • {jobRole.domain.name}
                  </div>

                  {/* Basic Information with Icons */}
                  <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                    <div className='flex items-center gap-1'>
                      <Briefcase className='w-4 h-4' />
                      <span>{jobRole.level.name} Level</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Building2 className='w-4 h-4' />
                      <span>{jobRole.domain.name} Domain</span>
                    </div>
                    <div className='flex items-center gap-1'>
                      <Users className='w-4 h-4' />
                      <span>
                        {jobRole.people.length}{' '}
                        {jobRole.people.length === 1 ? 'person' : 'people'}{' '}
                        assigned
                      </span>
                    </div>
                  </div>
                </div>
                <div className='flex items-center gap-2'>
                  <JobRoleActionsDropdown
                    jobRoleId={jobRole.id}
                    jobRoleTitle={jobRole.title}
                  />
                </div>
              </div>
            </div>
          </div>

          {/* Main Content */}
          <div className='px-4 lg:px-6'>
            <div className='space-y-6'>
              {/* Description Section */}
              {jobRole.description && (
                <div className='page-section'>
                  <SectionHeader icon={FileText} title='Description' />
                  <ReadonlyNotesField
                    content={jobRole.description}
                    variant='detailed'
                    showEmptyState={false}
                  />
                </div>
              )}

              {/* People Section */}
              {jobRole.people.length > 0 && (
                <div className='page-section'>
                  <SectionHeader
                    icon={Users}
                    title={`People (${jobRole.people.length})`}
                  />
                  <div className='space-y-2'>
                    {jobRole.people.map(person => (
                      <Link
                        key={person.id}
                        href={`/people/${person.id}`}
                        className='block'
                      >
                        <PersonListItem
                          person={{
                            id: person.id,
                            name: person.name,
                            email: person.email,
                          }}
                          showEmail={true}
                        />
                      </Link>
                    ))}
                  </div>
                </div>
              )}
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
