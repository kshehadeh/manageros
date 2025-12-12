import { InitiativeObjectives } from './initiative-objectives'
import { prisma } from '@/lib/db'

interface InitiativeObjectivesServerProps {
  initiativeId: string
}

export async function InitiativeObjectivesServer({
  initiativeId,
}: InitiativeObjectivesServerProps) {
  // Fetch objectives for this initiative
  const objectives = await prisma.objective.findMany({
    where: { initiativeId },
    orderBy: { sortIndex: 'asc' },
  })

  // Only show if there are objectives
  if (objectives.length === 0) {
    return null
  }

  return (
    <InitiativeObjectives objectives={objectives} initiativeId={initiativeId} />
  )
}
