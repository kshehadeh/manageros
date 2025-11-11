import { NotesSection } from './notes-section'
import { getNotesForEntity } from '@/lib/actions/notes'
import { getActionPermission, getCurrentUser } from '@/lib/auth-utils'

interface NotesSectionServerProps {
  entityType: string
  entityId: string
}

export async function NotesSectionServer({
  entityType,
  entityId,
}: NotesSectionServerProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    `${entityType.toLowerCase()}.edit`,
    entityId
  )

  // Fetch notes for this entity
  const notes = await getNotesForEntity(entityType, entityId)

  // Only show if there are notes
  if (notes.length === 0) {
    return null
  }

  return (
    <NotesSection
      entityType={entityType}
      entityId={entityId}
      notes={notes}
      canEdit={canEdit}
    />
  )
}
