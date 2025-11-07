import { getMeetingInstance } from '@/lib/actions/meeting-instance'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { notFound } from 'next/navigation'
import Link from 'next/link'
import { Calendar, StickyNote, ChevronRight, Users } from 'lucide-react'
import { LinkListSection } from '@/components/links/link-list-section'
import { MeetingInstanceDetailBreadcrumbClient } from '@/components/meetings/meeting-instance-detail-breadcrumb-client'
import { MeetingInstanceActionsDropdown } from '@/components/meetings/meeting-instance-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { SimplePeopleList } from '@/components/people/person-list'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'

export default async function MeetingInstanceDetailPage({
  params,
}: {
  params: Promise<{ id: string; instanceId: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user.organizationId) {
    redirect('/organization/create')
  }

  const { instanceId } = await params
  const [meetingInstance, entityLinks] = await Promise.all([
    getMeetingInstance(instanceId),
    getEntityLinks('MeetingInstance', instanceId),
  ])

  if (!meetingInstance) {
    notFound()
  }

  const scheduledDate = new Date(meetingInstance.scheduledAt)
  const isPast = scheduledDate < new Date()

  const formatDateTime = (date: Date) => {
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    }).format(date)
  }

  const attendedCount = meetingInstance.participants.filter(
    p => p.status === 'attended'
  ).length
  const totalParticipants = meetingInstance.participants.length

  return (
    <MeetingInstanceDetailBreadcrumbClient
      meetingTitle={meetingInstance.meeting.title}
      meetingId={meetingInstance.meetingId}
      instanceId={meetingInstance.id}
    >
      <PageContainer>
        <PageHeader
          title={meetingInstance.meeting.title}
          helpId='meeting-instances'
          subtitle={
            <>
              <p className='page-section-subtitle'>Meeting Instance</p>
              {/* Instance details in header */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-xs text-muted-foreground'>
                <Link
                  href={`/meetings/${meetingInstance.meetingId}`}
                  className='flex items-center gap-1 hover:text-foreground transition-colors'
                >
                  <span>Parent Meeting</span>
                  <ChevronRight className='h-3 w-3' />
                </Link>
                <div className='flex items-center gap-1'>
                  <Calendar className='h-3 w-3' />
                  <span>{formatDateTime(scheduledDate)}</span>
                </div>
                {isPast && <span>Past Instance</span>}
                <span>
                  {attendedCount}/{totalParticipants} attended
                </span>
              </div>
            </>
          }
          actions={
            <MeetingInstanceActionsDropdown
              meetingId={meetingInstance.meetingId}
              instanceId={meetingInstance.id}
            />
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Notes section */}
              <PageSection
                header={<SectionHeader icon={StickyNote} title='Notes' />}
              >
                <ReadonlyNotesField
                  content={meetingInstance.notes || ''}
                  variant='default'
                  emptyStateText='No notes for this meeting instance'
                  truncateMode={true}
                  maxHeight='200px'
                />
              </PageSection>
            </div>
          </PageMain>

          <PageSidebar>
            <PageSection
              header={
                <SectionHeader
                  icon={Users}
                  title={`Participants (${meetingInstance.participants.length})`}
                />
              }
            >
              <SimplePeopleList
                people={meetingInstance.participants.map(p => ({
                  ...p.person,
                  team: null,
                  jobRole: null,
                  manager: null,
                  reports: [],
                  level: 0,
                }))}
                variant='compact'
                emptyStateText='No participants yet.'
                showEmail={false}
                showRole={false}
                showTeam={false}
                showJobRole={false}
                showManager={false}
                showReportsCount={false}
                customSubtextMap={meetingInstance.participants.reduce(
                  (acc, p) => {
                    acc[p.person.id] =
                      p.status.charAt(0).toUpperCase() + p.status.slice(1)
                    return acc
                  },
                  {} as Record<string, string>
                )}
              />
            </PageSection>
            <LinkListSection
              links={entityLinks.map(link => ({
                id: link.id,
                url: link.url,
                title: link.title,
                description: link.description,
                createdAt: link.createdAt,
                updatedAt: link.updatedAt,
                createdBy: link.createdBy,
              }))}
              entityType='MeetingInstance'
              entityId={meetingInstance.id}
              title='Links'
              emptyStateText='No links added yet.'
              className='mt-6'
            />
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </MeetingInstanceDetailBreadcrumbClient>
  )
}
