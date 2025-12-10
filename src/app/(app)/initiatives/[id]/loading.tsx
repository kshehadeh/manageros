import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { Rocket } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title={<Skeleton className='h-8 w-64' />}
        titleIcon={Rocket}
        subtitle={<Skeleton className='h-6 w-32' />}
        actions={<Skeleton className='h-9 w-9 rounded-md' />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <PageSection>
              <Skeleton className='h-32 w-full' />
            </PageSection>

            <PageSection>
              <Skeleton className='h-64 w-full' />
            </PageSection>

            <PageSection>
              <Skeleton className='h-48 w-full' />
            </PageSection>

            <PageSection>
              <Skeleton className='h-48 w-full' />
            </PageSection>

            <PageSection>
              <Skeleton className='h-40 w-full' />
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          <PageSection>
            <Skeleton className='h-32 w-full' />
          </PageSection>

          <PageSection>
            <Skeleton className='h-48 w-full' />
          </PageSection>

          <PageSection>
            <Skeleton className='h-40 w-full' />
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
