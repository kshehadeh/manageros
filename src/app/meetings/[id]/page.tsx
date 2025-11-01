import { getMeeting } from '@/lib/actions/meeting'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { notFound } from 'next/navigation'
import { MeetingDetailBreadcrumbClient } from '@/components/meetings/meeting-detail-breadcrumb-client'
import { MeetingInstanceList } from '@/components/meetings/meeting-instance-list'
import { MeetingActionsDropdown } from '@/components/meetings/meeting-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { SimpleLinkList } from '@/components/links/link-list'
import { SimplePeopleList } from '@/components/people/person-list'
import {
  Clock,
  Users,
  User,
  Building2,
  Repeat,
  FileText,
  StickyNote,
  Calendar,
} from 'lucide-react'

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const { id } = await params
  const [meeting, entityLinks] = await Promise.all([
    getMeeting(id),
    getEntityLinks('Meeting', id),
  ])

  if (!meeting) {
    notFound()
  }

  const scheduledDate = new Date(meeting.scheduledAt)
  const isPast = scheduledDate < new Date()

  const formatDuration = (minutes: number | null) => {
    if (!minutes) return 'No duration set'
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    if (hours > 0) {
      return mins > 0
        ? `${hours} hour${hours !== 1 ? 's' : ''} ${mins} minute${mins !== 1 ? 's' : ''}`
        : `${hours} hour${hours !== 1 ? 's' : ''}`
    }
    return `${mins} minute${mins !== 1 ? 's' : ''}`
  }

  return (
    <MeetingDetailBreadcrumbClient
      meetingTitle={meeting.title}
      meetingId={meeting.id}
    >
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <Calendar className='h-6 w-6 text-muted-foreground' />
                <h1 className='page-title'>{meeting.title}</h1>
              </div>

              {/* Meeting details in small text */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                <div className='flex items-center gap-1'>
                  <Clock className='h-4 w-4' />
                  <span>{formatDuration(meeting.duration)}</span>
                </div>
                <div className='flex items-center gap-1'>
                  <Users className='h-4 w-4' />
                  <span>
                    {meeting.participants.length} participant
                    {meeting.participants.length !== 1 ? 's' : ''}
                  </span>
                </div>
                {meeting.isRecurring && (
                  <div className='flex items-center gap-1'>
                    <Repeat className='h-4 w-4' />
                    <span>{meeting.recurrenceType?.replace('_', '-')}</span>
                  </div>
                )}
                {meeting.isRecurring && meeting.instances.length > 0 && (
                  <span>
                    {meeting.instances.length} instance
                    {meeting.instances.length !== 1 ? 's' : ''}
                  </span>
                )}
                {meeting.owner && (
                  <div className='flex items-center gap-1'>
                    <User className='h-4 w-4' />
                    <Link
                      href={`/people/${meeting.owner.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {meeting.owner.name}
                    </Link>
                  </div>
                )}
                {meeting.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='h-4 w-4' />
                    <Link
                      href={`/teams/${meeting.team.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {meeting.team.name}
                    </Link>
                  </div>
                )}
                {isPast && !meeting.isRecurring && (
                  <span className='text-muted-foreground'>Past Meeting</span>
                )}
              </div>
            </div>
            <MeetingActionsDropdown meetingId={meeting.id} meeting={meeting} />
          </div>
        </div>

        {/* Main Content and Sidebar */}
        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
            <div className='space-y-6'>
              {/* Description */}
              {meeting.description && (
                <PageSection
                  header={<SectionHeader icon={FileText} title='Description' />}
                >
                  <ReadonlyNotesField
                    content={meeting.description}
                    variant='default'
                    showEmptyState={false}
                  />
                </PageSection>
              )}

              {/* Notes */}
              <PageSection
                header={<SectionHeader icon={StickyNote} title='Notes' />}
              >
                <ReadonlyNotesField
                  content={meeting.notes || ''}
                  variant='default'
                  emptyStateText='No notes for this meeting'
                />
              </PageSection>

              {/* Meeting Instances - Only show for recurring meetings */}
              {meeting.isRecurring && (
                <PageSection>
                  <MeetingInstanceList
                    instances={meeting.instances}
                    meetingId={meeting.id}
                    parentParticipants={meeting.participants.map(p => ({
                      personId: p.personId,
                      status: p.status,
                    }))}
                    parentScheduledAt={meeting.scheduledAt}
                  />
                </PageSection>
              )}
            </div>
          </div>

          {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
          <div className='w-full lg:w-80 lg:shrink-0'>
            <PageSection>
              <SimplePeopleList
                people={meeting.participants.map(p => ({
                  ...p.person,
                  team: null,
                  jobRole: null,
                  manager: null,
                  reports: [],
                  level: 0,
                }))}
                title={`Participants (${meeting.participants.length})`}
                variant='compact'
                emptyStateText='No participants yet.'
                showEmail={false}
                showRole={false}
                showTeam={false}
                showJobRole={false}
                showManager={false}
                showReportsCount={false}
                customSubtextMap={meeting.participants.reduce(
                  (acc, p) => {
                    acc[p.person.id] =
                      p.status.charAt(0).toUpperCase() + p.status.slice(1)
                    return acc
                  },
                  {} as Record<string, string>
                )}
              />
            </PageSection>
            <PageSection className='mt-6'>
              <SimpleLinkList
                links={entityLinks.map(link => ({
                  id: link.id,
                  url: link.url,
                  title: link.title,
                  description: link.description,
                  createdAt: link.createdAt,
                  updatedAt: link.updatedAt,
                  createdBy: link.createdBy,
                }))}
                entityType='Meeting'
                entityId={meeting.id}
                title='Links'
                variant='compact'
                showAddButton={true}
                emptyStateText='No links added yet.'
              />
            </PageSection>
          </div>
        </div>
      </div>
    </MeetingDetailBreadcrumbClient>
  )
}
