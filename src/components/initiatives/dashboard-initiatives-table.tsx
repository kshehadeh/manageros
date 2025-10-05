import { InitiativesTable } from './initiatives-table'
import { Person, Team } from '@prisma/client'
import { InitiativeWithRelations } from '@/types/initiative'

interface DashboardInitiativesTableProps {
  initiatives: InitiativeWithRelations[]
  people: Person[]
  teams: Team[]
}

export function DashboardInitiativesTable({
  initiatives,
  people,
  teams,
}: DashboardInitiativesTableProps) {
  return (
    <InitiativesTable
      initiatives={initiatives}
      people={people}
      teams={teams}
      hideFilters={true}
      hideOwner={true}
      hideActions={true}
    />
  )
}
