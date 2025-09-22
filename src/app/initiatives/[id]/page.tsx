import { prisma } from '@/lib/db'
import { Rag } from '@/components/rag'
import Link from 'next/link'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { CheckInList } from '@/components/checkin-list'
import { InitiativeDetailClient } from '@/components/initiative-detail-client'
import { InitiativeQuickTaskForm } from '@/components/initiative-quick-task-form'
import { InitiativeActionsDropdown } from '@/components/initiative-actions-dropdown'
import { TaskCard } from '@/components/task-card'
import { taskStatusUtils, type TaskStatus } from '@/lib/task-status'

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
  const init = await prisma.initiative.findFirst({
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
  })

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

  const priorityVariants = {
    1: 'error' as const,
    2: 'warning' as const,
    3: 'neutral' as const,
    4: 'success' as const,
    5: 'success' as const,
  }

  return (
    <InitiativeDetailClient initiativeTitle={init.title} initiativeId={init.id}>
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-center justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='page-title'>{init.title}</h1>
                <div className='flex items-center gap-2'>
                  <Rag rag={init.rag} />
                  <span className='badge'>{init.confidence}%</span>
                </div>
              </div>
              {init.summary && <p className='page-subtitle'>{init.summary}</p>}

              {/* Team and Owner Details */}
              <div className='space-y-2 mt-4'>
                {init.team && (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Team:
                    </span>
                    <Link
                      href={`/teams/${init.team.id}`}
                      className='link-hover'
                    >
                      {init.team.name}
                    </Link>
                  </div>
                )}

                {init.owners.length > 0 && (
                  <div className='flex items-center gap-2'>
                    <span className='text-sm font-medium text-muted-foreground'>
                      Owners:
                    </span>
                    <div className='flex items-center gap-2'>
                      {init.owners.map((owner, index) => (
                        <span
                          key={owner.person.id}
                          className='flex items-center gap-1'
                        >
                          <Link
                            href={`/people/${owner.person.id}`}
                            className='link-hover'
                          >
                            {owner.person.name}
                          </Link>
                          <span className='text-xs text-muted-foreground'>
                            ({owner.role})
                          </span>
                          {index < init.owners.length - 1 && (
                            <span className='text-muted-foreground'>,</span>
                          )}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Action Buttons */}
            <InitiativeActionsDropdown initiativeId={init.id} />
          </div>
        </div>

        <div className='page-section'>
          <div className='card'>
            <h3 className='font-semibold mb-3'>Objectives & Key Results</h3>
            <div className='space-y-4'>
              {init.objectives.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No objectives yet.
                </div>
              ) : (
                init.objectives
                  .sort((a, b) => a.sortIndex - b.sortIndex)
                  .map(objective => (
                    <div
                      key={objective.id}
                      className='border border-border rounded-lg p-4'
                    >
                      <div className='space-y-2'>
                        <h4 className='font-medium text-sm'>
                          {objective.title}
                        </h4>
                        {objective.keyResult && (
                          <div className='text-sm text-muted-foreground'>
                            <span className='font-medium'>Key Result:</span>{' '}
                            {objective.keyResult}
                          </div>
                        )}
                      </div>
                    </div>
                  ))
              )}
            </div>
          </div>
        </div>

        <div className='page-section'>
          <div className='card'>
            <div className='flex items-center justify-between mb-3'>
              <h3 className='font-semibold'>Tasks</h3>
            </div>

            <div className='mb-4'>
              <InitiativeQuickTaskForm
                initiativeId={init.id}
                objectives={init.objectives}
              />
            </div>

            <div className='space-y-3'>
              {allTasks.length === 0 ? (
                <div className='text-muted-foreground text-sm'>
                  No tasks yet.
                </div>
              ) : (
                allTasks.map(task => (
                  <TaskCard
                    key={task.id}
                    task={task}
                    statusVariant={taskStatusUtils.getUIVariant(
                      task.status as TaskStatus
                    )}
                    priorityVariant={
                      priorityVariants[
                        task.priority as keyof typeof priorityVariants
                      ]
                    }
                  />
                ))
              )}
            </div>
          </div>
        </div>

        <div className='page-section'>
          <div className='card'>
            <CheckInList
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
          </div>
        </div>
      </div>
    </InitiativeDetailClient>
  )
}
