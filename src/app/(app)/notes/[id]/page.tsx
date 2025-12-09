import { redirect } from 'next/navigation'
import { getCurrentUser } from '@/lib/auth-utils'
import { getNoteById } from '@/lib/actions/notes'
import { StandaloneNoteEditor } from '@/components/notes/standalone-note-editor'
import { NoteDetailBreadcrumbClient } from '@/components/notes/note-detail-breadcrumb-client'
import { PageContainer } from '@/components/ui/page-container'
import { PageContent } from '@/components/ui/page-content'

function getEntityLink(
  entityType: string | null | undefined,
  entityId: string | null | undefined
): string | null {
  if (!entityType || !entityId) return null

  const basePath = entityType.toLowerCase()
  if (entityType === 'MeetingInstance') {
    // MeetingInstance needs special handling - we'd need the meeting ID
    // For now, return null as we'd need more context
    return null
  }
  return `/${basePath}s/${entityId}`
}

function getEntityTypeLabel(
  entityType: string | null | undefined
): string | undefined {
  if (!entityType) return undefined
  return entityType
}

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
  const note = await getNoteById(id)

  if (!note) {
    redirect('/notes')
  }

  const entityLink = getEntityLink(note.entityType, note.entityId)
  const entityTypeLabel = getEntityTypeLabel(note.entityType)

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
            entityLink={entityLink}
            entityTypeLabel={entityTypeLabel}
          />
        </PageContent>
      </PageContainer>
    </NoteDetailBreadcrumbClient>
  )
}
