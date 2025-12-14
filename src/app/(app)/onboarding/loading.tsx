import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { Skeleton } from '@/components/ui/skeleton'
import { Card, CardContent, CardHeader } from '@/components/ui/card'

export default function OnboardingLoading() {
  return (
    <PageContainer>
      <PageHeader title='Your Onboarding' subtitle='Loading...' />
      <PageContent>
        <div className='space-y-6'>
          {/* Header card */}
          <Card>
            <CardHeader>
              <Skeleton className='h-6 w-48' />
              <Skeleton className='h-4 w-64 mt-2' />
            </CardHeader>
            <CardContent>
              <Skeleton className='h-3 w-full' />
            </CardContent>
          </Card>

          {/* Phase cards */}
          {[1, 2, 3].map(i => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className='h-5 w-32' />
              </CardHeader>
              <CardContent>
                <div className='space-y-3'>
                  <Skeleton className='h-16 w-full' />
                  <Skeleton className='h-16 w-full' />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </PageContent>
    </PageContainer>
  )
}
