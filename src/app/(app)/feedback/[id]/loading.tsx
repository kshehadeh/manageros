import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { MessageCircle, FileText } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Loading feedback...'
        titleIcon={MessageCircle}
        subtitle='Loading feedback details...'
      />

      <PageContent>
        <PageMain>
          <PageSection
            header={<SectionHeader icon={FileText} title='Feedback' />}
          >
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-5/6' />
            </div>
          </PageSection>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
