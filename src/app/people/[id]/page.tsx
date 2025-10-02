import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Rag } from '@/components/rag'
import { UserLinkForm } from '@/components/user-link-form'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { PersonActionsDropdown } from '@/components/people/person-actions-dropdown'
import { PersonDetailClient } from '@/components/people/person-detail-client'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { GithubPrsActivitySection } from '@/components/github-prs-activity-section'
import { JiraWorkActivitySection } from '@/components/jira-work-activity-section'
import { PersonListItemCard } from '@/components/people/person-list-item-card'
import { PersonStatusBadge } from '@/components/people/person-status-badge'
import { PersonFeedbackCampaigns } from '@/components/people/person-feedback-campaigns'
import { PersonSynopsis } from '@/components/people/person-synopsis'
import { TaskTable } from '@/components/tasks/task-table'
import { TASK_LIST_SELECT } from '@/lib/task-list-select'
import type { TaskListItem } from '@/lib/task-list-select'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPeople } from '@/lib/actions'
import { TASK_STATUS } from '@/lib/task-status'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import { ReadonlyNotesField } from '@/components/readonly-notes-field'
import {
  Eye,
  Plus,
  Users,
  User as UserIcon,
  Building2,
  CalendarDays,
  Rocket,
  ListTodo,
  CheckCircle,
  MessageCircle,
} from 'lucide-react'
import { FaJira, FaGithub } from 'react-icons/fa'
import { Button } from '@/components/ui/button'
import {
  Person,
  Team,
  User,
  InitiativeOwner,
  OneOnOne,
  CheckIn,
  Initiative,
  Feedback,
  FeedbackCampaign,
} from '@prisma/client'

type PersonWithRelations = Person & {
  team: Team | null
  manager: Person | null
  user: User | null
  reports: (Person & { team: Team | null })[]
  tasks: TaskListItem[]
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
        select: TASK_LIST_SELECT,
        where: {
          status: {
            notIn: [TASK_STATUS.DONE, TASK_STATUS.DROPPED],
          },
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

  // Get people data for TaskTable
  const people = await getPeople()

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
                {personWithRelations.birthday && (
                  <div className='flex items-center gap-1'>
                    <CalendarDays className='w-4 h-4' />
                    <span>
                      Birthday{' '}
                      {personWithRelations.birthday.toLocaleDateString(
                        'en-US',
                        {
                          year: 'numeric',
                          month: 'numeric',
                          day: 'numeric',
                        }
                      )}
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
            {/* Synopsis, Feedback, and Feedback Campaigns Side by Side */}
            {(canAccessSynopses ||
              visibleFeedback.length > 0 ||
              currentPerson?.id ||
              personWithRelations.feedbackCampaigns.length > 0) && (
              <div className='flex flex-wrap gap-6'>
                {/* Synopsis - Only show if user can access synopses */}
                {canAccessSynopses && (
                  <div className='flex-1 min-w-[300px] max-w-[500px]'>
                    <PersonSynopsis
                      personId={personWithRelations.id}
                      canGenerate={canAccessSynopses}
                    />
                  </div>
                )}

                {/* Feedback Section - Only show if there's feedback or user can add feedback */}
                {(visibleFeedback.length > 0 || currentPerson?.id) && (
                  <div className='flex-1 min-w-[300px] max-w-[500px]'>
                    <section id='feedback'>
                      <FeedbackList
                        person={personWithRelations}
                        feedback={visibleFeedback}
                        currentUserId={currentPerson?.id}
                      />
                    </section>
                  </div>
                )}

                {/* Feedback Campaigns Section - Only show if there are active or draft campaigns */}
                {personWithRelations.feedbackCampaigns.length > 0 && (
                  <div className='flex-1 min-w-[300px] max-w-[500px]'>
                    <section>
                      <div className='flex items-center justify-between mb-4 pb-3 border-b border-border'>
                        <h3 className='font-bold flex items-center gap-2'>
                          <MessageCircle className='w-4 h-4' />
                          Feedback Campaigns (
                          {personWithRelations.feedbackCampaigns.length})
                        </h3>
                        <div className='flex items-center gap-2'>
                          <Button
                            asChild
                            variant='outline'
                            size='sm'
                            title='View All Feedback Campaigns'
                          >
                            <Link
                              href={`/people/${personWithRelations.id}/feedback-campaigns`}
                            >
                              <Eye className='w-4 h-4' />
                            </Link>
                          </Button>
                          <Button
                            asChild
                            variant='outline'
                            size='sm'
                            title='Create New Feedback Campaign'
                          >
                            <Link
                              href={`/people/${personWithRelations.id}/feedback-campaigns/new`}
                            >
                              <Plus className='w-4 h-4' />
                            </Link>
                          </Button>
                        </div>
                      </div>
                      <PersonFeedbackCampaigns
                        campaigns={personWithRelations.feedbackCampaigns}
                      />
                    </section>
                  </div>
                )}
              </div>
            )}

            {/* Owned Initiatives - Only show if person has initiatives */}
            {personWithRelations.initiativeOwners.length > 0 && (
              <section>
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <Rocket className='w-4 h-4' />
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

            {/* Active Tasks - Only show if person has active tasks */}
            {personWithRelations.tasks.length > 0 && (
              <section>
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <ListTodo className='w-4 h-4' />
                  Active Tasks ({personWithRelations.tasks.length})
                </h3>
                <TaskTable
                  tasks={personWithRelations.tasks}
                  people={people}
                  showInitiative={true}
                  showDueDate={true}
                  hideFilters={true}
                />
              </section>
            )}

            {/* Recent Check-ins - Only show if person has check-ins */}
            {personWithRelations.checkIns.length > 0 && (
              <section>
                <div className='flex items-center justify-between mb-4'>
                  <h3 className='font-bold flex items-center gap-2'>
                    <CheckCircle className='w-4 h-4' />
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
                  <h3 className='font-bold mb-4 flex items-center gap-2'>
                    <MessageCircle className='w-4 h-4' />
                    1:1 Meetings
                  </h3>
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
                          1:1 Meetings ({personWithRelations.oneOnOnes.length})
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
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <Users className='w-4 h-4' />
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
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <UserIcon className='w-4 h-4' />
                  User Linking
                </h3>
                <UserLinkForm
                  personId={personWithRelations.id}
                  linkedUser={personWithRelations.user}
                />
              </section>
            )}

            {/* Jira Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <FaJira className='w-4 h-4' />
                  Jira Linking
                </h3>
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
                <h3 className='font-bold mb-4 flex items-center gap-2'>
                  <FaGithub className='w-4 h-4' />
                  GitHub Linking
                </h3>
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
