import { Link } from '@/components/ui/link'
import { PersonAvatarWrapper } from './person-avatar-wrapper'
import { PersonActionsDropdown } from './person-actions-dropdown'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import {
  CalendarDays,
  User as UserIcon,
  Building2,
  Briefcase,
} from 'lucide-react'
import { Suspense } from 'react'
import type { User, Person as PrismaPerson, Team } from '@prisma/client'
import type { Prisma } from '@prisma/client'

// Use Prisma's generated type based on the includes used in getPersonById
export type PersonWithDetailRelations = Prisma.PersonGetPayload<{
  include: {
    team: true
    manager: {
      include: {
        reports: true
      }
    }
    reports: true
    jobRole: {
      include: {
        level: true
        domain: true
      }
    }
    user: {
      select: {
        id: true
        name: true
        email: true
        role: true
      }
    }
    jiraAccount: true
    githubAccount: true
  }
}> & {
  level: number // Add level field for compatibility with Person type
}

// Import skeleton components
import {
  OverviewSectionSkeleton,
  FeedbackCampaignsSectionSkeleton,
  FeedbackSectionSkeleton,
  OwnedInitiativesSectionSkeleton,
  ActiveTasksSectionSkeleton,
  OneOnOneMeetingsSectionSkeleton,
  DirectReportsSectionSkeleton,
  AccountLinkingSectionSkeleton,
  JobRoleSectionSkeleton,
} from './person-detail-skeletons'

// Import section components
import { OverviewSection } from './sections/overview-section'
import { FeedbackCampaignsSection } from './sections/feedback-campaigns-section'
import { FeedbackSection } from './sections/feedback-section'
import { OwnedInitiativesSection } from './sections/owned-initiatives-section'
import { ActiveTasksSection } from './sections/active-tasks-section'
import { OneOnOneMeetingsSection } from './sections/one-on-one-meetings-section'
import { DirectReportsSection } from './sections/direct-reports-section'
import { AccountLinkingSection } from './sections/account-linking-section'
import { JobRoleSection } from './sections/job-role-section'
import { GithubMetricsSection } from '@/components/github-metrics-section'
import { JiraMetricsSection } from '@/components/jira-metrics-section'
import { PersonStatusBadge } from './person-status-badge'

interface PersonDetailContentProps {
  person: PersonWithDetailRelations
  linkedAvatars?: {
    jiraAvatar?: string | null
    githubAvatar?: string | null
  } | null
  isAdmin: boolean
  currentPersonId?: string | null
  organizationId: string
  currentUserId: string
}

export function PersonDetailContent({
  person,
  linkedAvatars,
  isAdmin,
  currentPersonId,
  organizationId,
  currentUserId,
}: PersonDetailContentProps) {
  return (
    <PageContainer>
      <PageHeader
        title={
          <div className='flex flex-row items-center gap-sm leading-none'>
            {person.name}
            <PersonStatusBadge status={person.status} size='sm' />
          </div>
        }
        iconComponent={
          <PersonAvatarWrapper
            personId={person.id}
            personName={person.name}
            currentAvatar={person.avatar || null}
            jiraAvatar={linkedAvatars?.jiraAvatar}
            githubAvatar={linkedAvatars?.githubAvatar}
            isAdmin={isAdmin}
          />
        }
        subtitle={
          <>
            <div className='flex items-center gap-4'>
              <div className='page-section-subtitle'>
                {person.jobRole?.title ?? person.role ?? ''}
              </div>
              <div className='flex items-center gap-4 text-sm text-muted-foreground'>
                {person.team && (
                  <div className='flex items-center gap-1'>
                    <Building2 className='w-4 h-4' />
                    <Link
                      href={`/teams/${person.team.id}`}
                      className='hover:text-highlight transition-colors'
                    >
                      {person.team.name}
                    </Link>
                  </div>
                )}
                {person.employeeType && (
                  <div className='flex items-center gap-1'>
                    <Briefcase className='w-4 h-4' />
                    <span>
                      {person.employeeType === 'FULL_TIME' && 'Full Time'}
                      {person.employeeType === 'PART_TIME' && 'Part Time'}
                      {person.employeeType === 'INTERN' && 'Intern'}
                      {person.employeeType === 'CONSULTANT' && 'Consultant'}
                    </span>
                  </div>
                )}
              </div>
            </div>
            <div className='text-xs text-muted-foreground'>{person.email}</div>

            {/* Basic Information with Icons */}
            <div className='flex flex-wrap items-center gap-4 mt-3 text-sm text-muted-foreground'>
              {person.manager && (
                <div className='flex items-center gap-1'>
                  <UserIcon className='w-4 h-4' />
                  <Link
                    href={`/people/${person.manager.id}`}
                    className='hover:text-highlight transition-colors'
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
          </>
        }
        actions={
          <PersonActionsDropdown
            person={
              person as unknown as PrismaPerson & {
                team?: Team | null
                reports?: PrismaPerson[]
                manager?: PrismaPerson | null
              }
            }
            currentPersonId={currentPersonId}
            isAdmin={isAdmin}
          />
        }
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Feedback Campaigns Section */}
            <Suspense fallback={<FeedbackCampaignsSectionSkeleton />}>
              <FeedbackCampaignsSection
                personId={person.id}
                organizationId={organizationId}
                currentUserId={currentUserId}
              />
            </Suspense>

            {/* Feedback Section */}
            <Suspense fallback={<FeedbackSectionSkeleton />}>
              <FeedbackSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* Owned Initiatives */}
            <Suspense fallback={<OwnedInitiativesSectionSkeleton />}>
              <OwnedInitiativesSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* Active Tasks */}
            <Suspense fallback={<ActiveTasksSectionSkeleton />}>
              <ActiveTasksSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* 1:1 Meetings */}
            <Suspense fallback={<OneOnOneMeetingsSectionSkeleton />}>
              <OneOnOneMeetingsSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* Jira Metrics - Show if person has Jira account */}
            {Boolean(person.jiraAccount) && (
              <JiraMetricsSection personId={person.id} hasJiraAccount={true} />
            )}

            {/* GitHub Metrics - Show if person has GitHub account */}
            {Boolean(person.githubAccount) && (
              <GithubMetricsSection
                personId={person.id}
                hasGithubAccount={true}
              />
            )}
          </div>
        </PageMain>

        <PageSidebar>
          <div className='space-y-6'>
            {/* Overview Section */}
            <Suspense fallback={<OverviewSectionSkeleton />}>
              <OverviewSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* Job Role Section */}
            <Suspense fallback={<JobRoleSectionSkeleton />}>
              <JobRoleSection
                personId={person.id}
                personName={person.name}
                currentJobRole={person.jobRole}
              />
            </Suspense>

            {/* Direct Reports */}
            <Suspense fallback={<DirectReportsSectionSkeleton />}>
              <DirectReportsSection
                personId={person.id}
                organizationId={organizationId}
              />
            </Suspense>

            {/* Account Linking - Only show for admins */}
            {isAdmin && (
              <Suspense fallback={<AccountLinkingSectionSkeleton />}>
                <AccountLinkingSection
                  personId={person.id}
                  personName={person.name}
                  personEmail={person.email}
                  linkedUser={person.user as User | null}
                  jiraAccount={person.jiraAccount}
                  githubAccount={person.githubAccount}
                />
              </Suspense>
            )}
          </div>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
