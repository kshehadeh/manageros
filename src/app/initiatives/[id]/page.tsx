import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiative-detail-client'
import { InitiativeHeader } from '@/components/initiative-header'
import { InitiativeObjectives } from '@/components/initiative-objectives'
import { InitiativeTasks } from '@/components/initiative-tasks'
import { InitiativeCheckIns } from '@/components/initiative-checkins'
import { InitiativeMeetings } from '@/components/initiative-meetings'
import { InitiativeSidebar } from '@/components/initiative-sidebar'
import { Suspense } from 'react'
import { Loading } from '@/components/ui/loading'
import { calculateTaskCompletionPercentage } from '@/lib/completion-utils'

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
  const [init, people, meetings] = await Promise.all([
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
            person: true,
          },
        },
      },
    }),
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId,
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
              summary: init.summary,
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
              <Suspense
                fallback={
                  <div className='page-section'>
                    <div className='flex items-center justify-center py-8'>
                      <Loading size='md' />
                      <span className='ml-2 text-sm text-muted-foreground'>
                        Loading objectives...
                      </span>
                    </div>
                  </div>
                }
              >
                <InitiativeObjectives objectives={init.objectives} />
              </Suspense>

              <Suspense
                fallback={
                  <div className='page-section'>
                    <div className='flex items-center justify-center py-8'>
                      <Loading size='md' />
                      <span className='ml-2 text-sm text-muted-foreground'>
                        Loading tasks...
                      </span>
                    </div>
                  </div>
                }
              >
                <InitiativeTasks
                  initiativeId={init.id}
                  objectives={init.objectives}
                  allTasks={allTasks}
                  people={people}
                />
              </Suspense>

              <Suspense
                fallback={
                  <div className='page-section'>
                    <div className='flex items-center justify-center py-8'>
                      <Loading size='md' />
                      <span className='ml-2 text-sm text-muted-foreground'>
                        Loading meetings...
                      </span>
                    </div>
                  </div>
                }
              >
                <InitiativeMeetings
                  meetings={meetings}
                  initiativeId={init.id}
                />
              </Suspense>

              <Suspense
                fallback={
                  <div className='page-section'>
                    <div className='flex items-center justify-center py-8'>
                      <Loading size='md' />
                      <span className='ml-2 text-sm text-muted-foreground'>
                        Loading check-ins...
                      </span>
                    </div>
                  </div>
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
          <div className='w-full lg:w-80 lg:flex-shrink-0'>
            <InitiativeSidebar
              team={init.team}
              owners={init.owners}
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
            />
          </div>
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
