import { InitiativeCheckIns } from './initiative-checkins'
import { prisma } from '@/lib/db'
import { getCurrentUser, getActionPermission } from '@/lib/auth-utils'

interface InitiativeCheckInsServerProps {
  initiativeId: string
}

export async function InitiativeCheckInsServer({
  initiativeId,
}: InitiativeCheckInsServerProps) {
  const user = await getCurrentUser()
  const canEdit = await getActionPermission(
    user,
    'initiative.edit',
    initiativeId
  )

  // Fetch check-ins and initiative title
  const [checkIns, initiative] = await Promise.all([
    prisma.checkIn.findMany({
      where: { initiativeId },
      include: { createdBy: true },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.initiative.findUnique({
      where: { id: initiativeId },
      select: { title: true },
    }),
  ])

  // Show section if there are check-ins or if user can edit
  // This allows users to add the first check-in from the section header
  if ((checkIns.length === 0 && !canEdit) || !initiative) {
    return null
  }

  return (
    <InitiativeCheckIns
      initiativeId={initiativeId}
      initiativeTitle={initiative.title}
      checkIns={checkIns.map(ci => ({
        id: ci.id,
        weekOf: ci.weekOf.toISOString(),
        rag: ci.rag,
        confidence: ci.confidence,
        summary: ci.summary,
        blockers: ci.blockers,
        nextSteps: ci.nextSteps,
        createdAt: ci.createdAt.toISOString(),
        createdBy: {
          id: ci.createdBy.id,
          name: ci.createdBy.name,
        },
      }))}
      canEdit={canEdit}
    />
  )
}
