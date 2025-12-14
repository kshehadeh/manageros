import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { SectionHeaderAction } from '@/components/ui/section-header-action'
import { ListTodo, Eye } from 'lucide-react'

export function ActivityTasksSectionSkeleton() {
  return (
    <div className='flex-1 min-w-[400px]'>
      <PageSection
        header={
          <SectionHeader
            icon={ListTodo}
            title='Tasks'
            action={
              <SectionHeaderAction href='#' disabled>
                <Eye className='w-3.5 h-3.5' />
                View All
              </SectionHeaderAction>
            }
          />
        }
      >
        <div className='space-y-2'>
          {[1, 2, 3, 4].map(i => (
            <div
              key={i}
              className='flex items-center gap-3 p-3 rounded-md border'
            >
              <div className='flex flex-col gap-2 flex-1 min-w-0'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-3 w-64' />
              </div>
              <Skeleton className='h-4 w-16' />
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
