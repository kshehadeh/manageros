import { getJobRole } from '@/lib/actions/job-roles'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/jobs/job-role-detail-client'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { JobRoleActionsDropdown } from '@/components/jobs/job-role-actions-dropdown'
import { Building2, Users, Briefcase } from 'lucide-react'
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
        <div className='page-container'>
          {/* Header */}
          <div className='page-header'>
            <div className='flex items-start justify-between'>
              <div className='flex-1'>
                <div className='flex items-center gap-3 mb-2'>
                  <h1 className='page-title'>{jobRole.title}</h1>
                </div>
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

          {/* Main Content */}
          <div className='main-layout'>
            <div className='main-content'>
              {/* Description Section */}
              <section>
                <h3 className='section-title'>Description</h3>
                <div className='section-content'>
                  {jobRole.description ? (
                    <ReadonlyNotesField
                      content={jobRole.description}
                      variant='detailed'
                      showEmptyState={false}
                    />
                  ) : (
                    <div className='text-muted-foreground italic'>
                      No description available for this job role.
                    </div>
                  )}
                </div>
              </section>

              {/* People Section */}
              {jobRole.people.length > 0 && (
                <section>
                  <h3 className='section-title'>
                    People ({jobRole.people.length})
                  </h3>
                  <div className='section-content'>
                    <div className='space-y-2'>
                      {jobRole.people.map(person => (
                        <Link
                          key={person.id}
                          href={`/people/${person.id}`}
                          className='content-card'
                        >
                          <div className='card-content'>
                            <div>
                              <div className='card-title'>{person.name}</div>
                              <div className='card-description'>
                                {person.email}
                              </div>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                </section>
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
