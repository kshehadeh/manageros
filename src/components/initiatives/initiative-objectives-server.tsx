import { InitiativeObjectives } from './initiative-objectives'
import { prisma } from '@/lib/db'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

interface InitiativeObjectivesServerProps {
  initiativeId: string
}

export async function InitiativeObjectivesServer({
  initiativeId,
}: InitiativeObjectivesServerProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    'initiative.edit',
    initiativeId
  )

  // Fetch objectives for this initiative
  const objectives = await prisma.objective.findMany({
    where: { initiativeId },
    orderBy: { sortIndex: 'asc' },
  })

  // Show section if there are objectives or if user can edit
  // This allows users to add the first objective from the section header
  if (objectives.length === 0 && !canEdit) {
    return null
  }

  return (
    <InitiativeObjectives
      objectives={objectives}
      initiativeId={initiativeId}
      canEdit={canEdit}
    />
  )
}
