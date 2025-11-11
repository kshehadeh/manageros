import { InitiativeMeetings } from './initiative-meetings'
import { getMeetingsForInitiativeSimple } from '@/lib/actions/meeting'
import { prisma } from '@/lib/db'

interface InitiativeMeetingsServerProps {
  initiativeId: string
}

export async function InitiativeMeetingsServer({
  initiativeId,
}: InitiativeMeetingsServerProps) {
  // Fetch meetings and initiative team
  const [meetings, initiative] = await Promise.all([
    getMeetingsForInitiativeSimple(initiativeId),
    prisma.initiative.findUnique({
      where: { id: initiativeId },
      select: { team: { select: { id: true, name: true } } },
    }),
  ])

  // Only show if there are meetings
  if (meetings.length === 0) {
    return null
  }

  return (
    <InitiativeMeetings
      meetings={meetings}
      initiativeId={initiativeId}
      currentTeam={initiative?.team || null}
    />
  )
}
