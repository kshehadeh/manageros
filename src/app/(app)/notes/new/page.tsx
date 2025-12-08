import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { StandaloneNoteEditor } from '@/components/notes/standalone-note-editor'
import { NewNoteBreadcrumbClient } from '@/components/notes/new-note-breadcrumb-client'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'

export default async function NewNotePage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/notes')
  }

  return (
    <NewNoteBreadcrumbClient>
      <PageContainer>
        <PageContent>
          <StandaloneNoteEditor />
        </PageContent>
      </PageContainer>
    </NewNoteBreadcrumbClient>
  )
}
