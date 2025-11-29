import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageMain } from '@/components/ui/page-main'
import { Skeleton } from '@/components/ui/skeleton'
import { Activity, ArrowLeft } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Link } from '@/components/ui/link'
import { SectionHeader } from '@/components/ui/section-header'
import { PageSection } from '@/components/ui/page-section'
import { FaJira } from 'react-icons/fa'
import { FaGithub } from 'react-icons/fa'
import { ListTodo, Rocket } from 'lucide-react'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function LoadingPage() {
  return (
    <PageContainer>
      <PageHeader
        title={<Skeleton className='h-8 w-48' />}
        titleIcon={Activity}
        subtitle={<Skeleton className='h-5 w-32' />}
        actions={
          <div className='flex items-center gap-2'>
            <Skeleton className='h-10 w-[180px]' />
            <Button asChild variant='outline' disabled>
              <Link href='#' className='flex items-center gap-2'>
                <ArrowLeft className='w-4 h-4' />
                Back to Profile
              </Link>
            </Button>
          </div>
        }
      />

      <PageContent>
        <PageMain>
          <div className='flex gap-lg flex-wrap space-y-6'>
            {/* Tasks Section Skeleton */}
            <div className='flex-1 min-w-[400px]'>
              <PageSection
                header={
                  <SectionHeader
                    icon={ListTodo}
                    title={<Skeleton className='h-5 w-20' />}
                    action={<Skeleton className='h-8 w-8' />}
                  />
                }
              >
                <div className='space-y-2'>
                  {[1, 2, 3, 4].map(i => (
                    <div
                      key={i}
                      className='flex items-center gap-3 p-3 rounded-md border'
                    >
                      <div className='flex flex-col gap-2 flex-1 min-w-0'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-3 w-64' />
                      </div>
                      <Skeleton className='h-4 w-16' />
                    </div>
                  ))}
                </div>
              </PageSection>
            </div>

            {/* Initiatives Section Skeleton */}
            <div className='flex-1 min-w-[400px]'>
              <PageSection
                header={
                  <SectionHeader
                    icon={Rocket}
                    title={<Skeleton className='h-5 w-28' />}
                    action={<Skeleton className='h-8 w-8' />}
                  />
                }
              >
                <div className='space-y-2'>
                  {[1, 2, 3].map(i => (
                    <div
                      key={i}
                      className='flex items-center gap-3 p-3 rounded-md border'
                    >
                      <div className='flex flex-col gap-2 flex-1 min-w-0'>
                        <Skeleton className='h-4 w-full' />
                        <Skeleton className='h-3 w-48' />
                      </div>
                      <Skeleton className='h-4 w-20' />
                    </div>
                  ))}
                </div>
              </PageSection>
            </div>

            {/* Jira Metrics Skeleton */}
            <PageSection
              header={
                <SectionHeader
                  icon={FaJira}
                  title={<Skeleton className='h-5 w-32' />}
                />
              }
              className='flex-1 min-w-[400px]'
            >
              <div className='space-y-6'>
                {/* Stats Cards */}
                <div className='grid grid-cols-1 md:grid-cols-3 gap-4'>
                  {[1, 2, 3].map(i => (
                    <Card key={i} className='bg-muted/40 border-0 rounded-md'>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <Skeleton className='h-4 w-20' />
                        <Skeleton className='h-4 w-4 rounded-full' />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className='h-8 w-12' />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* Ticket List Skeleton */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-32' />
                  <div className='space-y-2'>
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className='flex items-center gap-3 p-3 rounded-md border'
                      >
                        <div className='flex flex-col gap-2 flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <Skeleton className='h-3 w-16' />
                            <Skeleton className='h-4 w-20' />
                          </div>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-3 w-48' />
                        </div>
                        <Skeleton className='h-4 w-4' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PageSection>

            {/* GitHub Metrics Skeleton */}
            <PageSection
              header={
                <SectionHeader
                  icon={FaGithub}
                  title={<Skeleton className='h-5 w-36' />}
                />
              }
              className='flex-1 min-w-[400px]'
            >
              <div className='space-y-6'>
                {/* Stats Cards */}
                <div className='grid grid-cols-1 md:grid-cols-2 gap-4'>
                  {[1, 2].map(i => (
                    <Card key={i} className='bg-muted/40 border-0 rounded-md'>
                      <CardHeader className='flex flex-row items-center justify-between space-y-0 pb-2'>
                        <Skeleton className='h-4 w-24' />
                        <Skeleton className='h-4 w-4 rounded-full' />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className='h-8 w-12' />
                      </CardContent>
                    </Card>
                  ))}
                </div>

                {/* PR List Skeleton */}
                <div className='space-y-2'>
                  <Skeleton className='h-4 w-40' />
                  <div className='space-y-2'>
                    {[1, 2, 3].map(i => (
                      <div
                        key={i}
                        className='flex items-center gap-3 p-3 rounded-md border'
                      >
                        <Skeleton className='h-4 w-4 flex-shrink-0' />
                        <div className='flex flex-col gap-2 flex-1 min-w-0'>
                          <div className='flex items-center gap-2'>
                            <Skeleton className='h-3 w-12' />
                            <Skeleton className='h-4 w-16' />
                          </div>
                          <Skeleton className='h-4 w-full' />
                          <Skeleton className='h-3 w-56' />
                        </div>
                        <Skeleton className='h-4 w-4 flex-shrink-0' />
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </PageSection>
          </div>
        </PageMain>
      </PageContent>
    </PageContainer>
  )
}
