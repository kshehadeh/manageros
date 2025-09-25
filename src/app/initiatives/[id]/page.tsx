import { prisma } from '@/lib/db'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { InitiativeDetailClient } from '@/components/initiative-detail-client'
import { InitiativeHeader } from '@/components/initiative-header'
import { InitiativeObjectives } from '@/components/initiative-objectives'
import { InitiativeTasks } from '@/components/initiative-tasks'
import { InitiativeCheckIns } from '@/components/initiative-checkins'
import { Suspense } from 'react'
import { Loading } from '@/components/ui/loading'

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
  const [init, people] = await Promise.all([
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

  if (!init) return <div>Not found</div>

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <div className='page-container'>
        <InitiativeHeader initiative={init} />

        <Suspense
          fallback={
            <div className='page-section'>
              <div className='card'>
                <div className='flex items-center justify-center py-8'>
                  <Loading size='md' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Loading objectives...
                  </span>
                </div>
              </div>
            </div>
          }
        >
          <InitiativeObjectives objectives={init.objectives} />
        </Suspense>

        <Suspense
          fallback={
            <div className='page-section'>
              <div className='card'>
                <div className='flex items-center justify-center py-8'>
                  <Loading size='md' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Loading tasks...
                  </span>
                </div>
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
              <div className='card'>
                <div className='flex items-center justify-center py-8'>
                  <Loading size='md' />
                  <span className='ml-2 text-sm text-muted-foreground'>
                    Loading check-ins...
                  </span>
                </div>
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
    </InitiativeDetailClient>
  )
}
