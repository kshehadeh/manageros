import { redirect } from 'next/navigation'
import { TeamImportForm } from '@/components/teams/team-import-form'
import { getCurrentUser } from '@/lib/auth-utils'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Upload } from 'lucide-react'

export default async function ImportTeamsPage() {
  const user = await getCurrentUser()

  if (!user) {
    redirect('/auth/signin')
  }

  if (!user.managerOSOrganizationId) {
    redirect('/organization/create')
  }

  return (
    <PageContainer>
      <PageHeader
        title='Import Teams'
        titleIcon={Upload}
        subtitle='Bulk import teams from a CSV file'
      />

      <PageContent>
        <PageSection>
          <TeamImportForm />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
