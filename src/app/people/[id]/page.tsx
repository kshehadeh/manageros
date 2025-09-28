import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { UserLinkForm } from '@/components/user-link-form'
import { FeedbackList } from '@/components/feedback-list'
import { PersonActionsDropdown } from '@/components/person-actions-dropdown'
import { PersonDetailClient } from '@/components/person-detail-client'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { GithubPrsActivitySection } from '@/components/github-prs-activity-section'
import { JiraWorkActivitySection } from '@/components/jira-work-activity-section'
import { PersonListItemCard } from '@/components/person-list-item-card'
import { PersonStatusBadge } from '@/components/person-status-badge'
import { PersonFeedbackCampaigns } from '@/components/person-feedback-campaigns'
import { PersonSynopsis } from '@/components/person-synopsis'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import {
  Eye,
  Users,
  User as UserIcon,
  Building2,
  CalendarDays,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { TaskStatus, taskStatusUtils } from '@/lib/task-status'
import { taskPriorityUtils, type TaskPriority } from '@/lib/task-priority'
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
  FeedbackCampaign,
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
  githubAccount: {
    id: string
    personId: string
    githubUsername: string
    githubDisplayName: string | null
    githubEmail: string | null
    createdAt: Date
    updatedAt: Date
  } | null
  feedbackCampaigns: (FeedbackCampaign & {
    user: {
      id: string
      name: string
      email: string
    }
    template: {
      id: string
      name: string
    } | null
    responses: {
      id: string
      responderEmail: string
      submittedAt: Date | null
    }[]
  })[]
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
      githubAccount: true,
      feedbackCampaigns: {
        where: {
          status: {
            in: ['active', 'draft'],
          },
          userId: session.user.id,
        },
        include: {
          user: {
            select: {
              id: true,
              name: true,
              email: true,
            },
          },
          template: {
            select: {
              id: true,
              name: true,
            },
          },
          responses: {
            select: {
              id: true,
              responderEmail: true,
              submittedAt: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
      },
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

  // Check if user can access synopses for this person
  const canAccessSynopses = await canAccessSynopsesForPerson(
    personWithRelations.id
  )

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
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <h1 className='page-title'>{personWithRelations.name}</h1>
                <PersonStatusBadge status={personWithRelations.status} />
              </div>
              <div className='page-section-subtitle'>
                {personWithRelations.role ?? ''}
              </div>
              <div className='text-xs text-muted-foreground'>
                {personWithRelations.email}
              </div>

              {/* Basic Information with Icons */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                {personWithRelations.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='w-4 h-4' />
                    <Link
                      href={`/teams/${personWithRelations.team.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {personWithRelations.team.name}
                    </Link>
                  </div>
                )}
                {personWithRelations.manager && (
                  <div className='flex items-center gap-1'>
                    <UserIcon className='w-4 h-4' />
                    <Link
                      href={`/people/${personWithRelations.manager.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {personWithRelations.manager.name}
                    </Link>
                  </div>
                )}
                {personWithRelations.startedAt && (
                  <div className='flex items-center gap-1'>
                    <CalendarDays className='w-4 h-4' />
                    <span>
                      Started{' '}
                      {new Date(
                        personWithRelations.startedAt
                      ).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {personWithRelations.reports.length > 0 && (
                  <div className='flex items-center gap-1'>
                    <Users className='w-4 h-4' />
                    <span>
                      {personWithRelations.reports.length} direct report
                      {personWithRelations.reports.length !== 1 ? 's' : ''}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <PersonActionsDropdown
              person={personWithRelations}
              currentPerson={currentPerson}
              isAdmin={isAdmin(session.user)}
            />
          </div>
        </div>

        <div className='flex gap-6'>
          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            {/* Synopsis - Only show if user can access synopses */}
            {canAccessSynopses && (
              <PersonSynopsis
                personId={personWithRelations.id}
                canGenerate={canAccessSynopses}
              />
            )}
            {/* Owned Initiatives - Only show if person has initiatives */}
            {personWithRelations.initiativeOwners.length > 0 && (
              <section>
                <h3 className='font-semibold mb-4'>
                  Owned Initiatives (
                  {personWithRelations.initiativeOwners.length})
                </h3>
                <div className='space-y-3'>
                  {personWithRelations.initiativeOwners.map(ownership => (
                    <Link
                      key={ownership.initiative.id}
                      href={`/initiatives/${ownership.initiative.id}`}
                      className='block border rounded-xl p-3 hover:bg-accent/50 transition-colors'
                    >
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>
                            {ownership.initiative.title}
                          </div>
                          <div className='text-sm text-muted-foreground'>
                            {ownership.initiative.summary && (
                              <ReadonlyNotesField
                                content={ownership.initiative.summary}
                                variant='compact'
                                showEmptyState={false}
                              />
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
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
            )}

            {/* Assigned Tasks - Only show if person has tasks */}
            {personWithRelations.tasks.length > 0 && (
              <section>
                <h3 className='font-semibold mb-4'>
                  Assigned Tasks ({personWithRelations.tasks.length})
                </h3>
                <div className='space-y-3'>
                  {personWithRelations.tasks.slice(0, 5).map(task => (
                    <div key={task.id} className='border rounded-xl p-3'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <div className='font-medium'>{task.title}</div>
                          <div className='text-sm text-muted-foreground'>
                            {task.description && (
                              <ReadonlyNotesField
                                content={task.description}
                                variant='compact'
                                showEmptyState={false}
                              />
                            )}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
                            {task.initiative && (
                              <span>Initiative: {task.initiative.title}</span>
                            )}
                            {task.objective && (
                              <span> • Objective: {task.objective.title}</span>
                            )}
                          </div>
                        </div>
                        <div className='flex items-center gap-2'>
                          <Badge
                            variant={taskStatusUtils.getUIVariant(
                              task.status as TaskStatus
                            )}
                          >
                            {taskStatusUtils
                              .getLabel(task.status as TaskStatus)
                              .toUpperCase()}
                          </Badge>
                          {task.priority && (
                            <Badge
                              variant={taskPriorityUtils.getUIVariant(
                                task.priority as TaskPriority
                              )}
                            >
                              P{task.priority}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                  {personWithRelations.tasks.length > 5 && (
                    <div className='text-center'>
                      <Button asChild variant='ghost' size='sm'>
                        <Link href='/tasks' className='flex items-center gap-1'>
                          <Eye className='w-4 h-4' />
                          View all {personWithRelations.tasks.length} tasks
                        </Link>
                      </Button>
                    </div>
                  )}
                </div>
              </section>
            )}

            {/* Recent Check-ins - Only show if person has check-ins */}
            {personWithRelations.checkIns.length > 0 && (
              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold'>
                    Recent Check-ins ({personWithRelations.checkIns.length})
                  </h3>
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      href='/initiatives'
                      className='flex items-center gap-2'
                    >
                      <Eye className='w-4 h-4' />
                      View All
                    </Link>
                  </Button>
                </div>
                <div className='space-y-3'>
                  {personWithRelations.checkIns.slice(0, 3).map(checkIn => (
                    <div key={checkIn.id} className='border rounded-xl p-3'>
                      <div className='flex items-center justify-between'>
                        <div>
                          <Link
                            href={`/initiatives/${checkIn.initiative.id}`}
                            className='font-medium hover:text-primary transition-colors'
                          >
                            {checkIn.initiative.title}
                          </Link>
                          <div className='text-sm text-muted-foreground'>
                            {checkIn.summary}
                          </div>
                          <div className='text-xs text-muted-foreground mt-1'>
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
            )}

            {/* 1:1 Meetings - Only show if person has reports or a manager AND has 1:1s */}
            {(personWithRelations.reports.length > 0 ||
              personWithRelations.manager) &&
              (personWithRelations.oneOnOnes.length > 0 ||
                personWithRelations.oneOnOnesAsManager.length > 0) && (
                <section>
                  <h3 className='font-semibold mb-4'>1:1 Meetings</h3>
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
                              className='border rounded-xl p-3 mb-2'
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <Link
                                    href={`/people/${oneOnOne.report.id}`}
                                    className='font-medium hover:text-primary transition-colors'
                                  >
                                    {oneOnOne.report.name}
                                  </Link>
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    {oneOnOne.scheduledAt
                                      ? new Date(
                                          oneOnOne.scheduledAt
                                        ).toLocaleDateString()
                                      : 'TBD'}
                                  </div>
                                </div>
                                <Button asChild variant='outline' size='sm'>
                                  <Link href={`/oneonones/${oneOnOne.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}

                    {/* As Report */}
                    {personWithRelations.oneOnOnes.length > 0 && (
                      <div>
                        <div className='text-sm font-medium mb-2'>
                          With Manager ({personWithRelations.oneOnOnes.length})
                        </div>
                        {personWithRelations.oneOnOnes
                          .slice(0, 2)
                          .map(oneOnOne => (
                            <div
                              key={oneOnOne.id}
                              className='border rounded-xl p-3 mb-2'
                            >
                              <div className='flex items-center justify-between'>
                                <div>
                                  <Link
                                    href={`/people/${oneOnOne.manager.id}`}
                                    className='font-medium hover:text-primary transition-colors'
                                  >
                                    {oneOnOne.manager.name}
                                  </Link>
                                  <div className='text-xs text-muted-foreground mt-1'>
                                    {oneOnOne.scheduledAt
                                      ? new Date(
                                          oneOnOne.scheduledAt
                                        ).toLocaleDateString()
                                      : 'TBD'}
                                  </div>
                                </div>
                                <Button asChild variant='outline' size='sm'>
                                  <Link href={`/oneonones/${oneOnOne.id}`}>
                                    View
                                  </Link>
                                </Button>
                              </div>
                            </div>
                          ))}
                      </div>
                    )}
                  </div>
                </section>
              )}

            {/* Feedback Section - Only show if there's feedback or user can add feedback */}
            {(visibleFeedback.length > 0 || currentPerson?.id) && (
              <section id='feedback'>
                <FeedbackList
                  person={personWithRelations}
                  feedback={visibleFeedback}
                  currentUserId={currentPerson?.id}
                />
              </section>
            )}

            {/* Feedback Campaigns Section - Only show if there are active or draft campaigns */}
            {personWithRelations.feedbackCampaigns.length > 0 && (
              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-semibold'>
                    Feedback Campaigns (
                    {personWithRelations.feedbackCampaigns.length})
                  </h3>
                  <Button asChild variant='outline' size='sm'>
                    <Link
                      href={`/people/${personWithRelations.id}/feedback-campaigns`}
                      className='flex items-center gap-2'
                    >
                      <Eye className='w-4 h-4' />
                      View All
                    </Link>
                  </Button>
                </div>
                <PersonFeedbackCampaigns
                  campaigns={personWithRelations.feedbackCampaigns}
                />
              </section>
            )}

            {/* Jira Work Activity - Show if person has Jira account and work activity */}
            {personWithRelations.jiraAccount && (
              <JiraWorkActivitySection
                personId={personWithRelations.id}
                personName={personWithRelations.name}
                hasJiraAccount={!!personWithRelations.jiraAccount}
              />
            )}

            {/* GitHub PR Activity - Show if person has GitHub account and PR activity */}
            {personWithRelations.githubAccount && (
              <GithubPrsActivitySection
                personId={personWithRelations.id}
                personName={personWithRelations.name}
                hasGithubAccount={!!personWithRelations.githubAccount}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className='w-80 space-y-6'>
            {/* Direct Reports */}
            {personWithRelations.reports.length > 0 && (
              <section>
                <h3 className='font-semibold mb-4'>
                  Direct Reports ({personWithRelations.reports.length})
                </h3>
                <div className='space-y-3'>
                  {personWithRelations.reports.map(report => (
                    <PersonListItemCard
                      key={report.id}
                      person={report}
                      variant='simple'
                      showActions={true}
                      currentPerson={currentPerson}
                      isAdmin={isAdmin(session.user)}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* User Account Link - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <h3 className='font-semibold mb-4'>User Linking</h3>
                <UserLinkForm
                  personId={personWithRelations.id}
                  linkedUser={personWithRelations.user}
                />
              </section>
            )}

            {/* Jira Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <h3 className='font-semibold mb-4'>Jira Linking</h3>
                <JiraAccountLinker
                  personId={personWithRelations.id}
                  personName={personWithRelations.name}
                  personEmail={personWithRelations.email}
                  jiraAccount={personWithRelations.jiraAccount}
                />
              </section>
            )}

            {/* GitHub Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <h3 className='font-semibold mb-4'>GitHub Linking</h3>
                <GithubAccountLinker
                  personId={personWithRelations.id}
                  personName={personWithRelations.name}
                  githubAccount={personWithRelations.githubAccount}
                />
              </section>
            )}
          </div>
        </div>
      </div>
    </PersonDetailClient>
  )
}
