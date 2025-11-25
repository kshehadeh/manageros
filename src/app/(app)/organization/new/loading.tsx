import { Skeleton } from '@/components/ui/skeleton'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { SectionHeader } from '@/components/ui/section-header'
import { Building2, Mail } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Create or Join Organization'
        subtitle='Set up your organization or accept an invitation to join an existing one'
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <PageSection
              variant='bordered'
              header={
                <SectionHeader
                  icon={Mail}
                  title='Organization Invitations'
                  description='You have been invited to join organizations.'
                />
              }
            >
              <div className='space-y-4'>
                <Skeleton className='h-20 w-full rounded-lg' />
                <Skeleton className='h-20 w-full rounded-lg' />
              </div>
            </PageSection>

            <PageSection
              variant='bordered'
              header={
                <SectionHeader
                  icon={Building2}
                  title='Create Your Organization'
                  description='Or create your own organization to get started.'
                />
              }
            >
              <div className='space-y-4'>
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-full' />
                <Skeleton className='h-10 w-32' />
              </div>
            </PageSection>
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
