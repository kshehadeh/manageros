import { Skeleton } from '@/components/ui/skeleton'

export function OrganizationSectionSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-32' />
        <Skeleton className='h-5 w-48' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-4 w-32 font-mono' />
      </div>
      <div className='space-y-2'>
        <Skeleton className='h-4 w-28' />
        <Skeleton className='h-4 w-48 font-mono' />
      </div>
    </div>
  )
}
