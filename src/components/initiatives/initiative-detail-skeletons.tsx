import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import {
  ListTodo,
  Target,
  FileText,
  Users,
  User,
  Link as LinkIcon,
} from 'lucide-react'

export function InitiativeTasksSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={ListTodo}
          title='Tasks'
          action={<Skeleton className='h-8 w-24' />}
        />
      }
    >
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='border rounded-lg p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-5 w-48' />
              <Skeleton className='h-6 w-20 rounded-full' />
            </div>
            <div className='flex items-center gap-4'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-24' />
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function InitiativeObjectivesSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Target}
          title='Objectives & Key Results'
          action={<Skeleton className='h-8 w-24' />}
          className='mb-4'
        />
      }
    >
      <div className='space-y-4'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div
            key={i}
            className='border border-border rounded-lg p-4 space-y-2'
          >
            <Skeleton className='h-5 w-56' />
            <div className='space-y-1'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function InitiativeNotesSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={FileText}
          title='Notes'
          action={<Skeleton className='h-8 w-24' />}
        />
      }
    >
      <div className='space-y-4'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className='border rounded-lg p-4 space-y-3'>
            <div className='flex items-start justify-between'>
              <div className='flex items-center gap-3'>
                <Skeleton className='h-8 w-8 rounded-full' />
                <div className='space-y-1'>
                  <Skeleton className='h-4 w-32' />
                  <Skeleton className='h-3 w-24' />
                </div>
              </div>
              <Skeleton className='h-8 w-8' />
            </div>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
              <Skeleton className='h-4 w-4/5' />
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function InitiativeCheckInsSkeleton() {
  return (
    <PageSection>
      <div className='space-y-3'>
        {Array.from({ length: 2 }).map((_, i) => (
          <div key={i} className='border rounded-lg p-4 space-y-2'>
            <div className='flex items-center justify-between'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-6 w-16 rounded-full' />
            </div>
            <div className='space-y-1'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
            <div className='flex items-center gap-2 pt-2'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-2' />
              <Skeleton className='h-4 w-28' />
            </div>
          </div>
        ))}
      </div>
    </PageSection>
  )
}

export function InitiativeSidebarSkeleton() {
  return (
    <div className='w-full lg:w-80 space-y-6'>
      {/* Team Section */}
      <PageSection
        header={
          <SectionHeader
            icon={Users}
            title='Team'
            action={<Skeleton className='h-8 w-8' />}
            className='mb-3'
          />
        }
      >
        <div className='flex items-center gap-3'>
          <Skeleton className='h-10 w-10 rounded-full' />
          <Skeleton className='h-4 w-32' />
        </div>
      </PageSection>

      {/* People Section */}
      <PageSection
        header={
          <SectionHeader
            icon={User}
            title='People'
            action={<Skeleton className='h-8 w-8' />}
            className='mb-3'
          />
        }
      >
        <div className='space-y-3'>
          {Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <div className='flex-1 space-y-1'>
                <Skeleton className='h-4 w-32' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
          ))}
        </div>
      </PageSection>

      {/* Links Section */}
      <PageSection
        header={
          <SectionHeader
            icon={LinkIcon}
            title='Links'
            action={<Skeleton className='h-8 w-8' />}
          />
        }
      >
        <div className='space-y-3'>
          {Array.from({ length: 2 }).map((_, i) => (
            <div key={i} className='border rounded-lg p-3 space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-3 w-3/4' />
              <div className='flex items-center gap-2 pt-1'>
                <Skeleton className='h-3 w-16' />
                <Skeleton className='h-3 w-2' />
                <Skeleton className='h-3 w-20' />
              </div>
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  )
}

export function InitiativeCompletionRateSkeleton() {
  return <Skeleton className='h-6 w-20' />
}

export function InitiativePropertiesSidebarSkeleton() {
  return (
    <div className='text-sm'>
      <table className='w-full'>
        <tbody>
          {Array.from({ length: 6 }).map((_, i) => (
            <tr key={i}>
              <td className='py-sm pr-lg'>
                <div className='flex items-center gap-md'>
                  <Skeleton className='h-3.5 w-3.5' />
                  <Skeleton className='h-4 w-16' />
                </div>
              </td>
              <td className='py-sm'>
                <Skeleton className='h-4 w-20' />
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}
