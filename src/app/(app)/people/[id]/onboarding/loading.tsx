import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSection } from '@/components/ui/page-section'
import { SectionHeader } from '@/components/ui/section-header'
import { Skeleton } from '@/components/ui/skeleton'
import { BarChart3, Layers } from 'lucide-react'

export default function OnboardingLoading() {
  return (
    <PageContainer>
      <PageHeader title='Onboarding' subtitle='Loading...' />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Progress Overview Skeleton */}
            <PageSection
              header={
                <SectionHeader icon={BarChart3} title='Progress Overview' />
              }
            >
              <div className='space-y-4'>
                <div>
                  <div className='flex items-center justify-between mb-2'>
                    <Skeleton className='h-4 w-24' />
                    <Skeleton className='h-4 w-32' />
                  </div>
                  <Skeleton className='h-3 w-full' />
                </div>
                <div className='flex gap-4'>
                  <Skeleton className='h-6 w-40' />
                  <Skeleton className='h-6 w-40' />
                </div>
              </div>
            </PageSection>

            {/* Phases Skeleton */}
            <PageSection
              header={<SectionHeader icon={Layers} title='Phases' />}
            >
              <div className='space-y-4'>
                {[1, 2, 3].map(i => (
                  <div key={i} className='border rounded-lg p-4'>
                    <div className='flex items-center justify-between'>
                      <div className='flex items-center gap-3'>
                        <Skeleton className='h-5 w-5' />
                        <div>
                          <Skeleton className='h-5 w-32' />
                          <Skeleton className='h-4 w-20 mt-1' />
                        </div>
                      </div>
                      <Skeleton className='h-2 w-24' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
