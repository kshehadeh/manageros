import { PeopleDataTable } from '@/components/people/data-table'
import { Users } from 'lucide-react'
import { PageSection } from '@/components/ui/page-section'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { getOptionalUser } from '@/lib/auth-utils'

export default async function DirectReportsPage() {
  const user = await getOptionalUser()

  // If user doesn't have a personId, they can't have direct reports
  if (!user?.personId) {
    return (
      <PageContainer>
        <PageHeader title='Your Direct Reports' titleIcon={Users} />
        <PageContent>
          <PageSection>
            <div className='text-muted-foreground text-sm text-center py-8'>
              You need to be linked to a person record to view direct reports.
            </div>
          </PageSection>
        </PageContent>
      </PageContainer>
    )
  }

  return (
    <PageContainer>
      <PageHeader title='Your Direct Reports' titleIcon={Users} />

      <PageContent>
        <PageSection>
          <PeopleDataTable
            settingsId='direct-reports'
            immutableFilters={{
              managerId: user.personId,
              status: 'active',
            }}
          />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
