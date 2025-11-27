import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Activity'
        titleIcon={Activity}
        subtitle='Loading activity data...'
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Jira Section Skeleton */}
            <PageSection>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-5 w-32' />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className='p-4 rounded-md bg-muted/40'>
                      <Skeleton className='h-4 w-20 mb-2' />
                      <Skeleton className='h-8 w-12' />
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>

            {/* GitHub Section Skeleton */}
            <PageSection>
              <div className='space-y-4'>
                <div className='flex items-center gap-2'>
                  <Skeleton className='h-5 w-5' />
                  <Skeleton className='h-5 w-36' />
                </div>
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {Array.from({ length: 2 }).map((_, i) => (
                    <div key={i} className='p-4 rounded-md bg-muted/40'>
                      <Skeleton className='h-4 w-20 mb-2' />
                      <Skeleton className='h-8 w-12' />
                    </div>
                  ))}
                </div>
              </div>
            </PageSection>
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
