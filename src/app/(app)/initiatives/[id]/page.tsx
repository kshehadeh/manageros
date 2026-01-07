import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { InitiativeActionsDropdown } from '@/components/initiatives/initiative-actions-dropdown'
import { InitiativeObjectivesServer } from '@/components/initiatives/initiative-objectives-server'
import { InitiativeTasks } from '@/components/initiatives/initiative-tasks-server'
import { InitiativeCheckInsServer } from '@/components/initiatives/initiative-checkins-server'
import { InitiativeSidebar } from '@/components/initiatives/initiative-sidebar'
import { NotesSectionServer } from '@/components/notes/notes-section-server'
import { InitiativeCompletionRate } from '@/components/initiatives/initiative-completion-rate'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { InlineEditableText } from '@/components/common/inline-editable-text'
import { updateInitiativeSummary } from '@/lib/actions/initiative'
import React, { Suspense } from 'react'
import { FileText, Rocket } from 'lucide-react'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'
import { prisma } from '@/lib/db'
import {
  InitiativeTasksSkeleton,
  InitiativeObjectivesSkeleton,
  InitiativeNotesSkeleton,
  InitiativeCheckInsSkeleton,
  InitiativeSidebarSkeleton,
  InitiativeCompletionRateSkeleton,
  InitiativePropertiesSidebarSkeleton,
} from '@/components/initiatives/initiative-detail-skeletons'
import { InitiativePropertiesSidebarServer } from '@/components/initiatives/initiative-properties-sidebar-server'
import { MobileBottomPanel } from '@/components/ui/mobile-bottom-panel'
import { Rag } from '../../../../components/rag'
import { Badge } from '@/components/ui/badge'
import {
  initiativeStatusUtils,
  type InitiativeStatus,
} from '@/lib/initiative-status'
import { Link } from '@/components/ui/link'
import { TeamAvatar } from '@/components/teams/team-avatar'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
import { initiativeSizeUtils, type InitiativeSize } from '@/lib/initiative-size'
import { formatShortDate } from '@/lib/utils/date-utils'

export default async function InitiativeDetail({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  const { id } = await params
  const canView = await getActionPermission(user, 'initiative.view', id)
  if (!canView) {
    redirect('/initiatives')
  }

  // Only fetch the initiative with minimal data needed for the page
  // Filter by organizationId to ensure organization isolation
  const init = await prisma.initiative.findFirst({
    where: {
      id,
      organizationId: user.managerOSOrganizationId || '',
    },
    select: {
      id: true,
      title: true,
      summary: true,
      rag: true,
      status: true,
      priority: true,
      size: true,
      startDate: true,
      targetDate: true,
      team: {
        select: {
          id: true,
          name: true,
          avatar: true,
        },
      },
    },
  })

  if (!init) return <div>Not found</div>

  // Check permissions for edit and delete
  const canEdit = await getActionPermission(user, 'initiative.edit', init.id)
  const canDelete = await getActionPermission(
    user,
    'initiative.delete',
    init.id
  )
  const canCreateTask = await getActionPermission(user, 'task.create')

  const startDateFormatted = formatShortDate(init.startDate)
  const targetDateFormatted = formatShortDate(init.targetDate)

  // Build array of subtext items
  const subtextItems = [
    <Badge
      key='status'
      variant={initiativeStatusUtils.getVariant(
        init.status as InitiativeStatus
      )}
      className='text-xs'
    >
      {initiativeStatusUtils.getLabel(init.status as InitiativeStatus)}
    </Badge>,
    <Rag key='rag' rag={init.rag} size='small' />,
    <Suspense
      key='completion-rate'
      fallback={<InitiativeCompletionRateSkeleton />}
    >
      <InitiativeCompletionRate initiativeId={init.id} />
    </Suspense>,
    taskPriorityUtils.isValid(init.priority) && (
      <Badge
        key='priority'
        variant={
          taskPriorityUtils.getVariant(init.priority as TaskPriority) as
            | 'default'
            | 'secondary'
            | 'destructive'
            | 'outline'
        }
        className='text-xs'
      >
        {taskPriorityUtils.getLabel(init.priority as TaskPriority)}
      </Badge>
    ),
    initiativeSizeUtils.isValid(init.size) && (
      <Badge
        key='size'
        variant={
          initiativeSizeUtils.getVariant(init.size as InitiativeSize) as
            | 'default'
            | 'secondary'
            | 'destructive'
            | 'outline'
        }
        className='text-xs'
      >
        {initiativeSizeUtils.getShortLabel(init.size as InitiativeSize)}
      </Badge>
    ),
    startDateFormatted ? (
      <span key='start-date' className='text-sm text-muted-foreground'>
        {startDateFormatted}
      </span>
    ) : null,
    targetDateFormatted ? (
      <span key='target-date' className='text-sm text-muted-foreground'>
        {targetDateFormatted}
      </span>
    ) : null,
    init.team && (
      <div key='team' className='flex items-center gap-2'>
        <TeamAvatar name={init.team.name} avatar={init.team.avatar} size='xs' />
        <Link
          href={`/teams/${init.team.id}`}
          className='text-sm text-muted-foreground hover:text-foreground transition-colors'
        >
          {init.team.name}
        </Link>
      </div>
    ),
  ].filter(Boolean)

  // Separator component
  const Separator = () => <span className='text-muted-foreground'>•</span>

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <PageContainer>
        <PageHeader
          title={init.title}
          titleIcon={Rocket}
          subtitle={
            <div className='flex items-center gap-2 flex-wrap'>
              {subtextItems.map((item, index) => (
                <React.Fragment key={index}>
                  {index > 0 && <Separator />}
                  {item}
                </React.Fragment>
              ))}
            </div>
          }
          actions={
            <InitiativeActionsDropdown
              initiativeId={init.id}
              initiativeTitle={init.title}
              canEdit={canEdit}
              canDelete={canDelete}
              canCreateTask={canCreateTask}
            />
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-10'>
              {/* Summary Section */}
              {canEdit || init.summary ? (
                <PageSection
                  header={<SectionHeader icon={FileText} title='Summary' />}
                >
                  <InlineEditableText
                    value={init.summary || ''}
                    onValueChange={async newSummary => {
                      'use server'
                      await updateInitiativeSummary(init.id, newSummary)
                    }}
                    placeholder='Enter initiative summary'
                    multiline={true}
                    emptyStateText='Click to add summary'
                    disabled={!canEdit}
                  />
                </PageSection>
              ) : null}

              <Suspense fallback={<InitiativeTasksSkeleton />}>
                <InitiativeTasks initiativeId={init.id} />
              </Suspense>

              <Suspense fallback={<InitiativeObjectivesSkeleton />}>
                <InitiativeObjectivesServer initiativeId={init.id} />
              </Suspense>

              <Suspense fallback={<InitiativeNotesSkeleton />}>
                <NotesSectionServer
                  entityType='Initiative'
                  entityId={init.id}
                />
              </Suspense>

              <Suspense fallback={<InitiativeCheckInsSkeleton />}>
                <InitiativeCheckInsServer initiativeId={init.id} />
              </Suspense>
            </div>
          </PageMain>

          <PageSidebar>
            <div className='space-y-6'>
              {/* Properties sidebar - hidden on mobile, shown in bottom panel instead */}
              <div className='hidden lg:block'>
                <Suspense fallback={<InitiativePropertiesSidebarSkeleton />}>
                  <InitiativePropertiesSidebarServer initiativeId={init.id} />
                </Suspense>
              </div>
              <Suspense fallback={<InitiativeSidebarSkeleton />}>
                <InitiativeSidebar initiativeId={init.id} />
              </Suspense>
            </div>
          </PageSidebar>
        </PageContent>
      </PageContainer>

      {/* Mobile bottom panel for properties */}
      <MobileBottomPanel title='Details'>
        <Suspense fallback={<InitiativePropertiesSidebarSkeleton />}>
          <InitiativePropertiesSidebarServer
            initiativeId={init.id}
            showHeader={false}
          />
        </Suspense>
      </MobileBottomPanel>
    </InitiativeDetailClient>
  )
}
