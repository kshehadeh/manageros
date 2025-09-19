import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { UserLinkForm } from '@/components/user-link-form'
import { FeedbackList } from '@/components/feedback-list'
import { PersonActionPanel } from '@/components/person-action-panel'
import { PersonDetailClient } from '@/components/person-detail-client'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { JiraWorkActivity } from '@/components/jira-work-activity'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { EditIconButton } from '@/components/edit-icon-button'
import { Eye } from 'lucide-react'
import {
  Person,
  Team,
  User,
  Task,
  InitiativeOwner,
  OneOnOne,
  CheckIn,
  Initiative,
  Objective,
  Feedback,
} from '@prisma/client'

type PersonWithRelations = Person & {
  team: Team | null
  manager: Person | null
  user: User | null
  reports: (Person & { team: Team | null })[]
  tasks: (Task & {
    initiative: Initiative | null
    objective: Objective | null
  })[]
  initiativeOwners: (InitiativeOwner & {
    initiative: Initiative & {
      team: Team | null
    }
  })[]
  oneOnOnes: (OneOnOne & {
    manager: Person
  })[]
  oneOnOnesAsManager: (OneOnOne & {
    report: Person
  })[]
  checkIns: (CheckIn & {
    initiative: Initiative
  })[]
  feedback: (Feedback & {
    about: Person
    from: Person
  })[]
  jiraAccount: {
    id: string
    personId: string
    jiraAccountId: string
    jiraEmail: string
    jiraDisplayName: string | null
    createdAt: Date
    updatedAt: Date
  } | null
}

interface PersonDetailPageProps {
  params: Promise<{
    id: string
  }>
}

export default async function PersonDetailPage({
  params,
}: PersonDetailPageProps) {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  const { id } = await params

  if (!session.user.organizationId) {
    redirect('/organization/create')
  }

  const person = await prisma.person.findFirst({
    where: {
      id,
      organizationId: session.user.organizationId,
    },
    include: {
      team: true,
      manager: true,
      user: {
        select: {
          id: true,
          name: true,
          email: true,
          role: true,
        },
      },
      reports: {
        include: {
          team: true,
        },
        orderBy: { name: 'asc' },
      },
      tasks: {
        include: {
          initiative: true,
          objective: true,
        },
        orderBy: { updatedAt: 'desc' },
      },
      initiativeOwners: {
        include: {
          initiative: {
            include: {
              team: true,
            },
          },
        },
        orderBy: { initiative: { updatedAt: 'desc' } },
      },
      oneOnOnes: {
        include: {
          manager: true,
        },
        orderBy: { scheduledAt: 'desc' },
      },
      oneOnOnesAsManager: {
        include: {
          report: true,
        },
        orderBy: { scheduledAt: 'desc' },
      },
      checkIns: {
        include: {
          initiative: true,
        },
        orderBy: { createdAt: 'desc' },
      },
      feedback: {
        include: {
          about: {
            select: {
              id: true,
              name: true,
            },
          },
          from: {
            select: {
              id: true,
              name: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
      jiraAccount: true,
    },
  })

  if (!person) {
    notFound()
  }

  // Get the current user's person record to determine relationships
  const currentPerson = await prisma.person.findFirst({
    where: {
      user: {
        id: session.user.id,
      },
    },
  })

  const personWithRelations = person as PersonWithRelations

  // Filter feedback based on privacy rules
  // Only show feedback that is either:
  // 1. Not private (public feedback)
  // 2. Private feedback written by the current user
  const visibleFeedback = personWithRelations.feedback.filter(
    feedback => !feedback.isPrivate || feedback.fromId === currentPerson?.id
  )

  return (
    <PersonDetailClient
      personName={personWithRelations.name}
      personId={personWithRelations.id}
    >
      <div className='space-y-6'>
        <div className='flex items-center justify-between'>
          <div>
            <h2 className='text-lg font-semibold'>
              {personWithRelations.name}
            </h2>
            <div className='text-sm text-neutral-400'>
              {personWithRelations.role ?? ''}
            </div>
            <div className='text-xs text-neutral-500'>
              {personWithRelations.email}
            </div>
          </div>
          <div className='flex items-center gap-2'>
            <span
              className={`badge ${
                personWithRelations.status === 'active'
                  ? 'rag-green'
                  : personWithRelations.status === 'inactive'
                    ? 'rag-red'
                    : 'rag-amber'
              }`}
            >
              {personWithRelations.status.replace('_', ' ')}
            </span>
            {isAdmin(session.user) && (
              <EditIconButton
                href={`/people/${personWithRelations.id}/edit`}
                variant='outline'
                size='default'
              />
            )}
            <PersonActionPanel
              person={personWithRelations}
              currentPerson={currentPerson}
              isAdmin={isAdmin(session.user)}
            />
            <Link href='/people' className='btn flex items-center gap-2'>
              <Eye className='w-4 h-4' />
              Back to People
            </Link>
          </div>
        </div>

        <div className='space-y-6'>
          {/* Basic Information and Direct Reports */}
          {personWithRelations.reports.length > 0 ? (
            <div className='grid gap-6 md:grid-cols-2'>
              {/* Basic Information */}
              <section className='card'>
                <h3 className='font-semibold mb-4'>Basic Information</h3>
                <div className='space-y-3'>
                  <div>
                    <span className='text-sm font-medium'>Team:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.team ? (
                        <Link
                          href={`/teams/${personWithRelations.team.id}`}
                          className='hover:text-blue-400'
                        >
                          {personWithRelations.team.name}
                        </Link>
                      ) : (
                        'No team assigned'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>Manager:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.manager ? (
                        <Link
                          href={`/people/${personWithRelations.manager.id}`}
                          className='hover:text-blue-400'
                        >
                          {personWithRelations.manager.name}
                        </Link>
                      ) : (
                        'No manager assigned'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>User Account:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.user ? (
                        <div>
                          <div className='font-medium'>
                            {personWithRelations.user.name}
                          </div>
                          <div className='text-xs text-neutral-500'>
                            {personWithRelations.user.email} -{' '}
                            {personWithRelations.user.role}
                          </div>
                        </div>
                      ) : (
                        'No user account linked'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>Start Date:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.startedAt
                        ? new Date(
                            personWithRelations.startedAt
                          ).toLocaleDateString()
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>Reports:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.reports.length} direct report
                      {personWithRelations.reports.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </section>

              {/* Direct Reports */}
              <section className='card'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold'>
                    Direct Reports ({personWithRelations.reports.length})
                  </h3>
                </div>
                <div className='space-y-3'>
                  {personWithRelations.reports.map(report => (
                    <div
                      key={report.id}
                      className='border border-neutral-800 rounded-xl p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <Link
                            href={`/people/${report.id}`}
                            className='font-medium hover:text-blue-400'
                          >
                            {report.name}
                          </Link>
                          <div className='text-sm text-neutral-400'>
                            {report.role ?? ''}
                          </div>
                          <div className='text-xs text-neutral-500'>
                            {report.email}
                          </div>
                          {report.team && (
                            <div className='text-xs text-neutral-500 mt-1'>
                              Team: {report.team.name}
                            </div>
                          )}
                        </div>
                        <div className='flex items-center gap-2'>
                          <span
                            className={`badge ${
                              report.status === 'active'
                                ? 'rag-green'
                                : report.status === 'inactive'
                                  ? 'rag-red'
                                  : 'rag-amber'
                            }`}
                          >
                            {report.status.replace('_', ' ')}
                          </span>
                          {isAdmin(session.user) && (
                            <EditIconButton
                              href={`/people/${report.id}/edit`}
                              variant='outline'
                              size='sm'
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>
            </div>
          ) : (
            /* Basic Information - Full width when no direct reports */
            <section className='card'>
              <h3 className='font-semibold mb-4'>Basic Information</h3>
              <div className='grid gap-6 md:grid-cols-2'>
                <div className='space-y-3'>
                  <div>
                    <span className='text-sm font-medium'>Team:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.team ? (
                        <Link
                          href={`/teams/${personWithRelations.team.id}`}
                          className='hover:text-blue-400'
                        >
                          {personWithRelations.team.name}
                        </Link>
                      ) : (
                        'No team assigned'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>Manager:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.manager ? (
                        <Link
                          href={`/people/${personWithRelations.manager.id}`}
                          className='hover:text-blue-400'
                        >
                          {personWithRelations.manager.name}
                        </Link>
                      ) : (
                        'No manager assigned'
                      )}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>User Account:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.user ? (
                        <div>
                          <div className='font-medium'>
                            {personWithRelations.user.name}
                          </div>
                          <div className='text-xs text-neutral-500'>
                            {personWithRelations.user.email} -{' '}
                            {personWithRelations.user.role}
                          </div>
                        </div>
                      ) : (
                        'No user account linked'
                      )}
                    </div>
                  </div>
                </div>
                <div className='space-y-3'>
                  <div>
                    <span className='text-sm font-medium'>Start Date:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.startedAt
                        ? new Date(
                            personWithRelations.startedAt
                          ).toLocaleDateString()
                        : 'Not specified'}
                    </div>
                  </div>
                  <div>
                    <span className='text-sm font-medium'>Reports:</span>
                    <div className='text-sm text-neutral-400'>
                      {personWithRelations.reports.length} direct report
                      {personWithRelations.reports.length !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            </section>
          )}

          {/* Owned Initiatives - Only show if person has initiatives */}
          {personWithRelations.initiativeOwners.length > 0 && (
            <div className='grid gap-6 md:grid-cols-2'>
              <section className='card'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold'>
                    Owned Initiatives (
                    {personWithRelations.initiativeOwners.length})
                  </h3>
                </div>
                <div className='space-y-3'>
                  {personWithRelations.initiativeOwners.map(ownership => (
                    <Link
                      key={ownership.initiative.id}
                      href={`/initiatives/${ownership.initiative.id}`}
                      className='block border border-neutral-800 rounded-xl p-3 hover:bg-neutral-800/60'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>
                            {ownership.initiative.title}
                          </div>
                          <div className='text-sm text-neutral-400'>
                            {ownership.initiative.summary ?? ''}
                          </div>
                          <div className='text-xs text-neutral-500 mt-1'>
                            Role: {ownership.role} • Team:{' '}
                            {ownership.initiative.team?.name || 'No team'}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Rag rag={ownership.initiative.rag} />
                          <span className='badge'>
                            {ownership.initiative.confidence}%
                          </span>
                        </div>
                      </div>
                    </Link>
                  ))}
                </div>
              </section>

              {/* Assigned Tasks - Only show if person has tasks */}
              {personWithRelations.tasks.length > 0 && (
                <section className='card'>
                  <div className='flex items-center justify-between mb-4'>
                    <h3 className='font-semibold'>
                      Assigned Tasks ({personWithRelations.tasks.length})
                    </h3>
                  </div>
                  <div className='space-y-3'>
                    {personWithRelations.tasks.slice(0, 5).map(task => (
                      <div
                        key={task.id}
                        className='border border-neutral-800 rounded-xl p-3'
                      >
                        <div className='flex items-center justify-between'>
                          <div>
                            <div className='font-medium'>{task.title}</div>
                            <div className='text-sm text-neutral-400'>
                              {task.description ?? ''}
                            </div>
                            <div className='text-xs text-neutral-500 mt-1'>
                              {task.initiative && (
                                <span>Initiative: {task.initiative.title}</span>
                              )}
                              {task.objective && (
                                <span>
                                  {' '}
                                  • Objective: {task.objective.title}
                                </span>
                              )}
                            </div>
                          </div>
                          <div className='flex items-center gap-2'>
                            <span
                              className={`badge ${
                                task.status === 'done'
                                  ? 'rag-green'
                                  : task.status === 'doing'
                                    ? 'rag-amber'
                                    : task.status === 'blocked'
                                      ? 'rag-red'
                                      : 'badge'
                              }`}
                            >
                              {task.status.replace('_', ' ')}
                            </span>
                            {task.priority && (
                              <span className='badge'>P{task.priority}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    {personWithRelations.tasks.length > 5 && (
                      <div className='text-center'>
                        <Link
                          href='/tasks'
                          className='text-sm text-blue-400 hover:text-blue-300 flex items-center gap-1 justify-center'
                        >
                          <Eye className='w-4 h-4' />
                          View all {personWithRelations.tasks.length} tasks
                        </Link>
                      </div>
                    )}
                  </div>
                </section>
              )}
            </div>
          )}

          {/* Recent Check-ins - Only show if person has check-ins */}
          {personWithRelations.checkIns.length > 0 && (
            <div className='grid gap-6 md:grid-cols-2'>
              <section className='card'>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold'>
                    Recent Check-ins ({personWithRelations.checkIns.length})
                  </h3>
                  <Link
                    href='/initiatives'
                    className='btn text-sm flex items-center gap-2'
                  >
                    <Eye className='w-4 h-4' />
                    View All
                  </Link>
                </div>
                <div className='space-y-3'>
                  {personWithRelations.checkIns.slice(0, 3).map(checkIn => (
                    <div
                      key={checkIn.id}
                      className='border border-neutral-800 rounded-xl p-3'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <Link
                            href={`/initiatives/${checkIn.initiative.id}`}
                            className='font-medium hover:text-blue-400'
                          >
                            {checkIn.initiative.title}
                          </Link>
                          <div className='text-sm text-neutral-400'>
                            {checkIn.summary}
                          </div>
                          <div className='text-xs text-neutral-500 mt-1'>
                            Week of{' '}
                            {new Date(checkIn.weekOf).toLocaleDateString()}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Rag rag={checkIn.rag} />
                          <span className='badge'>{checkIn.confidence}%</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </section>

              {/* 1:1 Meetings - Only show if person has reports or a manager AND has 1:1s */}
              {(personWithRelations.reports.length > 0 ||
                personWithRelations.manager) &&
                (personWithRelations.oneOnOnes.length > 0 ||
                  personWithRelations.oneOnOnesAsManager.length > 0) && (
                  <section className='card'>
                    <div className='flex items-center justify-between mb-4'>
                      <h3 className='font-semibold'>1:1 Meetings</h3>
                    </div>
                    <div className='space-y-3'>
                      {/* As Manager */}
                      {personWithRelations.oneOnOnesAsManager.length > 0 && (
                        <div>
                          <div className='text-sm font-medium mb-2'>
                            As Manager (
                            {personWithRelations.oneOnOnesAsManager.length})
                          </div>
                          {personWithRelations.oneOnOnesAsManager
                            .slice(0, 2)
                            .map(oneOnOne => (
                              <div
                                key={oneOnOne.id}
                                className='border border-neutral-800 rounded-xl p-3 mb-2'
                              >
                                <div className='flex items-center justify-between'>
                                  <div>
                                    <Link
                                      href={`/people/${oneOnOne.report.id}`}
                                      className='font-medium hover:text-blue-400'
                                    >
                                      {oneOnOne.report.name}
                                    </Link>
                                    <div className='text-xs text-neutral-500 mt-1'>
                                      {oneOnOne.scheduledAt
                                        ? new Date(
                                            oneOnOne.scheduledAt
                                          ).toLocaleDateString()
                                        : 'TBD'}
                                    </div>
                                  </div>
                                  <Link
                                    href='/oneonones'
                                    className='btn text-sm'
                                  >
                                    Edit
                                  </Link>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}

                      {/* As Report */}
                      {personWithRelations.oneOnOnes.length > 0 && (
                        <div>
                          <div className='text-sm font-medium mb-2'>
                            With Manager ({personWithRelations.oneOnOnes.length}
                            )
                          </div>
                          {personWithRelations.oneOnOnes
                            .slice(0, 2)
                            .map(oneOnOne => (
                              <div
                                key={oneOnOne.id}
                                className='border border-neutral-800 rounded-xl p-3 mb-2'
                              >
                                <div className='flex items-center justify-between'>
                                  <div>
                                    <Link
                                      href={`/people/${oneOnOne.manager.id}`}
                                      className='font-medium hover:text-blue-400'
                                    >
                                      {oneOnOne.manager.name}
                                    </Link>
                                    <div className='text-xs text-neutral-500 mt-1'>
                                      {oneOnOne.scheduledAt
                                        ? new Date(
                                            oneOnOne.scheduledAt
                                          ).toLocaleDateString()
                                        : 'TBD'}
                                    </div>
                                  </div>
                                  <Link
                                    href='/oneonones'
                                    className='btn text-sm'
                                  >
                                    Edit
                                  </Link>
                                </div>
                              </div>
                            ))}
                        </div>
                      )}
                    </div>
                  </section>
                )}
            </div>
          )}

          {/* Person Statistics - Only show if there are any statistics */}
          {(personWithRelations.reports.length > 0 ||
            personWithRelations.initiativeOwners.length > 0 ||
            personWithRelations.tasks.length > 0 ||
            personWithRelations.checkIns.length > 0) && (
            <section className='card'>
              <h3 className='font-semibold mb-4'>Statistics</h3>
              <div className='grid grid-cols-2 md:grid-cols-4 gap-4'>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {personWithRelations.reports.length}
                  </div>
                  <div className='text-sm text-neutral-400'>Direct Reports</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {personWithRelations.initiativeOwners.length}
                  </div>
                  <div className='text-sm text-neutral-400'>
                    Owned Initiatives
                  </div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {personWithRelations.tasks.length}
                  </div>
                  <div className='text-sm text-neutral-400'>Assigned Tasks</div>
                </div>
                <div className='text-center'>
                  <div className='text-2xl font-bold'>
                    {personWithRelations.checkIns.length}
                  </div>
                  <div className='text-sm text-neutral-400'>Check-ins</div>
                </div>
              </div>
            </section>
          )}

          {/* Feedback Section - Only show if there's feedback or user can add feedback */}
          {(visibleFeedback.length > 0 || currentPerson?.id) && (
            <section className='card'>
              <FeedbackList
                person={personWithRelations}
                feedback={visibleFeedback}
                currentUserId={currentPerson?.id}
              />
            </section>
          )}

          {/* User Account Linking - Only show for admins */}
          {isAdmin(session.user) && (
            <section className='card'>
              <UserLinkForm
                personId={personWithRelations.id}
                linkedUser={personWithRelations.user}
              />
            </section>
          )}

          {/* Jira Integration - Only show for admins */}
          {isAdmin(session.user) && (
            <section className='card'>
              <JiraAccountLinker
                personId={personWithRelations.id}
                personName={personWithRelations.name}
                personEmail={personWithRelations.email}
                jiraAccount={personWithRelations.jiraAccount}
              />
            </section>
          )}

          {/* Jira Work Activity - Show if person has Jira account */}
          {personWithRelations.jiraAccount && (
            <section className='card'>
              <JiraWorkActivity
                personId={personWithRelations.id}
                personName={personWithRelations.name}
                hasJiraAccount={!!personWithRelations.jiraAccount}
              />
            </section>
          )}
        </div>
      </div>
    </PersonDetailClient>
  )
}
