import { prisma } from '@/lib/db'
import Link from 'next/link'
import { UserLinkForm } from '@/components/user-link-form'
import { FeedbackList } from '@/components/feedback/feedback-list'
import { PersonActionsDropdown } from '@/components/people/person-actions-dropdown'
import { PersonDetailClient } from '@/components/people/person-detail-client'
import { JiraAccountLinker } from '@/components/jira-account-linker'
import { GithubAccountLinker } from '@/components/github-account-linker'
import { GithubPrsActivitySection } from '@/components/github-prs-activity-section'
import { JiraWorkActivitySection } from '@/components/jira-work-activity-section'
import { PersonListItem } from '@/components/people/person-list-item'
import { PersonStatusBadge } from '@/components/people/person-status-badge'
import { PersonFeedbackCampaigns } from '@/components/people/person-feedback-campaigns'
import { PersonSynopsisList } from '@/components/people/person-synopsis-list'
import { PersonAvatar } from '@/components/people/person-avatar'
import { TaskTable } from '@/components/tasks/task-table'
import { InitiativesTable } from '@/components/initiatives/initiatives-table'
import { SectionHeader } from '@/components/ui/section-header'
import { TASK_LIST_SELECT } from '@/lib/task-list-select'
import type { TaskListItem } from '@/lib/task-list-select'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { getPeople } from '@/lib/actions'
import { TASK_STATUS } from '@/lib/task-status'
import { canAccessSynopsesForPerson } from '@/lib/auth-utils'
import {
  Eye,
  Plus,
  Users,
  User as UserIcon,
  Building2,
  CalendarDays,
  Rocket,
  ListTodo,
  MessageCircle,
  FileText,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import {
  Person,
  Team,
  User,
  InitiativeOwner,
  OneOnOne,
  Initiative,
  Feedback,
  FeedbackCampaign,
} from '@prisma/client'
import { FaGithub, FaJira } from 'react-icons/fa'

type PersonWithRelations = Person & {
  team: Team | null
  manager: Person | null
  user: User | null
  reports: (Person & { team: Team | null })[]
  tasks: TaskListItem[]
  initiativeOwners: (InitiativeOwner & {
    initiative: Initiative & {
      team: Team | null
      objectives: Array<{
        id: string
        title: string
        keyResult: string | null
        sortIndex: number
      }>
      owners: Array<{
        personId: string
        role: string
        person: {
          id: string
          name: string
        }
      }>
      _count: {
        checkIns: number
        tasks: number
      }
      tasks: Array<{
        status: string
      }>
    }
  })[]
  oneOnOnes: (OneOnOne & {
    manager: Person
  })[]
  oneOnOnesAsManager: (OneOnOne & {
    report: Person
  })[]
  feedback: (Feedback & {
    about: {
      id: string
      name: string
    }
    from: {
      id: string
      name: string
    }
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
              objectives: {
                select: {
                  id: true,
                  title: true,
                  keyResult: true,
                  sortIndex: true,
                },
                orderBy: { sortIndex: 'asc' },
              },
              owners: {
                include: {
                  person: {
                    select: {
                      id: true,
                      name: true,
                    },
                  },
                },
              },
              _count: {
                select: {
                  checkIns: true,
                  tasks: true,
                },
              },
              tasks: {
                select: {
                  status: true,
                },
              },
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

  // Get teams for the InitiativesTable component
  const teams = await prisma.team.findMany({
    where: {
      organizationId: session.user.organizationId,
    },
    orderBy: { name: 'asc' },
  })

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
                <PersonAvatar
                  name={personWithRelations.name}
                  avatar={personWithRelations.avatar}
                  size='lg'
                />
                <div className='flex items-center gap-3'>
                  <h1 className='page-title'>{personWithRelations.name}</h1>
                  <PersonStatusBadge status={personWithRelations.status} />
                </div>
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

        <div className='flex flex-col lg:flex-row gap-6'>
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
                    <section>
                      <SectionHeader
                        icon={FileText}
                        title='Synopsis'
                        action={
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              title='View All Synopses'
                            >
                              <Link
                                href={`/people/${personWithRelations.id}/synopses`}
                              >
                                <Eye className='w-4 h-4' />
                              </Link>
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              title='Add New Synopsis'
                            >
                              <Link
                                href={`/people/${personWithRelations.id}/synopses/new`}
                              >
                                <Plus className='w-4 h-4' />
                              </Link>
                            </Button>
                          </div>
                        }
                      />
                      <PersonSynopsisList
                        personId={personWithRelations.id}
                        compact={true}
                        canGenerate={canAccessSynopses}
                      />
                    </section>
                  </div>
                )}

                {/* Feedback Section - Only show if there's feedback or user can add feedback */}
                {(visibleFeedback.length > 0 || currentPerson?.id) && (
                  <div className='flex-1 min-w-[300px] max-w-[500px]'>
                    <section id='feedback'>
                      <SectionHeader
                        icon={MessageCircle}
                        title={`Feedback (${visibleFeedback.length})`}
                        action={
                          <div className='flex items-center gap-2'>
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              title='View All Feedback'
                            >
                              <Link
                                href={`/feedback?aboutPersonId=${personWithRelations.id}`}
                              >
                                <Eye className='w-4 h-4' />
                              </Link>
                            </Button>
                            <Button
                              variant='outline'
                              size='sm'
                              asChild
                              title='Add New Feedback'
                            >
                              <Link
                                href={`/people/${personWithRelations.id}/feedback/new`}
                              >
                                <Plus className='w-4 h-4' />
                              </Link>
                            </Button>
                          </div>
                        }
                      />
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
                      <SectionHeader
                        icon={MessageCircle}
                        title={`Feedback Campaigns (${personWithRelations.feedbackCampaigns.length})`}
                        action={
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
                        }
                      />
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
                <SectionHeader
                  icon={Rocket}
                  title={`Owned Initiatives (${personWithRelations.initiativeOwners.length})`}
                />
                <InitiativesTable
                  initiatives={personWithRelations.initiativeOwners.map(
                    ownership => ({
                      ...ownership.initiative,
                      objectives: ownership.initiative.objectives || [],
                      owners: ownership.initiative.owners || [],
                      _count: ownership.initiative._count || {
                        checkIns: 0,
                        tasks: 0,
                      },
                      tasks: ownership.initiative.tasks || [],
                    })
                  )}
                  people={people}
                  teams={teams}
                  hideFilters={true}
                  hideActions={true}
                />
              </section>
            )}

            {/* Active Tasks - Only show if person has active tasks */}
            {personWithRelations.tasks.length > 0 && (
              <section>
                <SectionHeader
                  icon={ListTodo}
                  title={`Active Tasks (${personWithRelations.tasks.length})`}
                />
                <TaskTable
                  tasks={personWithRelations.tasks}
                  people={people}
                  showInitiative={true}
                  showDueDate={true}
                  hideFilters={true}
                />
              </section>
            )}

            {/* 1:1 Meetings - Only show if person has reports or a manager AND has 1:1s */}
            {(personWithRelations.reports.length > 0 ||
              personWithRelations.manager) &&
              (personWithRelations.oneOnOnes.length > 0 ||
                personWithRelations.oneOnOnesAsManager.length > 0) && (
                <section>
                  <SectionHeader icon={MessageCircle} title='1:1 Meetings' />
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
          <div className='w-full lg:w-80 space-y-6'>
            {/* Direct Reports */}
            {personWithRelations.reports.length > 0 && (
              <section>
                <SectionHeader
                  icon={Users}
                  title={`Direct Reports (${personWithRelations.reports.length})`}
                />
                <div className='space-y-3'>
                  {personWithRelations.reports.map(report => (
                    <PersonListItem
                      key={report.id}
                      person={report}
                      showRole={true}
                      showTeam={true}
                    />
                  ))}
                </div>
              </section>
            )}

            {/* User Account Link - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <SectionHeader icon={UserIcon} title='User Linking' />
                <UserLinkForm
                  personId={personWithRelations.id}
                  linkedUser={personWithRelations.user}
                />
              </section>
            )}

            {/* Jira Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <section>
                <SectionHeader icon={FaJira} title='Jira Linking' />
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
                <SectionHeader icon={FaGithub} title='GitHub Linking' />
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
