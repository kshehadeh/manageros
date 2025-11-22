import { Skeleton } from '@/components/ui/loading'
import { Card } from '@/components/ui/card'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { ListTodo, Rocket, Sparkles, Activity } from 'lucide-react'

export function HighlightsSectionSkeleton() {
  return (
    <PageSection header={<SectionHeader icon={Sparkles} title='Highlights' />}>
      <div className='flex flex-wrap gap-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <Card
            key={i}
            className='flex items-center gap-2 px-4 py-2 bg-muted/5 border-0 rounded-md shadow-none'
          >
            <Skeleton className='h-4 w-4 shrink-0' />
            <Skeleton className='h-4 w-28' />
          </Card>
        ))}
      </div>
    </PageSection>
  )
}

export function TodaysPrioritiesSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={ListTodo}
          title="Today's Priorities"
          description={
            <div className='hidden md:flex items-center gap-md text-xs text-muted-foreground'>
              <Skeleton className='h-3 w-20' />
              <span>•</span>
              <Skeleton className='h-3 w-16' />
              <span>•</span>
              <Skeleton className='h-3 w-28' />
              <span>•</span>
              <Skeleton className='h-3 w-20' />
            </div>
          }
        />
      }
    >
      <div className='flex flex-col gap-md'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className='p-lg bg-muted/20 border-0 rounded-md shadow-none'
          >
            <div className='flex items-center justify-between gap-lg'>
              <div className='flex items-center gap-lg flex-1 min-w-0'>
                <Skeleton className='h-4 w-4 shrink-0' />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-md flex-wrap mb-sm'>
                    <Skeleton className='h-4 w-48' />
                    <Skeleton className='h-5 w-16 rounded-full' />
                  </div>
                  <div className='flex items-center gap-md'>
                    <Skeleton className='h-3 w-24' />
                    <span>•</span>
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              </div>
              <div className='flex items-center gap-md shrink-0'>
                <Skeleton className='h-5 w-16 rounded-full' />
                <Skeleton className='h-8 w-8 rounded-md' />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageSection>
  )
}

export function ActiveInitiativesSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Rocket}
          title='Active Initiatives'
          description={
            <div className='hidden md:flex items-center gap-md text-xs text-muted-foreground'>
              <Skeleton className='h-3 w-24' />
            </div>
          }
        />
      }
    >
      <div className='flex flex-col gap-md'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className='p-lg bg-muted/20 border-0 rounded-md shadow-none'
          >
            <div className='flex items-center justify-between gap-lg'>
              <div className='flex items-center gap-lg flex-1 min-w-0'>
                <Skeleton className='h-4 w-4 shrink-0' />
                <div className='flex-1 min-w-0'>
                  <div className='flex items-center gap-md flex-wrap mb-sm'>
                    <Skeleton className='h-4 w-56' />
                  </div>
                  <div className='flex items-center gap-md'>
                    <Skeleton className='h-3 w-20' />
                    <span>•</span>
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
              </div>
              <Skeleton className='h-5 w-20 rounded-full shrink-0' />
            </div>
          </Card>
        ))}
      </div>
    </PageSection>
  )
}

export function TeamPulseSectionSkeleton() {
  return (
    <PageSection
      header={
        <SectionHeader
          icon={Activity}
          title='Team Pulse'
          description={
            <div className='hidden md:flex items-center gap-md text-xs text-muted-foreground'>
              <Skeleton className='h-3 w-28' />
              <span>•</span>
              <Skeleton className='h-3 w-20' />
            </div>
          }
        />
      }
    >
      <div className='flex flex-col gap-lg'>
        {Array.from({ length: 5 }).map((_, i) => (
          <Card
            key={i}
            className='p-lg bg-muted/20 border-0 rounded-md shadow-none'
          >
            <div className='flex items-center gap-lg'>
              <Skeleton className='h-10 w-10 rounded-full shrink-0' />
              <div className='flex-1 min-w-0'>
                <Skeleton className='h-4 w-32 mb-sm' />
                <Skeleton className='h-3 w-40 mb-sm' />
                <Skeleton className='h-3 w-24' />
              </div>
            </div>
          </Card>
        ))}
      </div>
    </PageSection>
  )
}
