import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Users, Rocket, Building2 } from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title={<Skeleton className='h-8 w-64' />}
        iconComponent={<Skeleton className='h-16 w-16 rounded-full' />}
        subtitle={
          <>
            <Skeleton className='h-5 w-96 mb-2' />
            <Skeleton className='h-4 w-48 mt-1' />
          </>
        }
        actions={<Skeleton className='h-9 w-9 rounded-md' />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Team Members */}
            <PageSection
              header={
                <SectionHeader
                  icon={Users}
                  title='Members'
                  action={<Skeleton className='h-8 w-28' />}
                />
              }
            >
              <div className='space-y-3'>
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className='flex items-center gap-3'>
                    <Skeleton className='h-10 w-10 rounded-full' />
                    <div className='flex-1 space-y-1'>
                      <Skeleton className='h-4 w-48' />
                      <Skeleton className='h-3 w-32' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Team Initiatives */}
            <PageSection
              header={
                <SectionHeader
                  icon={Rocket}
                  title='Initiatives'
                  action={<Skeleton className='h-8 w-28' />}
                />
              }
            >
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='h-5 w-56' />
                      <Skeleton className='h-6 w-20 rounded-full' />
                    </div>
                    <Skeleton className='h-4 w-full' />
                    <div className='flex items-center gap-4'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Child Teams */}
            <PageSection
              header={
                <SectionHeader
                  icon={Building2}
                  title='Children'
                  action={<Skeleton className='h-8 w-24' />}
                />
              }
            >
              <div className='space-y-3'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center gap-3'>
                      <Skeleton className='h-10 w-10 rounded-full' />
                      <div className='flex-1 space-y-1'>
                        <Skeleton className='h-5 w-48' />
                        <Skeleton className='h-4 w-32' />
                      </div>
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
