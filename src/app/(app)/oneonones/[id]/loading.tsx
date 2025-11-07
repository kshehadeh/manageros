import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, Info, StickyNote } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='1:1 Meeting'
        titleIcon={MessageCircle}
        subtitle='Loading meeting details...'
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <PageSection
              header={<SectionHeader icon={StickyNote} title='Meeting Notes' />}
            >
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
              </div>
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          <PageSection
            header={<SectionHeader icon={Info} title='Meeting Details' />}
          >
            <div className='space-y-3'>
              <Skeleton className='h-4 w-32' />
              <Skeleton className='h-4 w-28' />
            </div>
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
