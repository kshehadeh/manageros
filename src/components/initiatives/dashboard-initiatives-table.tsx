import { InitiativesTable } from './initiatives-table'
import { Person, Team } from '@prisma/client'

interface InitiativeWithRelations {
  id: string
  title: string
  summary: string | null
  outcome: string | null
  startDate: Date | null
  targetDate: Date | null
  status: string
  rag: string
  confidence: number
  teamId: string | null
  organizationId: string
  createdAt: Date
  updatedAt: Date
  objectives: Array<{
    id: string
    title: string
    keyResult: string | null
    sortIndex: number
  }>
  team: {
    id: string
    name: string
  } | null
  owners: Array<{
    personId: string
    role: string
    person: {
      id: string
      name: string
    }
  }>
  _count: {
    checkIns: number
    tasks: number
  }
  tasks: Array<{
    status: string
  }>
}

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
