import { Skeleton } from '@/components/ui/skeleton'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { PageSidebar } from '@/components/ui/page-sidebar'
import {
  Clock,
  Users,
  User,
  Building2,
  Repeat,
  FileText,
  StickyNote,
  Calendar,
  Link as LinkIcon,
} from 'lucide-react'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title='Loading meeting...'
        titleIcon={Calendar}
        subtitle={
          <div className='flex flex-wrap items-center gap-4 mt-3'>
            <div className='flex items-center gap-1'>
              <Clock className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-24' />
            </div>
            <div className='flex items-center gap-1'>
              <Users className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-32' />
            </div>
            <div className='flex items-center gap-1'>
              <Repeat className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-20' />
            </div>
            <div className='flex items-center gap-1'>
              <User className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-28' />
            </div>
            <div className='flex items-center gap-1'>
              <Building2 className='h-4 w-4 text-muted-foreground' />
              <Skeleton className='h-4 w-24' />
            </div>
            <Skeleton className='h-5 w-20 rounded-full' />
          </div>
        }
        actions={<Skeleton className='h-9 w-9 rounded-md' />}
      />

      <PageContent>
        <PageMain>
          <div className='space-y-6'>
            {/* Description Section */}
            <PageSection
              header={<SectionHeader icon={FileText} title='Description' />}
            >
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-3/4' />
              </div>
            </PageSection>

            {/* Notes Section */}
            <PageSection
              header={<SectionHeader icon={StickyNote} title='Notes' />}
            >
              <div className='space-y-2'>
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-full' />
                <Skeleton className='h-4 w-5/6' />
              </div>
            </PageSection>

            {/* Meeting Instances Section - Show skeleton for recurring meetings */}
            <PageSection>
              <SectionHeader icon={Calendar} title='Meeting Instances' />
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
                    <div className='flex items-center gap-2 pt-2'>
                      {Array.from({ length: 3 }).map((_, j) => (
                        <Skeleton key={j} className='h-8 w-8 rounded-full' />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </PageSection>
          </div>
        </PageMain>

        <PageSidebar>
          {/* Participants Section */}
          <PageSection
            header={<SectionHeader icon={Users} title='Participants (0)' />}
          >
            <div className='space-y-3'>
              {Array.from({ length: 4 }).map((_, i) => (
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
            header={<SectionHeader icon={LinkIcon} title='Links' />}
            className='mt-6'
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
