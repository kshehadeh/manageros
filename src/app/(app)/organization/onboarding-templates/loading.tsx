import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Skeleton } from '@/components/ui/skeleton'

export default function OnboardingTemplatesLoading() {
  return (
    <PageContainer>
      <PageHeader
        title='Onboarding Templates'
        subtitle='Create and manage onboarding templates for new team members.'
      />

      <PageContent>
        <div className='space-y-4'>
          <Skeleton className='h-10 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
          <Skeleton className='h-16 w-full' />
        </div>
      </PageContent>
    </PageContainer>
  )
}
