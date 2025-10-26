import { Skeleton } from '@/components/ui/loading'

interface SectionHeaderSkeletonProps {
  title: string
  icon?: React.ComponentType<{ className?: string }>
}

function SectionHeaderSkeleton({
  title,
  icon: Icon,
}: SectionHeaderSkeletonProps) {
  return (
    <div className='flex items-center justify-between border-b border-muted pb-3 mb-3 -mx-3 px-3 md:mx-0 md:px-0'>
      <h3 className='font-bold flex items-center gap-2'>
        {Icon && <Icon className='w-4 h-4' />}
        {title}
      </h3>
      <div className='h-8 w-20'>
        <Skeleton className='h-full w-full' />
      </div>
    </div>
  )
}

interface SimpleTaskListSkeletonProps {
  title: string
  itemCount?: number
  variant?: 'simple' | 'detailed'
  icon?: React.ComponentType<{ className?: string }>
  className?: string
}

export function SimpleTaskListSkeleton({
  title,
  itemCount = 5,
  variant = 'simple',
  icon,
  className = '',
}: SimpleTaskListSkeletonProps) {
  const renderSimpleItem = (i: number) => (
    <div key={i} className='flex items-center justify-between p-3 border-b'>
      <div className='flex-1 min-w-0'>
        <div className='flex items-center gap-2 mb-1'>
          <Skeleton className='h-4 w-48' />
          <Skeleton className='h-5 w-16 rounded-full' />
        </div>
        <div className='flex items-center gap-2'>
          <Skeleton className='h-3 w-32' />
          <Skeleton className='h-3 w-2' />
          <Skeleton className='h-3 w-24' />
        </div>
      </div>
    </div>
  )

  const renderDetailedItem = (i: number) => (
    <div key={i} className='p-4 border rounded-lg'>
      <div className='flex items-start justify-between gap-3'>
        <div className='flex-1 min-w-0'>
          <div className='flex items-center gap-2 mb-2'>
            <Skeleton className='h-4 w-40' />
            <Skeleton className='h-3 w-3 rounded-full' />
          </div>
          <div className='flex items-center gap-2 mb-2'>
            <Skeleton className='h-5 w-20 rounded-full' />
          </div>
          <div className='flex items-center gap-2'>
            <Skeleton className='h-3 w-24' />
            <Skeleton className='h-3 w-2' />
            <Skeleton className='h-3 w-20' />
          </div>
        </div>
      </div>
    </div>
  )

  return (
    <section
      className={`rounded-xl py-4 -mx-3 px-3 md:mx-0 md:px-4 space-y-4 ${className}`}
    >
      <SectionHeaderSkeleton title={title} icon={icon} />
      <div className='space-y-3'>
        {Array.from({ length: itemCount }).map((_, i) =>
          variant === 'simple' ? renderSimpleItem(i) : renderDetailedItem(i)
        )}
      </div>
    </section>
  )
}
