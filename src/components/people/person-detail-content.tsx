import { Link } from '@/components/ui/link'
import { PersonAvatarWrapper } from './person-avatar-wrapper'
import { PersonActionsDropdown } from './person-actions-dropdown'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { CalendarDays, Users, Briefcase, ArrowUpRight } from 'lucide-react'
import { PersonViewDropdown } from './person-view-dropdown'
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
  FeedbackCampaignsSectionSkeleton,
  FeedbackSectionSkeleton,
  OwnedInitiativesSectionSkeleton,
  ActiveTasksSectionSkeleton,
  OneOnOneMeetingsSectionSkeleton,
  DirectReportsSectionSkeleton,
  JobRoleSectionSkeleton,
} from './person-detail-skeletons'

// Import section components
import { FeedbackCampaignsSection } from './sections/feedback-campaigns-section'
import { FeedbackSection } from './sections/feedback-section'
import { OwnedInitiativesSection } from './sections/owned-initiatives-section'
import { ActiveTasksSection } from './sections/active-tasks-section'
import { OneOnOneMeetingsSection } from './sections/one-on-one-meetings-section'
import { DirectReportsSection } from './sections/direct-reports-section'
import { JobRoleSection } from './sections/job-role-section'
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
  // Build subtitle items array for dot-separated display
  const subtitleItems = [
    // Job role/title
    (person.jobRole?.title ?? person.role) ? (
      <span key='role' className='font-medium text-foreground'>
        {person.jobRole ? (
          <Link
            href={`/job-roles/${person.jobRole.id}`}
            className='hover:text-highlight transition-colors'
          >
            {person.jobRole.title}
          </Link>
        ) : (
          person.role
        )}
      </span>
    ) : null,

    // Team
    person.team ? (
      <span key='team' className='flex items-center gap-1 whitespace-nowrap'>
        <Users className='w-3.5 h-3.5' />
        <Link
          href={`/teams/${person.team.id}`}
          className='hover:text-highlight transition-colors'
        >
          {person.team.name}
        </Link>
      </span>
    ) : null,

    // Employee type
    person.employeeType ? (
      <span key='type' className='flex items-center gap-1 whitespace-nowrap'>
        <Briefcase className='w-3.5 h-3.5' />
        <span>
          {person.employeeType === 'FULL_TIME' && 'Full Time'}
          {person.employeeType === 'PART_TIME' && 'Part Time'}
          {person.employeeType === 'INTERN' && 'Intern'}
          {person.employeeType === 'CONSULTANT' && 'Consultant'}
        </span>
      </span>
    ) : null,

    // Email
    <span key='email'>{person.email}</span>,

    // Manager
    person.manager ? (
      <span key='manager' className='flex items-center gap-1 whitespace-nowrap'>
        <ArrowUpRight className='w-3.5 h-3.5' />
        <Link
          href={`/people/${person.manager.id}`}
          className='hover:text-highlight transition-colors'
        >
          {person.manager.name}
        </Link>
      </span>
    ) : null,

    // Start date
    person.startedAt ? (
      <span key='started' className='flex items-center gap-1 whitespace-nowrap'>
        <CalendarDays className='w-3.5 h-3.5' />
        Started {new Date(person.startedAt).toLocaleDateString()}
      </span>
    ) : null,

    // Birthday
    person.birthday ? (
      <span
        key='birthday'
        className='flex items-center gap-1 whitespace-nowrap'
      >
        <CalendarDays className='w-3.5 h-3.5' />
        Birthday{' '}
        {person.birthday.toLocaleDateString('en-US', {
          year: 'numeric',
          month: 'numeric',
          day: 'numeric',
        })}
      </span>
    ) : null,
  ].filter(Boolean)

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
          <div className='flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-muted-foreground'>
            {subtitleItems.map((item, index) => (
              <span key={index} className='flex items-center gap-2'>
                {index > 0 && (
                  <span className='text-muted-foreground/50'>·</span>
                )}
                {item}
              </span>
            ))}
          </div>
        }
        actions={
          <div className='flex items-center gap-2'>
            <PersonViewDropdown personId={person.id} />
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
              linkedUser={person.user as User | null}
              jiraAccount={person.jiraAccount}
              githubAccount={person.githubAccount}
              size='sm'
            />
          </div>
        }
      />

      <PageContent>
        <PageMain>
          <div className='flex gap-lg flex-wrap space-y-6'>
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
          </div>

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
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
