import { IndigoIcon } from '@/components/indigo-icon'
import { Skeleton } from '@/components/ui/skeleton'
import { APP_VERSION } from '@/lib/version'

export function SidebarSkeleton() {
  return (
    <div className='hidden lg:flex h-screen w-64 flex-col bg-card border-r'>
      <div className='flex h-16 items-center px-6'>
        <div className='flex items-center gap-3'>
          <IndigoIcon width={32} height={26} color='currentColor' />
          <h1 className='text-xl font-semibold text-foreground'>ManagerOS</h1>
        </div>
      </div>

      {/* User Info Skeleton */}
      <div className='px-6 py-4 border-b'>
        <div className='flex items-start gap-3'>
          <Skeleton className='h-8 w-8 rounded-full shrink-0' />
          <div className='flex-1 min-w-0 space-y-2'>
            <Skeleton className='h-4 w-32' />
            <Skeleton className='h-3 w-40' />
            <div className='flex items-center gap-2 mt-1'>
              <Skeleton className='h-3 w-16' />
              <Skeleton className='h-3 w-1' />
              <Skeleton className='h-3 w-20' />
            </div>
          </div>
        </div>
      </div>

      {/* Navigation Skeleton */}
      <nav className='flex-1 px-3 py-4 space-y-1'>
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 px-3 py-2 rounded-lg'>
            <Skeleton className='h-5 w-5 rounded' />
            <Skeleton className='h-4 w-24' />
          </div>
        ))}
        {/* AI Chat Button Skeleton */}
        <div className='flex items-center gap-3 px-3 py-2 rounded-lg'>
          <Skeleton className='h-5 w-5 rounded' />
          <Skeleton className='h-4 w-20' />
        </div>
      </nav>

      {/* Footer Actions Skeleton */}
      <div className='px-3 py-4 border-t space-y-1'>
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className='flex items-center gap-3 px-3 py-2 rounded-lg'>
            <Skeleton className='h-5 w-5 rounded' />
            <Skeleton className='h-4 w-32' />
          </div>
        ))}
      </div>

      {/* Version Footer */}
      <div className='px-3 py-2 border-t'>
        <div className='text-xs text-muted-foreground text-center'>
          v{APP_VERSION}
        </div>
      </div>
    </div>
  )
}
