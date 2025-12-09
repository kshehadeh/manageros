import { getMeeting } from '@/lib/actions/meeting'
import { getEntityLinks } from '@/lib/data/entity-links'

import { redirect } from 'next/navigation'
import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { notFound } from 'next/navigation'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'
import { MeetingInstanceList } from '@/components/meetings/meeting-instance-list'
import { MeetingActionsDropdown } from '@/components/meetings/meeting-actions-dropdown'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
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
import { LinkListSection } from '@/components/links/link-list-section'
import { MeetingStatusBadge } from '@/components/meetings/meeting-status-badge'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { EntityIntegrationLinksServer } from '@/components/integrations/entity-integration-links-server'
import { Plug } from 'lucide-react'

export default async function MeetingDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  const { id } = await params
  if (!(await getActionPermission(user, 'meeting.view', id))) {
    redirect('/dashboard')
  }

  const meeting = await getMeeting(id)

  if (!meeting) {
    notFound()
  }

  // Check permissions for edit and delete
  const canEdit = await getActionPermission(user, 'meeting.edit', meeting.id)
  const canDelete = await getActionPermission(
    user,
    'meeting.delete',
    meeting.id
  )

  // Get entity links for this meeting
  const entityLinksResult = await getEntityLinks(
    'Meeting',
    id,
    user.managerOSOrganizationId || '',
    {
      includeCreatedBy: true,
    }
  )

  // Type assertion: when includeCreatedBy is true, createdBy will be included
  const entityLinks = entityLinksResult as Array<
    (typeof entityLinksResult)[0] & {
      createdBy: { id: string; name: string; email: string }
    }
  >

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

  const pathname = `/meetings/${meeting.id}`
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Meetings', href: '/meetings' },
    { name: meeting.title, href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageHeader
          title={meeting.title}
          titleIcon={Calendar}
          subtitle={
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
                    className='hover:text-highlight transition-colors'
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
                    className='hover:text-highlight transition-colors'
                  >
                    {meeting.team.name}
                  </Link>
                </div>
              )}
              <MeetingStatusBadge
                scheduledAt={meeting.scheduledAt}
                isRecurring={meeting.isRecurring}
              />
            </div>
          }
          actions={
            <MeetingActionsDropdown
              meetingId={meeting.id}
              meeting={meeting}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          }
        />

        <PageContent>
          <PageMain>
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
                  truncateMode={true}
                  maxHeight='200px'
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
                    canEdit={canEdit}
                  />
                </PageSection>
              )}
            </div>
          </PageMain>

          <PageSidebar>
            <PageSection
              header={
                <SectionHeader
                  icon={Users}
                  title={`Participants (${meeting.participants.length})`}
                />
              }
            >
              <SimplePeopleList
                people={meeting.participants.map(p => ({
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
              entityType='Meeting'
              entityId={meeting.id}
              title='Links'
              emptyStateText='No links added yet.'
              className='mt-6'
              canEdit={canEdit}
            />
            <PageSection
              header={
                <SectionHeader icon={Plug} title='External Integrations' />
              }
              className='mt-6'
            >
              <EntityIntegrationLinksServer
                entityType='Meeting'
                entityId={meeting.id}
              />
            </PageSection>
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
