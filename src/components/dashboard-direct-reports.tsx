import { PersonListItem } from '@/components/people/person-list-item'
import { Person, Team } from '@prisma/client'

type PersonWithRelations = Person & {
  team: Team | null
  reports: Person[]
}

interface DirectReportsProps {
  directReports: PersonWithRelations[]
}

export function DirectReports({ directReports }: DirectReportsProps) {
  if (directReports.length === 0) {
    return (
      <div className='text-center py-8'>
        <p className='text-muted-foreground text-sm'>No direct reports</p>
      </div>
    )
  }

  return (
    <div className='grid gap-3'>
      {directReports.map(person => (
        <PersonListItem
          key={person.id}
          person={person}
          showRole={true}
          showTeam={true}
        />
      ))}
    </div>
  )
}
