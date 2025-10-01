'use client'

import { useRouter } from 'next/navigation'
// Simplified types for dashboard display
type PersonSummary = {
  id: string
  name: string
}

type TeamSummary = {
  id: string
  name: string
}
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { calculateInitiativeCompletionPercentage } from '@/lib/completion-utils'

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
  people: PersonSummary[]
  teams: TeamSummary[]
}

function getRagColor(rag: string): string {
  switch (rag) {
    case 'green':
      return 'bg-green-500'
    case 'amber':
      return 'bg-amber-500'
    case 'red':
      return 'bg-red-500'
    default:
      return 'bg-gray-500'
  }
}

export function DashboardInitiativesTable({
  initiatives,
}: DashboardInitiativesTableProps) {
  const router = useRouter()

  const handleRowClick = (initiativeId: string) => {
    router.push(`/initiatives/${initiativeId}`)
  }

  if (initiatives.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No open initiatives</p>
      </div>
    )
  }

  return (
    <div className='rounded-md border'>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className='w-8 p-2'></TableHead>
            <TableHead className='p-2'>Initiative</TableHead>
            <TableHead className='hidden md:table-cell p-2'>Team</TableHead>
            <TableHead className='text-right p-2'>Progress</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {initiatives.map(initiative => (
            <TableRow
              key={initiative.id}
              className='hover:bg-accent/50 cursor-pointer'
              onClick={() => handleRowClick(initiative.id)}
            >
              <TableCell className='text-muted-foreground p-2'>
                <div className='flex items-center justify-center'>
                  <div
                    className={`w-3 h-3 rounded-full ${getRagColor(initiative.rag)}`}
                  />
                </div>
              </TableCell>
              <TableCell className='font-medium text-foreground p-2'>
                <div>
                  <div className='font-medium'>{initiative.title}</div>
                  <div className='text-xs text-muted-foreground mt-1'>
                    {initiative.objectives.length} objectives •{' '}
                    {initiative._count.tasks} tasks •{' '}
                    {initiative._count.checkIns} check-ins
                  </div>
                </div>
              </TableCell>
              <TableCell className='text-muted-foreground hidden md:table-cell p-2'>
                {initiative.team?.name || '—'}
              </TableCell>
              <TableCell className='text-right p-2'>
                <span className='inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary'>
                  {calculateInitiativeCompletionPercentage(initiative)}%
                </span>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  )
}
