import { Skeleton } from '@/components/ui/loading'

function SectionHeader({ title }: { title: string }) {
  return (
    <div className='flex items-center justify-between mb-3'>
      <h2 className='font-semibold'>{title}</h2>
      <div className='h-8 w-20'>
        <Skeleton className='h-full w-full' />
      </div>
    </div>
  )
}

export function TasksSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='My Tasks' />
      <div className='card p-4'>
        <div className='mb-4 grid grid-cols-6 gap-4'>
          <Skeleton className='h-4 w-24 col-span-2' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
          <Skeleton className='h-4 w-20' />
        </div>
        <div className='space-y-3'>
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className='grid grid-cols-6 items-center gap-4'>
              <Skeleton className='h-4 col-span-2' />
              <Skeleton className='h-4' />
              <Skeleton className='h-4' />
              <Skeleton className='h-4' />
              <Skeleton className='h-4' />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}

export function FeedbackCampaignsSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Feedback Campaigns' />
      <div className='card p-4 space-y-4'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='flex items-center gap-3'>
              <Skeleton className='h-5 w-20 rounded-full' />
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-56' />
            </div>
            <div className='flex items-center gap-4'>
              <Skeleton className='h-4 w-24' />
              <Skeleton className='h-4 w-40' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RecentFeedbackSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Recent Feedback' />
      <div className='space-y-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='card p-4'>
            <Skeleton className='h-4 w-3/4 mb-2' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-3 w-28' />
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function OpenInitiativesSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Open Initiatives' />
      <div className='grid gap-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='card p-4 space-y-2'>
            <Skeleton className='h-4 w-1/2' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-3 w-24' />
              <Skeleton className='h-3 w-20' />
              <Skeleton className='h-3 w-16' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function RecentOneOnOnesSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Recent 1:1s' />
      <div className='grid gap-3'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='card p-4 flex items-center justify-between'>
            <div className='space-y-2'>
              <Skeleton className='h-4 w-44' />
              <Skeleton className='h-3 w-24' />
            </div>
            <Skeleton className='h-3 w-16' />
          </div>
        ))}
      </div>
    </section>
  )
}

export function RelatedTeamsSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Related Teams' />
      <div className='space-y-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='flex items-start justify-between'>
            <div>
              <Skeleton className='h-4 w-36 mb-1' />
              <Skeleton className='h-3 w-48 mb-1' />
              <Skeleton className='h-3 w-56' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}

export function DirectReportsSectionFallback() {
  return (
    <section className='bg-card/30 border border-border/50 rounded-xl p-4 space-y-4'>
      <SectionHeader title='Direct Reports' />
      <div className='grid gap-3'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='card p-4'>
            <Skeleton className='h-4 w-40 mb-2' />
            <div className='flex items-center gap-3'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-12' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
        ))}
      </div>
    </section>
  )
}
