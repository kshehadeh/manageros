import { PersonImportForm } from '@/components/people/person-import-form'
import { PageContainer } from '@/components/ui/page-container'
import { PageHeader } from '@/components/ui/page-header'
import { PageContent } from '@/components/ui/page-content'
import { PageSection } from '@/components/ui/page-section'
import { Upload } from 'lucide-react'

export default function ImportPeoplePage() {
  return (
    <PageContainer>
      <PageHeader
        title='Import People'
        titleIcon={Upload}
        subtitle='Bulk import people from a CSV file'
      />

      <PageContent>
        <PageSection>
          <PersonImportForm />
        </PageSection>
      </PageContent>
    </PageContainer>
  )
}
