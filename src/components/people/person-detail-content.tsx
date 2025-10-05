import Link from 'next/link'
import { PersonAvatarWrapper } from './person-avatar-wrapper'
import { PersonStatusBadge } from './person-status-badge'
import { PersonActionsDropdown } from './person-actions-dropdown'
import { CalendarDays, User as UserIcon, Building2 } from 'lucide-react'
import { Suspense } from 'react'
import type { User, Person as PrismaPerson, Team } from '@prisma/client'
import { Person } from '@/types/person'

// Type for person with all the relations needed by PersonDetailContent
type PersonWithDetailRelations = Person & {
  avatar?: string | null
  startedAt?: Date | null
  jiraAccount?: unknown
  githubAccount?: unknown
}

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
} from './person-detail-skeletons'

// Import section components
import { SynopsisSection } from './sections/synopsis-section'
import { FeedbackSection } from './sections/feedback-section'
import { FeedbackCampaignsSection } from './sections/feedback-campaigns-section'
import { OwnedInitiativesSection } from './sections/owned-initiatives-section'
import { ActiveTasksSection } from './sections/active-tasks-section'
import { OneOnOneMeetingsSection } from './sections/one-on-one-meetings-section'
import { DirectReportsSection } from './sections/direct-reports-section'
import { UserLinkingSection } from './sections/user-linking-section'
import { JiraLinkingSection } from './sections/jira-linking-section'
import { GithubLinkingSection } from './sections/github-linking-section'
import { GithubPrsActivitySection } from '@/components/github-prs-activity-section'
import { JiraWorkActivitySection } from '@/components/jira-work-activity-section'

interface PersonDetailContentProps {
  person: PersonWithDetailRelations
  linkedAvatars?: {
    jiraAvatar?: string | null
    githubAvatar?: string | null
  } | null
  isAdmin: boolean
  currentPerson?: PersonWithDetailRelations
}

export function PersonDetailContent({
  person,
  linkedAvatars,
  isAdmin,
  currentPerson,
}: PersonDetailContentProps) {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <PersonAvatarWrapper
                personId={person.id}
                personName={person.name}
                currentAvatar={person.avatar || null}
                jiraAvatar={linkedAvatars?.jiraAvatar}
                githubAvatar={linkedAvatars?.githubAvatar}
                isAdmin={isAdmin}
              />
              <div className='flex items-center gap-3'>
                <h1 className='page-title'>{person.name}</h1>
                <PersonStatusBadge status={person.status} />
              </div>
            </div>
            <div className='page-section-subtitle'>{person.role ?? ''}</div>
            <div className='text-xs text-muted-foreground'>{person.email}</div>

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
            person={
              person as unknown as PrismaPerson & {
                team?: Team | null
                reports?: PrismaPerson[]
                manager?: PrismaPerson | null
              }
            }
            currentPerson={currentPerson as unknown as PrismaPerson | null}
            isAdmin={isAdmin}
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
              <FeedbackSection
                personId={person.id}
                person={person as unknown as PrismaPerson}
              />
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
          {Boolean(person.jiraAccount) && (
            <JiraWorkActivitySection
              personId={person.id}
              personName={person.name}
              hasJiraAccount={true}
            />
          )}

          {/* GitHub PR Activity - Show if person has GitHub account */}
          {Boolean(person.githubAccount) && (
            <GithubPrsActivitySection
              personId={person.id}
              personName={person.name}
              hasGithubAccount={true}
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
          {isAdmin && (
            <Suspense fallback={<UserLinkingSectionSkeleton />}>
              <UserLinkingSection
                personId={person.id}
                linkedUser={person.user as User | null}
              />
            </Suspense>
          )}

          {/* Jira Integration - Only show for admins */}
          {isAdmin && (
            <Suspense fallback={<JiraLinkingSectionSkeleton />}>
              <JiraLinkingSection
                personId={person.id}
                personName={person.name}
                personEmail={person.email}
                jiraAccount={
                  person.jiraAccount as unknown as {
                    id: string
                    personId: string
                    jiraAccountId: string
                    jiraEmail: string
                    jiraDisplayName: string | null
                    createdAt: Date
                    updatedAt: Date
                  } | null
                }
              />
            </Suspense>
          )}

          {/* GitHub Integration - Only show for admins */}
          {isAdmin && (
            <Suspense fallback={<GithubLinkingSectionSkeleton />}>
              <GithubLinkingSection
                personId={person.id}
                personName={person.name}
                githubAccount={
                  person.githubAccount as unknown as {
                    id: string
                    personId: string
                    githubUsername: string
                    githubDisplayName: string | null
                    githubEmail: string | null
                    createdAt: Date
                    updatedAt: Date
                  } | null
                }
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  )
}
