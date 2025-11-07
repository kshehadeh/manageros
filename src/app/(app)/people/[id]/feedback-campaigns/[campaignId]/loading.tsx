import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { Mail, Users, FileText, Link as LinkIcon } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Loading campaign...'
        titleIcon={Mail}
        subtitle='Loading campaign details...'
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            <PageSection
              header={
                <SectionHeader icon={FileText} title='Campaign Details' />
              }
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
          <PageSection header={<SectionHeader icon={Users} title='Invitees' />}>
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-24' />
                  </div>
                </div>
              ))}
            </div>
          </PageSection>

          <PageSection
            header={<SectionHeader icon={LinkIcon} title='Links' />}
            className='mt-6'
          >
            <div className='space-y-2'>
              <Skeleton className='h-4 w-full' />
              <Skeleton className='h-4 w-3/4' />
            </div>
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
