import { NotesSection } from './notes-section'
import { getNotesForEntity } from '@/lib/actions/notes'
import {
  getActionPermission,
  getCurrentUser,
  PermissionType,
} from '@/lib/auth-utils'

interface NotesSectionServerProps {
  entityType: string
  entityId: string
}

export async function NotesSectionServer({
  entityType,
  entityId,
}: NotesSectionServerProps) {
  const user = await getCurrentUser()
  let entityTypePermission: PermissionType | null = null
  switch (entityType) {
    case 'task':
      entityTypePermission = 'task.edit'
      break
    case 'meeting':
      entityTypePermission = 'meeting.edit'
      break
    default:
      entityTypePermission = null
      break
  }
  if (!entityTypePermission) {
    return null
  }
  const canEdit = await getActionPermission(
    user,
    entityTypePermission,
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
