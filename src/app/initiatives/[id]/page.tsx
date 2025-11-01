import { prisma } from '@/lib/db'
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
  const [init, people, meetings, notes, teams] = await Promise.all([
    prisma.initiative.findFirst({
      where: {
        id,
        organizationId: session.user.organizationId,
      },
      include: {
        objectives: true,
        tasks: {
          include: {
            assignee: true,
            createdBy: true,
            objective: true,
            initiative: true,
          },
          orderBy: { createdAt: 'desc' },
        },
        checkIns: {
          orderBy: { createdAt: 'desc' },
          include: {
            createdBy: true,
          },
        },
        team: true,
        owners: {
          include: {
            person: {
              include: {
                team: true,
                jobRole: {
                  include: {
                    level: true,
                    domain: true,
                  },
                },
                manager: {
                  include: {
                    reports: true,
                  },
                },
                reports: true,
              },
            },
          },
        },
      },
    }),
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      include: {
        team: true,
        jobRole: {
          include: {
            level: true,
            domain: true,
          },
        },
        manager: {
          include: {
            reports: true,
          },
        },
        reports: true,
      },
      orderBy: { name: 'asc' },
    }),
    prisma.meeting.findMany({
      where: {
        initiativeId: id,
        organizationId: session.user.organizationId,
      },
      include: {
        team: true,
        initiative: true,
        owner: true,
        createdBy: true,
        participants: {
          include: {
            person: true,
          },
        },
      },
      orderBy: { scheduledAt: 'asc' },
    }),
    getNotesForEntity('Initiative', id),
    prisma.team.findMany({
      where: {
        organizationId: session.user.organizationId,
      },
      orderBy: { name: 'asc' },
    }),
  ])

  // Get all tasks associated with this initiative (both direct and through objectives)
  const allTasks = await prisma.task.findMany({
    where: {
      OR: [{ initiativeId: id }, { objective: { initiativeId: id } }],
    },
    include: {
      assignee: true,
      createdBy: true,
      objective: true,
      initiative: true,
    },
    orderBy: { createdAt: 'desc' },
  })

  // Get entity links for this initiative
  const entityLinks = await prisma.entityLink.findMany({
    where: {
      entityType: 'Initiative',
      entityId: id,
      organizationId: session.user.organizationId,
    },
    include: {
      createdBy: {
        select: {
          id: true,
          name: true,
          email: true,
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })

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
            </div>
          </div>

          {/* Right Sidebar - Full width on mobile, fixed width on desktop */}
          <div className='w-full lg:w-80 lg:shrink-0'>
            <InitiativeSidebar
              team={init.team}
              owners={init.owners.map(owner => ({
                ...owner,
                person: {
                  ...owner.person,
                  level: 0, // Default level
                  team: owner.person.team
                    ? {
                        id: owner.person.team.id,
                        name: owner.person.team.name,
                      }
                    : null,
                  jobRole: owner.person.jobRole
                    ? {
                        id: owner.person.jobRole.id,
                        title: owner.person.jobRole.title,
                        level: owner.person.jobRole.level
                          ? {
                              id: owner.person.jobRole.level.id,
                              name: owner.person.jobRole.level.name,
                            }
                          : { id: '', name: '' },
                        domain: owner.person.jobRole.domain
                          ? {
                              id: owner.person.jobRole.domain.id,
                              name: owner.person.jobRole.domain.name,
                            }
                          : { id: '', name: '' },
                      }
                    : null,
                  manager: owner.person.manager
                    ? {
                        id: owner.person.manager.id,
                        name: owner.person.manager.name,
                        email: owner.person.manager.email,
                        role: owner.person.manager.role,
                        status: owner.person.manager.status,
                        birthday: owner.person.manager.birthday,
                        reports: owner.person.manager.reports || [],
                      }
                    : null,
                  reports: owner.person.reports || [],
                },
              }))}
              links={entityLinks.map(link => ({
                id: link.id,
                url: link.url,
                title: link.title,
                description: link.description,
                createdAt: link.createdAt,
                updatedAt: link.updatedAt,
                createdBy: link.createdBy,
              }))}
              entityType='Initiative'
              entityId={init.id}
              teams={teams}
              people={people.map(person => ({
                ...person,
                level: 0, // Default level
                team: person.team
                  ? {
                      id: person.team.id,
                      name: person.team.name,
                    }
                  : null,
                jobRole: person.jobRole
                  ? {
                      id: person.jobRole.id,
                      title: person.jobRole.title,
                      level: person.jobRole.level
                        ? {
                            id: person.jobRole.level.id,
                            name: person.jobRole.level.name,
                          }
                        : { id: '', name: '' },
                      domain: person.jobRole.domain
                        ? {
                            id: person.jobRole.domain.id,
                            name: person.jobRole.domain.name,
                          }
                        : { id: '', name: '' },
                    }
                  : null,
                manager: person.manager
                  ? {
                      id: person.manager.id,
                      name: person.manager.name,
                      email: person.manager.email,
                      role: person.manager.role,
                      status: person.manager.status,
                      birthday: person.manager.birthday,
                      reports: person.manager.reports || [],
                    }
                  : null,
                reports: person.reports.map(report => ({
                  id: report.id,
                  name: report.name,
                  email: report.email,
                  role: report.role,
                  status: report.status,
                  birthday: report.birthday,
                })),
              }))}
            />
          </div>
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
