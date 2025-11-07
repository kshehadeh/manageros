import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import {
  Rocket,
  FileText,
  ListTodo,
  Target,
  Calendar,
  Users,
  User,
  Link as LinkIcon,
} from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Loading initiative...'
        titleIcon={Rocket}
        subtitle={
          <div className='flex items-center gap-2'>
            <Skeleton className='h-6 w-16 rounded-full' />
            <Skeleton className='h-6 w-24 rounded-full' />
          </div>
        }
        actions={<Skeleton className='h-9 w-9 rounded-md' />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Summary Section */}
            <PageSection
              header={<SectionHeader icon={FileText} title='Summary' />}
            >
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
                <Skeleton className='h-4 w-4/5' />
              </div>
            </PageSection>

            {/* Tasks Section */}
            <PageSection>
              <SectionHeader icon={ListTodo} title='Tasks' />
              <div className='space-y-3 mt-4'>
                {Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='h-5 w-48' />
                      <Skeleton className='h-6 w-20 rounded-full' />
                    </div>
                    <div className='flex items-center gap-4'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Objectives Section */}
            <PageSection>
              <SectionHeader icon={Target} title='Objectives' />
              <div className='space-y-3 mt-4'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='h-5 w-56' />
                      <Skeleton className='h-6 w-16 rounded-full' />
                    </div>
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-3/4' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Meetings Section */}
            <PageSection>
              <SectionHeader icon={Calendar} title='Meetings' />
              <div className='space-y-3 mt-4'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='h-5 w-48' />
                      <Skeleton className='h-5 w-20 rounded-full' />
                    </div>
                    <div className='flex items-center gap-4'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-4 w-24' />
                    </div>
                    <div className='flex items-center gap-2 pt-2'>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Skeleton key={j} className='h-8 w-8 rounded-full' />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>

            {/* Check-ins Section */}
            <PageSection>
              <SectionHeader icon={Calendar} title='Check-ins' />
              <div className='space-y-3 mt-4'>
                {Array.from({ length: 2 }).map((_, i) => (
                  <div key={i} className='border rounded-lg p-4 space-y-2'>
                    <div className='flex items-center justify-between'>
                      <Skeleton className='h-4 w-32' />
                      <Skeleton className='h-6 w-16 rounded-full' />
                    </div>
                    <div className='space-y-1'>
                      <Skeleton className='h-4 w-full' />
                      <Skeleton className='h-4 w-5/6' />
                    </div>
                    <div className='flex items-center gap-2 pt-2'>
                      <Skeleton className='h-4 w-24' />
                      <Skeleton className='h-4 w-2' />
                      <Skeleton className='h-4 w-28' />
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          {/* Team Section */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={Users}
                title='Team'
                action={<Skeleton className='h-8 w-8' />}
                className='mb-3'
              />
            }
          >
            <div className='flex items-center gap-3'>
              <Skeleton className='h-10 w-10 rounded-full' />
              <Skeleton className='h-4 w-32' />
            </div>
          </PageSection>

          {/* People Section */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={User}
                title='People'
                action={<Skeleton className='h-8 w-8' />}
                className='mb-3'
              />
            }
          >
            <div className='space-y-3'>
              {Array.from({ length: 3 }).map((_, i) => (
                <div key={i} className='flex items-center gap-3'>
                  <Skeleton className='h-10 w-10 rounded-full' />
                  <div className='flex-1 space-y-1'>
                    <Skeleton className='h-4 w-32' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          </PageSection>

          {/* Links Section */}
          <PageSection
            variant='bordered'
            header={
              <SectionHeader
                icon={LinkIcon}
                title='Links'
                action={<Skeleton className='h-8 w-8' />}
              />
            }
          >
            <div className='space-y-3'>
              {Array.from({ length: 2 }).map((_, i) => (
                <div key={i} className='border rounded-lg p-3 space-y-2'>
                  <Skeleton className='h-4 w-full' />
                  <Skeleton className='h-3 w-3/4' />
                  <div className='flex items-center gap-2 pt-1'>
                    <Skeleton className='h-3 w-16' />
                    <Skeleton className='h-3 w-2' />
                    <Skeleton className='h-3 w-20' />
                  </div>
                </div>
              ))}
            </div>
          </PageSection>
        </PageSidebar>
      </PageContent>
    </PageContainer>
  )
}
