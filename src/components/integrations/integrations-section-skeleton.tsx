/**
 * Skeleton loader for integrations section
 */

import { Skeleton } from '@/components/ui/skeleton'

export function IntegrationsSectionSkeleton() {
  return (
    <div className='space-y-4'>
      <div className='flex items-center justify-between'>
        <div className='space-y-2'>
          <Skeleton className='h-6 w-48' />
          <Skeleton className='h-4 w-64' />
        </div>
        <Skeleton className='h-10 w-32' />
      </div>
      <div className='space-y-4'>
        <Skeleton className='h-24 w-full' />
        <Skeleton className='h-24 w-full' />
      </div>
    </div>
  )
}
