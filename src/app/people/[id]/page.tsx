import { prisma } from '@/lib/db'
import Link from 'next/link'
import { PersonActionsDropdown } from '@/components/people/person-actions-dropdown'
import { PersonDetailClient } from '@/components/people/person-detail-client'
import { GithubPrsActivitySection } from '@/components/github-prs-activity-section'
import { JiraWorkActivitySection } from '@/components/jira-work-activity-section'
import { PersonStatusBadge } from '@/components/people/person-status-badge'
import { PersonAvatar } from '@/components/people/person-avatar'
import { notFound } from 'next/navigation'
import { getServerSession } from 'next-auth'
import { authOptions, isAdmin } from '@/lib/auth'
import { redirect } from 'next/navigation'
import { Suspense } from 'react'
import { User as UserIcon, Building2, CalendarDays } from 'lucide-react'
import type { User } from '@prisma/client'

// Import skeleton components
import {
  SynopsisSectionSkeleton,
  FeedbackSectionSkeleton,
  FeedbackCampaignsSectionSkeleton,
  OwnedInitiativesSectionSkeleton,
  ActiveTasksSectionSkeleton,
  OneOnOneMeetingsSectionSkeleton,
  DirectReportsSectionSkeleton,
  UserLinkingSectionSkeleton,
  JiraLinkingSectionSkeleton,
  GithubLinkingSectionSkeleton,
} from '@/components/people/person-detail-skeletons'

// Import section components
import { SynopsisSection } from '@/components/people/sections/synopsis-section'
import { FeedbackSection } from '@/components/people/sections/feedback-section'
import { FeedbackCampaignsSection } from '@/components/people/sections/feedback-campaigns-section'
import { OwnedInitiativesSection } from '@/components/people/sections/owned-initiatives-section'
import { ActiveTasksSection } from '@/components/people/sections/active-tasks-section'
import { OneOnOneMeetingsSection } from '@/components/people/sections/one-on-one-meetings-section'
import { DirectReportsSection } from '@/components/people/sections/direct-reports-section'
import { UserLinkingSection } from '@/components/people/sections/user-linking-section'
import { JiraLinkingSection } from '@/components/people/sections/jira-linking-section'
import { GithubLinkingSection } from '@/components/people/sections/github-linking-section'

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
      jiraAccount: true,
      githubAccount: true,
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

  return (
    <PersonDetailClient personName={person.name} personId={person.id}>
      <div className='page-container'>
        <div className='page-header'>
          <div className='flex items-start justify-between'>
            <div className='flex-1'>
              <div className='flex items-center gap-3 mb-2'>
                <PersonAvatar
                  name={person.name}
                  avatar={person.avatar}
                  size='lg'
                />
                <div className='flex items-center gap-3'>
                  <h1 className='page-title'>{person.name}</h1>
                  <PersonStatusBadge status={person.status} />
                </div>
              </div>
              <div className='page-section-subtitle'>{person.role ?? ''}</div>
              <div className='text-xs text-muted-foreground'>
                {person.email}
              </div>

              {/* Basic Information with Icons */}
              <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
                {person.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='w-4 h-4' />
                    <Link
                      href={`/teams/${person.team.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {person.team.name}
                    </Link>
                  </div>
                )}
                {person.manager && (
                  <div className='flex items-center gap-1'>
                    <UserIcon className='w-4 h-4' />
                    <Link
                      href={`/people/${person.manager.id}`}
                      className='hover:text-primary transition-colors'
                    >
                      {person.manager.name}
                    </Link>
                  </div>
                )}
                {person.startedAt && (
                  <div className='flex items-center gap-1'>
                    <CalendarDays className='w-4 h-4' />
                    <span>
                      Started {new Date(person.startedAt).toLocaleDateString()}
                    </span>
                  </div>
                )}
                {person.birthday && (
                  <div className='flex items-center gap-1'>
                    <CalendarDays className='w-4 h-4' />
                    <span>
                      Birthday{' '}
                      {person.birthday.toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'numeric',
                        day: 'numeric',
                      })}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <PersonActionsDropdown
              person={person}
              currentPerson={currentPerson}
              isAdmin={isAdmin(session.user)}
            />
          </div>
        </div>

        <div className='flex flex-col lg:flex-row gap-6'>
          {/* Main Content */}
          <div className='flex-1 space-y-6'>
            {/* Feedback and Feedback Campaigns Side by Side */}
            <div className='flex flex-wrap gap-6'>
              {/* Feedback Section */}
              <Suspense fallback={<FeedbackSectionSkeleton />}>
                <FeedbackSection personId={person.id} person={person} />
              </Suspense>

              {/* Feedback Campaigns Section */}
              <Suspense fallback={<FeedbackCampaignsSectionSkeleton />}>
                <FeedbackCampaignsSection personId={person.id} />
              </Suspense>
            </div>

            {/* Owned Initiatives */}
            <Suspense fallback={<OwnedInitiativesSectionSkeleton />}>
              <OwnedInitiativesSection personId={person.id} />
            </Suspense>

            {/* Active Tasks */}
            <Suspense fallback={<ActiveTasksSectionSkeleton />}>
              <ActiveTasksSection personId={person.id} />
            </Suspense>

            {/* 1:1 Meetings */}
            <Suspense fallback={<OneOnOneMeetingsSectionSkeleton />}>
              <OneOnOneMeetingsSection personId={person.id} />
            </Suspense>

            {/* Jira Work Activity - Show if person has Jira account */}
            {person.jiraAccount && (
              <JiraWorkActivitySection
                personId={person.id}
                personName={person.name}
                hasJiraAccount={!!person.jiraAccount}
              />
            )}

            {/* GitHub PR Activity - Show if person has GitHub account */}
            {person.githubAccount && (
              <GithubPrsActivitySection
                personId={person.id}
                personName={person.name}
                hasGithubAccount={!!person.githubAccount}
              />
            )}
          </div>

          {/* Right Sidebar */}
          <div className='w-full lg:w-80 space-y-6'>
            {/* Synopsis Section */}
            <Suspense fallback={<SynopsisSectionSkeleton />}>
              <SynopsisSection personId={person.id} />
            </Suspense>

            {/* Direct Reports */}
            <Suspense fallback={<DirectReportsSectionSkeleton />}>
              <DirectReportsSection personId={person.id} />
            </Suspense>

            {/* User Account Link - Only show for admins */}
            {isAdmin(session.user) && (
              <Suspense fallback={<UserLinkingSectionSkeleton />}>
                <UserLinkingSection
                  personId={person.id}
                  linkedUser={person.user as User | null}
                />
              </Suspense>
            )}

            {/* Jira Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <Suspense fallback={<JiraLinkingSectionSkeleton />}>
                <JiraLinkingSection
                  personId={person.id}
                  personName={person.name}
                  personEmail={person.email}
                  jiraAccount={person.jiraAccount}
                />
              </Suspense>
            )}

            {/* GitHub Integration - Only show for admins */}
            {isAdmin(session.user) && (
              <Suspense fallback={<GithubLinkingSectionSkeleton />}>
                <GithubLinkingSection
                  personId={person.id}
                  personName={person.name}
                  githubAccount={person.githubAccount}
                />
              </Suspense>
            )}
          </div>
        </div>
      </div>
    </PersonDetailClient>
  )
}
