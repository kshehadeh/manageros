import { InitiativeCard } from '@/components/initiative-card'
import { Initiative, Team } from '@prisma/client'

type InitiativeWithRelations = Initiative & {
  team: Team | null
  objectives: Array<{ id: string }>
  _count: { checkIns: number }
}

interface OpenInitiativesProps {
  openInitiatives: InitiativeWithRelations[]
}

export function OpenInitiatives({ openInitiatives }: OpenInitiativesProps) {
  if (openInitiatives.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No open initiatives</p>
      </div>
    )
  }

  return (
    <div className='grid gap-3'>
      {openInitiatives.map(initiative => (
        <InitiativeCard
          key={initiative.id}
          initiative={initiative}
          variant='compact'
          showTeam={true}
          showSummary={false}
        />
      ))}
    </div>
  )
}
