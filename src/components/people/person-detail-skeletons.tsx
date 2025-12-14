import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import {
  Handshake,
  MessageCircle,
  Rocket,
  ListTodo,
  Users,
  Briefcase,
  Link as LinkIcon,
  Sparkles,
  ClipboardList,
} from 'lucide-react'
import { FaGithub, FaJira } from 'react-icons/fa'

export function PersonDetailHeaderSkeleton() {
  return (
    <div className='page-container'>
      <div className='page-header'>
        <div className='flex items-start justify-between'>
          <div className='flex-1'>
            <div className='flex items-center gap-3 mb-2'>
              <Skeleton className='h-16 w-16 rounded-full' />
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-48' />
                <Skeleton className='h-6 w-20' />
              </div>
            </div>
            <Skeleton className='h-5 w-32 mb-2' />
            <Skeleton className='h-4 w-40' />

            {/* Basic Information with Icons */}
            <div className='flex flex-wrap items-center gap-4 mt-3'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-28' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-20' />
            </div>
          </div>
          <Skeleton className='h-8 w-8' />
        </div>
      </div>
    </div>
  )
}

export function OverviewSectionSkeleton() {
  return (
    <PageSection>
      <SectionHeader
        icon={Sparkles}
        title='AI Overview'
        action={<Skeleton className='h-8 w-8 rounded-md' />}
      />
      <div className='space-y-3 mt-2'>
        <div className='space-y-2'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
        </div>
        <Skeleton className='h-3 w-32' />
      </div>
    </PageSection>
  )
}

export function FeedbackCampaignsSectionSkeleton() {
  return (
    <div className='flex-1 min-w-[300px] max-w-[500px]'>
      <PageSection
        header={
          <SectionHeader
            icon={MessageCircle}
            title='Feedback 360 (0)'
            action={
              <div className='flex items-center gap-2'>
                <Skeleton className='h-8 w-8 rounded-md' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            }
          />
        }
      >
        <div className='border rounded-lg p-3 space-y-2'>
          {/* Campaign name */}
          <Skeleton className='h-5 w-48' />
          {/* Person name */}
          <Skeleton className='h-4 w-32' />
          {/* Campaign details */}
          <div className='flex items-center gap-4 pt-1'>
            <Skeleton className='h-3 w-24' />
            <div className='flex items-center gap-1'>
              <Skeleton className='h-3 w-3 rounded-full' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
          {/* Status badge area */}
          <div className='flex justify-end pt-1'>
            <Skeleton className='h-5 w-16 rounded-full' />
          </div>
        </div>
      </PageSection>
    </div>
  )
}

export function OnboardingSectionSkeleton() {
  return (
    <PageSection
      className='flex-1 min-w-[300px]'
      header={<SectionHeader icon={ClipboardList} title='Onboarding' />}
    >
      <div className='border rounded-lg p-4 space-y-4'>
        <div className='flex items-start justify-between'>
          <div className='space-y-1'>
            <Skeleton className='h-5 w-40' />
            <Skeleton className='h-4 w-24' />
          </div>
          <Skeleton className='h-5 w-20 rounded-full' />
        </div>
        <Skeleton className='h-2 w-full' />
        <div className='flex gap-2'>
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='h-5 w-16 rounded-full' />
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
      </div>
    </PageSection>
  )
}

export function FeedbackSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={MessageCircle}
          title='Recent Feedback'
          action={<Skeleton className='h-8 w-20 rounded-md' />}
        />
      }
    >
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-start gap-3 py-3 first:pt-0'>
            <div className='flex-1 min-w-0'>
              {/* Kind label and private badge */}
              <div className='flex items-center gap-2 mb-1'>
                <Skeleton className='h-3 w-16 rounded' />
                <Skeleton className='h-4 w-12 rounded-full' />
              </div>
              {/* Feedback body (truncated) */}
              <Skeleton className='h-4 w-full mb-1' />
              <Skeleton className='h-4 w-3/4 mb-2' />
              {/* Metadata: From name, bullet, time ago */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-24 rounded' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-20 rounded' />
              </div>
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function OwnedInitiativesSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Rocket}
          title='Owned Initiatives'
          action={<Skeleton className='h-8 w-20 rounded-md' />}
        />
      }
    >
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className='flex items-center justify-between py-3 first:pt-0'
          >
            <div className='flex-1 min-w-0'>
              {/* Initiative title */}
              <Skeleton className='h-4 w-48 mb-1' />
              {/* Status badge, RAG circle, team, updated date */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-3 w-3 rounded-full' />
                <Skeleton className='h-3 w-24 rounded' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-28 rounded' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 rounded-md shrink-0' />
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function ActiveTasksSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={ListTodo}
          title='Active Tasks'
          action={<Skeleton className='h-8 w-20 rounded-md' />}
        />
      }
    >
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-start gap-3 py-3 first:pt-0'>
            {/* Checkbox */}
            <Skeleton className='h-4 w-4 rounded mt-0.5 shrink-0' />
            <div className='flex-1 min-w-0'>
              {/* Task title */}
              <Skeleton className='h-4 w-48 mb-1' />
              {/* Priority badge, initiative/objective, due date */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-24 rounded' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-20 rounded' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 rounded-md shrink-0' />
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function OneOnOneMeetingsSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Handshake}
          title='1:1 Meetings'
          action={<Skeleton className='h-8 w-20 rounded-md' />}
        />
      }
    >
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div
            key={i}
            className='flex items-center justify-between py-3 first:pt-0'
          >
            <div className='flex-1 min-w-0'>
              {/* Manager name ↔ Report name */}
              <div className='flex items-center gap-2 mb-1'>
                <Skeleton className='h-4 w-28 rounded' />
                <Skeleton className='h-4 w-2 rounded-full' />
                <Skeleton className='h-4 w-24 rounded' />
              </div>
              {/* Calendar icon, date, notes */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-3 rounded' />
                <Skeleton className='h-3 w-32 rounded' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-24 rounded' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 rounded-md shrink-0' />
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function JiraWorkActivitySectionSkeleton() {
  return (
    <section>
      <SectionHeader icon={FaJira} title='Jira Work Activity' />
      <div className='border rounded-lg p-4'>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </div>
    </section>
  )
}

export function GithubPrsActivitySectionSkeleton() {
  return (
    <section>
      <SectionHeader icon={FaGithub} title='GitHub PR Activity' />
      <div className='border rounded-lg p-4'>
        <div className='space-y-3'>
          <Skeleton className='h-4 w-full' />
          <Skeleton className='h-4 w-3/4' />
          <Skeleton className='h-4 w-1/2' />
        </div>
      </div>
    </section>
  )
}

export function DirectReportsSectionSkeleton() {
  return (
    <PageSection
      header={<SectionHeader icon={Users} title='Direct Reports (0)' />}
    >
      <div className='space-y-0 divide-y'>
        {[1, 2].map(i => (
          <div key={i} className='flex items-start gap-3 py-3 first:pt-0'>
            {/* Avatar */}
            <Skeleton className='h-10 w-10 rounded-full shrink-0' />
            <div className='flex-1 min-w-0'>
              {/* Person name */}
              <Skeleton className='h-4 w-32 mb-1' />
              {/* Role and team */}
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-24 rounded' />
                <Skeleton className='h-3 w-1 rounded-full' />
                <Skeleton className='h-3 w-20 rounded' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 rounded-md shrink-0' />
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function AccountLinkingSectionSkeleton() {
  return (
    <PageSection
      header={<SectionHeader icon={LinkIcon} title='Account Linking' />}
    >
      <div className='space-y-6'>
        {/* User Account Subsection Skeleton */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 w-24 rounded' />
          </div>
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-8 w-24 rounded-md' />
          </div>
        </div>

        {/* Jira Account Subsection Skeleton */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 w-24 rounded' />
          </div>
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-8 w-24 rounded-md' />
          </div>
        </div>

        {/* GitHub Account Subsection Skeleton */}
        <div className='space-y-3'>
          <div className='flex items-center gap-2 pb-2 border-b border-muted'>
            <Skeleton className='h-4 w-4 rounded' />
            <Skeleton className='h-4 w-24 rounded' />
          </div>
          <div className='space-y-3'>
            <Skeleton className='h-10 w-full rounded-md' />
            <Skeleton className='h-8 w-24 rounded-md' />
          </div>
        </div>
      </div>
    </PageSection>
  )
}

export function JobRoleSectionSkeleton() {
  return (
    <PageSection>
      <SectionHeader
        icon={Briefcase}
        title='Job Role'
        action={<Skeleton className='h-8 w-8 rounded-md' />}
      />
      <div className='space-y-2 mt-2'>
        {/* Job role title */}
        <Skeleton className='h-5 w-40 rounded' />
        {/* Level and domain */}
        <Skeleton className='h-3 w-32 rounded' />
      </div>
    </PageSection>
  )
}
