import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { InitiativeActionsDropdown } from '@/components/initiatives/initiative-actions-dropdown'
import { InitiativeObjectives } from '@/components/initiatives/initiative-objectives'
import { InitiativeTasks } from '@/components/initiatives/initiative-tasks'
import { InitiativeCheckIns } from '@/components/initiatives/initiative-checkins'
import { InitiativeMeetings } from '@/components/initiatives/initiative-meetings'
import { InitiativeSidebar } from '@/components/initiatives/initiative-sidebar'
import { NotesSection } from '@/components/notes/notes-section'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { Suspense } from 'react'
import { Loading } from '@/components/ui/loading'
import { calculateTaskCompletionPercentage } from '@/lib/completion-utils'
import { getNotesForEntity } from '@/lib/actions/notes'
import { getInitiativeById } from '@/lib/actions/initiative'
import { getPeopleForOrganization } from '@/lib/actions/person'
import { getMeetingsForInitiativeSimple } from '@/lib/actions/meeting'
import { getAllTasksForInitiative } from '@/lib/actions/task'
import { getTeams } from '@/lib/actions/team'
import { getEntityLinks } from '@/lib/actions/entity-links'
import { FileText, Rocket } from 'lucide-react'
import { Rag } from '@/components/rag'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

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

  const [init, people, meetings, notes, teams, allTasks, entityLinks] =
    await Promise.all([
      getInitiativeById(id),
      getPeopleForOrganization(),
      getMeetingsForInitiativeSimple(id),
      getNotesForEntity('Initiative', id),
      getTeams(),
      getAllTasksForInitiative(id),
      getEntityLinks('Initiative', id),
    ])

  if (!init) return <div>Not found</div>

  // Calculate completion rate for the initiative
  const completionRate = calculateTaskCompletionPercentage(allTasks)

  // Check permissions for edit and delete
  const canEdit = await getActionPermission(user, 'initiative.edit', init.id)
  const canDelete = await getActionPermission(
    user,
    'initiative.delete',
    init.id
  )

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <PageContainer>
        <PageHeader
          title={init.title}
          titleIcon={Rocket}
          subtitle={
            <div className='flex items-center gap-2 ml-0 md:ml-9'>
              <Rag rag={init.rag} />
              <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                {completionRate}% complete
              </span>
            </div>
          }
          actions={
            <InitiativeActionsDropdown
              initiativeId={init.id}
              canEdit={canEdit}
              canDelete={canDelete}
            />
          }
        />

        <PageContent>
          <PageMain>
            <div className='space-y-6'>
              {/* Summary Section */}
              {init.summary && (
                <PageSection
                  header={<SectionHeader icon={FileText} title='Summary' />}
                >
                  <ReadonlyNotesField
                    content={init.summary}
                    variant='default'
                    emptyStateText='No summary provided'
                    truncateMode={true}
                    maxHeight='200px'
                  />
                </PageSection>
              )}

              {allTasks.length > 0 && (
                <Suspense
                  fallback={
                    <PageSection>
                      <div className='flex items-center justify-center py-8'>
                        <Loading size='md' />
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Loading tasks...
                        </span>
                      </div>
                    </PageSection>
                  }
                >
                  <InitiativeTasks
                    initiativeId={init.id}
                    tasks={init.tasks}
                    objectives={init.objectives}
                    canEdit={canEdit}
                  />
                </Suspense>
              )}

              {init.objectives.length > 0 && (
                <Suspense
                  fallback={
                    <PageSection>
                      <div className='flex items-center justify-center py-8'>
                        <Loading size='md' />
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Loading objectives...
                        </span>
                      </div>
                    </PageSection>
                  }
                >
                  <InitiativeObjectives
                    objectives={init.objectives}
                    initiativeId={init.id}
                    canEdit={canEdit}
                  />
                </Suspense>
              )}

              {meetings.length > 0 && (
                <Suspense
                  fallback={
                    <PageSection>
                      <div className='flex items-center justify-center py-8'>
                        <Loading size='md' />
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Loading meetings...
                        </span>
                      </div>
                    </PageSection>
                  }
                >
                  <InitiativeMeetings
                    meetings={meetings}
                    initiativeId={init.id}
                    currentTeam={init.team}
                  />
                </Suspense>
              )}

              {notes.length > 0 && (
                <Suspense
                  fallback={
                    <PageSection>
                      <div className='flex items-center justify-center py-8'>
                        <Loading size='md' />
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Loading notes...
                        </span>
                      </div>
                    </PageSection>
                  }
                >
                  <NotesSection
                    entityType='Initiative'
                    entityId={init.id}
                    notes={notes}
                    canEdit={canEdit}
                  />
                </Suspense>
              )}

              {init.checkIns.length > 0 && (
                <Suspense
                  fallback={
                    <PageSection>
                      <div className='flex items-center justify-center py-8'>
                        <Loading size='md' />
                        <span className='ml-2 text-sm text-muted-foreground'>
                          Loading check-ins...
                        </span>
                      </div>
                    </PageSection>
                  }
                >
                  <InitiativeCheckIns
                    initiativeId={init.id}
                    initiativeTitle={init.title}
                    checkIns={init.checkIns.map(ci => ({
                      id: ci.id,
                      weekOf: ci.weekOf.toISOString(),
                      rag: ci.rag,
                      confidence: ci.confidence,
                      summary: ci.summary,
                      blockers: ci.blockers,
                      nextSteps: ci.nextSteps,
                      createdAt: ci.createdAt.toISOString(),
                      createdBy: {
                        id: ci.createdBy.id,
                        name: ci.createdBy.name,
                      },
                    }))}
                  />
                </Suspense>
              )}
            </div>
          </PageMain>

          <PageSidebar>
            <InitiativeSidebar
              team={init.team}
              owners={init.owners}
              links={entityLinks}
              entityType='Initiative'
              entityId={init.id}
              teams={teams}
              people={people}
              canEdit={canEdit}
            />
          </PageSidebar>
        </PageContent>
      </PageContainer>
    </InitiativeDetailClient>
  )
}
