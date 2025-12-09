import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { StandaloneNoteEditor } from '@/components/notes/standalone-note-editor'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'
import { PageBreadcrumbSetter } from '@/components/page-breadcrumb-setter'

export default async function NewNotePage() {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/notes')
  }

  const pathname = '/notes/new'
  const breadcrumbs = [
    { name: 'Dashboard', href: '/dashboard' },
    { name: 'Notes', href: '/notes' },
    { name: 'New Note', href: pathname },
  ]

  return (
    <PageBreadcrumbSetter breadcrumbs={breadcrumbs}>
      <PageContainer>
        <PageContent>
          <StandaloneNoteEditor />
        </PageContent>
      </PageContainer>
    </PageBreadcrumbSetter>
  )
}
