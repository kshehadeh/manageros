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
    case 'Initiative':
      entityTypePermission = 'initiative.edit'
      break
    default:
      entityTypePermission = null
      break
  }

  // For Initiative, we still want to show the section even if permission check fails
  // (users can view notes even if they can't edit)
  let canEdit = false
  if (entityTypePermission) {
    canEdit = await getActionPermission(user, entityTypePermission, entityId)
  }

  // Fetch notes for this entity
  const notes = await getNotesForEntity(entityType, entityId)

  // Only show if there are notes (users can add notes via action menu)
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
