import { getJobRole } from '@/lib/actions/job-roles'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { JobRoleDetailClient } from '@/components/jobs/job-role-detail-client'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { JobRoleActionsDropdown } from '@/components/jobs/job-role-actions-dropdown'
import { SimplePeopleList } from '@/components/people/person-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Building2, Users, Briefcase, FileText } from 'lucide-react'
import type { Person } from '@/types/person'
import { AssignPersonButton } from '@/components/jobs/assign-person-button'

interface JobRoleDetailPageProps {
  params: Promise<{ id: string }>
}

export default async function JobRoleDetailPage({
  params,
}: JobRoleDetailPageProps) {
  const session = await getServerSession(authOptions)

  // Check if user belongs to an organization
  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params

  try {
    const jobRole = await getJobRole(id)

    return (
      <JobRoleDetailClient jobRoleTitle={jobRole.title} jobRoleId={jobRole.id}>
        <PageContainer>
          <PageHeader
            title={jobRole.title}
            subtitle={
              <>
                <div className='page-section-subtitle'>
                  {jobRole.level.name} • {jobRole.domain.name}
                </div>
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
              </>
            }
            actions={
              <JobRoleActionsDropdown
                jobRoleId={jobRole.id}
                jobRoleTitle={jobRole.title}
              />
            }
          />

          <PageContent>
            <PageMain>
              <div className='space-y-6'>
                {/* Description Section */}
                {jobRole.description && (
                  <PageSection
                    header={
                      <SectionHeader icon={FileText} title='Description' />
                    }
                  >
                    <ReadonlyNotesField
                      content={jobRole.description}
                      variant='detailed'
                      showEmptyState={false}
                    />
                  </PageSection>
                )}

                {/* People Section */}
                <PageSection
                  header={
                    <SectionHeader
                      icon={Users}
                      title={`People (${jobRole.people.length})`}
                      action={
                        <AssignPersonButton
                          jobRoleId={jobRole.id}
                          excludePersonIds={(jobRole.people as Person[]).map(
                            p => p.id
                          )}
                        />
                      }
                    />
                  }
                >
                  <SimplePeopleList
                    people={jobRole.people as Person[]}
                    variant='compact'
                    showEmail={true}
                    showRole={true}
                    showTeam={true}
                    showJobRole={false}
                    showManager={false}
                    showReportsCount={false}
                    emptyStateText='No people assigned to this job role.'
                  />
                </PageSection>
              </div>
            </PageMain>
          </PageContent>
        </PageContainer>
      </JobRoleDetailClient>
    )
  } catch (error) {
    console.error('Error fetching job role:', error)
    notFound()
  }
}
