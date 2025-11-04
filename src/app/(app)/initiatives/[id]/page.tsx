import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiatives/initiative-detail-client'
import { InitiativeHeader } from '@/components/initiatives/initiative-header'
import { InitiativeObjectives } from '@/components/initiatives/initiative-objectives'
import { InitiativeTasks } from '@/components/initiatives/initiative-tasks'
import { InitiativeCheckIns } from '@/components/initiatives/initiative-checkins'
import { InitiativeMeetings } from '@/components/initiatives/initiative-meetings'
import { InitiativeSidebar } from '@/components/initiatives/initiative-sidebar'
import { NotesSection } from '@/components/notes/notes-section'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
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
import { FileText } from 'lucide-react'

export default async function InitiativeDetail({
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

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <div className='space-y-6'>
        {/* Header - Full Width */}
        <div className='px-4 lg:px-6'>
          <InitiativeHeader
            initiative={{
              id: init.id,
              title: init.title,
              rag: init.rag,
              completionRate: completionRate,
            }}
          />
        </div>

        {/* Main Content and Sidebar */}
        <div className='flex flex-col lg:flex-row gap-6 px-4 lg:px-6'>
          {/* Main Content */}
          <div className='flex-1 min-w-0'>
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
          </div>

          {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
          <div className='w-full lg:w-80 lg:shrink-0'>
            <InitiativeSidebar
              team={init.team}
              owners={init.owners}
              links={entityLinks}
              entityType='Initiative'
              entityId={init.id}
              teams={teams}
              people={people}
            />
          </div>
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
