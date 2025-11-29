import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { FaJira } from 'react-icons/fa'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export function JiraMetricsSectionSkeleton() {
  const header = <SectionHeader icon={FaJira} title='Jira Activity' />

  return (
    <PageSection header={header} className='flex-1 min-w-[400px]'>
      <div className='space-y-6'>
        {/* Stats Cards */}
        <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
          {[1, 2, 3].map(i => (
            <Card key={i} className='bg-muted/40 border-0 rounded-md'>
              <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                <Skeleton className='h-4 w-20' />
                <Skeleton className='h-4 w-4 rounded-full' />
              </CardHeader>
              <CardContent>
                <Skeleton className='h-8 w-12' />
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Ticket List Skeleton */}
        <div className='space-y-2'>
          <Skeleton className='h-4 w-32' />
          <div className='space-y-2'>
            {[1, 2, 3].map(i => (
              <div
                key={i}
                className='flex items-center gap-3 p-3 rounded-md border'
              >
                <div className='flex flex-col gap-2 flex-1 min-w-0'>
                  <div className='flex items-center gap-2'>
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-4 w-20' />
                  </div>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-3 w-48' />
                </div>
                <Skeleton className='h-4 w-4' />
              </div>
            ))}
          </div>
        </div>
      </div>
    </PageSection>
  )
}
