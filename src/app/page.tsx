import { prisma } from '@/lib/db'
import Link from 'next/link'
import { Button } from '@/components/ui/button'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { redirect } from 'next/navigation'
import {
  getPendingInvitationsForUser,
  getActiveFeedbackCampaignsForUser,
} from '@/lib/actions'
import { getTasksAssignedToCurrentUser } from '@/lib/actions/task'
import PendingInvitations from '@/components/pending-invitations'
import { ExpandableSection } from '@/components/expandable-section'
import { ActiveFeedbackCampaigns } from '@/components/active-feedback-campaigns'
import { DirectReports } from '@/components/dashboard-direct-reports'
import { OpenInitiatives } from '@/components/dashboard-open-initiatives'
import { AssignedTasks } from '@/components/dashboard-assigned-tasks'
import { Suspense } from 'react'
import { Loading } from '@/components/ui/loading'

export default async function Home() {
  const session = await getServerSession(authOptions)

  if (!session?.user) {
    redirect('/auth/signin')
  }

  // If user doesn't have an organization, show organization creation prompt and pending invitations
  if (!session.user.organizationId) {
    const pendingInvitations = await getPendingInvitationsForUser()

    return (
      <div className='space-y-6'>
        {/* Show pending invitations first if any exist */}
        {pendingInvitations.length > 0 && (
          <PendingInvitations invitations={pendingInvitations} />
        )}

        <div className='card text-center py-12'>
          <h2 className='text-xl font-semibold mb-4'>Welcome to ManagerOS!</h2>
          <p className='text-neutral-400 mb-6'>
            {pendingInvitations.length > 0
              ? 'You can accept one of the invitations above or create a new organization.'
              : "To get started, you'll need to create an organization or be invited to an existing one."}
          </p>
          <div className='flex justify-center gap-4'>
            <Button asChild variant='outline'>
              <Link href='/organization/create'>Create Organization</Link>
            </Button>
            <Button asChild variant='outline'>
              <Link href='/teams'>Browse Teams</Link>
            </Button>
          </div>
        </div>
      </div>
    )
  }

  // First, get all people that the current user manages (directly or indirectly)
  const getAllManagedPeople = async (userId: string): Promise<string[]> => {
    const managedPersonIds: string[] = []

    // Get the current user's person record
    const currentUserPerson = await prisma.person.findFirst({
      where: { user: { id: userId } },
      select: { id: true },
    })

    if (!currentUserPerson) return managedPersonIds

    // Recursive function to find all reports (direct and indirect)
    const findReports = async (managerId: string) => {
      const directReports = await prisma.person.findMany({
        where: { managerId },
        select: { id: true },
      })

      for (const report of directReports) {
        managedPersonIds.push(report.id)
        // Recursively find reports of this report
        await findReports(report.id)
      }
    }

    await findReports(currentUserPerson.id)
    return managedPersonIds
  }

  const managedPersonIds = await getAllManagedPeople(session.user.id)

  const [
    teams,
    directReports,
    openInitiatives,
    recentOneOnes,
    activeCampaigns,
    assignedTasks,
    people,
    recentFeedback,
  ] = await Promise.all([
    // Get teams where the current user is associated (member or manages team members)
    prisma.team.findMany({
      where: {
        organizationId: session.user.organizationId!,
        OR: [
          // User is a member of the team
          {
            people: {
              some: {
                user: {
                  id: session.user.id,
                },
              },
            },
          },
          // User manages someone who is a member of the team (directly or indirectly)
          {
            people: {
              some: {
                id: {
                  in: managedPersonIds,
                },
              },
            },
          },
        ],
      },
      orderBy: { name: 'asc' },
      include: {
        people: true,
        initiatives: true,
        parent: true,
      },
    }),
    // Get direct reports for the logged-in user
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId!,
        manager: {
          user: {
            id: session.user.id,
          },
        },
      },
      orderBy: { name: 'asc' },
      include: {
        team: true,
        reports: true,
      },
    }),
    // Get open initiatives (not done or canceled)
    prisma.initiative.findMany({
      where: {
        organizationId: session.user.organizationId!,
        status: {
          notIn: ['done', 'canceled'],
        },
      },
      orderBy: { updatedAt: 'desc' },
      include: {
        team: true,
        objectives: true,
        _count: { select: { checkIns: true } },
      },
    }),
    // Get recent 1:1s where the logged-in user was either manager or report
    prisma.oneOnOne.findMany({
      where: {
        OR: [
          {
            manager: {
              user: {
                id: session.user.id,
              },
            },
          },
          {
            report: {
              user: {
                id: session.user.id,
              },
            },
          },
        ],
      },
      orderBy: { scheduledAt: 'desc' },
      include: {
        manager: {
          include: {
            user: true,
          },
        },
        report: {
          include: {
            user: true,
          },
        },
      },
    }),
    // Get active feedback campaigns for the current user
    getActiveFeedbackCampaignsForUser(),
    // Get tasks assigned to the current user
    getTasksAssignedToCurrentUser(),
    // Get all people in the organization for the task table
    prisma.person.findMany({
      where: {
        organizationId: session.user.organizationId!,
      },
      orderBy: { name: 'asc' },
    }),
    // Get recent feedback created by or about the current user (that is not private)
    prisma.feedback.findMany({
      where: {
        OR: [
          // Feedback created by the user
          {
            from: {
              user: {
                id: session.user.id,
              },
            },
          },
          // Non-private feedback about the user
          {
            about: {
              user: {
                id: session.user.id,
              },
            },
            isPrivate: false,
          },
        ],
        // Ensure the feedback is in the user's organization
        about: {
          organizationId: session.user.organizationId!,
        },
      },
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
      take: 5, // Limit to 5 most recent
    }),
  ])

  return (
    <div className='page-container'>
      <div className='flex gap-6'>
        {/* Main Content Area */}
        <div className='flex-1 space-y-6'>
          {/* My Tasks Section - only show if there are assigned tasks */}
          {assignedTasks.length > 0 && (
            <ExpandableSection title='My Tasks' viewAllHref='/tasks'>
              <Suspense
                fallback={
                  <div className='flex items-center justify-center py-8'>
                    <Loading size='md' />
                    <span className='ml-2 text-sm text-muted-foreground'>
                      Loading tasks...
                    </span>
                  </div>
                }
              >
                <AssignedTasks assignedTasks={assignedTasks} people={people} />
              </Suspense>
            </ExpandableSection>
          )}

          {/* Active Feedback Campaigns Section - only show if there are active campaigns */}
          {activeCampaigns.length > 0 && (
            <ActiveFeedbackCampaigns
              campaigns={activeCampaigns.map(campaign => ({
                ...campaign,
                status: campaign.status as
                  | 'draft'
                  | 'active'
                  | 'completed'
                  | 'cancelled',
                template: campaign.template
                  ? {
                      id: campaign.template.id,
                      name: campaign.template.name,
                      description: campaign.template.description || undefined,
                    }
                  : null,
                targetPerson: {
                  ...campaign.targetPerson,
                  email: campaign.targetPerson.email || '',
                },
              }))}
            />
          )}

          {/* Recent Feedback Section - only show if there is recent feedback */}
          {recentFeedback.length > 0 && (
            <ExpandableSection title='Recent Feedback' viewAllHref='/people'>
              <div className='space-y-3'>
                {recentFeedback.map(feedback => (
                  <Link
                    key={feedback.id}
                    href={`/people/${feedback.about.id}#feedback`}
                    className='block card hover:bg-accent/50 transition-colors'
                  >
                    <div className='flex items-start justify-between'>
                      <div className='flex-1'>
                        <div className='text-sm font-medium text-card-foreground'>
                          {feedback.kind === 'praise' && '✨ '}
                          {feedback.kind === 'constructive' && '💡 '}
                          {feedback.kind === 'general' && '💬 '}
                          {feedback.body.length > 100
                            ? feedback.body.substring(0, 100) + '...'
                            : feedback.body}
                        </div>
                        <div className='flex items-center gap-2 mt-1'>
                          <span className='text-xs text-muted-foreground'>
                            About{' '}
                            <span className='text-primary'>
                              {feedback.about.name}
                            </span>
                          </span>
                          {feedback.from.id !== feedback.about.id && (
                            <span className='text-xs text-muted-foreground'>
                              • From{' '}
                              <span className='text-primary'>
                                {feedback.from.name}
                              </span>
                            </span>
                          )}
                          <span className='text-xs text-muted-foreground'>
                            •{' '}
                            {new Date(feedback.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      {feedback.isPrivate && (
                        <span className='text-xs text-muted-foreground italic'>
                          Private
                        </span>
                      )}
                    </div>
                  </Link>
                ))}
              </div>
            </ExpandableSection>
          )}

          {/* Open Initiatives Section - only show if there are open initiatives */}
          {openInitiatives.length > 0 && (
            <ExpandableSection
              title='Open Initiatives'
              viewAllHref='/initiatives'
            >
              <Suspense
                fallback={
                  <div className='flex items-center justify-center py-8'>
                    <Loading size='md' />
                    <span className='ml-2 text-sm text-muted-foreground'>
                      Loading initiatives...
                    </span>
                  </div>
                }
              >
                <OpenInitiatives openInitiatives={openInitiatives} />
              </Suspense>
            </ExpandableSection>
          )}

          {/* Middle Section: Other Content */}
          <div className='grid gap-6 md:grid-cols-2'>
            {/* Recent 1:1s Section - only show if there are recent 1:1s */}
            {recentOneOnes.length > 0 && (
              <ExpandableSection title='Recent 1:1s' viewAllHref='/oneonones'>
                {recentOneOnes.map(oneOnOne => (
                  <Link
                    key={oneOnOne.id}
                    href={`/oneonones/${oneOnOne.id}`}
                    className='block card hover:bg-neutral-800/60'
                  >
                    <div className='flex items-center justify-between'>
                      <div>
                        <div className='font-medium'>
                          {oneOnOne.manager?.user?.id === session.user.id ? (
                            <span>
                              With{' '}
                              <span className='hover:text-blue-400'>
                                {oneOnOne.report.name}
                              </span>
                            </span>
                          ) : (
                            <span>
                              With{' '}
                              <span className='hover:text-blue-400'>
                                {oneOnOne.manager.name}
                              </span>
                            </span>
                          )}
                        </div>
                        <div className='text-xs text-neutral-500 mt-1'>
                          {oneOnOne.scheduledAt
                            ? new Date(
                                oneOnOne.scheduledAt
                              ).toLocaleDateString()
                            : 'TBD'}
                        </div>
                      </div>
                      <div className='text-xs text-neutral-500'>
                        {oneOnOne.manager?.user?.id === session.user.id
                          ? 'Manager'
                          : 'Report'}
                      </div>
                    </div>
                  </Link>
                ))}
              </ExpandableSection>
            )}
          </div>
        </div>

        {/* Right Sidebar */}
        <div className='w-80 space-y-6'>
          {/* Teams Section - only show if there are teams */}
          {teams.length > 0 && (
            <ExpandableSection title='Related Teams' viewAllHref='/teams'>
              {teams.map(team => (
                <div
                  key={team.id}
                  className='flex items-center justify-between'
                >
                  <div>
                    <Link
                      href={`/teams/${team.id}`}
                      className='font-medium hover:text-blue-400'
                    >
                      {team.name}
                    </Link>
                    <div className='text-neutral-400 text-sm'>
                      {team.description ?? ''}
                    </div>
                    <div className='text-xs text-neutral-500 mt-1'>
                      {team.people.length} member
                      {team.people.length !== 1 ? 's' : ''} •{' '}
                      {team.initiatives.length} initiative
                      {team.initiatives.length !== 1 ? 's' : ''}
                      {team.parent && (
                        <span>
                          {' '}
                          • Parent:{' '}
                          <Link
                            href={`/teams/${team.parent.id}`}
                            className='hover:text-blue-400'
                          >
                            {team.parent.name}
                          </Link>
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </ExpandableSection>
          )}

          {/* Direct Reports Section - only show if there are direct reports */}
          {directReports.length > 0 && (
            <ExpandableSection
              title='Direct Reports'
              viewAllHref='/direct-reports'
            >
              <Suspense
                fallback={
                  <div className='flex items-center justify-center py-8'>
                    <Loading size='md' />
                    <span className='ml-2 text-sm text-muted-foreground'>
                      Loading reports...
                    </span>
                  </div>
                }
              >
                <DirectReports directReports={directReports} />
              </Suspense>
            </ExpandableSection>
          )}
        </div>
      </div>
    </div>
  )
}
