import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import {
  FileText,
  Handshake,
  MessageCircle,
  Rocket,
  ListTodo,
  Users,
  User as UserIcon,
  Briefcase,
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

export function SynopsisSectionSkeleton() {
  return (
    <section>
      <SectionHeader
        icon={FileText}
        title='Synopsis'
        action={
          <div className='flex items-center gap-2'>
            <Skeleton className='h-8 w-8' />
            <Skeleton className='h-8 w-8' />
          </div>
        }
      />
      <div className='space-y-3'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    </section>
  )
}

export function FeedbackCampaignsSectionSkeleton() {
  return (
    <div className='flex-1 min-w-[300px] max-w-[500px]'>
      <section>
        <SectionHeader
          icon={MessageCircle}
          title='Feedback Campaigns (0)'
          action={
            <div className='flex items-center gap-2'>
              <Skeleton className='h-8 w-8' />
              <Skeleton className='h-8 w-8' />
            </div>
          }
        />
        <div className='space-y-3'>
          <Skeleton className='h-24 w-full' />
        </div>
      </section>
    </div>
  )
}

export function OwnedInitiativesSectionSkeleton() {
  return (
    <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
      <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
        <h3 className='font-bold flex items-center gap-2'>
          <Rocket className='w-4 h-4' />
          Owned Initiatives
        </h3>
      </div>
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-center justify-between px-3 py-3'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <Skeleton className='h-4 w-48' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-3 w-3' />
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-2' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 shrink-0' />
          </div>
        ))}
      </div>
    </section>
  )
}

export function ActiveTasksSectionSkeleton() {
  return (
    <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
      <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
        <h3 className='font-bold flex items-center gap-2'>
          <ListTodo className='w-4 h-4' />
          Active Tasks
        </h3>
      </div>
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-center justify-between px-3 py-3'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <Skeleton className='h-4 w-48' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-3 w-3' />
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-2' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 shrink-0' />
          </div>
        ))}
      </div>
    </section>
  )
}

export function OneOnOneMeetingsSectionSkeleton() {
  return (
    <section className='rounded-xl py-4 -mx-3 px-3 space-y-4'>
      <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
        <h3 className='font-bold flex items-center gap-2'>
          <Handshake className='w-4 h-4' />
          1:1 Meetings
        </h3>
      </div>
      <div className='space-y-0 divide-y'>
        {[1, 2, 3].map(i => (
          <div key={i} className='flex items-center justify-between px-3 py-3'>
            <div className='flex-1 min-w-0'>
              <div className='flex items-center gap-2 mb-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-4 w-2' />
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-3 w-24' />
                <Skeleton className='h-3 w-2' />
                <Skeleton className='h-3 w-32' />
              </div>
            </div>
            <Skeleton className='h-8 w-8 shrink-0' />
          </div>
        ))}
      </div>
    </section>
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
    <section>
      <SectionHeader icon={Users} title='Direct Reports (0)' />
      <div className='space-y-3'>
        <Skeleton className='h-16 w-full' />
        <Skeleton className='h-16 w-full' />
      </div>
    </section>
  )
}

export function UserLinkingSectionSkeleton() {
  return (
    <section>
      <SectionHeader icon={UserIcon} title='User Linking' />
      <div className='border rounded-lg p-4'>
        <div className='space-y-3'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
    </section>
  )
}

export function JiraLinkingSectionSkeleton() {
  return (
    <section>
      <SectionHeader icon={FaJira} title='Jira Linking' />
      <div className='border rounded-lg p-4'>
        <div className='space-y-3'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
    </section>
  )
}

export function GithubLinkingSectionSkeleton() {
  return (
    <section>
      <SectionHeader icon={FaGithub} title='GitHub Linking' />
      <div className='border rounded-lg p-4'>
        <div className='space-y-3'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-8 w-24' />
        </div>
      </div>
    </section>
  )
}

export function JobRoleSectionSkeleton() {
  return (
    <section>
      <SectionHeader
        icon={Briefcase}
        title='Job Role'
        action={<Skeleton className='h-8 w-8' />}
      />
      <div className='space-y-2'>
        <Skeleton className='h-16 w-full' />
      </div>
    </section>
  )
}
