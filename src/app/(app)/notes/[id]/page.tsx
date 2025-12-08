import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getStandaloneNoteById } from '@/lib/actions/notes'
import { StandaloneNoteEditor } from '@/components/notes/standalone-note-editor'
import { NoteDetailBreadcrumbClient } from '@/components/notes/note-detail-breadcrumb-client'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'

export default async function NoteDetailPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const user = await getCurrentUser()

  if (!user.managerOSOrganizationId) {
    redirect('/notes')
  }

  const { id } = await params
  const note = await getStandaloneNoteById(id)

  if (!note) {
    redirect('/notes')
  }

  return (
    <NoteDetailBreadcrumbClient
      noteTitle={note.title || 'Untitled'}
      noteId={note.id}
    >
      <PageContainer>
        <PageContent>
          <StandaloneNoteEditor
            note={note}
            currentUserId={user.managerOSUserId}
          />
        </PageContent>
      </PageContainer>
    </NoteDetailBreadcrumbClient>
  )
}
