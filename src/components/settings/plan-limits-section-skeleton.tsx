import { Skeleton } from '@/components/ui/skeleton'

export function PlanLimitsSectionSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-24' />
        <Skeleton className='h-5 w-32' />
      </div>
      <div className='space-y-4'>
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className='space-y-2'>
            <div className='flex items-center justify-between'>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-4' />
                <Skeleton className='h-4 w-24' />
              </div>
              <div className='flex items-center gap-2'>
                <Skeleton className='h-4 w-8' />
                <span className='text-muted-foreground'>/</span>
                <Skeleton className='h-4 w-16' />
              </div>
            </div>
            <Skeleton className='h-2 w-full rounded-full' />
          </div>
        ))}
      </div>
    </div>
  )
}
