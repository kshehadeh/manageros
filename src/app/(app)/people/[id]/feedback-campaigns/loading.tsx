import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Feedback Campaigns'
        titleIcon={Mail}
        subtitle='Loading feedback campaigns...'
      />

      <PageContent>
        <PageSection>
          <div className='space-y-3'>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} className='border rounded-lg p-4 space-y-2'>
                <Skeleton className='h-5 w-48' />
                <Skeleton className='h-4 w-32' />
              </div>
            ))}
          </div>
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
