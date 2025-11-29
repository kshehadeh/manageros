import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Rocket, Eye } from 'lucide-react'
import { Link } from '@/components/ui/link'
import { Button } from '@/components/ui/button'

export function ActivityInitiativesSectionSkeleton() {
  return (
    <div className='flex-1 min-w-[400px]'>
      <PageSection
        header={
          <SectionHeader
            icon={Rocket}
            title='Initiatives'
            action={
              <Button asChild variant='outline' size='sm' disabled>
                <Link href='#' className='flex items-center gap-2'>
                  <Eye className='w-4 h-4' />
                </Link>
              </Button>
            }
          />
        }
      >
        <div className='space-y-2'>
          {[1, 2, 3].map(i => (
            <div
              key={i}
              className='flex items-center gap-3 p-3 rounded-md border'
            >
              <div className='flex flex-col gap-2 flex-1 min-w-0'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-3 w-48' />
              </div>
              <Skeleton className='h-4 w-20' />
            </div>
          ))}
        </div>
      </PageSection>
    </div>
  )
}
